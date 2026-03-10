const verifyToken = require("../middleware/verifyToken");
const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const Event = require("../models/event"); // adjust path if needed
const rateLimit = require("express-rate-limit");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sendMail = require("../utils/mailer");
const QRCode = require("qrcode");
const path = require("path");
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // max 15 registrations per IP
  message: "Too many registrations. Please try again later.",
});
/* =====================================
   1️⃣ GET ALL REGISTRATIONS
===================================== */
router.get("/registrations", verifyToken, async (req, res) => {
  try {
    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    res.json(registrations);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ message: "Error fetching registrations" });
  }
});

/* =====================================
   CHECK TEAM NAME BEFORE PAYMENT
===================================== */
router.get("/check-team", async (req, res) => {
  try {
    const { teamName, event } = req.query;

    const existingTeam = await Registration.findOne({
      teamName: teamName.toUpperCase(),
    });

    if (existingTeam) {
      return res.json({ exists: true });
    }

    res.json({ exists: false });
  } catch (error) {
    console.error("TEAM CHECK ERROR:", error);
    res.status(500).json({ message: "Error checking team name" });
  }
});

/* =====================================
   2️⃣ CREATE REGISTRATION
===================================== */
router.post("/register", registerLimiter, async (req, res) => {
  if (req.body.honeypot) {
    return res.status(400).json({
      message: "Spam detected",
    });
  }

  try {
    const {
      eventType,
      eventName,
      teamName,
      teamSize,
      teamMembers,
      accommodationRequired,
      hostelMembers,
      expectedAmount: frontendAmount, // This is what the frontend claims is the price
      userTransactionId,
      screenshotUrl,
    } = req.body;
        
const event = await Event.findOne({ eventType });
if (!event) {
  return res.status(400).json({
    message: "Invalid event type",
  });
}

if (!event.registrationOpen) {
  return res.status(403).json({
    message: "Registrations are currently closed."
  });
}
    if (!teamMembers || teamMembers.length !== teamSize) {
  return res.status(400).json({
    message: "Invalid team size"
  });
} 
    // 🔐 Secure amount calculation (backend authority)
    const perPersonFee = eventType === "combo" ? 200 : 100;
    const correctAmount = perPersonFee * teamSize;

    // 🚫 Prevent fake payment amounts
    if (frontendAmount !== correctAmount) {
      return res.status(400).json({
        message: "Invalid payment amount detected.",
      });
    }

    // 🚫 Prevent invalid UTR format
    const utrRegex = /^[A-Za-z0-9]{12,22}$/;

    if (!userTransactionId || !utrRegex.test(userTransactionId)) {
      return res.status(400).json({
        message: "Invalid UTR ID format",
      });
    }
    // 🚫 Prevent repeated fake UTR numbers
    if (/^(\d)\1+$/.test(userTransactionId)) {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    if (!screenshotUrl) {
      return res
        .status(400)
        .json({ message: "Payment screenshot is required" });
    }

    // 🚫 Prevent duplicate transaction ID
    const existingTransaction = await Registration.findOne({
      "payment.userTransactionId": userTransactionId,
    });
    if (existingTransaction) {
      return res
        .status(400)
        .json({ message: "This UTR ID has already been used." });
    }

    // 🚫 Prevent duplicate team name
    const existingTeam = await Registration.findOne({
      teamName: teamName.toUpperCase(),
    });
    if (existingTeam) {
      return res
        .status(400)
        .json({ message: "This Team name is already registered." });
    }

    // 🚫 Check for duplicate members (Email, Phone, or RollNo)
    const duplicateMember = await Registration.findOne({
      $or: [
        { "teamMembers.email": { $in: teamMembers.map((m) => m.email) } },
        { "teamMembers.phone": { $in: teamMembers.map((m) => m.phone) } },
        { "teamMembers.rollNo": { $in: teamMembers.map((m) => m.rollNo) } },
      ],
    }).lean();

    if (duplicateMember) {
      return res
        .status(400)
        .json({ message: "One of the team members is already registered." });
    }
    // 🔐 Generate Random Registration ID
    const prefix = eventType === "combo" ? "SPS26CMB" : "SPS26BLD";

    let registrationId;
    let exists = true;

    while (exists) {
      const randomNumber = Math.floor(1000 + Math.random() * 9000);

      registrationId = `${prefix}-${randomNumber}`;

      const existing = await Registration.findOne({ registrationId });

      if (!existing) {
        exists = false;
      }
    }

    const registration = new Registration({
      registrationId,
      eventType,
      eventName,
      teamName: teamName.toUpperCase(),
      teamSize,
      teamMembers,
      expectedAmount: correctAmount, // Save the verified amount
      accommodationRequired,
      hostelMembers,
      payment: {
        userTransactionId,
        screenshotUrl,
        verified: false,
      },
      registrationStatus: "Pending",
    });

    await registration.save();

    // Telegram Notifications
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const memberNames = teamMembers
      .map((m, i) => `${i + 1}. ${m.fullName} (${m.rollNo})`)
      .join("\n");
    // Count pending registrations
    const pendingCount = await Registration.countDocuments({
      registrationStatus: "Pending",
    });
    const telegramRes = await axios.post(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      {
        chat_id: chatId,
        photo: screenshotUrl,
        caption: `🚀 *New Registration*

Team: *${teamName}*
Event: ${eventName}
Amount: ₹${correctAmount}
Hostel Required: *${accommodationRequired ? "Yes" : "No"}*

UTR: \`${userTransactionId}\`

👥 *Members*
${memberNames}

Registration ID: \`${registrationId}\`

⏳ Pending Approvals: *${pendingCount}*`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Confirm",
                callback_data: `confirm_${registrationId}`,
              },
              { text: "❌ Reject", callback_data: `reject_${registrationId}` },
            ],
          ],
        },
      },
    );
    // Save telegram message ID
    registration.telegramMessageId = telegramRes.data.result.message_id;
    await registration.save();
    res.status(201).json({
      message: "Registration submitted successfully",
      data: registration,
    });
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ message: "Error submitting registration" });
  }
});
const generateReceiptPDF = async (registration) => {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ margin: 40 });

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    /* EVENT BORDER */
    doc
      .rect(20, 20, pageWidth - 40, pageHeight - 40)
      .lineWidth(2)
      .strokeColor("#0077cc")
      .stroke();

    /* LOGO */
    try {
      doc.image(
        path.join(__dirname, "../public/AD2026.png"),
        pageWidth / 2 - 60,
        35,
        { width: 120 },
      );
    } catch {
      console.log("Logo not found");
    }

    doc.moveDown(3);

    /* TITLE */
    doc
      .fontSize(22)
      .fillColor("#0077cc")
      .text("Arduino Days 2026", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("gray")
      .text("Official Event Pass", { align: "center" });

    doc.moveDown(1);

    doc
      .moveTo(80, doc.y)
      .lineTo(pageWidth - 80, doc.y)
      .stroke();

    doc.moveDown(1.5);

    /* DATE TIME */
    const createdDate = new Date(registration.createdAt);

    const date = createdDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const time = createdDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    /* DETAILS BOX */
    doc
      .rect(80, doc.y, pageWidth - 160, 120)
      .fillOpacity(0.05)
      .fill("#0077cc")
      .fillOpacity(1);

    let y = doc.y + 10;

    const details = [
      ["Registration ID", registration.registrationId],
      ["Team Name", registration.teamName],
      ["Event", registration.eventName],
      ["Team Size", registration.teamSize],
      ["Amount Paid", `₹${registration.expectedAmount}`],
      ["Transaction ID", registration.payment.userTransactionId],
      ["Date", date],
      ["Time", time],
    ];

    details.forEach(([label, value]) => {
      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .text(`${label}: `, 100, y, { continued: true })
        .font("Helvetica")
        .text(value);
      y += 15;
    });

    doc.y = y + 10;

    /* TEAM MEMBERS */
    doc
      .fontSize(14)
      .fillColor("#0077cc")
      .text("Team Members", { align: "center" });

    doc.moveDown(0.5);

    registration.teamMembers.forEach((member, i) => {
      doc
        .fontSize(11)
        .fillColor("black")
        .text(`${i + 1}. ${member.fullName} - ${member.rollNo}`, {
          align: "center",
        });
    });

    doc.moveDown(1.5);

    /* QR CODE */
    if (registration.registrationStatus === "Confirmed") {
      const qrData = `https://ieee-sps-website.onrender.com/api/entry/${registration.registrationId}`;

      const qrImage = await QRCode.toDataURL(qrData);
      const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");

      doc
        .fontSize(14)
        .fillColor("#0077cc")
        .text("Event Entry QR Code", { align: "center" });

      doc.moveDown(0.5);

      const qrY = doc.y;
doc
.rect(pageWidth / 2 - 90, qrY - 10, 180, 180)
.strokeColor("#dddddd")
.stroke();
doc.image(qrBuffer, pageWidth / 2 - 80, qrY, {
  width: 160,
});

doc.y = qrY + 160;

doc
  .fontSize(10)
  .fillColor("gray")
  .text("Show this QR code at the event entrance", { align: "center" });
}

    doc.moveDown(1);

    /* STATUS */
    const statusText =
      registration.registrationStatus === "Confirmed"
        ? "Payment Verified"
        : "Payment Submitted - Verification Pending";

    doc
      .fontSize(12)
      .fillColor(
        registration.registrationStatus === "Confirmed" ? "green" : "orange",
      )
      .text(`Status: ${statusText}`, { align: "center" });

    doc.moveDown(2);

    /* FOOTER */
    doc
      .fontSize(10)
      .fillColor("gray")
      .text("IEEE SPS Student Branch Chapter", { align: "center" });

    doc.text("Aditya University, Surampalem", { align: "center" });

    doc.end();
  });
};

/* =====================================
   3️⃣ CONFIRM REGISTRATION
===================================== */
router.put("/confirm/:id", verifyToken, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.registrationStatus === "Confirmed") {
      return res.sendStatus(200);
    }

    // Generate QR
    const qrData = `https://ieee-sps-website.onrender.com/api/entry/${registration.registrationId}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    registration.registrationStatus = "Confirmed";

    await registration.save();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (registration.telegramMessageId) {
      const members = registration.teamMembers
        .map((m, i) => `${i + 1}. ${m.fullName}`)
        .join("\n");

      await axios.post(
        `https://api.telegram.org/bot${token}/editMessageCaption`,
        {
          chat_id: chatId,
          message_id: registration.telegramMessageId,
          caption: `✅ *Registration Confirmed*

Team: *${registration.teamName}*
Event: ${registration.eventName}
Registration ID: \`${registration.registrationId}\`

👥 *Members*
${members}

Status: ✅ Confirmed`,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [] },
        },
      );
    }
    await axios.post(
      "https://ieee-sps-website.onrender.com/api/send-confirmation-email",
      { registration, qrCodeImage },
    );

    res.json({
      message: "Registration confirmed successfully",
      data: registration,
    });
  } catch (error) {
    console.error("CONFIRM ERROR:", error);
    res.status(500).json({ message: "Error confirming registration" });
  }
});

/* =====================================
   4️⃣ DELETE REGISTRATION
===================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    await Registration.findByIdAndDelete(req.params.id);

    res.json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Error deleting registration" });
  }
});

/* =====================================
   5️⃣ DOWNLOAD PDF
===================================== */
router.get("/pdf/:id", async (req, res) => {
  try {
    const registration = await Registration.findOne({
      registrationId: req.params.id,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const pdfBuffer = await generateReceiptPDF(registration);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${registration.registrationId}.pdf`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF ERROR:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

/* =====================================
   7️⃣ SEND CONFIRMATION EMAIL (Separate Route)
===================================== */
router.post("/send-confirmation-email", async (req, res) => {
  try {
    const { registration, qrCodeImage } = req.body;

    if (!registration || !registration.teamMembers) {
      return res.status(400).json({ message: "Invalid registration data" });
    }

    const participants = registration.teamMembers
      .map((m, i) => `${i + 1}. ${m.fullName}`)
      .join("<br>");

    let htmlTemplate = "";

    if (registration.eventType === "combo") {

htmlTemplate = `
<div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">

<div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;padding:30px;">

<div style="text-align:center;margin-bottom:20px;">
<img src="https://res.cloudinary.com/dlzs0cgfd/image/upload/v1772826744/titlelogo_k0cdzv.png" width="150"/>
<h2 style="color:#0ea5e9;">Registration Confirmed 🎉</h2>
</div>

<p>Hello <b>${registration.teamName}</b>,</p>

<p>Your registration for <b>Arduino Days 2026</b> has been confirmed.</p>

<h3>Registration Details</h3>

<p>
<b>Event:</b> Skill Forze Workshop + Buildathon<br>
<b>Registration ID:</b> ${registration.registrationId}<br>
<b>Team Size:</b> ${registration.teamSize} Members
</p>

<h3>Event Schedule</h3>

<p>
<b>Skill Forze:</b> 23rd & 24th March 2026<br>
<b>Buildathon:</b> 25th March 2026<br>
<b>Venue:</b> Aditya University, Surampalem
</p>

<h3>Team Members</h3>

<p>${participants}</p>

<div style="text-align:center;margin-top:30px;">

<h3>Event Entry QR Code</h3>

<img src="${qrCodeImage}" width="180" style="margin:10px 0;" />

<p style="font-size:13px;color:#555;">
Show this QR code at the event entrance.
</p>

</div>

<h3>Important Instructions</h3>

<ul>
<li>Carry your <b>Student ID Card</b></li>
<li>Bring a <b>Laptop with Arduino IDE installed</b></li>
<li>Teams must present a <b>working prototype</b></li>
</ul>

<div style="text-align:center;margin-top:25px;">

<p>Join the official WhatsApp group for updates</p>

<table align="center" cellpadding="0" cellspacing="0">
<tr>
<td bgcolor="#25D366" style="border-radius:6px;">
<a href="https://chat.whatsapp.com/DruOGVhGlNc989mcDWTEYP"
style="color:#ffffff;font-family:Arial;padding:12px 22px;display:inline-block;text-decoration:none;">
Join WhatsApp Group
</a>
</td>
</tr>
</table>

</div>

<hr style="margin:25px 0">

<p style="font-size:14px;">
For any queries contact:<br>
<b>Chitturi Sanjay Kumar</b><br>
+91 7095009441
</p>

<p style="font-size:13px;color:#777;">
IEEE SPS Student Branch Chapter<br>
Aditya University, Surampalem
</p>

</div>
</div>
`;

} else {

htmlTemplate = `
<div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">

<div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;padding:30px;">

<div style="text-align:center;margin-bottom:20px;">
<img src="https://res.cloudinary.com/dlzs0cgfd/image/upload/v1772826744/titlelogo_k0cdzv.png" width="150"/>
<h2 style="color:#8b5cf6;">Registration Confirmed 🎉</h2>
</div>

<p>Hello <b>${registration.teamName}</b>,</p>

<p>Your registration for the <b>Arduino Days Buildathon</b> has been successfully confirmed.</p>

<h3>Registration Details</h3>

<p>
<b>Event:</b> Buildathon Hackathon<br>
<b>Registration ID:</b> ${registration.registrationId}<br>
<b>Team Size:</b> ${registration.teamSize} Members
</p>

<h3>Event Details</h3>

<p>
<b>Date:</b> 25th March 2026<br>
<b>Venue:</b> Aditya University, Surampalem
</p>

<h3>Team Members</h3>

<p>${participants}</p>

<div style="text-align:center;margin-top:30px;">

<h3>Event Entry QR Code</h3>

<img src="${qrCodeImage}" width="180" style="margin:10px 0;" />

<p style="font-size:13px;color:#555;">
Please show this QR code at the event entrance.
</p>

</div>

<h3>Participation Rules</h3>

<ul>
<li>Minimum <b>one laptop per team</b> is mandatory.</li>
<li>Problem statements will be revealed at the venue.</li>
<li>Projects must be developed during the event.</li>
<li>A functional prototype must be presented.</li>
</ul>

<div style="text-align:center;margin-top:25px;">

<p>Join the official Hackathon WhatsApp group</p>

<table align="center" cellpadding="0" cellspacing="0">
<tr>
<td bgcolor="#25D366" style="border-radius:6px;">
<a href="https://chat.whatsapp.com/Csy0z79Sxyz7kwKvwTEN8p"
style="color:#ffffff;font-family:Arial;padding:12px 22px;display:inline-block;text-decoration:none;">
Join WhatsApp Group
</a>
</td>
</tr>
</table>

</div>

<hr style="margin:30px 0">

<p style="font-size:14px;">
For any queries contact:<br>
<b>Chitturi Sanjay Kumar</b><br>
+91 7095009441
</p>

<p style="font-size:13px;color:#666;">
IEEE SPS Student Branch Chapter<br>
Aditya University, Surampalem
</p>

</div>
</div>
`;
}

    const pdfBuffer = await generateReceiptPDF(registration);

    for (const member of registration.teamMembers) {
      if (!member.email) continue;

      await sendMail(
  member.email,
  "Arduino Days 2026 Registration Confirmed",
  htmlTemplate,
  pdfBuffer,
  `${registration.registrationId}.pdf`,
  qrCodeImage
);
    }

    res.json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Mail error:", error);
    res.status(500).json({ message: "Email sending failed" });
  }
});

/* =====================================
   8️⃣ ENTRY QR SCAN
===================================== */

router.get("/entry/:registrationId", async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({ registrationId });

    if (!registration) {
      return res.send(`
        <div style="font-family:Arial;text-align:center;padding:60px;">
          <h1 style="color:red;">❌ Invalid QR Code</h1>
        </div>
      `);
    }

    if (registration.registrationStatus !== "Confirmed") {
      return res.send(`
        <div style="font-family:Arial;text-align:center;padding:60px;">
          <h1 style="color:red;">❌ Registration Not Confirmed</h1>
          <p>Team: ${registration.teamName}</p>
        </div>
      `);
    }

    if (registration.entryTime) {
      return res.send(`
        <div style="font-family:Arial;text-align:center;padding:60px;">
          <h1 style="color:red;">❌ Already Entered</h1>
          <p><b>Team:</b> ${registration.teamName}</p>
          <p>This team has already checked in.</p>
        </div>
      `);
    }

    registration.teamMembers.forEach((member) => {
      member.checkedIn = true;
    });

    registration.entryTime = new Date();
    await registration.save();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const entryTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const memberList = registration.teamMembers
      .map((m, i) => `${i + 1}. ${m.fullName}`)
      .join("\n");

    /* COUNT PARTICIPANTS */
    const totalParticipants = await Registration.aggregate([
      { $group: { _id: null, total: { $sum: "$teamSize" } } },
    ]);

    const checkedInParticipants = await Registration.aggregate([
      { $unwind: "$teamMembers" },
      { $match: { "teamMembers.checkedIn": true } },
      { $count: "count" },
    ]);

    const total = totalParticipants[0]?.total || 0;
    const entered = checkedInParticipants[0]?.count || 0;
    const remaining = total - entered;

    /* SEND TELEGRAM MESSAGE */
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: `🎟 ENTRY SCANNED

Team: ${registration.teamName}
Registration ID: ${registration.registrationId}

👥 Members
${memberList}

⏰ Time: ${entryTime}

📊 Live Entry Stats
Entered: ${entered}
Remaining: ${remaining}
Total Participants: ${total}`,
    });

    const membersHTML = registration.teamMembers
      .map((m) => `<li>${m.fullName}</li>`)
      .join("");

    res.send(`
      <div style="font-family:Arial;text-align:center;padding:50px;">
        <h1 style="color:green;font-size:40px;">✅ ENTRY ALLOWED</h1>
        <h2>${registration.teamName}</h2>

        <p><b>Registration ID:</b> ${registration.registrationId}</p>

        <h3>Team Members</h3>

        <ul style="list-style:none;padding:0;font-size:18px;">
          ${membersHTML}
        </ul>

        <p style="margin-top:30px;color:gray;">
          Entry recorded successfully
        </p>
      </div>
    `);
  } catch (error) {
    console.error("ENTRY ERROR:", error);
    res.status(500).send("Server Error");
  }
});

/* =====================================
   ENTRY STATS
===================================== */

router.get("/entry-stats", async (req, res) => {
  try {
    const totalParticipants = await Registration.aggregate([
      { $group: { _id: null, total: { $sum: "$teamSize" } } },
    ]);

    const checkedInParticipants = await Registration.aggregate([
      { $unwind: "$teamMembers" },
      { $match: { "teamMembers.checkedIn": true } },
      { $count: "count" },
    ]);

    const total = totalParticipants[0]?.total || 0;
    const entered = checkedInParticipants[0]?.count || 0;

    res.json({
      totalParticipants: total,
      enteredParticipants: entered,
      remainingParticipants: total - entered,
    });
  } catch (error) {
    console.error("Entry stats error:", error);

    res.status(500).json({ message: "Error fetching entry stats" });
  }
});

router.post("/telegram-webhook", async (req, res) => {
  const data = req.body;

  const token = process.env.TELEGRAM_BOT_TOKEN;

  /* =========================
     TELEGRAM COMMANDS
  ========================= */

  if (data.message && data.message.text) {
    const command = data.message.text;
    const chatId = data.message.chat.id;

    if (command === "/stats") {
      const totalTeams = await Registration.countDocuments();

      const totalParticipants = await Registration.aggregate([
        { $group: { _id: null, total: { $sum: "$teamSize" } } },
      ]);

      const checkedIn = await Registration.aggregate([
        { $unwind: "$teamMembers" },
        { $match: { "teamMembers.checkedIn": true } },
        { $count: "count" },
      ]);

      const revenue = await Registration.aggregate([
        { $group: { _id: null, total: { $sum: "$expectedAmount" } } },
      ]);

      const statsMessage = `📊 Arduino Days Live Stats

👥 Teams: ${totalTeams}

🧑 Participants: ${totalParticipants[0]?.total || 0}

🎟 Checked In: ${checkedIn[0]?.count || 0}

💰 Revenue: ₹${revenue[0]?.total || 0}
`;

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: statsMessage,
      });
    }

    return res.sendStatus(200);
  }

  /* =========================
     TELEGRAM BUTTON ACTIONS
  ========================= */
  if (!data) return res.sendStatus(200);
  if (!data.callback_query) {
    return res.sendStatus(200);
  }

  const callbackData = data.callback_query.data;

  const chatId = data.callback_query.message.chat.id;
  const messageId = data.callback_query.message.message_id;

  /* =========================
     CONFIRM REGISTRATION
  ========================= */
  if (callbackData.startsWith("confirm_")) {
    const registrationId = callbackData.split("_")[1];

    const registration = await Registration.findOne({ registrationId });

    if (!registration) return res.sendStatus(200);

    if (registration.registrationStatus === "Confirmed") {
      return res.sendStatus(200);
    }

    registration.registrationStatus = "Confirmed";

    await registration.save();
    // Generate QR for entry
    const qrData = `https://ieee-sps-website.onrender.com/api/entry/${registration.registrationId}`;

    const qrCodeImage = await QRCode.toDataURL(qrData);

    // Send confirmation email
    try {
      await axios.post(
        "https://ieee-sps-website.onrender.com/api/send-confirmation-email",
        { registration, qrCodeImage },
      );
      console.log("📧 Confirmation email sent");
    } catch (err) {
      console.error("Email sending failed:", err.message);
    }

    const members = registration.teamMembers
      .map((m, i) => `${i + 1}. ${m.fullName}`)
      .join("\n");

    // 🔥 Update Telegram message
    await axios.post(
      `https://api.telegram.org/bot${token}/editMessageCaption`,
      {
        chat_id: chatId,
        message_id: messageId,
        caption: `✅ *Registration Confirmed*

Team: *${registration.teamName}*
Event: ${registration.eventName}
Registration ID: \`${registration.registrationId}\`

👥 *Members*
${members}

Status: ✅ Confirmed`,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] }, // removes buttons
      },
    );

    console.log("✅ Confirmed via Telegram");
  }

  /* =========================
     REJECT REGISTRATION
  ========================= */

  if (callbackData.startsWith("reject_")) {
    const registrationId = callbackData.split("_")[1];

    const registration = await Registration.findOne({ registrationId });

    if (!registration) return res.sendStatus(200);

    registration.registrationStatus = "Rejected";

    await registration.save();

    const members = registration.teamMembers
      .map((m, i) => `${i + 1}. ${m.fullName}`)
      .join("\n");

    await axios.post(
      `https://api.telegram.org/bot${token}/editMessageCaption`,
      {
        chat_id: chatId,
        message_id: messageId,
        caption: `❌ *Registration Rejected*

Team: *${registration.teamName}*
Event: ${registration.eventName}
Registration ID: \`${registration.registrationId}\`

👥 *Members*
${members}

Status: ❌ Rejected`,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
      },
    );

    console.log("❌ Rejected via Telegram");
  }

  res.sendStatus(200);
});

module.exports = router;

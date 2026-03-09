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
  registrationStatus: "Pending"
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
          { text: "✅ Confirm", callback_data: `confirm_${registrationId}` },
          { text: "❌ Reject", callback_data: `reject_${registrationId}` }
        ]
      ]
    }
  }
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
 const generateReceiptPDF = (registration) => {
  return new Promise((resolve) => {

    const doc = new PDFDocument({ margin: 50 });

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const pageWidth = doc.page.width;

    /* HEADER LOGO */
    doc.image("public/titlelogo.png", pageWidth / 2 - 70, 20, { width: 140 });

    doc.moveDown(3);

    doc
      .fontSize(20)
      .fillColor("#0077cc")
      .text("Arduino Days 2026", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("gray")
      .text("Registration Receipt", { align: "center" });

    doc.moveDown();

    /* LINE */
    doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).stroke();

    doc.moveDown(1.5);

    /* DETAILS TABLE */

    const details = [
      ["Registration ID", registration.registrationId],
      ["Team Name", registration.teamName],
      ["Event", registration.eventName],
      ["Team Size", registration.teamSize],
      ["Amount Paid", "Rs. " + registration.expectedAmount],
      ["Transaction ID", registration.payment.userTransactionId],
      ["Date", new Date(registration.createdAt).toLocaleDateString()],
      ["Time", new Date(registration.createdAt).toLocaleTimeString()],
    ];

    details.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .text(label + ":", { continued: true })
        .font("Helvetica")
        .text(` ${value}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();

    /* TEAM MEMBERS */

    doc
      .fontSize(14)
      .fillColor("#0077cc")
      .text("Team Members");

    doc.moveDown(0.5);

    registration.teamMembers.forEach((member, i) => {
      doc
        .fontSize(11)
        .fillColor("black")
        .text(`${i + 1}. ${member.fullName} - ${member.rollNo}`);
    });

    doc.moveDown(2);

    /* STATUS BADGE */

    doc
      .fontSize(12)
      .fillColor("red")
      .text("Status : Payment Submitted - Verification Pending");

    doc.moveDown(2);

    doc.moveDown(3);

    /* FOOTER */

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("IEEE SPS Student Branch Chapter", { align: "center" });

    doc.text("Aditya University", { align: "center" });

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
const qrData = `https://ieee-sps-website.onrender.com/entry/${registration.registrationId}`;
const qrCodeImage = await QRCode.toDataURL(qrData);

registration.registrationStatus = "Confirmed";

await registration.save();

    await registration.save();
    const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (registration.telegramMessageId) {

  const members = registration.teamMembers
    .map((m,i)=>`${i+1}. ${m.fullName}`)
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
      reply_markup: { inline_keyboard: [] }
    }
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${registration.registrationId}.pdf`,
    );

    const doc = new PDFDocument({ margin: 40 });

    // STREAM PDF DIRECTLY
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

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

    /* BORDER */
    doc
      .lineWidth(1.2)
      .strokeColor("#00b4ff")
      .rect(10, 10, pageWidth - 20, pageHeight - 20)
      .stroke();

    /* TITLE */
    doc
      .fontSize(18)
      .fillColor("#00b4ff")
      .text("Arduino Days 2026 Registration Receipt", 0, 70, {
        align: "center",
      });

    doc.fillColor("black").fontSize(12);

    let y = 110;

    doc.text(`Registration ID : ${registration.registrationId}`, 40, y);
    y += 20;

    doc.text(`Team Name : ${registration.teamName}`, 40, y);
    y += 20;

    doc.text(`Event : ${registration.eventName}`, 40, y);
    y += 20;

    doc.text(`Team Size : ${registration.teamSize}`, 40, y);
    y += 20;

    doc.text(`Amount Paid : ₹${registration.expectedAmount}`, 40, y);
    y += 20;

    doc.text(
      `Transaction ID : ${registration.payment.userTransactionId}`,
      40,
      y,
    );
    y += 20;

    doc.text(`Date : ${date}`, 40, y);
    y += 20;

    doc.text(`Time : ${time}`, 40, y);

    y += 40;

    doc.fontSize(14).fillColor("#00b4ff").text("Team Members", 40, y);

    doc.fontSize(12).fillColor("black");

    y += 20;

    registration.teamMembers.forEach((member, index) => {
      doc.text(`${index + 1}. ${member.fullName} - ${member.rollNo}`, 50, y);
      y += 15;
    });

    y += 20;
    
    doc
      .fillColor("red")
      .text("Status : Payment Submitted - Verification Pending", 40, y);
    doc
  .fontSize(10)
  .fillColor("gray")
  .text(
    "Your event entry QR code will be sent to your email after payment verification.",
    { align: "center" }
  );
    doc
      .fillColor("black")
      .fontSize(10)
      .text("IEEE SPS Student Branch Chapter", 0, pageHeight - 60, {
        align: "center",
      });

    doc.text("Aditya University", 0, pageHeight - 45, { align: "center" });

    doc.end();
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

    // Template Selection
    if (registration.eventType === "combo") {
      htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; padding: 40px 10px; color: #fff;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #18181b, #09090b); border: 1px solid #22d3ee; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);">
        
<div style="background: #0f172a; padding: 30px; text-align: center; border-bottom: 1px solid #22d3ee;">
    <img src="https://res.cloudinary.com/dlzs0cgfd/image/upload/v1772826744/titlelogo_k0cdzv.png" 
         alt="Arduino Days Logo" 
         style="width: 180px; height: auto; display: block; margin: 0 auto;" />
    <p style="margin-top: 12px; color: #22d3ee; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
        Registration Confirmed 🎉
    </p>
</div>

        <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px;">Hello <b style="color: #22d3ee;">${registration.teamName}</b>,</p>
            <p style="color: #a1a1aa;">Great news! Your team has successfully secured a spot for the premium technical experience at Aditya University.</p>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border-left: 4px solid #22d3ee; margin: 25px 0;">
                <p style="margin: 5px 0;"><strong>Event:</strong> Skill Forze Workshop + Buildathon</p>
                <p style="margin: 5px 0;"><strong>Registration ID:</strong> <span style="color: #facc15;">${registration.registrationId}</span></p>
                <p style="margin: 5px 0;"><strong>Team Size:</strong> ${registration.teamSize} Members</p>
            </div>

            <h3 style="color: #22d3ee; border-bottom: 1px solid #3f3f46; padding-bottom: 8px;">📅 Event Schedule</h3>
            <p style="margin-bottom: 5px;"><strong>Skill Forze:</strong> 23<sup>rd</sup> & 24<sup>th</sup> March 2026</p>
            <p style="margin-top: 0;"><strong>Buildathon:</strong> 25<sup>th</sup> March 2026</p>
            <p><strong>Venue:</strong> Aditya University, Surampalem</p>

            <h3 style="color: #22d3ee; border-bottom: 1px solid #3f3f46; padding-bottom: 8px;">👥 Team Members</h3>
            <div style="color: #d4d4d8;">${participants}</div>
            <div style="text-align:center;margin-top:30px;">
  <p><b>Event Entry QR Code</b></p>
 <img src="${qrCodeImage}" width="200"/>
  <p style="font-size:12px;color:#aaa">
    Please show this QR code at the event entrance.
  </p>
</div>

            <h3 style="color: #22d3ee; border-bottom: 1px solid #3f3f46; padding-bottom: 8px;">📢 Important Checklist</h3>
            <ul style="color: #a1a1aa; padding-left: 20px;">
                <li>Carry your <b>Student ID Card</b> for verification.</li>
                <li>Bring a <b>Laptop</b> with Arduino IDE pre-installed.</li>
                <li>Teams must present a <b>working prototype</b> for Buildathon.</li>
            </ul>

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: rgba(37, 211, 102, 0.1); border-radius: 12px;">
                <p style="margin-bottom: 15px; font-size: 14px;">Join the official group for live updates & coordination:</p>
                <a href="https://chat.whatsapp.com/DruOGVhGlNc989mcDWTEYP?mode=gi_t" style="background: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Join WhatsApp Group</a>
            </div>
        </div>

        <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
    <p style="margin: 0; font-size: 14px; color: #71717a;">For any help or queries, contact:</p>
    <p style="margin: 5px 0; color: #fff; font-size: 15px;">
        <b>Chitturi Sanjay Kumar</b><br>
        <a href="tel:+917095009441" style="color: #22d3ee; text-decoration: none;">+91 7095009441</a>
    </p>
    
    <hr style="border: 0; border-top: 1px solid #27272a; width: 50%; margin: 15px auto;">
    
    <p style="margin: 5px 0; color: #22d3ee; font-weight: bold;">IEEE SPS Student Branch Chapter</p>
    <p style="margin: 0; font-size: 12px; color: #52525b;">Aditya University, Surampalem</p>
</div>
    </div>
</div>`;
    } else {
      htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; padding: 40px 10px; color: #fff;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #18181b, #09090b); border: 1px solid #a855f7; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.1);">
        
        <div style="background: #0f172a; padding: 30px; text-align: center; border-bottom: 1px solid #22d3ee;">
    <img src="https://res.cloudinary.com/dlzs0cgfd/image/upload/v1772826744/titlelogo_k0cdzv.png" 
         alt="Arduino Days Logo" 
         style="width: 180px; height: auto; display: block; margin: 0 auto;" />
    <p style="margin-top: 12px; color: #22d3ee; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
        Registration Confirmed 🎉
    </p>
</div>

        <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px;">Hello <b style="color: #a855f7;">${registration.teamName}</b>,</p>
            <p style="color: #a1a1aa;">Gear up! Your registration for the Buildathon challenge is officially confirmed.</p>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border-left: 4px solid #a855f7; margin: 25px 0;">
                <p style="margin: 5px 0;"><strong>Event:</strong> Buildathon Hackathon</p>
                <p style="margin: 5px 0;"><strong>Registration ID:</strong> <span style="color: #facc15;">${registration.registrationId}</span></p>
                <p style="margin: 5px 0;"><strong>Team Size:</strong> ${registration.teamSize} Members</p>
            </div>

            <h3 style="color: #a855f7; border-bottom: 1px solid #3f3f46; padding-bottom: 8px;">📅 Hackathon Details</h3>
            <p style="margin-bottom: 5px;"><strong>Date:</strong> 25<sup>th</sup> March 2026</p>
            <p><strong>Venue:</strong> Aditya University, Surampalem</p>

            <h3 style="color: #a855f7; border-bottom: 1px solid #3f3f46; padding-bottom: 8px;">👥 Innovators</h3>
            <div style="color: #d4d4d8;">${participants}</div>
            <div style="text-align:center;margin-top:30px;">
  <p><b>Event Entry QR Code</b></p>
<img src="${qrCodeImage}" width="200"/>
  <p style="font-size:12px;color:#aaa">
    Please show this QR code at the event entrance.
  </p>
</div>

            <h3 style="color: #a855f7; border-bottom: 1px solid #3f3f46; padding-bottom: 8px;">📢 Participation Rules</h3>
            <ul style="color: #a1a1aa; padding-left: 20px;">
                <li>Minimum <b>one laptop per team</b> is mandatory.</li>
                <li>Problem statements will be revealed at the venue.</li>
                <li>Projects must be developed <b>scratch</b> during the event.</li>
                <li>A functional hardware prototype must be presented for judging.</li>
            </ul>

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: rgba(37, 211, 102, 0.1); border-radius: 12px;">
                <p style="margin-bottom: 15px; font-size: 14px;">Join the hackathon community for briefings:</p>
                <a href="https://chat.whatsapp.com/Csy0z79Sxyz7kwKvwTEN8p?mode=gi_t" style="background: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Join Hackathon Group</a>
            </div>
        </div>

        <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
    <p style="margin: 0; font-size: 14px; color: #71717a;">For any help or queries, contact:</p>
    <p style="margin: 5px 0; color: #fff; font-size: 15px;">
        <b>Chitturi Sanjay Kumar</b><br>
        <a href="tel:+917095009441" style="color: #22d3ee; text-decoration: none;">+91 7095009441</a>
    </p>
    </div>
</div>`;
    }
    const pdfBuffer = await generateReceiptPDF(registration);

    for (const member of registration.teamMembers) {

  if (!member.email) continue;

  await sendMail(
    member.email,
    "Arduino Days 2026 Registration Confirmed",
    htmlTemplate,
    pdfBuffer,
    `${registration.registrationId}.pdf`
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

    // 1️⃣ Check QR validity
    if (!registration) {
      return res.send(`
        <h2 style="color:red;text-align:center;">
        ❌ Invalid QR Code
        </h2>
      `);
    }

    // 3️⃣ Check registration confirmed
    if (registration.registrationStatus !== "Confirmed") {
      return res.send(`
        <h2 style="color:red;text-align:center;">
        ❌ Registration Not Confirmed
        </h2>
      `);
    }

// 4️⃣ Prevent duplicate scans (multiple devices)
if (registration.entryTime) {
  return res.json({
    success: false,
    reason: "already",
    teamName: registration.teamName
  });
}

    // 5️⃣ Mark members as checked in
    registration.teamMembers.forEach((member) => {
      member.checkedIn = true;
    });

    registration.entryTime = new Date();

    await registration.save();
    // Send Telegram entry notification
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const entryTime = new Date().toLocaleTimeString("en-IN", {
  hour: "2-digit",
  minute: "2-digit"
});

const memberList = registration.teamMembers
  .map((m, i) => `${i + 1}. ${m.fullName}`)
  .join("\n");

await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
  chat_id: chatId,
  text: `🎟 Entry Scanned

Team: ${registration.teamName}
Registration ID: ${registration.registrationId}
Event: ${registration.eventName}

👥 Members:
${memberList}

⏰ Time: ${entryTime}`
});

    // 6️⃣ Success response
    res.json({
  success: true,
  teamName: registration.teamName,
  members: registration.teamMembers.map((m) => m.fullName)
});

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
      { $group: { _id: null, total: { $sum: "$teamSize" } } }
    ]);

    const checkedInParticipants = await Registration.aggregate([
      { $unwind: "$teamMembers" },
      { $match: { "teamMembers.checkedIn": true } },
      { $count: "count" }
    ]);

    const total = totalParticipants[0]?.total || 0;
    const entered = checkedInParticipants[0]?.count || 0;

    res.json({
      totalParticipants: total,
      enteredParticipants: entered,
      remainingParticipants: total - entered
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
        { $group: { _id: null, total: { $sum: "$teamSize" } } }
      ]);

      const checkedIn = await Registration.aggregate([
        { $unwind: "$teamMembers" },
        { $match: { "teamMembers.checkedIn": true } },
        { $count: "count" }
      ]);

      const revenue = await Registration.aggregate([
        { $group: { _id: null, total: { $sum: "$expectedAmount" } } }
      ]);

      const statsMessage = `📊 Arduino Days Live Stats

👥 Teams: ${totalTeams}

🧑 Participants: ${totalParticipants[0]?.total || 0}

🎟 Checked In: ${checkedIn[0]?.count || 0}

💰 Revenue: ₹${revenue[0]?.total || 0}
`;

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: statsMessage
      });

    }

    return res.sendStatus(200);
  }

  /* =========================
     TELEGRAM BUTTON ACTIONS
  ========================= */

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
const qrData = `https://ieee-sps-website.onrender.com/entry/${registration.registrationId}`;

const qrCodeImage = await QRCode.toDataURL(qrData);

// Send confirmation email
try {
  await axios.post(
    "https://ieee-sps-website.onrender.com/api/send-confirmation-email",
    { registration, qrCodeImage }
  );
  console.log("📧 Confirmation email sent");
} catch (err) {
  console.error("Email sending failed:", err.message);
}

  const members = registration.teamMembers
    .map((m, i) => `${i + 1}. ${m.fullName}`)
    .join("\n");

  // 🔥 Update Telegram message
  await axios.post(`https://api.telegram.org/bot${token}/editMessageCaption`, {
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
    reply_markup: { inline_keyboard: [] } // removes buttons
  });

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

  await axios.post(`https://api.telegram.org/bot${token}/editMessageCaption`, {
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
    reply_markup: { inline_keyboard: [] }
  });

  console.log("❌ Rejected via Telegram");
}

  res.sendStatus(200);

});

module.exports = router;

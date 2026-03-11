const verifyToken = require("../middleware/verifyToken");
const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const Event = require("../models/event"); // adjust path if needed
const rateLimit = require("express-rate-limit");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sendMail = require("../utils/mailer");
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
      startupAnswer,
      startupIdea,
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
        message: "Registrations are currently closed.",
      });
    }
    if (!teamMembers || teamMembers.length !== teamSize) {
      return res.status(400).json({
        message: "Invalid team size",
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
      startup: {
        answer: startupAnswer,
        idea: startupIdea,
      },
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
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const pageWidth = doc.page.width;
    const accentColor = "#00AEEF"; // Sky Blue
    const isConfirmed = registration.registrationStatus === "Confirmed";

    // 1. LOGO & HEADER
    try {
      doc.image(path.join(__dirname, "../public/AD2026.png"), 50, 50, { width: 70 });
    } catch (e) { console.log("Logo skip"); }

    doc.fillColor(accentColor)
       .font("Helvetica-Bold")
       .fontSize(20)
       .text("Arduino Days 2026", 135, 65);
    
    doc.fillColor("gray")
       .font("Helvetica")
       .fontSize(10)
       .text("OFFICIAL REGISTRATION RECEIPT", 135, 90, { characterSpacing: 1 });

    doc.moveDown(4);

    // 2. REGISTRATION SUMMARY (Clean List Style)
    const labelX = 60;
    const valueX = 200;
    let currentY = doc.y;

    const createdDate = new Date(registration.createdAt);
    const details = [
      ["Registration ID", registration.registrationId],
      ["Team Name", registration.teamName],
      ["Event", registration.eventName],
      ["Amount Paid", `Rs. ${registration.expectedAmount} /-`],
      ["Transaction ID", registration.payment.userTransactionId],
      ["Issued On", `${createdDate.toLocaleDateString("en-IN")} at ${createdDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}`]
    ];

    details.forEach(([label, value]) => {
      // Label in light gray
      doc.fontSize(9).fillColor("#7f8c8d").font("Helvetica").text(label.toUpperCase(), labelX, currentY);
      // Value in bold black
      doc.fontSize(11).fillColor("#2d3436").font("Helvetica-Bold").text(value, valueX, currentY);
      
      currentY += 28;
      // Very thin divider line
      doc.moveTo(labelX, currentY - 10).lineTo(pageWidth - labelX, currentY - 10).lineWidth(0.3).strokeColor("#eee").stroke();
    });

    // 3. TEAM MEMBERS (Neat Stacked List)
    doc.y = currentY + 20;
    doc.fontSize(12).fillColor(accentColor).font("Helvetica-Bold").text("PARTICIPANTS", labelX);
    doc.moveDown(1.5);

    registration.teamMembers.forEach((m, i) => {
      const memberY = doc.y;
      
      // Blue bullet point or number
      doc.fillColor(accentColor).font("Helvetica-Bold").fontSize(11).text(`${i + 1}.`, labelX);
      
      // Name (Bold)
      doc.fillColor("#2d3436").font("Helvetica-Bold").fontSize(11).text(m.fullName.toUpperCase(), labelX + 30, memberY);
      
      // Roll Number (Below name, gray)
      doc.fillColor("#636e72").font("Helvetica").fontSize(10).text(`Roll No: ${m.rollNo.toUpperCase()}`, labelX + 30, memberY + 14);
      
      doc.moveDown(2.5);
    });

    // 4. STATUS INDICATOR (Modern Pill Style)
    doc.y = doc.page.height - 150;
    const statusLabel = isConfirmed ? "PAYMENT VERIFIED" : "VERIFICATION PENDING";
    const statusColor = isConfirmed ? "#27ae60" : "#e67e22";

    doc.fillColor(statusColor)
       .font("Helvetica-Bold")
       .fontSize(12)
       .text(statusLabel, { align: "right", indent: 20 });

    // 5. FOOTER
    const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    doc.y = doc.page.height - 70;
    doc.fontSize(8).fillColor("#b2bec3").font("Helvetica")
       .text("IEEE SPS Student Branch Chapter | Aditya University, Surampalem", { align: "center" })
       .text(`System Generated on ${now}`, { align: "center" });

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
      { registration },
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
   7️⃣ SEND CONFIRMATION EMAIL (Separate Route)
===================================== */
router.post("/send-confirmation-email", async (req, res) => {
  try {
    const { registration } = req.body;

    if (!registration || !registration.teamMembers) {
      return res.status(400).json({ message: "Invalid registration data" });
    }

    const participants = registration.teamMembers
      .map((m, i) => `${i + 1}. ${m.fullName}`)
      .join("<br>");

    let htmlTemplate = "";

    if (registration.eventType === "combo") {
      htmlTemplate = `
<div style="font-family:Arial,sans-serif;line-height:1.6">

<div style="text-align:center;margin-bottom:20px">
<img src="https://res.cloudinary.com/dlzs0cgfd/image/upload/v1772826744/titlelogo_k0cdzv.png" width="140">
</div>

<p>Hello <b>${registration.teamName}</b>,</p>

<p>Your registration for <b>Arduino Days 2026</b> has been <b>confirmed</b>.</p>

<h3>Registration Details</h3>

<p>
<b>Event:</b> Skill Forze Workshop + Buildathon<br>
<b>Registration ID:</b> ${registration.registrationId}<br>
<b>Team Size:</b> ${registration.teamSize} Members<br>
<b>Confirmed On:</b> ${new Date().toLocaleString("en-IN")}
</p>

<h3>Team Members</h3>

<ul>
${registration.teamMembers.map((m) => `<li>${m.fullName}</li>`).join("")}
</ul>

<h3>Event Schedule</h3>

<p>
<b>Skill Forze:</b> 23rd & 24th March 2026<br>
<b>Buildathon:</b> 25th March 2026<br>
<b>Venue:</b> Aditya University, Surampalem
</p>

<h3>Important Instructions</h3>

<ul>
<li>Carry your Student ID card</li>
<li>Bring a laptop with Arduino IDE installed</li>
<li>Teams must present a working prototype</li>
</ul>
<h3>WhatsApp Updates</h3>
<p>
Join the official Skill Forze + Buildathon WhatsApp group for announcements and instructions.
</p>

<p style="margin-top:10px;">
<a href="https://chat.whatsapp.com/DruOGVhGlNc989mcDWTEYP" 
style="background:#25D366;color:white;padding:10px 18px;text-decoration:none;border-radius:5px;display:inline-block;">
Join WhatsApp Group
</a>
</p>

<hr>

<p>
For queries contact:<br>
<b>Chitturi Sanjay Kumar</b><br>
+91 7095009441
</p>

<p style="color:gray;font-size:13px">
IEEE SPS Student Branch Chapter<br>
Aditya University, Surampalem
</p>

</div>
`;
    } else {
      htmlTemplate = `
<div style="font-family:Arial,sans-serif;line-height:1.6">

<div style="text-align:center;margin-bottom:20px">
<img src="https://res.cloudinary.com/dlzs0cgfd/image/upload/v1772826744/titlelogo_k0cdzv.png" width="140">
</div>

<p>Hello <b>${registration.teamName}</b>,</p>

<p>Your registration for the <b>Arduino Days Buildathon</b> has been <b>confirmed</b>.</p>

<h3>Registration Details</h3>

<p>
<b>Event:</b> Buildathon Hackathon<br>
<b>Registration ID:</b> ${registration.registrationId}<br>
<b>Team Size:</b> ${registration.teamSize} Members<br>
<b>Confirmed On:</b> ${new Date().toLocaleString("en-IN")}
</p>

<h3>Team Members</h3>

<ul>
${registration.teamMembers.map((m) => `<li>${m.fullName}</li>`).join("")}
</ul>

<h3>Event Details</h3>

<p>
<b>Date:</b> 25th March 2026<br>
<b>Venue:</b> Aditya University, Surampalem
</p>

<h3>Rules</h3>

<ul>
<li>Minimum one laptop per team</li>
<li>Problem statements will be revealed at the venue</li>
<li>Projects must be developed during the event</li>
<li>Teams must present a functional prototype</li>
</ul>

<h3>WhatsApp Updates</h3>

<p>
Join the official Buildathon WhatsApp group for announcements and instructions.
</p>

<p style="margin-top:10px;">
<a href="https://chat.whatsapp.com/Csy0z79Sxyz7kwKvwTEN8p" 
style="background:#25D366;color:white;padding:10px 18px;text-decoration:none;border-radius:5px;display:inline-block;">
Join WhatsApp Group
</a>
</p>

<hr>

<p>
For queries contact:<br>
<b>Chitturi Sanjay Kumar</b><br>
+91 7095009441
</p>

<p style="color:gray;font-size:13px">
IEEE SPS Student Branch Chapter<br>
Aditya University, Surampalem
</p>

</div>
`;
    }

    const pdfBuffer = await generateReceiptPDF(registration);

    const emailPromises = registration.teamMembers
      .filter((member) => member.email)
      .map((member) =>
        sendMail(
          member.email,
          "Arduino Days 2026 – Registration Confirmed (Event Pass Attached)",
          htmlTemplate,
          pdfBuffer,
          `${registration.registrationId}.pdf`,
        ).catch(() => {
          console.error("Email failed:", member.email);
        }),
      );

    await Promise.allSettled(emailPromises);

    res.json({
      success: true,
      message: "Emails sent successfully",
    });
  } catch (error) {
    console.error("Mail error:", error);

    res.status(500).json({
      message: "Email sending failed",
    });
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

    if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
      return res.sendStatus(200);
    }

    // STATS
   if (command === "/stats") {

  // Total teams from both events
  const totalTeams = await Registration.countDocuments({
    eventType: { $in: ["combo", "buildathon"] }
  });

  // Total participants
  const totalParticipants = await Registration.aggregate([
    { $match: { eventType: { $in: ["combo", "buildathon"] } } },
    { $group: { _id: null, total: { $sum: "$teamSize" } } },
  ]);

  // Total revenue
  const revenue = await Registration.aggregate([
    { $match: { eventType: { $in: ["combo", "buildathon"] } } },
    { $group: { _id: null, total: { $sum: "$expectedAmount" } } },
  ]);

  // Check registration status of both events
  const events = await Event.find({
    eventType: { $in: ["combo", "buildathon"] }
  });

  const registrationStatus = events.some(e => e.registrationOpen)
    ? "🟢 OPEN"
    : "🔴 CLOSED";

  const statsMessage = `📊 Arduino Days Live Stats

👥 Teams: ${totalTeams}

🧑 Participants: ${totalParticipants[0]?.total || 0}

💰 Revenue: ₹${revenue[0]?.total || 0}

📥 Registrations: ${registrationStatus}
`;

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: statsMessage,
  });

  return res.sendStatus(200);
}
  }
  /* =========================
     TELEGRAM BUTTON ACTIONS
  ========================= */
  if (!data) return res.sendStatus(200);
  if (!data.callback_query) {
    return res.sendStatus(200);
  }

  const callbackData = data.callback_query.data;
  const chatId = process.env.TELEGRAM_CHAT_ID;

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

    await axios.post(
      "https://ieee-sps-website.onrender.com/api/send-confirmation-email",
      { registration },
    );

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
        reply_markup: {
          inline_keyboard: [], // removes buttons
        },
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
        message_id: registration.telegramMessageId,
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

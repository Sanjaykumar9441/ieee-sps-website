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
const puppeteer = require("puppeteer");
const receiptTemplate = require("../utils/receiptTemplate");
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

  const html = receiptTemplate(registration);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();

  return pdf;
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
  { registration }
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
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Arduino Days 2026 Registration</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<span style="display:none;visibility:hidden;mso-hide:all;">
Arduino Days 2026 – Registration Confirmed (Event Pass Attached)
</span>

<div style="padding:30px;">

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

<h3>Important Instructions</h3>

<ul>
<li>Carry your <b>Student ID Card</b></li>
<li>Bring a <b>Laptop with Arduino IDE installed</b></li>
<li>Teams must present a <b>working prototype</b></li>
</ul>

<div style="text-align:center;margin-top:25px;">

<p>Join the official WhatsApp group for updates</p>

<table align="center">
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

<div style="border-top:1px solid #e5e7eb;margin:25px 0;"></div>

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

</body>
</html>
`;
    } 
    else {

      htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Arduino Days 2026 Registration</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">

<div style="padding:30px;">

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

<h3>Participation Rules</h3>

<ul>
<li>Minimum <b>one laptop per team</b> is mandatory.</li>
<li>Problem statements will be revealed at the venue.</li>
<li>Projects must be developed during the event.</li>
<li>A functional prototype must be presented.</li>
</ul>

<div style="text-align:center;margin-top:25px;">

<p>Join the official Hackathon WhatsApp group</p>

<table align="center">
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

</body>
</html>
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
          `${registration.registrationId}.pdf`
        ).catch(() => {
          console.error("Email failed:", member.email);
        })
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
    await axios.post(
  "https://ieee-sps-website.onrender.com/api/send-confirmation-email",
  { registration }
);

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

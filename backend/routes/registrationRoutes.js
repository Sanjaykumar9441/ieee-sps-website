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
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const pageWidth = doc.page.width;
    const secondaryColor = "#00AEEF"; // Sky Blue from screenshot

    // 1. FRAME BORDER
    doc.rect(20, 20, pageWidth - 40, 10).fill(secondaryColor);
    doc.rect(20, 30, 2, doc.page.height - 50).fill(secondaryColor);
    doc.rect(pageWidth - 22, 30, 2, doc.page.height - 50).fill(secondaryColor);
    doc.rect(20, doc.page.height - 30, pageWidth - 40, 2).fill(secondaryColor);

    // 2. LOGO & HEADER
    try {
      doc.image(
        path.join(__dirname, "../public/AD2026.png"),
        pageWidth / 2 - 45,
        40,
        { width: 90 },
      );
    } catch (e) {
      console.log("Logo path error");
    }

    doc.moveDown(5);
    doc
      .fontSize(22)
      .fillColor(secondaryColor)
      .font("Helvetica-Bold")
      .text("Arduino Days 2026", { align: "center" });
    doc
      .fontSize(10)
      .fillColor("gray")
      .font("Helvetica")
      .text("Official Registration Receipt", { align: "center" });

    doc.moveDown(0.5);
    doc
      .moveTo(100, doc.y)
      .lineTo(pageWidth - 100, doc.y)
      .lineWidth(0.5)
      .strokeColor("#ccc")
      .stroke();
    doc.moveDown(1.5);

    // 3. DETAILS BOX
    const boxX = 60;
    const boxTopY = doc.y;
    doc
      .roundedRect(boxX, boxTopY, pageWidth - 120, 145, 10)
      .fillOpacity(0.05)
      .fill(secondaryColor)
      .fillOpacity(1);

    let currentY = boxTopY + 15;
    const createdDate = new Date(registration.createdAt);
    const details = [
      ["Registration ID:", registration.registrationId],
      ["Team Name:", registration.teamName],
      ["Event:", registration.eventName],
      ["Team Size:", registration.teamSize.toString()],
      ["Amount Paid:", `Rs. ${registration.expectedAmount} /-`],
      ["Transaction ID:", registration.payment.userTransactionId],
      [
        "Date:",
        createdDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ],
      [
        "Time:",
        createdDate
          .toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          .toLowerCase(),
      ],
    ];

    details.forEach(([label, value]) => {
      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(label, boxX + 25, currentY);
      doc.font("Helvetica").text(value, boxX + 150, currentY);
      currentY += 15;
    });

    // 4. TEAM MEMBERS LIST (Simple Layout)

    doc.moveDown(2);

    doc
      .fontSize(12)
      .fillColor(secondaryColor)
      .font("Helvetica-Bold")
      .text("Team Members", { align: "center" });

    doc.moveDown(1);

    doc.fillColor("black").font("Helvetica").fontSize(10);

    registration.teamMembers.forEach((m, i) => {
      doc.text(
        `${i + 1}. ${m.fullName.toUpperCase()}  -  ${m.rollNo.toUpperCase()}`,
        {
          align: "left",
        },
      );

      doc.moveDown(0.5);
    });
    // 5. DYNAMIC STATUS
    doc.moveDown(3);
    const isConfirmed = registration.registrationStatus === "Confirmed";
    doc
      .fontSize(11)
      .fillColor(isConfirmed ? "green" : "red")
      .font("Helvetica-Bold")
      .text(
        `Status : ${isConfirmed ? "Payment Verified" : "Payment Submitted - Awaiting Verification"}`,
        { align: "right", indent: 40 },
      );

    // 6. FOOTER WITH TIMESTAMP
    const now = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.y = doc.page.height - 85;
    doc
      .fontSize(8)
      .fillColor("gray")
      .font("Helvetica")
      .text("IEEE SPS Student Branch Chapter", { align: "center" })
      .text("Aditya University, Surampalem", { align: "center" })
      .moveDown(0.5)
      .fontSize(7)
      .text(`Generated on: ${now}`, { align: "center", fontStyle: "italic" });

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

<p>
Join WhatsApp group for updates:
</p>

<p>
<a href="https://chat.whatsapp.com/DruOGVhGlNc989mcDWTEYP">
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

<p>
Join the official Buildathon WhatsApp group:
</p>

<p>
<a href="https://chat.whatsapp.com/Csy0z79Sxyz7kwKvwTEN8p">
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
    if (command === "/open") {
      const event = await Event.findOne({ eventType: "combo" });

      if (!event) return res.sendStatus(200);

      event.registrationOpen = true;
      await event.save();

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: "🟢 Registrations are now OPEN",
      });
    }
    if (command === "/close") {
      const event = await Event.findOne({ eventType: "combo" });

      if (!event) return res.sendStatus(200);

      event.registrationOpen = false;
      await event.save();

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: "🔴 Registrations are now CLOSED",
      });
    }

    if (command === "/stats") {
      const totalTeams = await Registration.countDocuments();

      const totalParticipants = await Registration.aggregate([
        { $group: { _id: null, total: { $sum: "$teamSize" } } },
      ]);

      const revenue = await Registration.aggregate([
        { $group: { _id: null, total: { $sum: "$expectedAmount" } } },
      ]);

      // Get registration status
      const event = await Event.findOne({ eventType: "combo" });
      const registrationStatus = event?.registrationOpen
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

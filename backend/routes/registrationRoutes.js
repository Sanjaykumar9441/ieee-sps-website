const verifyToken = require("../middleware/verifyToken");
const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const Event = require("../models/event"); // adjust path if needed
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sendMail = require("../utils/mailer");
const Tesseract = require("tesseract.js");
const sendTelegramNotification = async (message) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });

    console.log("✅ Telegram notification sent");
  } catch (error) {
    console.error("❌ Telegram notification failed:", error.message);
  }
};
async function extractAmountFromImage(imageUrl) {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imageUrl, "eng");

    console.log("OCR TEXT:", text);

    const amountMatch = text.match(/₹\s?\d+/);

    if (amountMatch) {
      return parseInt(amountMatch[0].replace(/[^0-9]/g, ""));
    }

    return null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
}

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

    const eventName =
      event === "combo" ? "Skill Forze + Buildathon" : "Buildathon";

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
router.post("/register", async (req, res) => {

  if (req.body.honeypot) {
    return res.status(400).json({
      message: "Spam detected"
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
    // AI OCR Payment Detection
    //const detectedAmount = await extractAmountFromImage(screenshotUrl);

   // if (detectedAmount && detectedAmount !== correctAmount) {
     // console.log("⚠ Payment mismatch detected");
    //}

    // 🚫 Prevent fake payment amounts
    if (frontendAmount !== correctAmount) {
      return res.status(400).json({
        message: "Invalid payment amount detected.",
      });
    }

    // 🚫 Prevent empty payment submission
    if (!userTransactionId || userTransactionId.length < 12) {
      return res.status(400).json({ message: "Valid UTR ID is required" });
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
    const message = `🚀 New Registration: ${teamName}\nEvent: ${eventName}\nUTR: ${userTransactionId}`;
    await sendTelegramNotification(message);
    await sendTelegramNotification(`🖼 Payment Screenshot:\n${screenshotUrl}`);

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

    const doc = new PDFDocument({ margin: 40 });

    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", () => {

      const pdfBuffer = Buffer.concat(buffers);

      resolve(pdfBuffer);

    });

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

    /* LOGO */
    doc.image("public/titlelogo.png", pageWidth / 2 - 60, 20, {
      width: 120,
    });

    /* TITLE */
    doc
      .fontSize(18)
      .fillColor("#00b4ff")
      .text(
        "Arduino Days 2026 Registration Receipt",
        0,
        70,
        { align: "center" }
      );

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

    doc.text(`Transaction ID : ${registration.payment.userTransactionId}`, 40, y);
    y += 20;

    doc.text(`Date : ${date}`, 40, y);
    y += 20;

    doc.text(`Time : ${time}`, 40, y);

    /* MEMBERS */
    y += 40;

    doc
      .fontSize(14)
      .fillColor("#00b4ff")
      .text("Team Members", 40, y);

    doc.fontSize(12).fillColor("black");

    y += 20;

    registration.teamMembers.forEach((member, index) => {

      doc.text(
        `${index + 1}. ${member.fullName} - ${member.rollNo}`,
        50,
        y
      );

      y += 15;

    });

    /* STATUS */

    y += 20;

    doc
      .fillColor("red")
      .text(
        "Status : Payment Submitted - Verification Pending",
        40,
        y
      );

    /* FOOTER */

    doc
      .fillColor("black")
      .fontSize(10)
      .text(
        "IEEE SPS Student Branch Chapter",
        0,
        pageHeight - 60,
        { align: "center" }
      );

    doc.text(
      "Aditya University",
      0,
      pageHeight - 45,
      { align: "center" }
    );

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
    registration.registrationStatus = "Confirmed";
    registration.payment.verified = true;

    await registration.save();

    const message = `
✅ Registration Confirmed

Team: ${registration.teamName}
Event: ${registration.eventName}
Registration ID:${registration.registrationId}
Members: ${registration.teamMembers.length}
Hostel: ${registration.accommodationRequired ? "Yes" : "No"}
`;

    await sendTelegramNotification(message);

    // Fetch event details from Events collection
    let eventDate = "To be announced";
    let eventVenue = "To be announced";

    const eventDetails = await Event.findOne({
      title: registration.eventName,
    });

    if (eventDetails) {
      eventDate = eventDetails.date || eventDate;
      eventVenue = eventDetails.location || eventVenue;
    }

    // ✅ THIS WAS MISSING
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
      `attachment; filename=${registration.registrationId}.pdf`
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
      y
    );
    y += 20;

    doc.text(`Date : ${date}`, 40, y);
    y += 20;

    doc.text(`Time : ${time}`, 40, y);

    y += 40;

    doc
      .fontSize(14)
      .fillColor("#00b4ff")
      .text("Team Members", 40, y);

    doc.fontSize(12).fillColor("black");

    y += 20;

    registration.teamMembers.forEach((member, index) => {
      doc.text(`${index + 1}. ${member.fullName} - ${member.rollNo}`, 50, y);
      y += 15;
    });

    y += 20;

    doc.fillColor("red").text(
      "Status : Payment Submitted - Verification Pending",
      40,
      y
    );

    doc
      .fillColor("black")
      .fontSize(10)
      .text(
        "IEEE SPS Student Branch Chapter",
        0,
        pageHeight - 60,
        { align: "center" }
      );

    doc.text("Aditya University", 0, pageHeight - 45, { align: "center" });

    doc.end();

  } catch (error) {
    console.error("PDF ERROR:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});
/* =====================================
   6️⃣ VERIFY PAYMENT STATUS
===================================== */
router.put("/verify-payment/:id", verifyToken, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // 1. OCR Check (Non-blocking but informative)
    let ocrWarning = "";
    try {
      const detectedAmount = await extractAmountFromImage(registration.payment.screenshotUrl);
      
      // Use fuzzy matching or Number conversion to avoid string/number type issues
      if (Number(detectedAmount) !== Number(registration.expectedAmount)) {
        console.warn(`⚠ OCR Mismatch: Expected ${registration.expectedAmount}, found ${detectedAmount}`);
        ocrWarning = " (Note: OCR detected an amount mismatch)";
      }
    } catch (ocrError) {
      console.error("OCR Failed:", ocrError);
      // Don't crash the whole route if OCR fails
    }

    // 2. Explicitly set verified (Don't toggle!)
    // If you want to toggle, check a value in req.body, e.g., req.body.status
    registration.payment.verified = true; 
    await registration.save();

    // 3. Structured Telegram Message
    const message = `
💳 *Payment Verified* ${ocrWarning ? "⚠️" : "✅"}
-------------------------
*Team:* ${registration.teamName}
*Event:* ${registration.eventName}
*Amount:* ${registration.expectedAmount}
${ocrWarning}
`;

    await sendTelegramNotification(message);

    return res.json({
      success: true,
      message: "Payment verified successfully",
      ocrMismatch: !!ocrWarning
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Internal server error during verification" });
  }
});

/* =====================================
   7️⃣ SEND CONFIRMATION EMAIL (Separate Route)
===================================== */
router.post("/send-confirmation-email", verifyToken, async (req, res) => {
  try {
    const { registration } = req.body;

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

module.exports = router;

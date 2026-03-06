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

    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      "eng"
    );

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
router.get("/registrations", async (req, res) => {
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
      eventName: eventName,
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
  try {
    const {
      eventType,
      eventName,
      teamName,
      teamSize,
      teamMembers,
      accommodationRequired,
      hostelMembers,
      expectedAmount, // This is what the frontend claims is the price
      userTransactionId,
      screenshotUrl,
    } = req.body;

    // 🔐 Secure amount calculation (backend authority)
    const perPersonFee = eventType === "combo" ? 200 : 100;
    const correctAmount = perPersonFee * teamSize;
    // AI OCR Payment Detection
const detectedAmount = await extractAmountFromImage(screenshotUrl);

if (detectedAmount && detectedAmount !== correctAmount) {
  console.log("⚠ Payment mismatch detected");
}

    // 🚫 Prevent fake payment amounts
    if (expectedAmount !== correctAmount) {
      return res.status(400).json({
        message: "Invalid payment amount detected."
      });
    }

    // 🚫 Prevent empty payment submission
    if (!userTransactionId || userTransactionId.length < 12) {
      return res.status(400).json({ message: "Valid UTR ID is required" });
    }

    if (!screenshotUrl) {
      return res.status(400).json({ message: "Payment screenshot is required" });
    }

    // 🚫 Prevent duplicate transaction ID
    const existingTransaction = await Registration.findOne({
      "payment.userTransactionId": userTransactionId,
    });
    if (existingTransaction) {
      return res.status(400).json({ message: "This UTR ID has already been used." });
    }

    // 🚫 Prevent duplicate team name
    const existingTeam = await Registration.findOne({
      teamName: teamName.toUpperCase(),
      eventName: eventName,
    });
    if (existingTeam) {
      return res.status(400).json({ message: "Team name already registered for this event." });
    }

    // 🚫 Check for duplicate members (Email, Phone, or RollNo)
    const duplicateMember = await Registration.findOne({
      $or: [
        { "teamMembers.email": { $in: teamMembers.map((m) => m.email) } },
        { "teamMembers.phone": { $in: teamMembers.map((m) => m.phone) } },
        { "teamMembers.rollNo": { $in: teamMembers.map((m) => m.rollNo) } }
      ]
    });

    if (duplicateMember) {
      return res.status(400).json({ message: "One of the team members is already registered." });
    }

    const registration = new Registration({
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

/* =====================================
   3️⃣ CONFIRM REGISTRATION
===================================== */
router.put("/confirm/:id", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Generate Registration ID
    const prefix =
      registration.eventType === "combo" ? "SPS26-CMB" : "SPS26-BLD";

    // find last registration
    const lastRegistration = await Registration.findOne({
      eventType: registration.eventType,
      registrationStatus: "Confirmed",
    }).sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastRegistration && lastRegistration.registrationId) {
      const parts = lastRegistration.registrationId.split("-");
      const lastNumber = parseInt(parts[parts.length - 1]);
      nextNumber = lastNumber + 1;
    }

    const registrationId = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
    // SAFETY CHECK
    const existing = await Registration.findOne({ registrationId });

    if (existing) {
      return res.status(400).json({
        message: "Registration ID conflict. Please try again.",
      });
    }

    registration.registrationId = registrationId;
    registration.registrationStatus = "Confirmed";
    registration.payment.verified = true;

    await registration.save();

    const message = `
✅ Registration Confirmed

Team: ${registration.teamName}
Event: ${registration.eventName}
Registration ID: ${registration.registrationId}
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
router.delete("/:id", async (req, res) => {
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
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (!registration.registrationId) {
      return res.status(400).json({
        message: "Registration not confirmed yet",
      });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${registration.registrationId}.pdf`,
    );

    doc.pipe(res);

    doc.fontSize(18).text("IEEE SPS Registration Confirmation", {
      align: "center",
    });

    doc.moveDown();
    doc.fontSize(12);

    doc.text(`Registration ID: ${registration.registrationId}`);
    doc.text(`Event: ${registration.eventName}`);
    doc.text(`Team Name: ${registration.teamName}`);
    doc.text(`Team Size: ${registration.teamSize}`);
    doc.moveDown();

    doc.text("Team Members:");
    registration.teamMembers.forEach((member, index) => {
      doc.text(`${index + 1}. ${member.fullName} - ${member.rollNo}`);
    });

    if (
      registration.accommodationRequired &&
      registration.hostelMembers &&
      registration.hostelMembers.length > 0
    ) {
      doc.moveDown();
      doc.text("Hostel Members:");
      registration.hostelMembers.forEach((member, index) => {
        doc.text(`${index + 1}. ${member.fullName}`);
      });
    }

    doc.end();
  } catch (error) {
    console.error("PDF ERROR:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

/* =====================================
   6️⃣ VERIFY PAYMENT STATUS
===================================== */
router.put("/verify-payment/:id", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Toggle verification status
    registration.payment.verified = !registration.payment.verified;
    await registration.save();

    const message = `
💳 Payment Status Updated

Team: ${registration.teamName}
Event: ${registration.eventName}
Verified: ${registration.payment.verified ? "Yes" : "No"}
`;

    await sendTelegramNotification(message);

    res.json({
      message: "Payment status updated",
      data: registration,
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Error updating payment" });
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

    // Template Selection
    if (registration.eventType === "combo") {
      htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; padding: 40px 10px; color: #fff;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #18181b, #09090b); border: 1px solid #22d3ee; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);">
        
        <div style="background: linear-gradient(90deg, #0891b2, #0e7490); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Arduino Days 2026</h1>
            <p style="margin-top: 5px; opacity: 0.9; font-weight: 300;">Registration Confirmed 🎉</p>
        </div>

        <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px;">Hello <b style="color: #22d3ee;">${registration.teamName}</b>,</p>
            <p style="color: #a1a1aa;">Great news! Your team has successfully secured a spot for the premium technical experience at Aditya University.</p>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border-left: 4px solid #22d3ee; margin: 25px 0;">
                <p style="margin: 5px 0;"><strong>Event:</strong> Skill Forze Workshop + Buildathon</p>
                <p style="margin: 5px 0;"><strong>Registration ID:</strong> <span style="color: #facc15;">${registration._id}</span></p>
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
            <p style="margin: 0; font-size: 14px; color: #71717a;">Regards,</p>
            <p style="margin: 5px 0; color: #22d3ee; font-weight: bold;">IEEE SPS Student Branch Chapter</p>
            <p style="margin: 0; font-size: 12px; color: #52525b;">Aditya University, Surampalem</p>
        </div>
    </div>
</div>` ;
    } else {
      htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; padding: 40px 10px; color: #fff;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #18181b, #09090b); border: 1px solid #a855f7; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.1);">
        
        <div style="background: linear-gradient(90deg, #9333ea, #6b21a8); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Arduino Days 2026</h1>
            <p style="margin-top: 5px; opacity: 0.9; font-weight: 300;">Buildathon Hackathon Confirmed 🚀</p>
        </div>

        <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px;">Hello <b style="color: #a855f7;">${registration.teamName}</b>,</p>
            <p style="color: #a1a1aa;">Gear up! Your registration for the Buildathon challenge is officially confirmed.</p>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border-left: 4px solid #a855f7; margin: 25px 0;">
                <p style="margin: 5px 0;"><strong>Event:</strong> Buildathon Hackathon</p>
                <p style="margin: 5px 0;"><strong>Registration ID:</strong> <span style="color: #facc15;">${registration._id}</span></p>
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
            <p style="margin: 0; font-size: 14px; color: #71717a;">Regards,</p>
            <p style="margin: 5px 0; color: #a855f7; font-weight: bold;">IEEE SPS Student Branch Chapter</p>
            <p style="margin: 0; font-size: 12px; color: #52525b;">Aditya University, Surampalem</p>
        </div>
    </div>
</div>`;
    }

    // Send to all members
    for (const member of registration.teamMembers) {
      await sendMail(
        member.email,
        "Arduino Days 2026 Registration Confirmed",
        htmlTemplate
      );
    }

    res.json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Mail error:", error);
    res.status(500).json({ message: "Email sending failed" });
  }
});

module.exports = router;
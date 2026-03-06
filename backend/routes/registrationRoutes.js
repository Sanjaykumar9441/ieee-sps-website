const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const Event = require("../models/event"); // adjust path if needed
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sendMail = require("../utils/mailer");
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

router.put("/verify-payment/:id", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Not found" });
    }

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
    res.status(500).json({ message: "Error updating payment" });
  }
});
const participants = registration.teamMembers
  .map((m) => m.fullName)
  .join("<br>");

for (const member of registration.teamMembers) {

  const html = `
  <h2>Arduino Days 2026 Registration Confirmed</h2>

  <p><b>Team Name:</b> ${registration.teamName}</p>
  <p><b>Event:</b> ${registration.eventName}</p>
  <p><b>Registration ID:</b> ${registration.registrationId}</p>

  <h3>Participants</h3>
  ${participants}

  <p>See you at the event!</p>
  `;

  sendMail(member.email,"Arduino Days Registration Confirmed",html);

}
module.exports = router;

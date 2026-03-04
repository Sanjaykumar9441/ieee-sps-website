const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const Event = require("../models/event"); // adjust path if needed
const PDFDocument = require("pdfkit");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
      userTransactionId,
      screenshotUrl,
    } = req.body;
    // 🚫 Prevent empty payment submission
    if (!userTransactionId || !screenshotUrl) {
      return res.status(400).json({
        message: "Transaction ID and screenshot are required",
      });
    }

    /* 🚫 Prevent duplicate transaction ID */
    const existingTransaction = await Registration.findOne({
      "payment.userTransactionId": userTransactionId,
    });

    if (existingTransaction) {
      return res.status(400).json({
        message: "This transaction ID has already been used.",
      });
    }

    /* 🚫 Prevent duplicate team name */
    const existingTeam = await Registration.findOne({
      teamName: teamName.toUpperCase(),
      eventName: eventName,
    });

    if (existingTeam) {
      return res.status(400).json({
        message: "This team name has already registered for this event.",
      });
    }

    const registration = new Registration({
      eventType,
      eventName,
      teamName: teamName.toUpperCase(),
      teamSize,
      teamMembers,
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
    const count = await Registration.countDocuments({
      eventType: registration.eventType,
      registrationStatus: "Confirmed",
    });

    const prefix =
      registration.eventType === "combo" ? "SPS-COMBO" : "SPS-BUILD";

    const registrationId = `${prefix}-2026-${String(count + 1).padStart(3, "0")}`;

    registration.registrationId = registrationId;
    registration.registrationStatus = "Confirmed";
    registration.payment.verified = true;

    await registration.save();

    /* ================= SEND EMAIL TO ALL TEAM MEMBERS ================= */

    // Fetch event details from Events collection
    const eventDetails = await Event.findOne({
      title: registration.eventName,
    });

    const eventDate = eventDetails?.date || "To be announced";
    const eventVenue = eventDetails?.location || "To be announced";

    // Collect all emails
    const allEmails = registration.teamMembers
      .map((member) => member.email)
      .filter((email) => email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: allEmails, // send to all
      subject: `Registration Confirmed - ${registration.eventName}`,
      html: `
    <p>Dear Participant,</p>

    <p>Greetings from <b>IEEE SPS Student Branch</b>!</p>

    <p>Your registration has been successfully confirmed.</p>

    <h3>Event Details:</h3>
    <ul>
      <li><b>Event:</b> ${registration.eventName}</li>
      <li><b>Date:</b> ${eventDate}</li>
      <li><b>Venue:</b> ${eventVenue}</li>
    </ul>

    <h3>Registration Details:</h3>
    <ul>
      <li><b>Registration ID:</b> ${registrationId}</li>
      <li><b>Team Name:</b> ${registration.teamName}</li>
      <li><b>Team Size:</b> ${registration.teamSize}</li>
    </ul>

    <p>Please keep this email for future reference.</p>

    <p>We look forward to your participation!</p>

    <br/>
    <p>
      Best Regards,<br/>
      IEEE SPS Student Branch
      Aditya University
    </p>
  `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully");
    } catch (emailError) {
      console.error("❌ EMAIL ERROR:", emailError.message);
    }

    // ✅ THIS WAS MISSING
    res.json({
      message: "Registration confirmed and Email sent",
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

    res.json({
      message: "Payment status updated",
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment" });
  }
});

module.exports = router;

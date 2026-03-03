const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const PDFDocument = require("pdfkit");

/* =====================================
   1️⃣ CREATE REGISTRATION
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
      screenshotUrl
    } = req.body;

    const registration = new Registration({
      eventType,
      eventName,
      teamName,
      teamSize,
      teamMembers,
      accommodationRequired,
      hostelMembers,
      payment: {
        userTransactionId,
        screenshotUrl,
        verified: false
      },
      registrationStatus: "Pending"
    });

    await registration.save();

    res.status(201).json({
      message: "Registration submitted successfully",
      data: registration
    });

  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ message: "Error submitting registration" });
  }
});


/* =====================================
   2️⃣ GET ALL REGISTRATIONS
===================================== */
router.get("/registration", async (req, res) => {
  try {
    const registrations = await Registration.find()
      .sort({ createdAt: -1 });

    res.json(registrations);

  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ message: "Error fetching registrations" });
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

    // Already confirmed safeguard
    if (registration.registrationStatus === "Confirmed") {
      return res.json({
        message: "Already confirmed",
        data: registration
      });
    }

    // Count already confirmed for same event type
    const count = await Registration.countDocuments({
      eventType: registration.eventType,
      registrationStatus: "Confirmed"
    });

    const prefix =
      registration.eventType === "combo"
        ? "SPS-COMBO"
        : "SPS-BUILD";

    const registrationId =
      `${prefix}-2026-${String(count + 1).padStart(3, "0")}`;

    registration.registrationId = registrationId;
    registration.registrationStatus = "Confirmed";

    if (registration.payment) {
      registration.payment.verified = true;
    }

    await registration.save();

    res.json({
      message: "Registration confirmed successfully",
      data: registration
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
        message: "Registration not confirmed yet"
      });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${registration.registrationId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("IEEE SPS Registration Confirmation", {
      align: "center"
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

module.exports = router;
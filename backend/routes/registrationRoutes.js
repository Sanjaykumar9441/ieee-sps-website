const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const PDFDocument = require("pdfkit");

/* ================================
   1️⃣ CREATE REGISTRATION
================================ */
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
    console.error(error);
    res.status(500).json({ message: "Error submitting registration" });
  }
});


/* ================================
   2️⃣ GET PENDING REGISTRATIONS
================================ */
router.get("/pending", async (req, res) => {
  try {
    const registrations = await Registration.find({
      registrationStatus: "Pending"
    }).sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending registrations" });
  }
});


/* ================================
   3️⃣ GET CONFIRMED REGISTRATIONS
================================ */
router.get("/confirmed", async (req, res) => {
  try {
    const registrations = await Registration.find({
      registrationStatus: "Confirmed"
    }).sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching confirmed registrations" });
  }
});


/* ================================
   4️⃣ CONFIRM REGISTRATION
================================ */
router.put("/confirm/:id", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Generate Registration ID
    const count = await Registration.countDocuments({
      eventType: registration.eventType,
      registrationStatus: "Confirmed"
    });

    const prefix =
      registration.eventType === "combo"
        ? "SPS-COMBO"
        : "SPS-BUILD";

    const registrationId = `${prefix}-2026-${String(count + 1).padStart(3, "0")}`;

    registration.registrationId = registrationId;
    registration.registrationStatus = "Confirmed";
    registration.payment.verified = true;

    await registration.save();

    res.json({
      message: "Registration confirmed successfully",
      data: registration
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error confirming registration" });
  }
});


/* ================================
   5️⃣ DELETE REGISTRATION
================================ */
router.delete("/:id", async (req, res) => {
  try {
    await Registration.findByIdAndDelete(req.params.id);
    res.json({ message: "Registration deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting registration" });
  }
});


/* ================================
   6️⃣ DOWNLOAD PDF
================================ */
router.get("/pdf/:id", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Not found" });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${registration.registrationId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("IEEE SPS Registration Confirmation", { align: "center" });
    doc.moveDown();

    doc.text(`Registration ID: ${registration.registrationId}`);
    doc.text(`Event: ${registration.eventName}`);
    doc.text(`Team Name: ${registration.teamName}`);
    doc.text(`Team Size: ${registration.teamSize}`);
    doc.moveDown();

    doc.text("Team Members:");
    registration.teamMembers.forEach((member, index) => {
      doc.text(`${index + 1}. ${member.fullName} - ${member.rollNo}`);
    });

    if (registration.accommodationRequired) {
      doc.moveDown();
      doc.text("Hostel Members:");
      registration.hostelMembers.forEach((member, index) => {
        doc.text(`${index + 1}. ${member.fullName}`);
      });
    }

    doc.end();

  } catch (error) {
    res.status(500).json({ message: "Error generating PDF" });
  }
});


module.exports = router;
const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");
const Event = require("../models/event"); // adjust path if needed
const PDFDocument = require("pdfkit");

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const axios = require("axios");

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

    await registration.save();

    const message = `
🚀 New Registration Submitted

Team: ${teamName}
Event: ${eventName}
Members: ${teamMembers.length}
Hostel: ${accommodationRequired ? "Yes" : "No"}
Transaction ID: ${userTransactionId}
`;

    await sendTelegramNotification(message);

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

    /* ================= SEND EMAIL TO ALL TEAM MEMBERS ================= */

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

    // Collect all emails
    const allEmails = registration.teamMembers
      .map((member) => member.email)
      .filter((email) => email && email.trim() !== "");

    try {
      if (allEmails.length > 0) {
        const emailResponse = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: allEmails,
          subject: `Registration Confirmed - ${registration.eventName}`,
          html: `
<div style="font-family: Arial, sans-serif; padding:20px">

<h2 style="color:#0ea5e9;">IEEE Signal Processing Society</h2>

<p>Dear Participant,</p>

<p>
Greetings from <b>IEEE SPS Student Branch – Aditya University</b>.
</p>

<p>
Your registration for the event has been successfully confirmed.
</p>

<h3>Event Details</h3>

<table style="border-collapse:collapse">
<tr>
<td style="padding:6px"><b>Event</b></td>
<td style="padding:6px">${registration.eventName}</td>
</tr>

<tr>
<td style="padding:6px"><b>Date</b></td>
<td style="padding:6px">${eventDate}</td>
</tr>

<tr>
<td style="padding:6px"><b>Venue</b></td>
<td style="padding:6px">${eventVenue}</td>
</tr>
</table>

<h3>Registration Details</h3>

<table style="border-collapse:collapse">
<tr>
<td style="padding:6px"><b>Registration ID</b></td>
<td style="padding:6px">${registrationId}</td>
</tr>

<tr>
<td style="padding:6px"><b>Team Name</b></td>
<td style="padding:6px">${registration.teamName}</td>
</tr>

<tr>
<td style="padding:6px"><b>Team Size</b></td>
<td style="padding:6px">${registration.teamSize}</td>
</tr>
</table>

<p>
Please keep this email for future reference.
</p>

<p>
We look forward to your participation!
</p>
<p>
For updates visit:
<a href="https://ieeespsaditya.vercel.app">
https://ieeespsaditya.vercel.app
</a>
</p>

<br>

<p>
Best Regards<br>
<b>IEEE SPS Student Branch</b><br>
Aditya University
</p>

</div>

      `,
        });
        console.log("Resend response:", emailResponse);

        console.log("✅ Email sent successfully");
      } else {
        console.log("⚠ No emails found, skipping email");
      }
    } catch (emailError) {
      console.error("❌ EMAIL ERROR:", emailError);
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
module.exports = router;

const express = require("express");
const ExcelJS = require("exceljs");

const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/excel", verifyToken, async (req, res) => {
  try {
    const registrations = await SpaceDayRegistration.find().sort({
      createdAt: -1,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Registrations");

    worksheet.columns = [
      { header: "Registration ID", key: "registrationId", width: 20 },
      { header: "Event", key: "event", width: 22 },
      { header: "Team", key: "team", width: 25 },
      { header: "Participant", key: "participant", width: 28 },
      { header: "Roll Number", key: "roll", width: 18 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "College", key: "college", width: 28 },
      { header: "Department", key: "department", width: 28 },
      { header: "Year", key: "year", width: 15 },
      { header: "Fee", key: "fee", width: 12 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Transaction ID", key: "transaction", width: 24 },
    ];

    registrations.forEach((registration) => {
      registration.members.forEach((member) => {
        worksheet.addRow({
          registrationId: registration.registrationId,
          event: registration.eventType,
          team: registration.teamName || "Individual",
          participant: member.fullName,
          roll: member.rollNumber,
          phone: member.phone,
          email: member.email,
          college: member.college,
          department: member.department,
          year: member.year,
          fee: registration.totalFee,
          payment: registration.paymentStatus,
          transaction: registration.transactionId,
        });
      });
    });

    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: "FFFFFF" },
    };

    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2563EB" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SpaceDay_Registrations.xlsx"'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error("Export Error:", error);

    res.status(500).json({
      message: "Failed to export registrations.",
    });
  }
});

module.exports = router;
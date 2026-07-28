const express = require("express");
const ExcelJS = require("exceljs");

const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const eventNames = {
  astroquiz: "Astro Quiz",
  astrodesign: "AI Astro Design",
  astromodeler: "Astro Modeler",
};

router.get("/excel", verifyToken, async (req, res) => {
  try {
    const registrations = await SpaceDayRegistration.find().sort({
      createdAt: -1,
    });

    const workbook = new ExcelJS.Workbook();

    const quizSheet = workbook.addWorksheet("Astro Quiz");

    const designSheet = workbook.addWorksheet("AI Astro Design");

    const modelerSheet = workbook.addWorksheet("Astro Modeler");

    const accommodationSheet = workbook.addWorksheet("Accommodation");

    const summarySheet = workbook.addWorksheet("Summary");

    const registrationColumns = [
      { header: "Registration ID", key: "registrationId", width: 20 },
      { header: "Team", key: "team", width: 22 },
      { header: "Participant", key: "participant", width: 28 },
      { header: "Gender", key: "gender", width: 12 },
      { header: "Roll Number", key: "roll", width: 18 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 32 },
      { header: "College", key: "college", width: 30 },
      { header: "Department", key: "department", width: 25 },
      { header: "Year", key: "year", width: 10 },
      { header: "Fee", key: "fee", width: 12 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Transaction ID", key: "transaction", width: 24 },
      { header: "Arrival Date", key: "arrivalDate", width: 15 },
      { header: "Arrival Time", key: "arrivalTime", width: 15 },
      { header: "Departure Date", key: "departureDate", width: 15 },
      { header: "Departure Time", key: "departureTime", width: 15 },
    ];

    quizSheet.columns = registrationColumns;

    designSheet.columns = registrationColumns;

    modelerSheet.columns = registrationColumns;

    accommodationSheet.columns = [
      { header: "Registration ID", key: "registrationId", width: 20 },
      { header: "Event", key: "event", width: 20 },
      { header: "Team", key: "team", width: 22 },
      { header: "Participant", key: "participant", width: 28 },
      { header: "Gender", key: "gender", width: 12 },
      { header: "Roll Number", key: "roll", width: 18 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "College", key: "college", width: 30 },
      { header: "Arrival Date", key: "arrivalDate", width: 15 },
      { header: "Arrival Time", key: "arrivalTime", width: 15 },
      { header: "Departure Date", key: "departureDate", width: 15 },
      { header: "Departure Time", key: "departureTime", width: 15 },
    ];

    registrations.forEach((registration) => {
      let sheet;

      switch (registration.eventType) {
        case "astroquiz":
          sheet = quizSheet;
          break;

        case "astrodesign":
          sheet = designSheet;
          break;

        case "astromodeler":
          sheet = modelerSheet;
          break;

        default:
          return;
      }

      const startRow = sheet.rowCount + 1;

      registration.members.forEach((member) => {
        sheet.addRow({
          registrationId: registration.registrationId,

          team: registration.teamName || "Individual",

          participant: member.fullName,

          gender: member.gender,

          roll: member.rollNumber,

          phone: member.phone,

          email: member.email,

          college: member.college,

          department: member.department,

          year: member.year,

          fee: registration.totalFee,

          payment: registration.paymentStatus,

          transaction: registration.transactionId,

          arrivalDate: registration.arrivalDate || "",

          arrivalTime: registration.arrivalTime || "",

          departureDate: registration.departureDate || "",

          departureTime: registration.departureTime || "",
        });
      });

      const endRow = sheet.rowCount;

      if (
        registration.registrationType === "team" &&
        registration.members.length > 1
      ) {
        [
          "A", // Registration ID
          "B", // Team
          "K", // Fee
          "L", // Payment
          "M", // Transaction
          "N", // Arrival Date
          "O", // Arrival Time
          "P", // Departure Date
          "Q", // Departure Time
        ].forEach((column) => {
          sheet.mergeCells(`${column}${startRow}:${column}${endRow}`);

          sheet.getCell(`${column}${startRow}`).alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        });
      }

      /* ------------------------------
   ACCOMMODATION SHEET
------------------------------ */

      if (registration.accommodation) {
        registration.members.forEach((member, index) => {
          // Skip members who didn't select hostel
          if (
            registration.registrationType === "team" &&
            registration.accommodationMembers &&
            registration.accommodationMembers[index] === false
          ) {
            return;
          }

          accommodationSheet.addRow({
            registrationId: registration.registrationId,

            event: eventNames[registration.eventType],

            team: registration.teamName || "Individual",

            participant: member.fullName,

            gender: member.gender,

            roll: member.rollNumber,

            phone: member.phone,

            college: member.college,

            arrivalDate: registration.arrivalDate || "",

            arrivalTime: registration.arrivalTime || "",

            departureDate: registration.departureDate || "",

            departureTime: registration.departureTime || "",
          });
        });
      }
    });

    const sheets = [quizSheet, designSheet, modelerSheet, accommodationSheet];

    sheets.forEach((sheet) => {
      // Freeze header row
      sheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      // Auto filter

      if (sheet === accommodationSheet) {
        sheet.autoFilter = "A1:L1";
      } else {
        sheet.autoFilter = "A1:Q1";
      }
      // Style header
      const header = sheet.getRow(1);

      header.height = 24;

      header.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };

      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "0F4C81", // IEEE Blue
        },
      };

      header.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      if (sheet !== accommodationSheet) {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const paymentCell = row.getCell("L");

          if (paymentCell.value === "Verified") {
            paymentCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "D1FAE5" },
            };

            paymentCell.font = {
              color: { argb: "166534" },
              bold: true,
            };
          }

          if (paymentCell.value === "Pending") {
            paymentCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FEF3C7" },
            };

            paymentCell.font = {
              color: { argb: "92400E" },
              bold: true,
            };
          }

          if (paymentCell.value === "Rejected") {
            paymentCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FEE2E2" },
            };

            paymentCell.font = {
              color: { argb: "991B1B" },
              bold: true,
            };
          }
        });
      }
    });

    const exportedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    sheets.forEach((sheet) => {
      sheet.getCell("T1").value = `Exported: ${exportedAt}`;

      sheet.getCell("T1").font = {
        italic: true,
        size: 10,
        color: { argb: "666666" },
      };
    });

    sheets.forEach((sheet) => {
      sheet.columns.forEach((column) => {
        let maxLength = 10;

        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : "";

          maxLength = Math.max(maxLength, value.length + 2);
        });

        column.width = Math.min(maxLength, 40);
      });
    });

    ["A", "B", "D", "E", "J", "K", "L", "N", "O", "P", "Q"].forEach((col) => {
      sheets.forEach((sheet) => {
        sheet.getColumn(col).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });
    });

    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 35 },
      { header: "Value", key: "value", width: 20 },
    ];

    const totalRegistrations = registrations.length;

    const totalParticipants = registrations.reduce(
      (sum, reg) => sum + reg.members.length,
      0,
    );

    const quizCount = registrations.filter(
      (r) => r.eventType === "astroquiz",
    ).length;

    const designTeams = registrations.filter(
      (r) => r.eventType === "astrodesign",
    ).length;

    const modelerTeams = registrations.filter(
      (r) => r.eventType === "astromodeler",
    ).length;

    const accommodationParticipants = registrations.reduce((sum, reg) => {
      if (!reg.accommodation) return sum;

      if (reg.registrationType === "individual") return sum + 1;

      return sum + reg.accommodationMembers.filter(Boolean).length;
    }, 0);

    const verified = registrations.filter(
      (r) => r.paymentStatus === "Verified",
    ).length;

    const pending = registrations.filter(
      (r) => r.paymentStatus === "Pending",
    ).length;

    const rejected = registrations.filter(
      (r) => r.paymentStatus === "Rejected",
    ).length;

    const totalAmount = registrations
      .filter((r) => r.paymentStatus === "Verified")
      .reduce((sum, r) => sum + r.totalFee, 0);

    const pendingAmount = registrations
      .filter((r) => r.paymentStatus === "Pending")
      .reduce((sum, r) => sum + r.totalFee, 0);

    summarySheet.addRow(["National Space Day 2026"]);
    summarySheet.addRow(["IEEE SPS Student Branch Chapter"]);
    summarySheet.addRow([]);

    summarySheet.addRow(["EVENT OVERVIEW", ""]);

    summarySheet.addRow(["Total Registrations", totalRegistrations]);
    summarySheet.addRow(["Total Participants", totalParticipants]);
    summarySheet.addRow(["Total Teams", designTeams + modelerTeams]);
    summarySheet.addRow([
      "Accommodation Participants",
      accommodationParticipants,
    ]);

    summarySheet.addRow([]);

    summarySheet.addRow(["EVENT-WISE REGISTRATIONS", ""]);

    summarySheet.addRow(["Astro Quiz", quizCount]);
    summarySheet.addRow(["AI Astro Design", designTeams]);
    summarySheet.addRow(["Astro Modeler", modelerTeams]);

    summarySheet.addRow([]);

    summarySheet.addRow(["PAYMENT SUMMARY", ""]);

    summarySheet.addRow(["Verified", verified]);
    summarySheet.addRow(["Pending", pending]);
    summarySheet.addRow(["Rejected", rejected]);

    summarySheet.addRow([]);

    summarySheet.addRow(["REVENUE SUMMARY", ""]);

    summarySheet.addRow(["Verified Amount (₹)", totalAmount]);

    summarySheet.addRow(["Pending Amount (₹)", pendingAmount]);

    const totalRegistrationValue = registrations.reduce(
      (sum, r) => sum + r.totalFee,
      0,
    );

    summarySheet.addRow([
      "Total Registration Value (₹)",
      totalRegistrationValue,
    ]);

    summarySheet.addRow([]);

    summarySheet.addRow(["Exported On", exportedAt]);

    /* ------------------------------
   SUMMARY SECTION HEADERS
------------------------------ */

    [4, 10, 14, 18].forEach((rowNumber) => {
      const titleCell = summarySheet.getCell(`A${rowNumber}`);

      titleCell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0F4C81" }, // IEEE Blue
      };

      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Fill the second column with the same color
      const valueCell = summarySheet.getCell(`B${rowNumber}`);

      valueCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0F4C81" },
      };
    });

    summarySheet.mergeCells("A2:B2");

    summarySheet.getCell("A2").font = {
      size: 13,
      italic: true,
    };

    summarySheet.getCell("A2").alignment = {
      horizontal: "center",
    };

    summarySheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    summarySheet.columns.forEach((column) => {
      let max = 15;

      column.eachCell({ includeEmpty: true }, (cell) => {
        max = Math.max(max, cell.value ? cell.value.toString().length + 2 : 10);
      });

      column.width = Math.min(max, 35);
    });

    summarySheet.mergeCells("A1:B1");

    summarySheet.getCell("A1").font = {
      size: 20,
      bold: true,
      color: { argb: "0F4C81" },
    };

    summarySheet.getCell("A1").alignment = {
      horizontal: "center",
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SpaceDay_Registrations.xlsx"',
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

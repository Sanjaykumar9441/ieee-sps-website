const XLSX = require("xlsx");
const fs = require("fs");
const os = require("os");
const path = require("path");

const Certificate = require("../models/Certificate");
const { importRows } = require("../services/certificateImportService");
const {
  generateParticipationCertificate,
} = require("../services/participationCertificateService");
const {
  generateMeritCertificate,
} = require("../services/meritCertificateService");

async function importCertificates(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const eventCode = String(req.body.eventCode || "")
      .trim()
      .toUpperCase();
    const certificateType = String(req.body.certificateType || "")
      .trim()
      .toUpperCase();

    if (!eventCode || !certificateType) {
      return res.status(400).json({
        message: "eventCode and certificateType are required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
    });

    if (!workbook.SheetNames.length) {
      return res.status(400).json({ message: "Excel file has no worksheet" });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: true,
    });

    let requiredColumns;

    if (certificateType === "MERIT") {
      requiredColumns = [
        "Name",
        "RollNo",
        "Team",
        "College",
        "Position",
        "Event",
      ];
    } else {
      requiredColumns = ["Name", "RollNo", "Branch", "College", "City", "Date"];
    }

    const headers = Object.keys(rows[0] || {});
    const missing = requiredColumns.filter(
      (column) => !headers.includes(column),
    );

    if (missing.length) {
      return res.status(400).json({
        message: "Invalid Excel format",
        missingColumns: missing,
        requiredColumns,
      });
    }

    const result = await importRows({
      eventCode,
      certificateType,
      rows,
    });

    return res.json({
      success: true,
      totalRows: rows.length,
      ...result,
    });
  } catch (error) {
    console.error("Certificate import error:", error);
    return res.status(500).json({
      message: "Certificate import failed",
      error: error.message,
    });
  }
}

// ============================================================
// ADMIN - GET CERTIFICATE RECORDS
// ============================================================

async function getAdminCertificates(req, res) {
  try {
    const eventCode = String(req.query.eventCode || "")
      .trim()
      .toUpperCase();

    const certificateType = String(req.query.certificateType || "")
      .trim()
      .toUpperCase();

    const filter = {};

    if (eventCode) {
      filter.eventCode = eventCode;
    }

    if (certificateType) {
      filter.certificateType = certificateType;
    }

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      total: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error("Get admin certificates error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load certificate records",
      error: error.message,
    });
  }
}

// ============================================================
// ADMIN - EDIT CERTIFICATE
// ============================================================

async function updateAdminCertificate(req, res) {
  try {
    const certificateId = String(req.params.certificateId || "").trim();
    if (!certificateId) {
      return res
        .status(400)
        .json({ success: false, message: "Certificate ID is required" });
    }

    const existing = await Certificate.findOne({ certificateId });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Certificate not found" });
    }

    const normalizedRollNo = String(req.body.rollNo || "")
      .trim()
      .toUpperCase();
    const name = String(req.body.name || "").trim();

    if (!name || !normalizedRollNo) {
      return res.status(400).json({
        success: false,
        message: "Name and Roll No are required",
      });
    }

    const duplicate = await Certificate.findOne({
      _id: { $ne: existing._id },
      eventCode: existing.eventCode,
      certificateType: existing.certificateType,
      rollNo: normalizedRollNo,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "Another certificate already exists for this roll number in this event and certificate type",
      });
    }

    existing.name = name;
    existing.rollNo = normalizedRollNo;

    if (existing.certificateType === "MERIT") {
      existing.team = String(req.body.team || "").trim();
      existing.college = String(req.body.college || "").trim();
      existing.position = String(req.body.position || "").trim();
      existing.event = String(req.body.event || "").trim();

      if (
        !existing.team ||
        !existing.college ||
        !existing.position ||
        !existing.event
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, Roll No, Team, College, Position and Event are required",
        });
      }
    } else {
      existing.branch = String(req.body.branch || "").trim();
      existing.college = String(req.body.college || "").trim();
      existing.city = String(req.body.city || "").trim();
    }

    // eventCode and certificateId are immutable.
    await existing.save();

    return res.json({
      success: true,
      message: "Certificate updated successfully",
      certificate: existing,
    });
  } catch (error) {
    console.error("Update certificate error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update certificate",
      error: error.message,
    });
  }
}

// ============================================================
// ADMIN - EXPORT CERTIFICATE DATA TO EXCEL
// ============================================================

async function exportAdminCertificates(req, res) {
  try {
    const eventCode = String(req.query.eventCode || "")
      .trim()
      .toUpperCase();

    const certificateType = String(req.query.certificateType || "")
      .trim()
      .toUpperCase();

    const filter = {};

    if (eventCode) {
      filter.eventCode = eventCode;
    }

    if (certificateType) {
      filter.certificateType = certificateType;
    }

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    const rows = certificates.map((certificate) => ({
      Name: certificate.name,
      RollNo: certificate.rollNo,
      Branch: certificate.branch,
      College: certificate.college,
      City: certificate.city,
      Date: certificate.eventDate,
      CertificateId: certificate.certificateId,
      EventCode: certificate.eventCode,
      CertificateType: certificate.certificateType,
    }));

    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const safeEventCode = eventCode || "ALL";
    const safeType = certificateType || "ALL";

    const fileName = `certificates_${safeEventCode}_${safeType}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Certificate Excel export error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to export certificate data",
      error: error.message,
    });
  }
}

async function getCertificate(req, res) {
  try {
    const rollNo = String(req.params.rollNo || "")
      .trim()
      .toUpperCase();
    const eventCode = String(req.query.eventCode || "")
      .trim()
      .toUpperCase();
    const certificateType = String(req.query.certificateType || "PARTICIPATION")
      .trim()
      .toUpperCase();

    if (!rollNo || !eventCode) {
      return res.status(400).json({
        message: "Roll number and eventCode are required",
      });
    }

    const certificate = await Certificate.findOne({
      rollNo,
      eventCode,
      certificateType,
    }).lean();

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found",
      });
    }

    return res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        name: certificate.name,
        rollNo: certificate.rollNo,
        branch: certificate.branch,
        college: certificate.college,
        city: certificate.city,
        team: certificate.team,
        position: certificate.position,
        event: certificate.event,
        eventDate: certificate.eventDate,
        certificateType: certificate.certificateType,
      },
    });
  } catch (error) {
    console.error("Certificate lookup error:", error);
    return res.status(500).json({
      message: "Certificate lookup failed",
      error: error.message,
    });
  }
}

async function downloadCertificate(req, res) {
  try {
    const rollNo = String(req.params.rollNo || "")
      .trim()
      .toUpperCase();
    const eventCode = String(req.query.eventCode || "")
      .trim()
      .toUpperCase();
    const certificateType = String(req.query.certificateType || "PARTICIPATION")
      .trim()
      .toUpperCase();

    if (!rollNo || !eventCode) {
      return res.status(400).json({
        message: "Roll number and eventCode are required",
      });
    }

    const certificate = await Certificate.findOne({
      rollNo,
      eventCode,
      certificateType,
    });

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found",
      });
    }

    const fileName = `${certificate.certificateId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");

    const tempPath = path.join(
      os.tmpdir(),
      `${certificate.certificateId}-${Date.now()}.pdf`,
    );

    const output = fs.createWriteStream(tempPath);

    if (certificate.certificateType === "MERIT") {
      await generateMeritCertificate(certificate, output);
    } else {
      await generateParticipationCertificate(certificate, output);
    }

    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();

    res.download(tempPath, fileName, (error) => {
      fs.unlink(tempPath, () => {});

      if (error && !res.headersSent) {
        res.status(500).json({
          message: "Certificate download failed",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Certificate generation error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Certificate generation failed",
        error: error.message,
      });
    }
  }
}

module.exports = {
  importCertificates,
  getCertificate,
  downloadCertificate,

  // Admin
  getAdminCertificates,
  updateAdminCertificate,
  exportAdminCertificates,
};

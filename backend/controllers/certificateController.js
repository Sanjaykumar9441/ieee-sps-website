const XLSX = require("xlsx");
const fs = require("fs");
const os = require("os");
const path = require("path");

const Certificate = require("../models/Certificate");
const { importRows } = require("../services/certificateImportService");
const {
  generateParticipationCertificate,
} = require("../services/participationCertificateService");

async function importCertificates(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const { eventCode, certificateType, defaultEventDate } = req.body;

    if (!eventCode || !certificateType) {
      return res.status(400).json({
        message: "eventCode and certificateType are required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: true,
    });

    const requiredColumns = ["Name", "RollNo", "Branch", "College", "City", "Date"];
    const headers = Object.keys(rows[0] || {});
    const missing = requiredColumns.filter((column) => !headers.includes(column));

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
      defaultEventDate,
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

async function getCertificate(req, res) {
  try {
    const rollNo = String(req.params.rollNo || "").trim().toUpperCase();
    const eventCode = String(req.query.eventCode || "").trim().toUpperCase();
    const certificateType = String(
      req.query.certificateType || "PARTICIPATION"
    )
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
    const rollNo = String(req.params.rollNo || "").trim().toUpperCase();
    const eventCode = String(req.query.eventCode || "").trim().toUpperCase();
    const certificateType = String(
      req.query.certificateType || "PARTICIPATION"
    )
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader("Cache-Control", "no-store");

    const tempPath = path.join(
      os.tmpdir(),
      `${certificate.certificateId}-${Date.now()}.pdf`
    );

    const output = fs.createWriteStream(tempPath);

    await generateParticipationCertificate(certificate, output);

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
};

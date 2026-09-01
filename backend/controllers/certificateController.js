const XLSX = require("xlsx");
const fs = require("fs");
const os = require("os");
const path = require("path");
const PDFDocument = require("pdfkit");

const Certificate = require("../models/Certificate");
const { importRows } = require("../services/certificateImportService");

const {
  generateParticipationCertificate,
} = require("../services/participationCertificateService");
const {
  generateMeritCertificate,
} = require("../services/meritCertificateService");

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const PARTICIPATION_TEMPLATE = path.join(
  __dirname,
  "../certificates/templates/Participation.jpeg",
);
const MERIT_TEMPLATE = path.join(
  __dirname,
  "../certificates/templates/Merit.jpeg",
);
const NAME_FONT = path.join(__dirname, "../certificates/fonts/Gabrielle.ttf");
const LATO_BOLD = path.join(__dirname, "../certificates/fonts/Lato-Bold.ttf");
const ORANGE = "#E66600";
const BLUE = "#07579A";

function clean(value) {
  return String(value ?? "").trim();
}

function cleanCode(value) {
  return clean(value).toUpperCase();
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function fitName(doc, name, maxWidth, start, min) {
  for (let size = start; size >= min; size -= 1) {
    doc.font(NAME_FONT).fontSize(size);
    if (doc.widthOfString(name) <= maxWidth) return size;
  }
  return min;
}

function fitText(doc, text, maxWidth, start = 16, min = 9) {
  for (let size = start; size >= min; size -= 1) {
    doc.font(LATO_BOLD).fontSize(size);
    if (doc.widthOfString(text) <= maxWidth) return size;
  }
  return min;
}

function drawCentered(doc, text, y, font, size, color, xOffset = 0) {
  doc.font(font).fontSize(size).fillColor(color);
  const width = doc.widthOfString(text);
  doc.text(text, (PAGE_WIDTH - width) / 2 + xOffset, y, {
    width: width + 2,
    lineBreak: false,
  });
}

function drawDynamic(doc, text, x, y, width, size, color, align = "center") {
  doc.font(LATO_BOLD).fontSize(size);
  const textWidth = doc.widthOfString(text);
  let textX = x;
  if (align === "center") textX = x + (width - textWidth) / 2;
  if (align === "right") textX = x + width - textWidth;

  doc.save();
  doc.fillColor("#FFFFFF");
  doc.rect(textX - 2, y - 1, textWidth + 4, size * 1.08).fill();
  doc.restore();

  doc.font(LATO_BOLD).fontSize(size).fillColor(color).text(text, textX, y, {
    width: textWidth + 2,
    lineBreak: false,
  });
}

function drawParticipationPage(doc, certificate) {
  assertFile(PARTICIPATION_TEMPLATE, "Participation certificate template");
  assertFile(NAME_FONT, "Gabrielle font");
  assertFile(LATO_BOLD, "Lato Bold font");

  doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
  doc.image(PARTICIPATION_TEMPLATE, 0, 0, {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });

  const name = clean(certificate.name);
  const roll = clean(certificate.rollNo);
  const branch = clean(certificate.branch);
  const college = clean(certificate.college);
  const city = clean(certificate.city);
  const date = clean(certificate.eventDate) || "13-08-2026";

  const nameSize = fitName(doc, name, 500, 36, 23);
  doc.font(NAME_FONT).fontSize(nameSize).fillColor(ORANGE);
  const nameWidth = doc.widthOfString(name);
  doc.text(name, (PAGE_WIDTH - nameWidth) / 2, 315, {
    width: nameWidth + 2,
    lineBreak: false,
  });

  drawCentered(
    doc,
    `${roll} - ${branch},        ${college} - ${city}`,
    285,
    LATO_BOLD,
    16,
    ORANGE,
  );

  drawCentered(doc, date, 192, LATO_BOLD, 15, ORANGE, 30);
}

function drawMeritPage(doc, certificate) {
  assertFile(MERIT_TEMPLATE, "Merit certificate template");
  assertFile(NAME_FONT, "Gabrielle font");
  assertFile(LATO_BOLD, "Lato Bold font");

  doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
  doc.image(MERIT_TEMPLATE, 0, 0, {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });

  const name = clean(certificate.name);
  const team = clean(certificate.team);
  const college = clean(certificate.college);
  const position = clean(certificate.position);
  const event = clean(certificate.event);

  const nameSize = fitName(doc, name, 570, 30, 20);
  doc.font(NAME_FONT).fontSize(nameSize).fillColor(BLUE);
  const nameWidth = doc.widthOfString(name);
  doc.text(name, (PAGE_WIDTH - nameWidth) / 2, 247, {
    width: nameWidth + 2,
    lineBreak: false,
  });

  drawDynamic(
    doc,
    team,
    125,
    285,
    170,
    fitText(doc, team, 180, 16, 10),
    BLUE,
  );

  drawDynamic(
    doc,
    college,
    305,
    285,
    390,
    fitText(doc, college, 390, 16, 9),
    BLUE,
  );

  drawDynamic(
    doc,
    position,
    300,
    320,
    170,
    fitText(doc, position, 170, 16, 10),
    BLUE,
  );

  drawDynamic(
    doc,
    event,
    465,
    320,
    330,
    fitText(doc, event, 350, 16, 9),
    BLUE,
  );
}

function createCombinedPdfBuffer(certificates) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: "Certificate Collection",
          Author: "Aditya University",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("error", reject);
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      for (const certificate of certificates) {
        if (certificate.certificateType === "MERIT") {
          drawMeritPage(doc, certificate);
        } else if (certificate.certificateType === "PARTICIPATION") {
          drawParticipationPage(doc, certificate);
        } else {
          // Volunteer certificates currently use the participation generator/layout.
          drawParticipationPage(doc, certificate);
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function importCertificates(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const eventCode = cleanCode(req.body.eventCode);
    const certificateType = cleanCode(req.body.certificateType);

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

    const requiredColumns =
      certificateType === "MERIT"
        ? ["Name", "RollNo", "Team", "College", "Position", "Event"]
        : ["Name", "RollNo", "Branch", "College", "City", "Date"];

    const headers = Object.keys(rows[0] || {});
    const missing = requiredColumns.filter((column) => !headers.includes(column));

    if (missing.length) {
      return res.status(400).json({
        message: "Invalid Excel format",
        missingColumns: missing,
        requiredColumns,
      });
    }

    const result = await importRows({ eventCode, certificateType, rows });

    return res.json({
      success: true,
      totalRows: rows.length,
      ...result,
    });
  } catch (error) {
    console.error("Certificate import error:", error);
    return res.status(500).json({
      success: false,
      message: "Certificate import failed",
      error: error.message,
    });
  }
}

async function getAdminCertificates(req, res) {
  try {
    const eventCode = cleanCode(req.query.eventCode);
    const certificateType = cleanCode(req.query.certificateType);
    const filter = {};

    if (eventCode) filter.eventCode = eventCode;
    if (certificateType) filter.certificateType = certificateType;

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

async function updateAdminCertificate(req, res) {
  try {
    const certificateId = clean(req.params.certificateId);
    if (!certificateId) {
      return res.status(400).json({ success: false, message: "Certificate ID is required" });
    }

    const existing = await Certificate.findOne({ certificateId });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    const name = clean(req.body.name);
    const rollNo = cleanCode(req.body.rollNo);
    if (!name || !rollNo) {
      return res.status(400).json({ success: false, message: "Name and Roll No are required" });
    }

    const duplicate = await Certificate.findOne({
      _id: { $ne: existing._id },
      eventCode: existing.eventCode,
      certificateType: existing.certificateType,
      rollNo,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another certificate already exists for this roll number in this event and certificate type",
      });
    }

    existing.name = name;
    existing.rollNo = rollNo;

    if (existing.certificateType === "MERIT") {
      existing.team = clean(req.body.team);
      existing.college = clean(req.body.college);
      existing.position = clean(req.body.position);
      existing.event = clean(req.body.event);

      if (!existing.team || !existing.college || !existing.position || !existing.event) {
        return res.status(400).json({
          success: false,
          message: "Name, Roll No, Team, College, Position and Event are required",
        });
      }
    } else {
      existing.branch = clean(req.body.branch);
      existing.college = clean(req.body.college);
      existing.city = clean(req.body.city);
    }

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

async function exportAdminCertificates(req, res) {
  try {
    const eventCode = cleanCode(req.query.eventCode);
    const certificateType = cleanCode(req.query.certificateType);
    const filter = {};

    if (eventCode) filter.eventCode = eventCode;
    if (certificateType) filter.certificateType = certificateType;

    const certificates = await Certificate.find(filter).sort({ createdAt: 1 }).lean();

    const rows = certificates.map((certificate) =>
      certificate.certificateType === "MERIT"
        ? {
            Name: certificate.name,
            RollNo: certificate.rollNo,
            Team: certificate.team,
            College: certificate.college,
            Position: certificate.position,
            Event: certificate.event,
            CertificateId: certificate.certificateId,
            EventCode: certificate.eventCode,
            CertificateType: certificate.certificateType,
          }
        : {
            Name: certificate.name,
            RollNo: certificate.rollNo,
            Branch: certificate.branch,
            College: certificate.college,
            City: certificate.city,
            CertificateId: certificate.certificateId,
            EventCode: certificate.eventCode,
            CertificateType: certificate.certificateType,
          },
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const fileName = `certificates_${eventCode || "ALL"}_${certificateType || "ALL"}.xlsx`;
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

// Combined PDF export. No ZIP/archiver is used.
async function exportAdminCertificatePdfs(req, res) {
  try {
    const eventCode = cleanCode(req.query.eventCode);
    const certificateType = cleanCode(req.query.certificateType);
    const certificateIdsRaw = clean(req.query.certificateIds);

    if (!eventCode) {
      return res.status(400).json({ success: false, message: "Event code is required" });
    }

    const filter = { eventCode };
    if (certificateType && certificateType !== "ALL") {
      filter.certificateType = certificateType;
    }

    if (certificateIdsRaw) {
      const certificateIds = certificateIdsRaw
        .split(",")
        .map((id) => clean(id))
        .filter(Boolean);

      if (!certificateIds.length) {
        return res.status(400).json({
          success: false,
          message: "No valid certificate IDs supplied",
        });
      }

      filter.certificateId = { $in: certificateIds };
    }

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    if (!certificates.length) {
      return res.status(404).json({
        success: false,
        message: "No certificates found for the selected export",
      });
    }

    const pdfBuffer = await createCombinedPdfBuffer(certificates);
    const safeEventCode = eventCode.replace(/[^A-Z0-9_-]/gi, "_");
    const safeType = certificateType || "ALL";
    const fileName = `${safeEventCode}_Certificates_${safeType}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store");

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Certificate combined PDF export error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to create combined certificate PDF",
        error: error.message,
      });
    }
    return res.destroy(error);
  }
}

async function getCertificate(req, res) {
  try {
    const rollNo = cleanCode(req.params.rollNo);
    const eventCode = cleanCode(req.query.eventCode);
    const certificateType = cleanCode(req.query.certificateType || "PARTICIPATION");

    if (!rollNo || !eventCode) {
      return res.status(400).json({ message: "Roll number and eventCode are required" });
    }

    const certificate = await Certificate.findOne({ rollNo, eventCode, certificateType }).lean();
    if (!certificate) return res.status(404).json({ message: "Certificate not found" });

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
    return res.status(500).json({ message: "Certificate lookup failed", error: error.message });
  }
}

async function downloadCertificate(req, res) {
  try {
    const rollNo = cleanCode(req.params.rollNo);
    const eventCode = cleanCode(req.query.eventCode);
    const certificateType = cleanCode(req.query.certificateType || "PARTICIPATION");

    if (!rollNo || !eventCode) {
      return res.status(400).json({ message: "Roll number and eventCode are required" });
    }

    const certificate = await Certificate.findOne({ rollNo, eventCode, certificateType });
    if (!certificate) return res.status(404).json({ message: "Certificate not found" });

    const fileName = `${certificate.certificateId}.pdf`;
    const tempPath = path.join(os.tmpdir(), `${certificate.certificateId}-${Date.now()}.pdf`);
    const output = fs.createWriteStream(tempPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");

    if (certificate.certificateType === "MERIT") {
      await generateMeritCertificate(certificate, output);
    } else {
      await generateParticipationCertificate(certificate, output);
    }

    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();

    return res.download(tempPath, fileName, (error) => {
      fs.unlink(tempPath, () => {});
      if (error && !res.headersSent) {
        res.status(500).json({ message: "Certificate download failed", error: error.message });
      }
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Certificate generation failed", error: error.message });
    }
    return undefined;
  }
}

module.exports = {
  importCertificates,
  getCertificate,
  downloadCertificate,
  getAdminCertificates,
  updateAdminCertificate,
  exportAdminCertificates,
  exportAdminCertificatePdfs,
};

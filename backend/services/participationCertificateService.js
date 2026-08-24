const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ============================================================
// PARTICIPATION CERTIFICATE GENERATOR
// Uses the SAME fonts and layout as the user's previous Python code.
// ============================================================

const TEMPLATE = path.join(__dirname, "../certificates/templates/Participation.jpeg");

// Put these exact font files in backend/certificates/fonts/
const NAME_FONT = path.join(__dirname, "../certificates/fonts/Gabrielle.ttf");
const LATO_REGULAR = path.join(__dirname, "../certificates/fonts/Lato-Regular.ttf");
const LATO_BOLD = path.join(__dirname, "../certificates/fonts/Lato-Bold.ttf");

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const ORANGE = "#E66600"; // 230/255, 102/255, 0

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function fitNameFontSize(doc, name) {
  for (let size = 36; size >= 23; size -= 1) {
    doc.font(NAME_FONT).fontSize(size);
    if (doc.widthOfString(name) <= 500) {
      return size;
    }
  }

  return 22;
}

function drawCenteredText(doc, text, y, fontPath, fontSize, color, xOffset = 0) {
  doc.font(fontPath).fontSize(fontSize).fillColor(color);

  const width = doc.widthOfString(text);
  const x = (PAGE_WIDTH - width) / 2 + xOffset;

  doc.text(text, x, y, {
    lineBreak: false,
    width: width + 2,
    continued: false,
  });
}

function generateParticipationCertificate(certificate, output) {
  return new Promise((resolve, reject) => {
    try {
      assertFile(TEMPLATE, "Participation certificate template");
      assertFile(NAME_FONT, "Gabrielle font");
      assertFile(LATO_REGULAR, "Lato Regular font");
      assertFile(LATO_BOLD, "Lato Bold font");

      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: `Certificate of Participation - ${certificate.name}`,
          Subject: certificate.certificateId,
          Author: "Aditya University",
        },
      });

      doc.addPage({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
      });

      // EXACTLY the same page size/background approach as Python.
      doc.image(TEMPLATE, 0, 0, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      const name = String(certificate.name || "").trim();
      const roll = String(certificate.rollNo || "").trim();
      const branch = String(certificate.branch || "").trim();
      const college = String(certificate.college || "").trim();
      const city = String(certificate.city || "").trim();
      const date = String(certificate.eventDate || "13-08-2026").trim();

      // ========================================================
      // NAME
      // Python:
      // for size in range(36, 22, -1):
      //     ... if w <= 500: break
      // c.drawString((PAGE_WIDTH - w)/2, 315, name)
      // ========================================================
      const nameSize = fitNameFontSize(doc, name);
      doc.font(NAME_FONT).fontSize(nameSize).fillColor(ORANGE);
      const nameWidth = doc.widthOfString(name);
      doc.text(name, (PAGE_WIDTH - nameWidth) / 2, 315, {
        lineBreak: false,
        width: nameWidth + 2,
      });

      // ========================================================
      // DETAILS
      // Python:
      // c.setFont("Lato-Bold", 16)
      // line = f"{roll} - {branch},        {college} - {city}"
      // c.drawString(x, 285, line)
      // ========================================================
      const line = `${roll} - ${branch},        ${college} - ${city}`;
      drawCenteredText(doc, line, 285, LATO_BOLD, 16, ORANGE);

      // ========================================================
      // DATE
      // Python:
      // c.setFont("Lato-Bold", 15)
      // c.drawString(x + 30, 192, date)
      // ========================================================
      drawCenteredText(doc, date, 192, LATO_BOLD, 15, ORANGE, 30);

      doc.pipe(output);

      output.on("finish", resolve);
      output.on("error", reject);

      doc.on("error", reject);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateParticipationCertificate,
};

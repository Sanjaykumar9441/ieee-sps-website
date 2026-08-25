const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ============================================================
// MERIT CERTIFICATE GENERATOR
// Uses the same fonts, PDF size and structure as
// participationCertificateService.js
// ============================================================

const TEMPLATE = path.join(__dirname, "../certificates/templates/Merit.jpeg");

// Same fonts used by Participation
const NAME_FONT = path.join(__dirname, "../certificates/fonts/Gabrielle.ttf");

const LATO_REGULAR = path.join(
  __dirname,
  "../certificates/fonts/Lato-Regular.ttf",
);

const LATO_BOLD = path.join(__dirname, "../certificates/fonts/Lato-Bold.ttf");

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const BLUE = "#07579A";

// ============================================================
// FILE CHECK
// ============================================================

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

// ============================================================
// FIT NAME
// ============================================================

function fitNameFontSize(doc, name) {
  for (let size = 30; size >= 20; size -= 1) {
    doc.font(NAME_FONT).fontSize(size);

    if (doc.widthOfString(name) <= 570) {
      return size;
    }
  }

  return 20;
}

// ============================================================
// FIT TEXT INSIDE WIDTH
// ============================================================

function fitTextFontSize(
  doc,
  text,
  fontPath,
  maxWidth,
  startSize = 16,
  minSize = 10,
) {
  for (let size = startSize; size >= minSize; size -= 1) {
    doc.font(fontPath).fontSize(size);

    if (doc.widthOfString(text) <= maxWidth) {
      return size;
    }
  }

  return minSize;
}

// ============================================================
// DRAW TEXT
// ============================================================

function drawText(doc, text, x, y, options = {}) {
  const {
    font = LATO_BOLD,
    fontSize = 16,
    color = BLUE,
    width = 200,
    align = "left",
  } = options;

  doc.font(font).fontSize(fontSize).fillColor(color).text(text, x, y, {
    width,
    align,
    lineBreak: false,
  });
}

// ============================================================
// DRAW TEXT WITH WHITE BACKGROUND
// This hides the dotted line underneath the dynamic text.
// ============================================================

function drawDynamicText(doc, text, x, y, width, options = {}) {
  const {
    font = LATO_BOLD,
    fontSize = 16,
    color = BLUE,
    align = "left",
  } = options;

  // White rectangle to hide dots behind the text
  doc
    .save()
    .fillColor("#FFFFFF")
    .rect(x - 3, y - 2, width + 6, fontSize + 8)
    .fill()
    .restore();

  drawText(doc, text, x, y, {
    font,
    fontSize,
    color,
    width,
    align,
  });
}

// ============================================================
// MERIT CERTIFICATE
// ============================================================

function generateMeritCertificate(certificate, output) {
  return new Promise((resolve, reject) => {
    try {
      // --------------------------------------------------------
      // CHECK REQUIRED FILES
      // --------------------------------------------------------

      assertFile(TEMPLATE, "Merit certificate template");
      assertFile(NAME_FONT, "Gabrielle font");
      assertFile(LATO_REGULAR, "Lato Regular font");
      assertFile(LATO_BOLD, "Lato Bold font");

      // --------------------------------------------------------
      // PDF
      // --------------------------------------------------------

      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: `Certificate of Appreciation - ${certificate.name}`,
          Subject: certificate.certificateId,
          Author: "Aditya University",
        },
      });

      doc.addPage({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
      });

      // --------------------------------------------------------
      // BACKGROUND TEMPLATE
      // --------------------------------------------------------

      doc.image(TEMPLATE, 0, 0, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      // --------------------------------------------------------
      // DATA
      // --------------------------------------------------------

      const name = String(certificate.name || "").trim();
      const team = String(certificate.team || "").trim();
      const college = String(certificate.college || "").trim();
      const position = String(certificate.position || "").trim();
      const event = String(certificate.event || "").trim();

      // ========================================================
      // 1. NAME
      //
      // Template:
      // "This is to certify that Mr./ Ms. ................."
      // ========================================================

      const nameSize = fitNameFontSize(doc, name);

      doc.font(NAME_FONT).fontSize(nameSize).fillColor(BLUE);

      const nameWidth = doc.widthOfString(name);

      // Name line
      doc.text(name, (PAGE_WIDTH - nameWidth) / 2, 247, {
        lineBreak: false,
        width: nameWidth + 2,
      });

      // ========================================================
      // 2. TEAM
      //
      // Template:
      // Team of ............................ From
      // ========================================================

      const teamFontSize = fitTextFontSize(doc, team, LATO_BOLD, 180, 16, 10);

      drawDynamicText(doc, team, 125, 285, 170, {
        font: LATO_BOLD,
        fontSize: teamFontSize,
        color: BLUE,
        align: "center",
      });

      // ========================================================
      // 3. COLLEGE
      //
      // Template:
      // From ................................. is awarded
      // ========================================================

      const collegeFontSize = fitTextFontSize(
        doc,
        college,
        LATO_BOLD,
        390,
        16,
        9,
      );

      drawDynamicText(doc, college, 305, 285, 390, {
        font: LATO_BOLD,
        fontSize: collegeFontSize,
        color: BLUE,
        align: "center",
      });

      // ========================================================
      // 4. POSITION
      //
      // Template:
      // securing ................. place
      // ========================================================

      const positionFontSize = fitTextFontSize(
        doc,
        position,
        LATO_BOLD,
        170,
        16,
        10,
      );

      drawDynamicText(doc, position, 300, 320, 170, {
        font: LATO_BOLD,
        fontSize: positionFontSize,
        color: BLUE,
        align: "center",
      });

      // ========================================================
      // 5. EVENT / CATEGORY
      //
      // Template:
      // place in the .............................
      // category
      // ========================================================

      const eventFontSize = fitTextFontSize(doc, event, LATO_BOLD, 350, 16, 9);

      drawDynamicText(doc, event, 465, 320, 330, {
        font: LATO_BOLD,
        fontSize: eventFontSize,
        color: BLUE,
        align: "center",
      });

      // --------------------------------------------------------
      // OUTPUT
      // --------------------------------------------------------

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

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generateMeritCertificate,
};

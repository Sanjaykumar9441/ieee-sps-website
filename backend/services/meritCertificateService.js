const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ============================================================
// MERIT CERTIFICATE GENERATOR
// ============================================================

const TEMPLATE = path.join(__dirname, "../certificates/templates/Merit.jpeg");

const NAME_FONT = path.join(__dirname, "../certificates/fonts/Gabrielle.ttf");

const LATO_REGULAR = path.join(
  __dirname,
  "../certificates/fonts/Lato-Regular.ttf",
);

const LATO_BOLD = path.join(__dirname, "../certificates/fonts/Lato-Bold.ttf");

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const ORANGE = "#E66600";

// ============================================================
// LINE COORDINATES  ⚠️ RUN calibrate.js AND FILL THESE IN
// ------------------------------------------------------------
// Each *_LINE_Y is the y-coordinate (PDF points, from top) of
// the dotted line itself — not where the text box starts.
// Read these off calibration.pdf, not off a screenshot of a
// rendered/zoomed PDF viewer (that scale is not 1:1 with the
// 842x595 page the code actually draws on).
// ============================================================

const LINE_Y = {
  NAME: 254, // "Mr./Ms. ....." row — already correct in your output
  TEAM_COLLEGE: 278, // "Team of ..... From ....." row — RECALIBRATE
  POSITION_EVENT: 309, // "securing ..... place in the ....." row — RECALIBRATE
};

const LINE_X = {
  TEAM: { x: 129, width: 180 },
  COLLEGE: { x: 385, width: 300 },
  POSITION: { x: 270, width: 120 },
  EVENT: { x: 472, width: 260 },
};

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
// SIT TEXT ON A LINE
// PDFKit's .text(x, y) draws from the TOP of the text box, but
// a dotted line is a baseline — text needs to rest just above
// it, not start at it. This converts "y of the line" into the
// correct "y to pass to .text()" for a given font size, so
// every field lines up consistently regardless of font size.
// ============================================================

function yForLine(lineY, fontSize) {
  return lineY - fontSize * 0.82;
}

// ============================================================
// DRAW TEXT
// ============================================================

function drawText(doc, text, x, y, options = {}) {
  const {
    font = LATO_BOLD,
    fontSize = 16,
    color = ORANGE,
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
// Hides dotted line underneath dynamic text. Sized tight to the
// glyph box so it can never bleed into a neighboring line.
// ============================================================

function drawDynamicText(doc, text, x, y, width, options = {}) {
  const {
    font = LATO_BOLD,
    fontSize = 16,
    color = ORANGE,
    align = "left",
  } = options;

  // Set font first so we can calculate the REAL text width
  doc.font(font).fontSize(fontSize);

  const textWidth = doc.widthOfString(text);

  let textX = x;

  if (align === "center") {
    textX = x + (width - textWidth) / 2;
  } else if (align === "right") {
    textX = x + width - textWidth;
  }

  // Only hide the dotted line directly underneath the actual text.
  // Do NOT cover the entire field width.
  doc
    .save()
    .fillColor("#FFFFFF")
    .rect(textX - 2, y - 1, textWidth + 4, fontSize * 1.05)
    .fill()
    .restore();

  // Draw actual text
  doc
    .font(font)
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, textX, y, {
      width: textWidth + 2,
      align: "left",
      lineBreak: false,
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
      // 1. NAME  — row: "This is to certify that Mr./Ms. ....."
      // ========================================================

      const nameSize = fitNameFontSize(doc, name);
      doc.font(NAME_FONT).fontSize(nameSize).fillColor(ORANGE);
      const nameWidth = doc.widthOfString(name);

      doc.text(
        name,
        (PAGE_WIDTH - nameWidth) / 2,
        yForLine(LINE_Y.NAME, nameSize),
        {
          lineBreak: false,
          width: nameWidth + 2,
        },
      );

      // ========================================================
      // 2. TEAM  — row: "Team of ..... From ..... is awarded"
      // ========================================================

      const teamFontSize = fitTextFontSize(
        doc,
        team,
        LATO_BOLD,
        LINE_X.TEAM.width,
        16,
        10,
      );

      drawDynamicText(
        doc,
        team,
        LINE_X.TEAM.x,
        yForLine(LINE_Y.TEAM_COLLEGE, teamFontSize),
        LINE_X.TEAM.width,
        {
          font: LATO_BOLD,
          fontSize: teamFontSize,
          color: ORANGE,
          align: "center",
        },
      );

      // ========================================================
      // 3. COLLEGE  — same row as TEAM
      // ========================================================

      const collegeFontSize = fitTextFontSize(
        doc,
        college,
        LATO_BOLD,
        LINE_X.COLLEGE.width,
        16,
        9,
      );

      drawDynamicText(
        doc,
        college,
        LINE_X.COLLEGE.x,
        yForLine(LINE_Y.TEAM_COLLEGE, collegeFontSize),
        LINE_X.COLLEGE.width,
        {
          font: LATO_BOLD,
          fontSize: collegeFontSize,
          color: ORANGE,
          align: "center",
        },
      );

      // ========================================================
      // 4. POSITION  — row: "..securing ..... place in the ....."
      // ========================================================

      const positionFontSize = fitTextFontSize(
        doc,
        position,
        LATO_BOLD,
        LINE_X.POSITION.width,
        16,
        10,
      );

      drawDynamicText(
        doc,
        position,
        LINE_X.POSITION.x,
        yForLine(LINE_Y.POSITION_EVENT, positionFontSize),
        LINE_X.POSITION.width,
        {
          font: LATO_BOLD,
          fontSize: positionFontSize,
          color: ORANGE,
          align: "center",
        },
      );

      // ========================================================
      // 5. EVENT / CATEGORY  — same row as POSITION, NOT the
      // "category at the National Space Day..." row below it
      // ========================================================

      const eventFontSize = fitTextFontSize(
        doc,
        event,
        LATO_BOLD,
        LINE_X.EVENT.width,
        16,
        9,
      );

      drawDynamicText(
        doc,
        event,
        LINE_X.EVENT.x,
        yForLine(LINE_Y.POSITION_EVENT, eventFontSize),
        LINE_X.EVENT.width,
        {
          font: LATO_BOLD,
          fontSize: eventFontSize,
          color: ORANGE,
          align: "center",
        },
      );

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

const fs = require("fs");
const path = require("path");

const puppeteer = require("puppeteer");
const QRCode = require("qrcode");

const themes = require("./theme");

const generateAcknowledgement = async (registration) => {
  const htmlPath = path.join(__dirname, "templates", "acknowledgement.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const theme = themes[registration.eventType];

  const ieeeLogo =
    "file://" + path.resolve(__dirname, "..", "public", "logos", "ieee.png");
  const spsLogo =
    "file://" + path.resolve(__dirname, "..", "public", "logos", "sps.png");
  const adityaLogo =
    "file://" + path.resolve(__dirname, "..", "public", "logos", "aditya.png");

  const qrCode = await QRCode.toDataURL(
    `https://ieeespsaditya.vercel.app/space-day/status/${registration.registrationId}`,
  );

  const eventNames = {
    astroquiz: "AstroQuiz Competition",
    astrodesign: "AI Astro-Design Competition",
    astromodeler: "Astro-Modeler Competition",
  };
  const eventTitle = eventNames[registration.eventType];

  const registrationType =
    registration.registrationType === "team"
      ? "Team Registration"
      : "Individual Registration";

  // registration.accommodation is a plain boolean flag — no numberOfDays field
  // exists on it, so read it directly instead of a non-existent sub-property.
  const accommodation = registration.accommodation ? "Yes" : "No";

  const paymentStatus = registration.paymentStatus || "Pending Verification";

  const totalFee = registration.totalFee;

  const registeredOn = new Date(registration.createdAt).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  const member = registration.members[0];

  const college =
    member.college === "Other" ? member.otherCollege : member.college;

  const department = member.department;
  const year = member.year;

  /* ==========================
   MEMBERS HTML
========================== */

  const membersHtml = registration.members
    .map(
      (member, index) => `
      <div class="member">
        <div class="member-name">
          ${index + 1}. ${member.fullName}
        </div>

        <div class="member-details">
          ${member.rollNumber}
        </div>

        <div class="member-college">
          ${member.college === "Other" ? member.otherCollege : member.college}
        </div>
      </div>
    `,
    )
    .join("");

  /* ==========================
   PARTICIPANT SECTION
========================== */

  let participantSection = "";

  if (registration.registrationType === "individual") {
    participantSection = `
    <div class="label">Participant</div>
    <div class="value">${member.fullName}</div>

    <div class="label">Roll Number</div>
    <div class="value">${member.rollNumber}</div>
  `;
  } else {
    participantSection = `
    <div class="label">Team Name</div>
    <div class="value">${registration.teamName}</div>

    <div class="label">Team Size</div>
    <div class="value">${registration.teamSize} Members</div>
  `;
  }

  /* ==========================
   ACADEMIC SECTION
========================== */

  let academicSection = "";

  if (registration.registrationType === "individual") {
    academicSection = `
    <div class="label">College</div>
    <div class="value">${college}</div>

    <div class="label">Department</div>
    <div class="value">${department}</div>

    <div class="label">Year</div>
    <div class="value">${year}</div>
  `;
  } else {
    academicSection = `
    <div class="label">Team Members</div>

    <div class="value">
      ${membersHtml}
    </div>
  `;
  }

  const statusClass =
    {
      Pending: "pending",
      Verified: "verified",
      Rejected: "rejected",
    }[paymentStatus] || "pending";

  let themeSection = "";

  if (registration.selectedTheme) {
    themeSection = `
      <div class="theme-note">
        <div class="label">Selected Theme</div>
        <div class="value">${registration.selectedTheme}</div>
      </div>
  `;
  }

  html = html
    .replace(/{{ieeeLogo}}/g, ieeeLogo)
    .replace(/{{spsLogo}}/g, spsLogo)
    .replace(/{{adityaLogo}}/g, adityaLogo)
    .replace(/{{primaryColor}}/g, theme.primary)
    .replace(/{{secondaryColor}}/g, theme.secondary)
    .replace(/{{gradient}}/g, theme.gradient)
    .replace(/{{eventTitle}}/g, eventTitle)
    .replace(/{{registrationId}}/g, registration.registrationId)
    .replace(/{{participantSection}}/g, participantSection)
    .replace(/{{academicSection}}/g, academicSection)
    .replace(/{{themeSection}}/g, themeSection)
    .replace(/{{registrationType}}/g, registrationType)
    .replace(/{{totalFee}}/g, totalFee)
    .replace(/{{accommodation}}/g, accommodation)
    .replace(/{{statusClass}}/g, statusClass)
    .replace(/{{paymentStatus}}/g, paymentStatus)
    .replace(/{{transactionId}}/g, registration.transactionId)
    .replace(/{{registeredOn}}/g, registeredOn)
    .replace(/{{qrCode}}/g, qrCode);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({
    format: "A4",
    landscape: false,
    printBackground: true,
  });

  await browser.close();

  return pdf;
};

module.exports = generateAcknowledgement;

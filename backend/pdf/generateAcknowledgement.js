const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright");
const QRCode = require("qrcode");

const themes = require("./theme");

const { astroModelerThemes } = require("../config/themeConfig");

const generateAcknowledgement = async (registration) => {
  const htmlPath = path.join(__dirname, "templates", "acknowledgement.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const cssPath = path.join(__dirname, "styles", "acknowledgement.css");

  const css = fs.readFileSync(cssPath, "utf8");

  const theme = themes[registration.eventType];

  const toBase64 = (filePath) => {
    const ext = path.extname(filePath).slice(1);
    const base64 = fs.readFileSync(filePath).toString("base64");
    return `data:image/${ext};base64,${base64}`;
  };

  const ieeeLogo = toBase64(
    path.resolve(__dirname, "..", "public", "logos", "ieee.png"),
  );

  const spsLogo = toBase64(
    path.resolve(__dirname, "..", "public", "logos", "sps.png"),
  );

  const adityaLogo = toBase64(
    path.resolve(__dirname, "..", "public", "logos", "aditya.png"),
  );

  const qrCode = await QRCode.toDataURL(
    `https://ieeespsaditya.vercel.app/space-day/status/${registration.registrationId}`,
  );

  const eventNames = {
    astroquiz: "AstroQuiz Competition",
    astrodesign: "AI Astro-Design Competition",
    astromodeler: "Astro-Modeler Competition",
  };

  const selectedTheme = astroModelerThemes.find(
    (theme) => theme.id === registration.selectedTheme,
  );

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

  const createdAt = new Date(registration.createdAt);

  createdAt.setMinutes(createdAt.getMinutes() + 330);

  const registeredOn = createdAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
        <div class="value">
  ${selectedTheme?.title || registration.selectedTheme}
</div>

${
  selectedTheme?.subtitle
    ? `<div style="font-size:13px;color:#666;margin-top:4px;">
         ${selectedTheme.subtitle}
       </div>`
    : ""
}
      </div>
  `;
  }

  /* ==========================
   PAGE DENSITY / COMPACT MODE
   3+ team members, or a selected theme, both push the content block
   taller than a relaxed single-page layout can absorb. Switch to a
   tighter spacing pass in those cases so the page still reads as
   "designed" rather than "overflowing".
========================== */

  const memberCount = registration.members?.length || 1;
  const isDense = memberCount >= 3 || Boolean(registration.selectedTheme);
  const pageClass = isDense ? "compact" : "";

  html = html
    .replace(/{{css}}/g, css)
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
    .replace(/{{qrCode}}/g, qrCode)
    .replace(/{{pageClass}}/g, pageClass);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  fs.writeFileSync(path.join(__dirname, "debug.html"), html);

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  await page.waitForLoadState("networkidle");

  await page.screenshot({
    path: "debug.png",
    fullPage: true,
  });

  await page.emulateMedia({
    media: "screen",
  });

  const pdf = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  return pdf;
};

module.exports = generateAcknowledgement;

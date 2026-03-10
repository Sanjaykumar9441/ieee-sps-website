const receiptTemplate = (registration, qrCodeImage) => {
  const members = registration.teamMembers
    .map((m, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${m.fullName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">${m.rollNo}</td>
      </tr>`)
    .join("");

  return `
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: auto; background: #fff; border: 2px solid #00979D; border-radius: 8px; overflow: hidden; }
  .header { background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #eee; }
  .title { color: #00979D; font-size: 26px; font-weight: bold; margin-bottom: 5px; }
  
  .details-box { padding: 25px; background-color: #f0fbfc; margin: 20px; border-radius: 6px; }
  .details-table { width: 100%; border-collapse: collapse; }
  .label-col { width: 140px; font-weight: bold; color: #444; padding: 5px 0; font-size: 14px; }
  .value-col { padding: 5px 0; color: #000; font-size: 14px; }
  
  .section-title { color: #00979D; font-size: 18px; margin: 20px; border-left: 4px solid #00979D; padding-left: 10px; font-weight: bold; }
  
  .member-table { width: 93%; margin: 0 20px 20px 20px; border-collapse: collapse; font-size: 13px; }
  .member-table th { background: #00979D; color: white; padding: 12px; text-align: left; }

  /* Venue & QR Style */
  .venue-box { margin: 20px; padding: 15px; border: 1px dashed #00979D; border-radius: 6px; background: #fff; display: flex; align-items: center; }
  .qr-container { text-align: center; padding: 20px; background: #fafafa; border-top: 1px solid #eee; }
  .qr-image { width: 150px; height: 150px; border: 2px solid #00979D; padding: 5px; border-radius: 10px; }

  .btn { display: inline-block; padding: 10px 20px; background-color: #00979D; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; margin-top: 10px; }
  .footer { text-align: center; padding: 25px; background: #f9f9f9; color: #777; font-size: 12px; }
</style>
</head>

<body>
  <div class="container">
    <div class="header">
      <div class="title">Arduino Days 2026</div>
      <div style="color: #666; font-size: 14px;">Official Event Pass</div>
    </div>

    <div class="details-box">
      <table class="details-table">
        <tr><td class="label-col">Registration ID</td><td class="value-col">: <b>${registration.registrationId}</b></td></tr>
        <tr><td class="label-col">Team Name</td><td class="value-col">: ${registration.teamName}</td></tr>
        <tr><td class="label-col">Event</td><td class="value-col">: ${registration.eventName}</td></tr>
        <tr><td class="label-col">Amount Paid</td><td class="value-col">: ₹${registration.expectedAmount}</td></tr>
      </table>
    </div>

    <div class="section-title">Team Members</div>
    <table class="member-table">
      <thead>
        <tr><th style="width: 40px; text-align: center;">No</th><th>Full Name</th><th>Roll Number</th></tr>
      </thead>
      <tbody>${members}</tbody>
    </table>

    <div class="section-title">Venue Details</div>
    <div style="margin: 0 20px 20px 20px; font-size: 14px;">
      <strong>Aditya University</strong><br>
      Surampalem, Gandepalli Mandal,<br>
      Andhra Pradesh 533437<br>
      <a href="https://maps.app.goo.gl/YourGoogleMapsLink" class="btn">📍 View on Google Maps</a>
    </div>

    <div class="qr-container">
      <div style="color: #00979D; font-weight: bold; margin-bottom: 10px;">Event Entry QR Code</div>
      <img src="${qrCodeImage}" alt="QR Code" class="qr-image" />
      <p style="font-size: 11px; color: #888; margin-top: 10px;">Present this QR code at the entrance for quick check-in.</p>
    </div>

    <div class="footer">
      <strong>IEEE SPS Student Branch Chapter</strong><br>
      Aditya University, Surampalem
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = receiptTemplate;
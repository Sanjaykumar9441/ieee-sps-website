const sendMail = async (to, subject, html, pdfBuffer, filename) => {

  try {

    const email = {
      sender: {
        name: "Arduino Days 2026",
        email: "ieee.club.aus@gmail.com"
      },

      to: [{ email: to }],

      subject: subject,

      htmlContent: html,

      attachment: pdfBuffer
        ? [
            {
              name: filename,
              content: pdfBuffer.toString("base64"),
            },
          ]
        : [],
    };

    await apiInstance.sendTransacEmail(email);

    console.log("✅ Email sent:", to);

  } catch (error) {
    console.error("❌ Mail error:", error);
  }
};
let isProcessing = false;

const { supabase } = require("../lib/supabase");
const { sendOtpEmail } = require("../lib/mailer");

async function processEmailQueue() {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const { data: emails, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) throw error;

    if (!emails || emails.length === 0) return;

    for (const email of emails) {
      const created = new Date(email.created_at).getTime();
      const now = Date.now();

      if (now - created < 15000 && (email.retry_count || 0) > 0) {
        continue;
      }
      try {
        switch (email.template_name) {
          case "otp":
            await sendOtpEmail(
              email.recipient_email,
              email.payload.assessmentTitle,
              email.payload.otp,
            );
            break;

          default:
            console.log(`[EMAIL] Unknown template: ${email.template_name}`);
        }

        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date(),
            last_error: null,
          })
          .eq("id", email.id);

        console.log(
          `[EMAIL] ${email.recipient_email} ${email.template_name} SUCCESS`,
        );
      } catch (err) {
        const retry = (email.retry_count || 0) + 1;

        await supabase
          .from("email_queue")
          .update({
            retry_count: retry,
            status: retry >= 3 ? "failed" : "pending",
            last_error: err.message,
          })
          .eq("id", email.id);

        console.error(`[EMAIL] ${email.recipient_email} FAILED ${err.message}`);
      }
    }
  } catch (err) {
    console.error("Email Worker Error:", err.message);
  } finally {
    isProcessing = false;
  }
}

/*
  Check queue every 10 seconds
*/

setInterval(processEmailQueue, 10000);

console.log("📧 Email Worker Started");

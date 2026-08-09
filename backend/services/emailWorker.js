let isProcessing = false;

const { supabase } = require("../lib/supabase");
const { sendOtpEmail } = require("../lib/mailer");

const MAX_RETRIES = 3;
const PROCESS_LIMIT = 20;
const PROCESS_INTERVAL = 10000;

async function processEmailQueue() {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const { data: emails, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(PROCESS_LIMIT);

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
            throw new Error(`Unknown email template: ${email.template_name}`);
        }

        await supabase
          .from("email_queue")
          .update({
            status: "SENT",
            sent_at: new Date().toISOString(),
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
            status: retry >= MAX_RETRIES ? "FAILED" : "PENDING",
            last_error: err?.message || "Unknown email error",
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

processEmailQueue();

setInterval(processEmailQueue, PROCESS_INTERVAL);

console.log(`📧 Email Worker Started (${PROCESS_INTERVAL / 1000}s interval)`);

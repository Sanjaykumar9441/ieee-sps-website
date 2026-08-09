const { supabase } = require("../lib/supabase");

/* ============================================================
   QUEUE OTP EMAIL
============================================================ */

exports.queueOtpEmail = async ({
  assessmentId,
  email,
  assessmentTitle,
  otp,
}) => {
  /*
  --------------------------------------------------------
  Remove previous pending OTP emails
  --------------------------------------------------------
  */

  await supabase
    .from("email_queue")
    .delete()
    .eq("assessment_id", assessmentId)
    .eq("recipient_email", email)
    .eq("template_name", "otp")
    .eq("status", "PENDING");

  /*
  --------------------------------------------------------
  Queue New Email
  --------------------------------------------------------
  */

  const { data, error } = await supabase
    .from("email_queue")
    .insert({
      assessment_id: assessmentId,

      recipient_email: email,

      subject: `Your OTP for ${assessmentTitle}`,

      template_name: "otp",

      payload: {
        assessmentTitle,
        otp,
      },

      status: "PENDING",

      retry_count: 0,

      last_error: null,

      sent_at: null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

const { supabase } = require("../config/supabase");

exports.queueOtpEmail = async ({
  assessmentId,
  email,
  assessmentTitle,
  otp,
}) => {
  const { error } = await supabase
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

      status: "pending",
      retry_count: 0,
    });

  if (error) throw error;
};
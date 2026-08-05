const supabase = require("../lib/supabase");

exports.getLiveDashboard = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data, error } = await supabase

      .from("live_dashboard")

      .select("*")

      .eq("assessment_id", assessmentId)

      .order("student_name");

    if (error) throw error;

    res.json({
      success: true,

      students: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

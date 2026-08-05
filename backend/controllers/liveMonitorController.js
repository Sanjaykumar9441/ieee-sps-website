const supabase = require("../lib/supabase");

exports.getLiveStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data, error } = await supabase

      .from("live_student_monitor")

      .select("*")

      .eq("assessment_id", assessmentId)

      .order("roll_no");

    if (error) throw error;

    res.json({
      success: true,

      students: data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

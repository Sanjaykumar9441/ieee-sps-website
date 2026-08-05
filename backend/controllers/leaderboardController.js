const supabase = require("../lib/supabase");

exports.getLeaderboard = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data, error } = await supabase
      .from("live_leaderboard")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("rank");

    if (error) throw error;

    res.json({
      success: true,
      leaderboard: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

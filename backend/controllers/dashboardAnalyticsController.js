const { supabase } = require("../lib/supabase");

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data, error } = await supabase
      .from("live_dashboard")
      .select("*")
      .eq("assessment_id", assessmentId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      analytics: data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
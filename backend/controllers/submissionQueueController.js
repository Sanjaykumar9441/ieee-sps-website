const {
  getQueueStats,
  getSubmissionStatus,
} = require("../services/submissionQueue");

exports.getStats = async (req, res) => {
  try {
    const stats = await getQueueStats();
    return res.json({ success: true, ...stats });
  } catch (error) {
    console.error("SUBMISSION QUEUE STATS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttemptStatus = async (req, res) => {
  try {
    const status = await getSubmissionStatus(req.params.attemptId);
    return res.json({ success: true, status });
  } catch (error) {
    console.error("SUBMISSION QUEUE ATTEMPT STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

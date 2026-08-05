const { getIO } = require("../socket");

exports.emitProgress = (assessmentId, data) => {
  getIO().to(`assessment-${assessmentId}`).emit("studentProgress", data);
};

exports.emitAnswerSaved = (assessmentId, data) => {
  getIO().to(`assessment-${assessmentId}`).emit("answerSaved", data);
};

exports.emitSubmitted = (assessmentId, data) => {
  getIO().to(`assessment-${assessmentId}`).emit("assessmentSubmitted", data);
};

exports.emitDisqualified = (assessmentId, data) => {
  getIO().to(`assessment-${assessmentId}`).emit("studentDisqualified", data);
};

exports.emitLeaderboard = (assessmentId, leaderboard) => {
  getIO()
    .to(`assessment-${assessmentId}`)
    .emit("leaderboardUpdated", leaderboard);
};

exports.emitDashboardAnalytics = (assessmentId, analytics) => {
  getIO()
    .to(`assessment-${assessmentId}`)
    .emit("dashboardAnalytics", analytics);
};

/* ============================================
   Student Management Events
============================================ */

exports.emitStudentStatusChanged = (assessmentId) => {
  getIO()
    .to(`assessment-${assessmentId}`)
    .emit("studentStatusChanged");
};

exports.emitStudentLoggedIn = (assessmentId) => {
  getIO()
    .to(`assessment-${assessmentId}`)
    .emit("studentLoggedIn");
};

exports.emitStudentSubmitted = (assessmentId) => {
  getIO()
    .to(`assessment-${assessmentId}`)
    .emit("studentSubmitted");
};
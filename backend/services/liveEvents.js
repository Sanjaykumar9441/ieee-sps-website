const { getIO } = require("../socket");

function emit(assessmentId,event,payload={}){try{getIO().to(`assessment-${assessmentId}`).emit(event,payload);}catch(err){console.error(`Socket emit failed (${event}):`,err.message);}}
exports.emitAssessmentStarted=(assessmentId,data)=>emit(assessmentId,"assessmentStarted",data);
exports.emitProgress=(assessmentId,data)=>emit(assessmentId,"studentProgress",data);
exports.emitQuestionChanged=(assessmentId,data)=>emit(assessmentId,"questionChanged",data);
exports.emitAnswerSaved=(assessmentId,data)=>emit(assessmentId,"answerSaved",data);
exports.emitTimer=(assessmentId,data)=>emit(assessmentId,"timerUpdated",data);
exports.emitSubmitted=(assessmentId,data)=>emit(assessmentId,"assessmentSubmitted",data);
exports.emitForceSubmitted=(assessmentId,data)=>emit(assessmentId,"forceSubmitted",data);
exports.emitSessionLocked=(assessmentId,data)=>emit(assessmentId,"sessionLocked",data);
exports.emitSessionUnlocked=(assessmentId,data)=>emit(assessmentId,"sessionUnlocked",data);
exports.emitSessionResumed=(assessmentId,data)=>emit(assessmentId,"sessionResumed",data);
exports.emitLeaderboard=(assessmentId,leaderboard)=>emit(assessmentId,"leaderboardUpdated",leaderboard);
exports.emitDashboardAnalytics=(assessmentId,analytics)=>emit(assessmentId,"dashboardAnalytics",analytics);
exports.emitDashboardRefresh=(assessmentId)=>emit(assessmentId,"dashboardRefresh");
exports.emitStatisticsUpdated=(assessmentId,statistics)=>emit(assessmentId,"statisticsUpdated",statistics);
exports.emitStudentStatusChanged=(assessmentId)=>emit(assessmentId,"studentStatusChanged");
exports.emitStudentLoggedIn=(assessmentId)=>emit(assessmentId,"studentLoggedIn");
exports.emitStudentSubmitted=(assessmentId)=>emit(assessmentId,"studentSubmitted");
exports.emitStudentBlocked=(assessmentId,data)=>emit(assessmentId,"studentBlocked",data);
exports.emitStudentUnblocked=(assessmentId,data)=>emit(assessmentId,"studentUnblocked",data);
exports.emitStudentDeleted=(assessmentId,data)=>emit(assessmentId,"studentDeleted",data);
exports.emitInfraction=(assessmentId,data)=>{try{getIO().to(`assessment-${assessmentId}`).emit("studentInfraction",data);}catch(err){console.error("Socket emit failed (studentInfraction):",err.message);}};
exports.emitQuestionBankCreated=(assessmentId,data)=>emit(assessmentId,"questionBankCreated",data);
exports.emitQuestionBankUpdated=(assessmentId,data)=>emit(assessmentId,"questionBankUpdated",data);
exports.emitQuestionBankDeleted=(assessmentId,data)=>emit(assessmentId,"questionBankDeleted",data);
exports.emitAssessmentUpdated=(assessmentId,data)=>emit(assessmentId,"assessmentUpdated",data);

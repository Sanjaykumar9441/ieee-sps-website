let io = null;

const initSocket = (socketServer) => {
  io = socketServer;

  io.on("connection", (socket) => {
    socket.emit("connected", {
      success: true,
      socketId: socket.id,
    });

    socket.on("joinAssessmentRoom", (assessmentId) => {
      try {
        if (!assessmentId) return;

        socket.join(`assessment-${assessmentId}`);

      } catch (err) {
        console.error(err);
      }
    });

    socket.on("joinAttemptRoom", (attemptId) => {
      try {
        if (!attemptId) return;

        socket.join(`attempt-${attemptId}`);

        console.log(`🎯 Student joined attempt-${attemptId}`);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("error", (err) => {
      console.error("Socket Error:", err.message);
    });

    socket.on("disconnect", () => {});
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};

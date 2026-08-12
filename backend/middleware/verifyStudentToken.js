const jwt = require("jsonwebtoken");
const { supabase } = require("../lib/supabase");

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }

    const token = auth.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Student access required",
      });
    }

    const { data: student, error } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("id", decoded.id)
      .single();

    if (error || !student) {
      return res.status(401).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Student access has been blocked",
      });
    }

    /*
     * If the route contains an assessmentId,
     * make sure the JWT belongs to that assessment.
     */
    if (
      req.params.assessmentId &&
      decoded.assessmentId !== req.params.assessmentId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this assessment",
      });
    }

    req.student = student;
    req.token = decoded;

    next();
  } catch (err) {
    console.error("STUDENT TOKEN ERROR:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

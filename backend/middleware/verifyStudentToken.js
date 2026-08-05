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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: student } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("id", decoded.id)
      .single();

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student not found",
      });
    }

    req.student = student;
    req.token = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};
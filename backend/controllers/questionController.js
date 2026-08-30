function validateMCQPayload(payload) {
  if (!payload.question_text) return "Question text is required.";
  if (!payload.bank_id) return "Question Bank ID is required.";
  if (!Array.isArray(payload.options) && (!payload.options || typeof payload.options !== "object")) return "MCQ options are required.";
  const options = normalizeOptions(payload.options);
  if (Object.keys(options).length !== 4) return "Exactly four MCQ options are required.";
  const type = String(payload.question_type || "MCQ").toUpperCase();
  const correct = Array.isArray(payload.correct_answers) ? payload.correct_answers : [];
  if (!correct.length) return "At least one correct answer is required.";
  if (type === "MCQ" && correct.length !== 1) return "MCQ requires exactly one correct answer.";
  const valid = correct.every((answer) => {
    if (typeof answer === "number") return Number.isInteger(answer) && answer >= 0 && answer < 4;
    if (typeof answer === "string" && /^[A-D]$/i.test(answer)) return true;
    if (typeof answer === "string" && /^\d+$/.test(answer)) return Number(answer) >= 0 && Number(answer) < 4;
    return false;
  });
  if (!valid) return "Correct answers must be A-D or option indices 0-3.";
  return null;
}

const Question = require("../models/Question");
const { supabase } = require("../lib/supabase");

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    const keys = ["A", "B", "C", "D", "E"];
    return options.reduce((result, option, index) => {
      const text = String(option ?? "").trim();
      if (text && keys[index]) result[keys[index]] = text;
      return result;
    }, {});
  }

  if (options && typeof options === "object") return options;
  return {};
}

exports.list = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    if (!questionBankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await Question.getAll(questionBankId);

    if (error) throw error;

    return res.json({
      success: true,
      questions: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.getById(id);

    if (error) throw error;

    return res.json({
      success: true,
      question: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = {
      bank_id: req.body.bank_id,
      question_text: String(req.body.question_text || "").trim(),
      question_type: String(req.body.question_type || "MCQ").toUpperCase() === "MULTIPLE_CORRECT" ? "MULTIPLE_CORRECT" : "MCQ",
      options: normalizeOptions(req.body.options),
      correct_answers: Array.isArray(req.body.correct_answers) ? [...new Set(req.body.correct_answers)] : [],
      // Fixed assessment format: every MCQ is one mark with no negative marking.
      marks: 1,
      negative_marks: 0,
      difficulty: "MEDIUM",
      explanation: null,
      question_image_id: null,
      estimated_seconds: 60,
      tags: [],
      language: "English",
    };

    const validationError = validateMCQPayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { data, error } = await Question.create(payload);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      question: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const payload = {
      question_type: String(req.body.question_type || "MCQ").toUpperCase() === "MULTIPLE_CORRECT" ? "MULTIPLE_CORRECT" : "MCQ",
      ...(req.body.question_text !== undefined && {
        question_text: String(req.body.question_text || "").trim(),
      }),
      ...(req.body.options !== undefined && {
        options: normalizeOptions(req.body.options),
      }),
      ...(req.body.correct_answers !== undefined && {
        correct_answers: Array.isArray(req.body.correct_answers)
          ? [...new Set(req.body.correct_answers)]
          : [],
      }),
      // Keep the simplified MCQ format consistent on every edit.
      marks: 1,
      negative_marks: 0,
      difficulty: "MEDIUM",
      explanation: null,
      question_image_id: null,
      estimated_seconds: 60,
      tags: [],
      language: "English",
    };

    const existing = await Question.getById(id);
    if (existing.error || !existing.data) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }
    const validationError = validateMCQPayload({ ...existing.data, ...payload });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { data, error } = await Question.update(id, payload);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question updated successfully.",
      question: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { error } = await Question.delete(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.duplicate(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question duplicated successfully.",
      question: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.search = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    const { keyword } = req.query;

    if (!questionBankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await Question.search(
      questionBankId,
      keyword || "",
    );

    if (error) throw error;

    return res.json({
      success: true,
      questions: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.importQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions provided.",
      });
    }

    return res.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("Import Questions Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Questions must be an array.",
      });
    }

    const { data: existingQuestions, error } = await Question.getAll(bankId);

    if (error) throw error;

    const existingTexts = new Set(
      (existingQuestions || []).map((q) =>
        q.question_text.trim().toLowerCase(),
      ),
    );

    const duplicates = questions
      .map((question, index) => ({
        index,
        question_text: question.question_text,
        duplicate: existingTexts.has(
          String(question.question_text || "")
            .trim()
            .toLowerCase(),
        ),
      }))
      .filter((item) => item.duplicate);

    return res.json({
      success: true,
      duplicates,
      duplicateCount: duplicates.length,
    });
  } catch (err) {
    console.error("Check Duplicates Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.validateQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};
    if (!bankId) return res.status(400).json({ success:false, message:"Question Bank ID is required." });
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({success:false,valid:false,errors:["No questions supplied."]});

    const errors=[];
    questions.forEach((q,i)=>{
      const row=i+1;
      const type=String(q.question_type||"MCQ").toUpperCase();
      const options=Array.isArray(q.options)?q.options.map(v=>String(v||"").trim()):[];
      const correct=Array.isArray(q.correct_answers)?q.correct_answers:[];
      if(!String(q.question_text||"").trim()) errors.push(`Row ${row}: Question text is required.`);
      if(!["MCQ","MULTIPLE_CORRECT"].includes(type)) errors.push(`Row ${row}: Only MCQ and multiple-correct questions are supported.`);
      if(options.length!==4 || options.some(v=>!v)) errors.push(`Row ${row}: Exactly four non-empty options are required.`);
      if(type==="MCQ" && correct.length!==1) errors.push(`Row ${row}: MCQ requires exactly one correct answer.`);
      if(type==="MULTIPLE_CORRECT" && correct.length<2) errors.push(`Row ${row}: Multiple choice requires at least two correct answers.`);
      const normalized=correct.map(a=>typeof a==="string"&&/^[A-D]$/i.test(a.trim())?a.trim().toUpperCase():Number(a));
      if(normalized.some(a=>!Number.isInteger(a) && !(typeof a==="string"&&/^[A-D]$/.test(a)) || (typeof a==="number"&&(a<0||a>3)))) errors.push(`Row ${row}: Correct answers must be A-D or option indices 0-3.`);
    });
    return res.json({success:true,valid:errors.length===0,errors});
  } catch(err) {
    console.error("Validate Questions Error:",err);
    return res.status(500).json({success:false,message:err.message});
  }
};

exports.finalImport = async (req, res) => {
  try {
    const { bankId }=req.params;
    const { questions }=req.body||{};
    if(!bankId) return res.status(400).json({success:false,message:"Question Bank ID is required."});
    if(!Array.isArray(questions)||!questions.length) return res.status(400).json({success:false,message:"No questions to import."});

    const normalized=questions.map(q=>{
      const type=String(q.question_type||"MCQ").toUpperCase()==="MULTIPLE_CORRECT"?"MULTIPLE_CORRECT":"MCQ";
      const options={}; ["A","B","C","D"].forEach((k,i)=>{options[k]=String((Array.isArray(q.options)?q.options[i]:"")||"").trim();});
      const correct=(Array.isArray(q.correct_answers)?q.correct_answers:[]).map(a=>{
        if(typeof a==="string"&&/^[A-D]$/i.test(a.trim())) return a.trim().toUpperCase();
        const n=Number(a); return Number.isInteger(n)&&n>=0&&n<4?["A","B","C","D"][n]:a;
      });
      return {bank_id:bankId,question_text:String(q.question_text||"").trim(),question_type:type,options,correct_answers:[...new Set(correct)],marks:1,negative_marks:0,difficulty:"MEDIUM",explanation:null,question_image_id:null,estimated_seconds:60,tags:[],language:"English",version:1,is_active:true};
    });

    const errors=[];
    normalized.forEach((q,i)=>{
      if(!q.question_text) errors.push(`Row ${i+1}: Question text is required.`);
      if(Object.values(q.options).some(v=>!v)) errors.push(`Row ${i+1}: Exactly four non-empty options are required.`);
      if(q.question_type==="MCQ"&&q.correct_answers.length!==1) errors.push(`Row ${i+1}: MCQ requires exactly one correct answer.`);
      if(q.question_type==="MULTIPLE_CORRECT"&&q.correct_answers.length<2) errors.push(`Row ${i+1}: Multiple choice requires at least two correct answers.`);
    });
    if(errors.length) return res.status(400).json({success:false,message:"Some questions failed validation.",errors});

    const {data:existing,error:existingError}=await Question.getAll(bankId);
    if(existingError) throw existingError;
    const existingTexts=new Set((existing||[]).map(q=>String(q.question_text||"").trim().toLowerCase()));
    const importable=normalized.filter(q=>!existingTexts.has(q.question_text.toLowerCase()));
    const duplicateCount=normalized.length-importable.length;

    let imported=0;
    if(importable.length){const {data,error}=await Question.bulkCreate(importable);if(error)throw error;imported=data?.length||0;}
    const {count,error:countError}=await Question.count(bankId); if(countError)throw countError;
    await supabase.from("question_banks").update({total_questions:count||0,updated_at:new Date().toISOString()}).eq("id",bankId);

    return res.status(201).json({success:true,message:`${imported} questions imported successfully.`,importedCount:imported,duplicateCount,totalQuestions:count||0,questions:importable});
  } catch(err) {
    console.error("Final Import Error:",err);
    return res.status(500).json({success:false,message:err.message});
  }
};

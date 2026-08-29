const { supabase } = require("../lib/supabase");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

function secondsToText(seconds) {
  const s = Math.max(0, Number(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

async function buildRows(assessmentId) {
  const { data: assessment, error: ae } = await supabase.from("assessments").select("*").eq("id", assessmentId).single();
  if (ae || !assessment) throw new Error("Assessment not found.");

  const { data: attempts, error: atErr } = await supabase.from("assessment_attempts").select(`id,student_id,status,score,correct,wrong,unanswered,percentage,started_at,submitted_at,disqualified_reason,assessment_allowed_students(name,roll_no,email,branch)`).eq("assessment_id", assessmentId);
  if (atErr) throw atErr;

  const submitted = (attempts || []).filter(a => ["SUBMITTED","EXPIRED","DISQUALIFIED"].includes(a.status));
  const rows = submitted.map((a, i) => {
    const st = a.assessment_allowed_students || {};
    const start = a.started_at ? new Date(a.started_at).getTime() : 0;
    const end = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const timeTaken = start && end ? Math.max(0, Math.floor((end-start)/1000)) : 0;
    return { rank: 0, attemptId:a.id, name:st.name||"", rollNo:st.roll_no||"", email:st.email||"", department:st.branch||"", status:a.status, score:Number(a.score||0), correct:Number(a.correct||0), wrong:Number(a.wrong||0), skipped:Number(a.unanswered||0), percentage:Number(a.percentage||0), timeTaken, startedAt:a.started_at||"", submittedAt:a.submitted_at||"", disqualifiedReason:a.disqualified_reason||"" };
  });
  rows.sort((a,b)=> b.score-a.score || new Date(a.submittedAt||0)-new Date(b.submittedAt||0) || a.rollNo.localeCompare(b.rollNo));
  rows.forEach((r,i)=>r.rank=i+1);
  return {assessment, rows};
}

async function buildQuestionRows(assessmentId) {
  const { data: attempts, error } = await supabase.from("assessment_attempts").select("id,status").eq("assessment_id", assessmentId).in("status", ["SUBMITTED","EXPIRED","DISQUALIFIED"]);
  if (error) throw error;
  const ids=(attempts||[]).map(a=>a.id);
  if (!ids.length) return [];
  const { data, error: qe } = await supabase.from("assessment_attempt_questions").select("question_order,question_id,correct_answers,assessment_answers(selected_answers),questions(question_text)").in("attempt_id", ids);
  if (qe) throw qe;
  const map=new Map();
  for(const item of data||[]){ const key=item.question_id; if(!map.has(key)) map.set(key,{questionNumber:item.question_order,question:item.questions?.question_text||"",total:0,correct:0,wrong:0,skipped:0}); const row=map.get(key); row.total++; const selected=item.assessment_answers?.[0]?.selected_answers; if(!Array.isArray(selected)||!selected.length){row.skipped++;continue;} const norm=v=>String(v).trim().toUpperCase(); const a=[...selected].map(norm).sort(); const c=(Array.isArray(item.correct_answers)?item.correct_answers:[item.correct_answers]).map(norm).sort(); if(JSON.stringify(a)===JSON.stringify(c)) row.correct++; else row.wrong++; }
  return [...map.values()].sort((a,b)=>a.questionNumber-b.questionNumber).map(r=>({...r,correctPercentage:r.total?Number((r.correct/r.total*100).toFixed(2)):0,wrongPercentage:r.total?Number((r.wrong/r.total*100).toFixed(2)):0,skippedPercentage:r.total?Number((r.skipped/r.total*100).toFixed(2)):0}));
}

exports.download = async (req,res) => {
  try {
    const { assessmentId } = req.params;
    const format = String(req.query.format || "xlsx").toLowerCase();
    const type = String(req.query.type || "results").toLowerCase();
    const {assessment, rows} = await buildRows(assessmentId);
    const questionRows = (type === "question-analysis" || type === "question_analysis") ? await buildQuestionRows(assessmentId) : [];

    if (format === "pdf") {
      if (type === "question-analysis" || type === "question_analysis") {
        res.setHeader("Content-Type","application/pdf");
        res.setHeader("Content-Disposition",`attachment; filename="${assessment.slug || "assessment"}-question-analysis.pdf"`);
        const doc=new PDFDocument({margin:36,size:"A4"}); doc.pipe(res);
        doc.fontSize(18).text(`${assessment.title || "Assessment"} - Question Analysis`); doc.fontSize(9).text(`Generated: ${new Date().toLocaleString("en-IN")}`); doc.moveDown();
        questionRows.forEach(r=>{ doc.fontSize(10).font("Helvetica-Bold").text(`Q${r.questionNumber}. ${r.question}`); doc.font("Helvetica").fontSize(9).text(`Attempts: ${r.total}   Correct: ${r.correctPercentage}%   Wrong: ${r.wrongPercentage}%   Skipped: ${r.skippedPercentage}%`); doc.moveDown(.5); if(doc.y>730) doc.addPage(); });
        doc.end(); return;
      }
      res.setHeader("Content-Type","application/pdf");
      res.setHeader("Content-Disposition",`attachment; filename="${assessment.slug || "assessment"}-${type}.pdf"`);
      const doc = new PDFDocument({margin:36,size:"A4",layout:"landscape"});
      doc.pipe(res);
      doc.fontSize(18).text(assessment.title || "Assessment Results");
      doc.fontSize(9).text(`Generated: ${new Date().toLocaleString("en-IN")}`);
      doc.moveDown();
      const cols=["Rank","Name","Roll No","Department","Score","Correct","Wrong","Skipped","%","Time","Submitted"];
      const widths=[35,100,70,75,45,45,40,45,40,60,100];
      let y=doc.y;
      const drawRow=(vals,bold=false)=>{let x=36; doc.fontSize(7).font(bold?"Helvetica-Bold":"Helvetica"); vals.forEach((v,i)=>{doc.text(String(v??""),x,y,{width:widths[i],ellipsis:true});x+=widths[i];}); y+=16;if(y>550){doc.addPage();y=36;}};
      drawRow(cols,true);
      rows.forEach(r=>drawRow([r.rank,r.name,r.rollNo,r.department,r.score,r.correct,r.wrong,r.skipped,r.percentage,secondsToText(r.timeTaken),r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):"-" ]));
      doc.end();
      return;
    }

    const wb=new ExcelJS.Workbook();
    if (type === "question-analysis" || type === "question_analysis") {
      const ws=wb.addWorksheet("Question Analysis");
      ws.columns=[{header:"Question No",key:"questionNumber",width:14},{header:"Question",key:"question",width:70},{header:"Attempts",key:"total",width:12},{header:"Correct",key:"correct",width:12},{header:"Wrong",key:"wrong",width:12},{header:"Skipped",key:"skipped",width:12},{header:"Correct %",key:"correctPercentage",width:12},{header:"Wrong %",key:"wrongPercentage",width:12},{header:"Skipped %",key:"skippedPercentage",width:12}];
      ws.addRows(questionRows); ws.getRow(1).font={bold:true}; ws.views=[{state:"frozen",ySplit:1}];
      res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition",`attachment; filename="${assessment.slug || "assessment"}-question-analysis.xlsx"`); await wb.xlsx.write(res); return res.end();
    }
    const ws=wb.addWorksheet(type === "leaderboard" ? "Leaderboard" : "Results");
    ws.columns=[
      {header:"Rank",key:"rank",width:8},{header:"Name",key:"name",width:24},{header:"Roll No",key:"rollNo",width:18},{header:"Email",key:"email",width:30},{header:"Department",key:"department",width:16},{header:"Status",key:"status",width:16},{header:"Score",key:"score",width:10},{header:"Correct",key:"correct",width:10},{header:"Wrong",key:"wrong",width:10},{header:"Skipped",key:"skipped",width:10},{header:"Percentage",key:"percentage",width:12},{header:"Time Taken",key:"timeTaken",width:14},{header:"Started At",key:"startedAt",width:24},{header:"Submitted At",key:"submittedAt",width:24},{header:"Disqualified Reason",key:"disqualifiedReason",width:30}
    ];
    ws.addRows(rows.map(r=>({...r,timeTaken:secondsToText(r.timeTaken),startedAt:r.startedAt?new Date(r.startedAt).toLocaleString("en-IN"):"",submittedAt:r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):""})));
    ws.getRow(1).font={bold:true}; ws.views=[{state:"frozen",ySplit:1}]; ws.autoFilter={from:"A1",to:`O${Math.max(1,rows.length+1)}`};
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",`attachment; filename="${assessment.slug || "assessment"}-${type}.xlsx"`);
    await wb.xlsx.write(res); res.end();
  } catch(err){ console.error("EXPORT ERROR",err); res.status(500).json({success:false,message:err.message}); }
};

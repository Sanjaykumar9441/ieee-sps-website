import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Edit3, Eye, FileUp, Plus, Trash2, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../../../../../lib/socket";
import { getQuestions, deleteQuestion, duplicateQuestion, validateImportedQuestions, checkQuestionDuplicates, finalImportQuestions } from "../../../Assessment/assessmentApi";
import { QuestionBank } from "./QuestionBanks";
import QuestionEditor from "./QuestionEditor";

interface Props { bank: QuestionBank; onBack: () => void; }
interface Question { id: string; bank_id: string; question_text: string; question_type: "MCQ" | "MULTIPLE_CORRECT"; options: Record<string,string> | string[]; correct_answers: any[]; is_active: boolean; }
interface ImportQuestion { question_text: string; question_type: "MCQ" | "MULTIPLE_CORRECT"; options: string[]; correct_answers: string[]; language: string; }

const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { cell += '"'; i++; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { row.push(cell); cell = ""; continue; }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
};

const normalizeCorrect = (value: string) => value.split(/[|;,]/).map((v) => v.trim().toUpperCase()).filter(Boolean).map((v) => /^[A-D]$/.test(v) ? v : String.fromCharCode(65 + Number(v))).filter((v) => /^[A-D]$/.test(v));
const optionArray = (options: Question["options"]) => Array.isArray(options) ? options.slice(0,4) : ["A","B","C","D"].map((k) => String(options?.[k] ?? ""));

export default function QuestionBankDetails({ bank, onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importQuestions, setImportQuestions] = useState<ImportQuestion[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [importBusy, setImportBusy] = useState(false);
  const [preview, setPreview] = useState<Question | null>(null);

  const fetchQuestions = async () => {
    try { setLoading(true); setQuestions(await getQuestions(bank.id) || []); }
    catch (error) { console.error(error); toast.error("Unable to load questions"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void fetchQuestions();
    const refresh = () => void fetchQuestions();
    socket.on("questionCreated", refresh); socket.on("questionUpdated", refresh); socket.on("questionDeleted", refresh);
    return () => { socket.off("questionCreated", refresh); socket.off("questionUpdated", refresh); socket.off("questionDeleted", refresh); };
  }, [bank.id]);

  const filtered = useMemo(() => questions.filter((q) => q.question_text.toLowerCase().includes(search.toLowerCase())), [questions, search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    try { await deleteQuestion(id); toast.success("Question deleted"); window.dispatchEvent(new CustomEvent("assessment-data-changed")); await fetchQuestions(); }
    catch (error) { console.error(error); toast.error("Unable to delete question"); }
  };

  const handleDuplicate = async (id: string) => {
    try { await duplicateQuestion(id); toast.success("Question duplicated"); window.dispatchEvent(new CustomEvent("assessment-data-changed")); await fetchQuestions(); }
    catch (error) { console.error(error); toast.error("Unable to duplicate question"); }
  };

  const downloadTemplate = () => {
    const rows = [
      ["question_text","question_type","option_a","option_b","option_c","option_d","correct_answers"],
      ["What is a multiplexer?","MCQ","MUX","Encoder","Decoder","Register","A"],
      ["Which are programming languages?","MULTIPLE_CORRECT","C","Python","HTML","JavaScript","A|B|D"],
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "assessment-question-template.csv"; link.click(); URL.revokeObjectURL(url);
  };

  const handleCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return toast.error("Please select a CSV file.");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result || ""));
        if (rows.length < 2) throw new Error("CSV must contain a header and at least one question.");
        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const required = ["question_text","question_type","option_a","option_b","option_c","option_d","correct_answers"];
        const missing = required.filter((h) => !headers.includes(h));
        if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
        const parsed = rows.slice(1).map((values) => {
          const record: Record<string,string> = {}; headers.forEach((h,i) => record[h] = (values[i] || "").trim());
          const type = ["MULTIPLE_CORRECT","MULTIPLE_CHOICE","MULTIPLE"].includes(record.question_type.toUpperCase().replace(/[ -]/g,"_")) ? "MULTIPLE_CORRECT" : "MCQ";
          return { question_text: record.question_text, question_type: type as ImportQuestion["question_type"], options: [record.option_a,record.option_b,record.option_c,record.option_d], correct_answers: normalizeCorrect(record.correct_answers), language: "English" };
        });
        setImportQuestions(parsed); setImportErrors([]); setDuplicateCount(0); toast.success(`${parsed.length} questions loaded. Click Validate before importing.`);
      } catch (error: any) { toast.error(error?.message || "Unable to parse CSV"); }
    };
    reader.readAsText(file);
  };

  const validateImport = async () => {
    if (!importQuestions.length) return toast.error("Choose a CSV first.");
    try {
      setImportBusy(true);
      const validation = await validateImportedQuestions(bank.id, importQuestions);
      setImportErrors(validation.errors || []);
      if (!validation.valid) return toast.error(`${validation.errors?.length || 0} validation error(s).`);
      const duplicates = await checkQuestionDuplicates(bank.id, importQuestions);
      setDuplicateCount(Number(duplicates.duplicateCount || 0));
      if (duplicates.duplicateCount) toast.error(`${duplicates.duplicateCount} duplicate question(s) found.`); else toast.success("CSV is valid and ready to import.");
    } catch (error: any) { console.error(error); toast.error(error?.response?.data?.message || "Unable to validate CSV"); }
    finally { setImportBusy(false); }
  };

  const importNow = async () => {
    if (!importQuestions.length) return toast.error("Choose a CSV first.");
    if (importErrors.length || duplicateCount) return toast.error("Validate the CSV and remove errors/duplicates first.");
    try {
      setImportBusy(true); const result = await finalImportQuestions(bank.id, importQuestions);
      toast.success(result.message || "Questions imported successfully."); setImportOpen(false); setImportQuestions([]); setDuplicateCount(0); setImportErrors([]); await fetchQuestions(); window.dispatchEvent(new CustomEvent("assessment-data-changed"));
    } catch (error: any) { console.error(error); toast.error(error?.response?.data?.message || "Unable to import questions"); }
    finally { setImportBusy(false); }
  };

  if (loading) return <div className="rounded-2xl border bg-white py-24 text-center text-slate-500">Loading Questions...</div>;
  if (editorOpen) return <QuestionEditor bankId={bank.id} initialQuestion={editingQuestion as any} onBack={() => { setEditorOpen(false); setEditingQuestion(null); }} onSaved={() => { setEditorOpen(false); setEditingQuestion(null); void fetchQuestions(); window.dispatchEvent(new CustomEvent("assessment-data-changed")); }} />;

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#00629B]"><ArrowLeft size={18}/> Back to Question Banks</button>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#00629B]">{bank.name}</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Question Library</h1><p className="mt-1 text-slate-500">{questions.length} active questions · {bank.questions_to_pick || 0} selected per attempt</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => { setEditingQuestion(null); setEditorOpen(true); }} className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white"><Plus size={18}/> Add Question</button><button type="button" onClick={() => { setImportOpen(true); setImportQuestions([]); setImportErrors([]); setDuplicateCount(0); }} className="flex items-center gap-2 rounded-xl border border-[#00629B] px-5 py-3 font-semibold text-[#00629B]"><FileUp size={18}/> Import CSV</button></div></div>
      <div className="rounded-2xl border bg-white p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00629B]"/></div>
      {filtered.length === 0 ? <div className="rounded-2xl border bg-white p-14 text-center"><p className="text-xl font-semibold text-slate-900">{search ? "No matching questions" : "No questions yet"}</p><p className="mt-2 text-sm text-slate-500">Add a question manually or use the CSV template.</p></div> : <div className="space-y-4">{filtered.map((q,index) => { const opts = optionArray(q.options); const correct = q.correct_answers.map((a) => typeof a === "number" ? String.fromCharCode(65+a) : String(a).toUpperCase()); return <div key={q.id} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Q{index+1}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{q.question_type === "MULTIPLE_CORRECT" ? "Multiple Correct" : "MCQ"}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">4 options</span></div><p className="mt-4 text-base font-medium leading-7 text-slate-900">{q.question_text}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{opts.map((opt,i) => <div key={i} className={`rounded-xl border p-3 text-sm ${correct.includes(String.fromCharCode(65+i)) ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}><span className="mr-2 font-bold">{String.fromCharCode(65+i)}.</span>{opt}</div>)}</div></div><div className="flex flex-wrap gap-2 lg:w-40 lg:justify-end"><button type="button" onClick={() => setPreview(q)} className="rounded-lg border px-3 py-2 text-sm"><Eye size={15} className="mr-1 inline"/>Preview</button><button type="button" onClick={() => { setEditingQuestion(q); setEditorOpen(true); }} className="rounded-lg border px-3 py-2 text-sm"><Edit3 size={15} className="mr-1 inline"/>Edit</button><button type="button" onClick={() => void handleDuplicate(q.id)} className="rounded-lg border px-3 py-2 text-sm"><Copy size={15} className="mr-1 inline"/>Duplicate</button><button type="button" onClick={() => void handleDelete(q.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"><Trash2 size={15} className="mr-1 inline"/>Delete</button></div></div></div>})}</div>}

      {preview && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && setPreview(null)}><div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold">Student Preview</h2><p className="text-sm text-slate-500">{preview.question_type === "MULTIPLE_CORRECT" ? "Select all correct answers." : "Select one correct answer."}</p></div><button type="button" onClick={() => setPreview(null)} className="rounded-lg border px-4 py-2">Close</button></div><div className="p-6"><p className="text-lg font-semibold text-slate-900">{preview.question_text}</p><div className="mt-6 space-y-3">{optionArray(preview.options).map((opt,i) => <div key={i} className="flex items-start gap-3 rounded-xl border p-4"><span className="flex h-7 w-7 items-center justify-center rounded-lg border font-bold">{String.fromCharCode(65+i)}</span><span>{opt}</span></div>)}</div></div></div></div>}

      {importOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold">Import Questions from CSV</h2><p className="mt-1 text-sm text-slate-500">One format supports both MCQ and Multiple Correct.</p></div><button type="button" onClick={() => !importBusy && setImportOpen(false)} className="rounded-lg border px-3 py-2">Close</button></div><div className="space-y-5 p-6"><div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-semibold">Required CSV columns</p><p className="mt-1 font-mono text-xs leading-6">question_text, question_type, option_a, option_b, option_c, option_d, correct_answers</p><p className="mt-2">Use <strong>MCQ</strong> + one answer such as <strong>A</strong>, or <strong>MULTIPLE_CORRECT</strong> + answers such as <strong>A|C|D</strong>.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={downloadTemplate} className="flex items-center gap-2 rounded-xl border px-4 py-3"><Download size={17}/> Download Template</button><label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white"><FileUp size={17}/> Choose CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSV}/></label></div>{importQuestions.length > 0 && <div className="rounded-xl border p-4"><p className="font-semibold">Loaded: {importQuestions.length} questions</p><p className="mt-1 text-sm text-slate-500">Validate before import. Duplicate questions are blocked.</p>{importErrors.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-red-600">{importErrors.slice(0,10).map((e) => <li key={e}>{e}</li>)}</ul>}{duplicateCount > 0 && <p className="mt-3 text-sm font-semibold text-amber-700">{duplicateCount} duplicate question(s) found.</p>}</div>}<div className="flex justify-end gap-3"><button type="button" onClick={() => void validateImport()} disabled={importBusy || !importQuestions.length} className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50">Validate CSV</button><button type="button" onClick={() => void importNow()} disabled={importBusy || !importQuestions.length || importErrors.length > 0 || duplicateCount > 0} className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white disabled:opacity-50">{importBusy ? "Working..." : "Import Questions"}</button></div></div></div></div>}
    </div>
  );
}

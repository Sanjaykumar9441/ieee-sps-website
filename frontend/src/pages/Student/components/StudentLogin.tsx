import { FormEvent, useState } from "react";
import { ArrowRight, Mail, LockKeyhole, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { loginStudent } from "../api/studenExamApi";

interface Props {
  assessmentId: string;
  assessmentTitle: string;
  onLoggedIn: () => void;
}

export default function StudentLogin({ assessmentId, assessmentTitle, onLoggedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error("Enter your registered email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return toast.error("Enter a valid email address.");
    if (!password) return toast.error("Enter the quiz password.");

    try {
      setLoading(true);
      await loginStudent(assessmentId, normalizedEmail, password);
      toast.success("Login successful.");
      onLoggedIn();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><div className="w-full max-w-md"><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
    <div className="bg-[#00629B] px-8 py-8 text-white"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><ShieldCheck size={26} /></div><h1 className="text-2xl font-bold">Student Examination Portal</h1><p className="mt-2 text-sm text-white/75">Secure login for your assessment</p></div>
    <form onSubmit={handleSubmit} className="p-8"><div className="mb-7"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assessment</p><h2 className="mt-1 text-lg font-semibold text-slate-900">{assessmentTitle}</h2></div>
      <label className="mb-2 block text-sm font-medium text-slate-700">Registered Email</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your registered email" autoComplete="email" className="h-13 w-full rounded-xl border border-slate-300 pl-11 pr-4 outline-none focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10" /></div>
      <p className="mt-3 text-xs text-slate-500">Only an email registered for this assessment can access the quiz.</p>
      <label className="mb-2 mt-6 block text-sm font-medium text-slate-700">Quiz Password</label><div className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter quiz password" autoComplete="current-password" className="h-13 w-full rounded-xl border border-slate-300 pl-11 pr-4 outline-none focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10" /></div>
      <button type="submit" disabled={loading} className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#00629B] font-semibold text-white transition hover:bg-[#00527f] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 size={18} className="animate-spin" />Signing in...</> : <>Continue <ArrowRight size={18} /></>}</button>
    </form></div><p className="mt-5 text-center text-xs text-slate-400">Authorized students only</p></div></div>;
}

import { FormEvent, useState } from "react";
import { ArrowRight, Mail, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { sendOtp } from "../api/studenExamApi";

interface Props {
  assessmentId: string;
  assessmentTitle: string;
  onOtpSent: (email: string) => void;
}

export default function StudentLogin({
  assessmentId,
  assessmentTitle,
  onOtpSent,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Enter your registered email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await sendOtp(assessmentId, normalizedEmail);

      toast.success("OTP sent to your email.");

      onOtpSent(normalizedEmail);
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message || err?.message || "Unable to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-[#00629B] px-8 py-8 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
              <ShieldCheck size={26} />
            </div>

            <h1 className="text-2xl font-bold">Student Examination Portal</h1>

            <p className="text-white/75 mt-2 text-sm">
              Secure login for your assessment
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assessment
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {assessmentTitle}
              </h2>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Registered Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                className="w-full h-13 pl-11 pr-4 border border-slate-300 rounded-xl outline-none transition focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10"
              />
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Use the email address registered by your institution for this
              assessment.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full h-13 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Authorized students only
        </p>
      </div>
    </div>
  );
}

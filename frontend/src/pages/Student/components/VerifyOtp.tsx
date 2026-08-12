import { FormEvent, useEffect, useRef, useState } from "react";

import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import toast from "react-hot-toast";

import { sendOtp, verifyOtp } from "../api/studenExamApi";

interface Props {
  assessmentId: string;
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function VerifyOtp({
  assessmentId,
  email,
  onVerified,
  onBack,
}: Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [seconds, setSeconds] = useState(300);
  const [resending, setResending] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [seconds]);

  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  };

  const handleOtpChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);

    setOtp(clean);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      await verifyOtp(assessmentId, email, otp);

      toast.success("Verification successful.");

      onVerified();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message || err?.message || "Invalid OTP.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || seconds > 270) {
      return;
    }

    try {
      setResending(true);

      await sendOtp(assessmentId, email);

      setOtp("");
      setSeconds(300);

      toast.success("A new OTP has been sent.");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message || err?.message || "Unable to resend OTP.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-7"
          >
            <ArrowLeft size={17} />
            Change email
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#00629B]/10 text-[#00629B] flex items-center justify-center">
            <Mail size={25} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-6">
            Verify your email
          </h1>

          <p className="text-sm text-slate-500 mt-2 leading-6">
            We sent a 6-digit verification code to
          </p>

          <p className="font-semibold text-slate-800 mt-1 break-all">{email}</p>

          <form onSubmit={handleSubmit} className="mt-7">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter OTP
            </label>

            <input
              ref={inputRef}
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="w-full h-14 text-center text-2xl tracking-[0.45em] font-bold border border-slate-300 rounded-xl outline-none focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10"
            />

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-slate-500">OTP expires in</span>

              <span
                className={
                  seconds <= 30
                    ? "font-semibold text-red-600"
                    : "font-semibold text-slate-700"
                }
              >
                {formatTime()}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="mt-6 w-full h-13 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Verify & Continue
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              disabled={resending || seconds > 270}
              onClick={handleResend}
              className="text-sm font-medium text-[#00629B] disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resending
                ? "Sending..."
                : seconds > 270
                  ? `Resend OTP in ${seconds - 270}s`
                  : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

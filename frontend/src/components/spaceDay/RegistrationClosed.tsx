import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function RegistrationClosed() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[#fbfaf6] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full rounded-3xl bg-white shadow-xl border overflow-hidden"
      >
        <div className="h-2 bg-gradient-to-r from-[#00629B] via-[#00AEEF] to-[#64C6FF]" />

        <div className="p-12 text-center">

          <div className="text-7xl mb-8">
            🚀
          </div>

          <h1 className="text-5xl font-bold text-slate-900">
            National Space Day 2026
          </h1>

          <p className="mt-8 text-3xl font-bold text-red-600">
            Registrations Temporarily Closed
          </p>

          <p className="mt-8 text-lg leading-8 text-slate-600">
            Due to bank server issues, payments are currently failing.
            <br />
            <br />
            Registrations will reopen on <strong>12‑08‑2026 at 6:00 AM</strong>.
            <br />
            <br />
            Thank you for your patience and overwhelming response.
            We look forward to seeing you at future IEEE SPS events.
          </p>

          <button
            onClick={() => navigate("/space-day")}
            className="mt-12 inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-8 py-4 font-semibold text-white transition hover:bg-[#004b78]"
          >
            <ArrowLeft size={18} />
            Back to Space Day
          </button>

        </div>
      </motion.div>
    </section>
  );
}

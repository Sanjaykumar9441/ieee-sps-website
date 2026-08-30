import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, School, Rocket, FileText, Users } from "lucide-react";

const perks = [
  { icon: School,   title: "Events & Workshops",   desc: "Exclusive access to IEEE SPS technical workshops and seminars." },
  { icon: Rocket,   title: "Hackathons & Projects", desc: "Compete, build, and ship real projects with a driven team." },
  { icon: FileText, title: "Research Support",      desc: "Guidance for publications, paper writing, and research projects." },
  { icon: Users,    title: "Professional Network",  desc: "Connect with IEEE members, alumni, and industry professionals." },
];

/** One full sine period, tileable at x=0 and x=100 */
const SINE_UNIT = "M0,20 C12,20 13,8 25,8 C37,8 38,20 50,20 C62,20 63,32 75,32 C87,32 88,20 100,20";
const REPEATS = 6;
const TILE_WIDTH = REPEATS * 100;
 
const WaveLayer = ({
  color,
  opacity,
  duration,
  strokeWidth,
  reverse = false,
}: {
  color: string;
  opacity: number;
  duration: number;
  strokeWidth: number;
  reverse?: boolean;
}) => (
  <div
    className="flex"
    style={{
      width: TILE_WIDTH * 2,
      opacity,
      animation: `sps-scroll ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
    }}
  >
    {[0, 1].map((copy) => (
      <svg
        key={copy}
        viewBox={`0 0 ${TILE_WIDTH} 40`}
        width={TILE_WIDTH}
        height="40"
        className="flex-shrink-0"
        preserveAspectRatio="none"
      >
        {Array.from({ length: REPEATS }).map((_, i) => (
          <path
            key={i}
            d={SINE_UNIT}
            transform={`translate(${i * 100}, 0)`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        ))}
      </svg>
    ))}
  </div>
);
 
const WaveformStrip = () => (
  <div className="relative h-20 sm:h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
    <div className="absolute inset-0 flex items-center">
      <WaveLayer color="#0F6E56" opacity={0.35} duration={22} strokeWidth={1} reverse />
    </div>
    <div className="absolute inset-0 flex items-center translate-y-1">
      <WaveLayer color="#22D3EE" opacity={0.9} duration={14} strokeWidth={1.5} />
    </div>
    <div className="absolute top-2 left-3 font-osc text-[10px] tracking-widest text-slate-500">
      SIG // IEEE&#8209;SPS
    </div>
  </div>
);

const JoinSPS = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    rollNumber: "", fullName: "", gender: "", department: "", otherDepartment: "",
    year: "", email: "", mobile: "", interested: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.rollNumber || !formData.fullName || !formData.gender || !formData.department ||
      !formData.year || !formData.email || !formData.mobile || !formData.interested ||
      (formData.department === "Other" && !formData.otherDepartment)) {
      setError("Please fill in all required fields."); return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError("Enter a valid 10-digit mobile number."); return;
    }
    if (!formData.email.endsWith("@adityauniversity.in")) {
      setError("Please use your college email (@adityauniversity.in)."); return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/sps-applications`, {
        ...formData,
        department: formData.department === "Other" ? formData.otherDepartment : formData.department,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

   
  const sharedStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap');
      .font-display { font-family: 'Space Grotesk', sans-serif; }
      .font-osc { font-family: 'JetBrains Mono', monospace; }
      @keyframes sps-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-${TILE_WIDTH}px); }
      }
    `}</style>
  );

  /* ── SUCCESS STATE ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        {sharedStyles}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm"
        >
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-7 h-7 text-[#00629B]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Application Submitted</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Thank you for applying to IEEE SPS Student Branch Chapter. Our team will verify your details and contact you soon.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-[#00629B] hover:bg-[#00517f] text-white py-3 rounded-xl text-sm font-semibold transition"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── MAIN PAGE ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {sharedStyles}
      <div className="px-4 sm:px-6 py-10 sm:py-16 max-w-6xl mx-auto">

        {/* BACK */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-[#00629B] text-xs font-medium mb-10 hover:gap-3 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </motion.button>

         {/* SIGNATURE WAVEFORM STRIP */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <WaveformStrip />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── LEFT ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#0C447C] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00629B]" />
              IEEE Signal Processing Society
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
              Join <span className="text-[#00629B]">IEEE SPS</span><br />
              Student Branch Chapter
            </h1>

            <p className="text-slate-500 text-sm leading-relaxed mb-10">
              Become a part of IEEE SPS at Aditya University. Participate in workshops,
              hackathons, research activities, and grow your professional network.
            </p>

            <div className="flex flex-col gap-3">
              {perks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#00629B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: FORM ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Application Form</h2>
              <p className="text-xs text-slate-400 mb-5">
                Fields marked <span className="text-red-500">*</span> are required
              </p>

              <div className="h-px bg-slate-100 mb-6" />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg p-3 mb-4"
                  >
                    <span>⚠</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                
                  <Field label="Roll Number *">
                    <input
                      type="text" placeholder="Your roll number"
                      value={formData.rollNumber}
                      onChange={e => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase().slice(0, 10) })}
                      className={inputCls} required
                    />
                  </Field>

                  <Field label="Full Name *">
                  <input type="text" name="fullName" placeholder="Your full name"
                    value={formData.fullName} onChange={handleChange} className={inputCls} required />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                <Field label="Gender *">
                    <select name="gender" value={formData.gender} onChange={handleChange} className={selectCls} required>
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </Field>

                  <Field label="Year of Study *">
                    <select name="year" value={formData.year} onChange={handleChange} className={selectCls} required>
                      <option value="">Select</option>
                      <option>1st Year</option><option>2nd Year</option>
                      <option>3rd Year</option><option>4th Year</option>
                    </select>
                  </Field>
                  </div>
              
                <Field label="Department *">
                  <select name="department" value={formData.department} onChange={handleChange} className={selectCls} required>
                    <option value="">Select department</option>
                    {["ECE","CSE","AI & ML","CSE (DS)","IT","EEE","Civil","Mechanical","Other"].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                {formData.department === "Other" && (
                  <Field label="Specify Department *">
                    <input type="text" name="otherDepartment" placeholder="Enter your department"
                      value={formData.otherDepartment} onChange={handleChange} className={inputCls} required />
                  </Field>
                )}

                <Field label="College Email *">
                  <input type="email" name="email" placeholder="roll@adityauniversity.in"
                    value={formData.email} onChange={handleChange} className={inputCls} required />
                </Field>

                <Field label="Mobile Number *">
                  <input type="tel" inputMode="numeric" name="mobile" placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className={inputCls} required />
                </Field>

                {/* Consent */}
                <label className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer">
                  <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border flex items-center justify-center transition-all ${
                    formData.interested ? "bg-[#00629B] border-[#00629B]" : "border-slate-300 bg-white"
                  }`}>
                    {formData.interested && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" name="interested" checked={formData.interested} onChange={handleChange} className="sr-only" />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    I confirm that I want to join the IEEE SPS Student Branch Chapter at Aditya University. <span className="text-red-500">*</span>
                  </span>
                </label>

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00629B] hover:bg-[#00517f] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition mt-1"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Application <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

/* ── Helpers ── */
const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00629B]/50 focus:bg-white transition";
const selectCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#00629B]/50 focus:bg-white transition appearance-none";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">{label}</p>
    {children}
  </div>
);

export default JoinSPS;
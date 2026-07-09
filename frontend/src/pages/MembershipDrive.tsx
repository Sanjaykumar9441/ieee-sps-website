import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle,
  Sparkles,
} from "lucide-react";

/**
 * Static event content for this campaign page.
 * Edit these fields directly — this page is not backend-driven like
 * the generic EventDetails route, since a membership drive is a
 * one-off campaign rather than a recurring catalog event.
 */

const EVENT = {
  title: "IEEE SPS Membership Development Drive",
  status: "Upcoming",
  date: "2026-07-11",
  certificate:
    " E-Certificate will be provided upon successful completion of the workshop." +
    " Participation will also help you earn valuable SABL Points.",
  location: "Aditya University, Surampalem.",
  description:
    "IEEE Signal Processing Society is opening its doors to new student members. " +
    "Join a global community of over 20,000 researchers, engineers, and students " +
    "working across signal processing, machine learning, and communications.\n\n" +
    "This drive is your easiest path in — reduced joining fees, dedicated mentorship " +
    "from senior members, and priority access to every SPS workshop and event this year.",
  benefits: [
    "Access to IEEE Xplore digital library",
    "Mentorship from senior IEEE SPS members",
    "Priority entry to workshops & tech talks",
    "Certificate of membership & networking events",
  ],
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

type FormState = {
  rollNumber: string;
  fullName: string;
  gender: string;
  department: string;
  otherDepartment: string;
  year: string;
  email: string;
  mobile: string;
  interested: boolean;
};

const initialForm: FormState = {
  rollNumber: "",
  fullName: "",
  gender: "",
  department: "",
  otherDepartment: "",
  year: "",
  email: "",
  mobile: "",
  interested: false,
};

const MembershipDrive = () => {
  const navigate = useNavigate();
  const isUpcoming = EVENT.status === "Upcoming";

  const [formData, setFormData] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const [settings, setSettings] = useState({
    maxRegistrations: 100,
    currentCount: 0,
    registrationOpen: true,
  });

  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/membership/settings",
      );

      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loadingSettings) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex justify-center items-center py-24">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#00629B] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const registrationClosed =
    !settings.registrationOpen ||
    settings.currentCount >= settings.maxRegistrations;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !settings.registrationOpen ||
      settings.currentCount >= settings.maxRegistrations
    ) {
      setError("Membership registrations are closed.");
      return;
    }

    if (
      !formData.rollNumber ||
      !formData.fullName ||
      !formData.gender ||
      !formData.department ||
      !formData.year ||
      !formData.email ||
      !formData.mobile ||
      !formData.interested ||
      (formData.department === "Other" && !formData.otherDepartment)
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.email.endsWith("@adityauniversity.in")) {
      setError("Please use your college email (@adityauniversity.in).");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        "https://ieee-sps-website.onrender.com/api/membership/register",
        {
          event: EVENT.title,
          ...formData,
          department:
            formData.department === "Other"
              ? formData.otherDepartment
              : formData.department,
        },
      );
      setSubmitted(true);
      await fetchSettings();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to submit. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {/* BACK */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#00629B] text-sm font-medium mb-8 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* LEFT: EVENT DETAILS */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {/* HERO CARD */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <div
                  className={`h-1 w-full ${
                    isUpcoming ? "bg-[#00629B]" : "bg-slate-300"
                  }`}
                />

                <div className="p-6 sm:p-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-[#0C447C] text-xs font-medium mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00629B]" />
                    IEEE SPS Event
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
                    {EVENT.title}
                  </h1>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                        isUpcoming
                          ? "bg-blue-50 text-[#0C447C] border-blue-100"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {EVENT.status}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(EVENT.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      <MapPin className="w-3.5 h-3.5" />
                      {EVENT.location}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* CERTIFICATE */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Certificate & Participation
                </p>

                <p className="text-slate-600 text-base leading-relaxed">
                  {EVENT.certificate}
                </p>
              </motion.div>

              {/* ABOUT */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  About this drive
                </p>
                <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                  {EVENT.description}
                </p>
              </motion.div>

              {/* BENEFITS */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#00629B]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Member benefits
                  </p>
                </div>
                <ul className="space-y-3">
                  {EVENT.benefits.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-600"
                    >
                      <CheckCircle className="w-4 h-4 text-[#00629B] mt-0.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* RIGHT: REGISTRATION FORM */}
            <div className="lg:col-span-2 lg:sticky lg:top-10">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center text-center py-8"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-5">
                        <CheckCircle className="w-7 h-7 text-[#00629B]" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        You've been successfully registered!
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Thanks for registering for the {EVENT.title}. Our team
                        will verify your details and reach out to{" "}
                        <span className="font-medium text-slate-700">
                          {formData.email}
                        </span>
                        .
                      </p>
                      <button
                        onClick={() => navigate(-1)}
                        className="mt-6 inline-flex items-center gap-2 text-[#00629B] text-sm font-medium hover:gap-3 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Events
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-base font-semibold text-slate-900 mb-1">
                        Registration Form
                      </h2>
                      <p className="text-xs text-slate-400 mb-5">
                        Fields marked <span className="text-red-500">*</span>{" "}
                        are required
                      </p>

                      <div className="h-px bg-slate-100 mb-6" />

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg p-3 mb-4"
                          >
                            <span>⚠</span> {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {registrationClosed ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                          <h2 className="text-2xl font-bold text-red-600 mb-3">
                            Membership Registrations Closed
                          </h2>

                          <p className="text-slate-600">
                            Registrations for this membership drive are
                            currently closed.
                          </p>

                          <p className="mt-3 font-semibold">
                            {settings.currentCount} /{" "}
                            {settings.maxRegistrations} Registered
                          </p>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleSubmit}
                          className="flex flex-col gap-4"
                        >
                          <Field label="Roll Number *">
                            <input
                              type="text"
                              placeholder="Your roll number"
                              value={formData.rollNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  rollNumber: e.target.value
                                    .toUpperCase()
                                    .slice(0, 10),
                                })
                              }
                              className={inputCls}
                              required
                            />
                          </Field>

                          <Field label="Full Name *">
                            <input
                              type="text"
                              name="fullName"
                              placeholder="Your full name"
                              value={formData.fullName}
                              onChange={handleChange}
                              className={inputCls}
                              required
                            />
                          </Field>

                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Gender *">
                              <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={selectCls}
                                required
                              >
                                <option value="">Select</option>
                                <option>Male</option>
                                <option>Female</option>
                              </select>
                            </Field>

                            <Field label="Year of Study *">
                              <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className={selectCls}
                                required
                              >
                                <option value="">Select</option>
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                              </select>
                            </Field>
                          </div>

                          <Field label="Department *">
                            <select
                              name="department"
                              value={formData.department}
                              onChange={handleChange}
                              className={selectCls}
                              required
                            >
                              <option value="">Select department</option>
                              {[
                                "ECE",
                                "CSE",
                                "AI & ML",
                                "CSE (DS)",
                                "IT",
                                "EEE",
                                "Civil",
                                "Mechanical",
                                "Other",
                              ].map((d) => (
                                <option key={d}>{d}</option>
                              ))}
                            </select>
                          </Field>

                          {formData.department === "Other" && (
                            <Field label="Specify Department *">
                              <input
                                type="text"
                                name="otherDepartment"
                                placeholder="Enter your department"
                                value={formData.otherDepartment}
                                onChange={handleChange}
                                className={inputCls}
                                required
                              />
                            </Field>
                          )}

                          <Field label="College Email *">
                            <input
                              type="email"
                              name="email"
                              placeholder="roll@adityauniversity.in"
                              value={formData.email}
                              onChange={handleChange}
                              className={inputCls}
                              required
                            />
                          </Field>

                          <Field label="Mobile Number *">
                            <input
                              type="tel"
                              inputMode="numeric"
                              name="mobile"
                              placeholder="10-digit mobile number"
                              value={formData.mobile}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  mobile: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10),
                                })
                              }
                              className={inputCls}
                              required
                            />
                          </Field>

                          {/* Consent */}
                          <label className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer">
                            <div
                              className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border flex items-center justify-center transition-all ${
                                formData.interested
                                  ? "bg-[#00629B] border-[#00629B]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.interested && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              name="interested"
                              checked={formData.interested}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <span className="text-xs text-slate-500 leading-relaxed">
                              I confirm that I want to register for the IEEE SPS
                              Membership Development Drive.{" "}
                              <span className="text-red-500">*</span>
                            </span>
                          </label>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-[#00629B] hover:bg-[#00517f] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition mt-1"
                          >
                            {submitting ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Register Now"
                            )}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── Helpers ── */
const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00629B]/50 focus:bg-white transition";
const selectCls =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#00629B]/50 focus:bg-white transition appearance-none";

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
      {label}
    </p>
    {children}
  </div>
);

export default MembershipDrive;
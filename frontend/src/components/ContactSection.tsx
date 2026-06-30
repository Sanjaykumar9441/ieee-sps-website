import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";

const ContactSection = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || data?.msg || "Something went wrong.");
      }

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        message: "",
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server not connected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 py-24 bg-[#F8FAFC]">
      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            {/* BADGE */}
            <span className="text-[#00629B] font-semibold uppercase tracking-wider text-sm">
              Contact Us
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Let's Connect &
              <span className="block text-[#00629B]">Collaborate</span>
            </h2>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              Reach out for collaborations, workshops, technical events,
              partnerships, research opportunities, or IEEE SPS related
              inquiries.
            </p>

            {/* CONTACT INFO */}
            <div className="mt-10 lg:mt-16 space-y-6">
              <div className="flex items-center gap-5">
                <div
                  className="w-14
h-14
rounded-xl
bg-blue-50
flex
items-center
justify-center"
                >
                  <Mail className="w-6 h-6 text-[#00629B]" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">Email</p>

                  <h3 className="text-slate-900 font-medium">
                    ieee.club.aus@gmail.com
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#00629B]" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">Phone</p>

                  <h3 className="text-slate-900 font-medium">
                    +91 70950 09441
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#00629B]" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">Location</p>

                  <h3 className="text-slate-900 font-medium">
                    Aditya University
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT FORM */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            {/* FORM CARD */}
            <div
              className="bg-white
border
border-slate-200
rounded-2xl
shadow-sm
p-8
lg:p-10"
            >
              {/* SUCCESS */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-50 px-5 py-4 text-green-700"
                >
                  <CheckCircle className="w-5 h-5" />

                  <span>Message sent successfully!</span>
                </motion.div>
              )}

              {/* ERROR */}
              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-50 px-5 py-4 text-red-700">
                  {error}
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                  className="w-full
rounded-xl
border
border-slate-300
bg-white
px-5
py-4
text-slate-900
placeholder:text-slate-400
outline-none
focus:border-[#00629B]
transition"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  required
                  className="
w-full
rounded-xl
border
border-slate-300
bg-white
px-5
py-4
text-slate-900
placeholder:text-slate-400
outline-none
focus:border-[#00629B]
transition
"
                />

                <textarea
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your Message"
                  required
                  className="
w-full
rounded-xl
border
border-slate-300
bg-white
px-5
py-4
text-slate-900
placeholder:text-slate-400
outline-none
focus:border-[#00629B]
transition
resize-none
"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="
w-full
rounded-xl
bg-[#00629B]
px-6
py-4
font-semibold
text-white
transition
hover:bg-[#00517f]
disabled:opacity-50
"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

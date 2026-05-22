import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react";

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            data?.msg ||
            "Something went wrong."
        );
      }

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        message: "",
      });

      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Server not connected."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative py-32 overflow-hidden bg-background"
    >

      {/* BACKGROUND LIGHTS */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >

            {/* BADGE */}
            <div className="inline-flex px-4 py-2 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-sm text-foreground/70 mb-6">
              Contact IEEE SPS
            </div>

            {/* TITLE */}
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">

              Let’s Build The Future

              <span className="block mt-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Together
              </span>

            </h2>

            {/* DESCRIPTION */}
            <p className="mt-8 text-lg leading-relaxed text-slate-300 max-w-xl">
              Reach out for collaborations, technical events,
              workshops, partnerships, or IEEE SPS related queries.
            </p>

            {/* CONTACT INFO */}
            <div className="mt-20 space-y-6">

              <div className="flex items-center gap-5">

                <div className="w-14 h-14 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-foreground" />
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Email
                  </p>

                  <h3 className="text-foreground font-medium">
                    ieee.club.aus@gmail.com
                  </h3>
                </div>

              </div>

              <div className="flex items-center gap-5">

                <div className="w-14 h-14 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-foreground" />
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Phone
                  </p>

                  <h3 className="text-foreground font-medium">
                    +91 70950 09441
                  </h3>
                </div>

              </div>

              <div className="flex items-center gap-5">

                <div className="w-14 h-14 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-foreground" />
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Location
                  </p>

                  <h3 className="text-foreground font-medium">
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
            className="relative"
          >

            {/* FORM CARD */}
            <div className="relative rounded-[36px] border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-2xl p-8 lg:p-10 overflow-hidden shadow-2xl">

              {/* TOP LIGHT */}
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent" />

              {/* SUCCESS */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300"
                >

                  <CheckCircle className="w-5 h-5" />

                  <span>
                    Message sent successfully!
                  </span>

                </motion.div>
              )}

              {/* ERROR */}
              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
                  {error}
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="space-y-6 relative z-10"
              >

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                  className="w-full rounded-2xl border dark:border-white/10 border-black/5 bg-black/20 px-5 py-4 text-foreground placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-indigo-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  required
                  className="w-full rounded-2xl border dark:border-white/10 border-black/5 bg-black/20 px-5 py-4 text-foreground placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-indigo-400"
                />

                <textarea
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your Message"
                  required
                  className="w-full rounded-2xl border dark:border-white/10 border-black/5 bg-black/20 px-5 py-4 text-foreground placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-indigo-400 resize-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-6 py-4 font-semibold text-foreground shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : "Send Message"}
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
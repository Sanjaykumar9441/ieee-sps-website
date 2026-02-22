import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

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

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || data?.msg || "Something went wrong.");
    }

    setSuccess(true);
    setForm({ name: "", email: "", message: "" });

    setTimeout(() => setSuccess(false), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Server not connected.");
  } finally {
    setLoading(false);
  }
};


  return (
    <motion.section
      id="contact"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 py-24"
    >
      <div className="relative p-[2px] rounded-2xl max-w-xl w-full mx-auto animate-rgb-border">
        <div className="bg-card border border-border p-10 rounded-2xl shadow-lg">

          <h2 className="text-4xl font-bold text-center mb-4">
            Contact Us
          </h2>

          <p className="text-center text-muted-foreground mb-8">
            Feel free to reach out for collaborations, events, or IEEE queries.
          </p>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-green-500 mb-6"
            >
              <CheckCircle size={22} />
              Message sent successfully!
            </motion.div>
          )}

          {error && (
            <div className="text-red-500 text-center mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full p-3 rounded-lg bg-muted border border-border outline-none focus:ring-2 focus:ring-primary transition"
              required
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your email"
              className="w-full p-3 rounded-lg bg-muted border border-border outline-none focus:ring-2 focus:ring-primary transition"
              required
            />

            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder="Your message"
              className="w-full p-3 rounded-lg bg-muted border border-border outline-none focus:ring-2 focus:ring-primary transition"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 transition p-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

          </form>
        </div>
      </div>
    </motion.section>
  );
};

export default ContactSection;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JoinSPS = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    rollNumber: "",
    fullName: "",
    department: "",
    otherDepartment: "",
    year: "",
    email: "",
    mobile: "",
    interested: false,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.rollNumber ||
      !formData.fullName ||
      !formData.department ||
      !formData.year ||
      !formData.email ||
      !formData.mobile ||
      !formData.interested ||
      (formData.department === "Other" && !formData.otherDepartment)
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "https://ieee-sps-website.onrender.com/api/sps-applications",
        {
          ...formData,
          department:
            formData.department === "Other"
              ? formData.otherDepartment
              : formData.department,
        },
      );

      setSubmitted(true);
      setLoading(false);

      setFormData({
        rollNumber: "",
        fullName: "",
        department: "",
        otherDepartment: "",
        year: "",
        email: "",
        mobile: "",
        interested: false,
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to submit application");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-[#0F172A] rounded-2xl p-10 text-center">
          <div className="text-6xl mb-4">✅</div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Application Submitted
          </h1>

          <p className="text-slate-300 leading-relaxed mb-8">
            Thank you for applying to IEEE SPS Student Branch Chapter.
            <br />
            <br />
            Your application has been received successfully. Our team will
            verify your details and contact you soon.
          </p>

          <button
            onClick={() => navigate("/")}
            className="bg-[#00629B] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#00517f] transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white py-16 px-6">
      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition"
      >
        ← Back to Home
      </button>
      <div className="max-w-2xl mx-auto bg-[#0F172A] rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-8">
          Join IEEE SPS Student Branch Chapter
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="rollNumber"
            placeholder="Roll Number"
            value={formData.rollNumber}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-black"
            required
          />

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-black"
            required
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-black"
            required
          >
            <option value="">Select Department</option>

            <option>ECE</option>
            <option>CSE</option>
            <option>AI & ML</option>
            <option>CSE (DS)</option>
            <option>IT</option>
            <option>EEE</option>
            <option>Civil</option>
            <option>Mechanical</option>
            <option>Other</option>
          </select>

          {formData.department === "Other" && (
            <input
              type="text"
              name="otherDepartment"
              placeholder="Enter Department"
              value={formData.otherDepartment}
              onChange={handleChange}
              className="w-full p-3 rounded-lg text-black"
              required
            />
          )}

          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-black"
            required
          >
            <option value="">Year of Study</option>

            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-black"
            required
          />

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-black"
            required
          />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="interested"
              checked={formData.interested}
              onChange={handleChange}
            />
            I want to join IEEE SPS Student Branch Chapter
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 py-3 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinSPS;

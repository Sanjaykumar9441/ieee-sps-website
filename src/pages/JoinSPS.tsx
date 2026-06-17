import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JoinSPS = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    setError("");

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

    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    if (!formData.email.endsWith("@adityauniversity.in")) {
      alert("Please use your college email ID");
      return;
    }

    if (formData.mobile.length !== 10) {
      alert("Mobile Number must be exactly 10 digits");
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
    } catch (err: any) {
      console.error(err);

      alert(err.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-[#070B14] text-white py-24 px-6">
      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition"
      >
        ← Back to Home
      </button>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT SIDE */}
          <div>
            <div>
              <div className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-[#00629B]">
                  IEEE Signal Processing Society
                </span>
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">
                Join IEEE SPS Student Branch Chapter
              </h1>

              <p className="text-slate-400 mb-8">
                Become a part of IEEE SPS Student Branch Chapter at Aditya
                University and participate in workshops, hackathons, research
                activities, technical events, and professional networking
                opportunities.
              </p>

              <p className="text-slate-400 mb-6 text-sm">
                Fields marked with <span className="text-red-500">*</span> are
                mandatory.
              </p>

              <div className="space-y-4 mt-8">
                <div className="flex gap-3">
                  <span>🎓</span>
                  <p>Access to IEEE SPS events and workshops</p>
                </div>

                <div className="flex gap-3">
                  <span>🚀</span>
                  <p>Hackathons and project opportunities</p>
                </div>

                <div className="flex gap-3">
                  <span>📄</span>
                  <p>Research and publication support</p>
                </div>

                <div className="flex gap-3">
                  <span>🤝</span>
                  <p>Networking with professionals and students</p>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT SIDE */}
          <div className="sticky top-24">
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8">
              {error && (
                <div
                  className="p-4 rounded-xl mb-4"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#ef4444",
                  }}
                >
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="rollNumber"
                  placeholder="Roll Number *"
                  value={formData.rollNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rollNumber: e.target.value.toUpperCase().slice(0, 10),
                    })
                  }
                  maxLength={10}
                  className="w-full p-3 rounded-lg text-black"
                  required
                />

                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name *"
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
                  <option value="">Select Department *</option>

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
                    placeholder="Enter Department *"
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
                  <option value="">Year of Study *</option>

                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>

                <input
                  type="email"
                  name="email"
                  placeholder="College Mail *"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg text-black"
                  required
                />

                <input
                  type="tel"
                  inputMode="numeric"
                  name="mobile"
                  placeholder="Mobile Number *"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  maxLength={10}
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
                  <span className="text-red-500">*</span>
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
        </div>
      </div>
    </div>
  );
};

export default JoinSPS;

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
type Member = {
  fullName: string;
  rollNo: string;
  email: string;
  phone: string;
  department: string;
  otherDepartment?: string;
  year: string;
  college: string; // Final college value
  collegeCity: string;
  collegePincode: string;
  collegeDistrict: string;
  collegeState: string;
  selectedCollege: string; // AUS / ACET / OTHER
};

const departmentOptions = [
  { value: "ECE", label: "Electronics & Communication Engineering (ECE)" },
  { value: "CSE", label: "Computer Science & Engineering (CSE)" },
  { value: "CSE-DS", label: "CSE (Data Science)" },
  { value: "AIML", label: "Artificial Intelligence & Machine Learning (AIML)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "CSE-CS", label: "Cyber Security (CSE)" },
  { value: "EEE", label: "Electrical & Electronics Engineering (EEE)" },
  { value: "MECH", label: "Mechanical Engineering" },
  { value: "CIVIL", label: "Civil Engineering" },
  { value: "PETRO", label: "Petroleum Engineering" },
  { value: "MIN", label: "Mining Engineering" },
  { value: "OTHER", label: "Other Department" },
];

const departmentMap: Record<string, string> = {
  ECE: "Electronics and Communication Engineering (ECE)",
  CSE: "Computer Science and Engineering (CSE)",
  "CSE-DS": "CSE (Data Science)",
  AIML: "Artificial Intelligence and Machine Learning (AIML)",
  IT: "Information Technology (IT)",
  "CSE-CS": "Cyber Security (CSE)",
  EEE: "Electrical and Electronics Engineering (EEE)",
  MECH: "Mechanical Engineering",
  CIVIL: "Civil Engineering",
  PETRO: "Petroleum Engineering",
  MIN: "Mining Engineering",
};

const collegeMap = {
  AUS: "Aditya University (AUS)",
  ACET: "Aditya College of Engineering & Technology (ACET)",
};

const createEmptyMember = (): Member => ({
  fullName: "",
  rollNo: "",
  email: "",
  phone: "",
  department: "",
  year: "",
  college: "",
  collegeCity: "",
  collegePincode: "",
  collegeDistrict: "",
  collegeState: "",
  selectedCollege: "",
});

const BackgroundImage = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Background Image */}
      <img
        src="/freepik_arduino_background.webp"
        decoding="async"
        loading="lazy"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    </div>
  );
};

const launchConfetti = async () => {
  const confetti = (await import("canvas-confetti")).default;

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
  });

  confetti({
    particleCount: 60,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
  });

  confetti({
    particleCount: 60,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
  });
};

const StepIndicator = ({
  showSummary,
  showPayment,
}: {
  showSummary: boolean;
  showPayment: boolean;
}) => {
  let step = 1;

  if (showSummary) step = 2;
  if (showPayment) step = 3;

  return (
    <div className="flex items-center justify-center mb-10">
      {[1, 2, 3].map((s, index) => {
        const active = s <= step;

        return (
          <div key={s} className="flex items-center">
            {/* Circle */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full font-bold
              ${
                active
                  ? "bg-cyan-400 text-black shadow-[0_0_10px_rgba(0,255,255,0.7)]"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {s}
            </div>

            {/* Label */}
            <span className="ml-2 mr-6 text-sm hidden md:block">
              {s === 1 && "Team Info"}
              {s === 2 && "Summary"}
              {s === 3 && "Payment"}
            </span>

            {/* Line */}
            {index < 2 && (
              <div className="w-10 md:w-16 h-[2px] bg-gray-600 mr-6"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MemberForm = React.memo(
  ({
    member,
    index,
    handleMemberChange,
    handleEnterNext,
    fetchPincodeDetails,
    loadingPincode,
    memberRefs,
    nameInputRefs,
  }: any) => {
    return (
      <div
        ref={(el) => (memberRefs.current[index] = el)}
        className="mb-10 p-5 md:p-6 border border-cyan-400/20 rounded-xl bg-gradient-to-br from-black/60 to-[#07111b] backdrop-blur-md shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-cyan-300">
          Member {index + 1}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            ref={(el) => (nameInputRefs.current[index] = el)}
            type="text"
            placeholder="Full Name"
            className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg"
            value={member.fullName}
            onChange={(e) =>
              handleMemberChange(index, "fullName", e.target.value)
            }
            onKeyDown={handleEnterNext}
          />

          <input
            type="text"
            placeholder="Roll Number"
            className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg"
            value={member.rollNo}
            onChange={(e) =>
              handleMemberChange(index, "rollNo", e.target.value)
            }
            onKeyDown={handleEnterNext}
          />
        </div>
      </div>
    );
  },
);

const Register = () => {
  const [registrationId, setRegistrationId] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [searchParams] = useSearchParams();
  const event = searchParams.get("event") || "combo";
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [teamSize, setTeamSize] = useState(4);
  const [teamName, setTeamName] = useState("");
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [accommodationMembers, setAccommodationMembers] = useState<number[]>(
    [],
  );
  const [showSummary, setShowSummary] = useState(false);
  const [agreedRules, setAgreedRules] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesError, setRulesError] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const memberRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loadingPincode, setLoadingPincode] = useState<number | null>(null);
  const pincodeCache = useRef<Record<string, any>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [members, setMembers] = useState<Member[]>(
    Array.from({ length: teamSize }, createEmptyMember),
  );
  useEffect(() => {
    setMembers(Array.from({ length: teamSize }, createEmptyMember));
  }, [teamSize]);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [showSummary, showPayment]);
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        autoFillTestData();
        alert("Test data auto-filled 🚀");
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  const handleAccommodationToggle = (index: number) => {
    setAccommodationMembers((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(
          "https://ieee-sps-website.onrender.com/events/registration-status",
        );

        if (!res.data.registrationOpen) {
          setRegistrationClosed(true);
        }
      } catch (error) {
        console.error("Status check failed");
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, []);
  const handleEnterNext = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const form = e.currentTarget.form;
      if (!form) return;

      const elements = Array.from(
        form.querySelectorAll("input, select, textarea"),
      ) as HTMLElement[];

      const index = elements.indexOf(e.currentTarget);

      const next = elements[index + 1];

      if (next) next.focus();
    }
  };
  const fetchPincodeDetails = (pincode: string, index: number) => {
    if (pincode.length !== 6) return;

    // 🧠 Check cache first
    if (pincodeCache.current[pincode]) {
      const data = pincodeCache.current[pincode];

      setMembers((prev) =>
        prev.map((member, i) =>
          i === index
            ? {
                ...member,
                collegeCity: data.city,
                collegeDistrict: data.district,
                collegeState: data.state,
              }
            : member,
        ),
      );

      return;
    }

    // ⏳ Debounce API calls
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        setLoadingPincode(index);

        const res = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`,
        );

        const data = await res.json();

        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];

          const locationData = {
            city: postOffice.Block || "",
            district: postOffice.District || "",
            state: postOffice.State || "",
          };

          // 💾 Save in cache
          pincodeCache.current[pincode] = locationData;

          setMembers((prev) =>
            prev.map((member, i) =>
              i === index
                ? {
                    ...member,
                    collegeCity: locationData.city,
                    collegeDistrict: locationData.district,
                    collegeState: locationData.state,
                  }
                : member,
            ),
          );
        }
      } catch (error) {
        console.log("Pincode fetch error");
      } finally {
        setLoadingPincode(null);
      }
    }, 400);
  };
  const handleMemberChange = (
    index: number,
    field: keyof Member,
    value: string,
  ) => {
    // 🔥 AUTO FILL FOR AUS / ACET
    if (field === "selectedCollege") {
      if (value === "AUS" || value === "ACET") {
        setMembers((prev) =>
          prev.map((member, i) =>
            i === index
              ? {
                  ...member,
                  selectedCollege: value,
                  college: value, // auto fill final college
                }
              : member,
          ),
        );
        return;
      }

      // If OTHER selected
      if (value === "OTHER") {
        setMembers((prev) =>
          prev.map((member, i) =>
            i === index
              ? {
                  ...member,
                  selectedCollege: value,
                  college: "",
                }
              : member,
          ),
        );
        return;
      }
    }

    // Fields that MUST be uppercase
    const forceUppercase: (keyof Member)[] = [
      "fullName",
      "rollNo",
      "department",
      "college",
      "otherDepartment",
    ];

    let updatedValue = value;

    if (forceUppercase.includes(field)) {
      updatedValue = value.toUpperCase();
    }

    // Phone → numbers only
    if (field === "phone") {
      updatedValue = value.replace(/\D/g, "");
    }

    setMembers((prev) => {
      const updated = prev.map((member, i) =>
        i === index ? { ...member, [field]: updatedValue } : member,
      );

      const m = updated[index];
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email);
      const completed =
        m.fullName &&
        m.rollNo &&
        m.email &&
        m.phone.length === 10 &&
        m.department &&
        m.year &&
        m.selectedCollege;
      return updated;
    });
  };
  const validateForm = () => {
    if (!teamName.trim() || teamName.length < 3) {
      alert("Team name is required.");
      return false;
    }

    for (let member of members) {
      if (
        !member.fullName.trim() ||
        !member.rollNo.trim() ||
        !member.email.trim() ||
        !member.phone.trim() ||
        !member.department.trim() ||
        !member.year.trim() ||
        !member.selectedCollege.trim()
      ) {
        alert("Please fill all required fields.");
        return false;
      }

      if (member.department === "OTHER" && !member.otherDepartment?.trim()) {
        alert("Please enter your department.");
        return false;
      }
      // 🔴 If OTHER college selected → require extra fields
      if (member.selectedCollege === "OTHER") {
        if (
          !member.college.trim() ||
          !member.collegeCity.trim() ||
          !member.collegePincode.trim() ||
          !member.collegeDistrict.trim() ||
          !member.collegeState.trim()
        ) {
          alert(
            "Please enter College Name, City, Pincode, District and State for OTHER colleges.",
          );
          return false;
        }
      }
      // Startup question must be answered
      if (!startupAnswer) {
        alert("Please answer: Are you planning for any start-up? *");
        return false;
      }

      // If YES → idea required
      if (startupAnswer === "yes" && !startupIdea.trim()) {
        alert("Please describe your startup idea.");
        return false;
      }
      // Phone validation
      if (!/^\d{10}$/.test(member.phone)) {
        alert("Phone number must be exactly 10 digits.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        alert("Please enter a valid email address.");
        return false;
      }
    }
    // 🚫 Prevent duplicate members inside same team
    const phones = members.map((m) => m.phone);
    const emails = members.map((m) => m.email);
    const rollNumbers = members.map((m) => m.rollNo);

    if (new Set(phones).size !== phones.length) {
      alert("Duplicate phone numbers are not allowed in the same team.");
      return false;
    }

    if (new Set(emails).size !== emails.length) {
      alert("Duplicate emails are not allowed in the same team.");
      return false;
    }

    if (new Set(rollNumbers).size !== rollNumbers.length) {
      alert("Duplicate roll numbers are not allowed in the same team.");
      return false;
    }
    // Hostel arrival/departure validation
    if (accommodationRequired) {
      if (!arrivalDate || !arrivalTime || !departureDate || !departureTime) {
        alert("Please select arrival and departure date & time.");
        return false;
      }

      const arrival = new Date(`${arrivalDate}T${arrivalTime}`);
      const departure = new Date(`${departureDate}T${departureTime}`);

      const eventStart = new Date("2026-03-22T00:00");
      const eventEnd = new Date("2026-03-26T23:59");

      if (arrival < eventStart || arrival > eventEnd) {
        alert("Arrival date must be between 22-03-2026 and 26-03-2026.");
        return false;
      }

      if (departure < eventStart || departure > eventEnd) {
        alert("Departure date must be between 22-03-2026 and 26-03-2026.");
        return false;
      }

      if (departure <= arrival) {
        alert("Departure must be after arrival.");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      const res = await axios.get(
        `https://ieee-sps-website.onrender.com/api/check-team?teamName=${teamName}&event=${event}`,
      );

      if (res.data.exists) {
        alert("This team name is already registered for this event.");
        return;
      }
    } catch (error) {
      alert("Error checking team name. Please try again.");
      return;
    }
    const selectedHostelMembers = accommodationMembers.map(
      (index) => members[index],
    );

    console.log("Registration Data:", {
      teamName,
      members,
      accommodationRequired,
      hostelMembers: selectedHostelMembers,
    });

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);

    setShowSummary(true);
  };

  const perPersonFee = event === "combo" ? 200 : 100;
  const baseFee = perPersonFee * teamSize;
  const totalAmount = baseFee;
  const [startupAnswer, setStartupAnswer] = useState("");
  const [startupIdea, setStartupIdea] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const autoFillTestData = () => {
    const testMembers = members.map((_, i) => ({
      fullName: `TEST MEMBER ${i + 1}`,
      rollNo: `TEST${Math.floor(1000 + Math.random() * 9000)}`,
      email: `test${i + 1}@mail.com`,
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      department: "ECE",
      year: "3rd",
      college: "Aditya University (AUS)",
      collegeCity: "Surampalem",
      collegePincode: "533437",
      collegeDistrict: "East Godavari",
      collegeState: "Andhra Pradesh",
      selectedCollege: "AUS",
    }));

    setTeamName(`TEST_TEAM_${Math.floor(Math.random() * 1000)}`);

    setMembers(testMembers);

    setTransactionId(
      `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    );

    setScreenshot(new File(["test"], "test.png", { type: "image/png" }));
  };
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);

    setCopiedField(field);

    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center text-cyan-400">
        Checking registration status...
      </div>
    );
  }

  if (registrationClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-center">
        <div className="text-center mt-20">
          <h1 className="text-4xl font-bold text-red-500 leading-relaxed">
            🚫 Arduino Days 2026 Registrations Closed
            <br />
            Stay tuned for future IEEE SPS events.
          </h1>

          <p className="text-gray-400 mt-4">
            Thank you for your interest. Registrations are currently closed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-white px-4 md:px-6 py-12 overflow-x-hidden">
      <BackgroundImage />

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <StepIndicator showSummary={showSummary} showPayment={showPayment} />
      </div>
      {!registrationClosed && (
        <form
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          className="relative z-10 max-w-4xl mx-auto w-full backdrop-blur-xl bg-black/50 border border-cyan-400/20 rounded-2xl p-5 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        >
          {!showSummary && !showPayment && (
            <>
              <h1
                className="text-2xl md:text-4xl font-bold mb-8 text-center 
bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 
bg-clip-text text-transparent"
              >
                Register for{" "}
                <span className="bg-cyan-400 text-black px-3 py-1 rounded">
                  {event === "combo"
                    ? "Skill Forze + Buildathon"
                    : "Buildathon"}
                </span>
              </h1>

              {/* Team Name */}
              <div className="mb-6">
                <label className="block mb-2">Team Name</label>
                <input
                  type="text"
                  placeholder="Enter your team name"
                  className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                  value={teamName}
                  onChange={(e) =>
                    setTeamName(
                      e.target.value.replace(/ {2,}/g, " ").toUpperCase(),
                    )
                  }
                />
              </div>
              {/* Team Size */}
              <div className="mb-6">
                <label className="block mb-2">Team Size</label>

                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
    focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                >
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                </select>
              </div>
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: "none" }}
              />

              {/* Members */}
              {members.map((member, index) => (
                <div
                  key={index}
                  ref={(el) => (memberRefs.current[index] = el)}
                  className="mb-10 p-5 md:p-6 border border-cyan-400/20 rounded-xl bg-gradient-to-br from-black/60 to-[#07111b] backdrop-blur-md shadow-lg"
                >
                  <h2 className="text-xl font-semibold mb-4 text-cyan-300">
                    Member {index + 1}
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      ref={(el) => (nameInputRefs.current[index] = el)}
                      type="text"
                      placeholder="Full Name with initial"
                      className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                      value={member.fullName}
                      onChange={(e) =>
                        handleMemberChange(index, "fullName", e.target.value)
                      }
                      onKeyDown={handleEnterNext}
                    />

                    <input
                      type="text"
                      placeholder="Roll Number"
                      className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                      value={member.rollNo}
                      onChange={(e) =>
                        handleMemberChange(index, "rollNo", e.target.value)
                      }
                      onKeyDown={handleEnterNext}
                    />

                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                      value={member.email}
                      onChange={(e) =>
                        handleMemberChange(index, "email", e.target.value)
                      }
                      onKeyDown={handleEnterNext}
                    />

                    <input
                      type="tel"
                      placeholder="WhatsApp Number (10 digits)"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                      value={member.phone}
                      onChange={(e) =>
                        handleMemberChange(index, "phone", e.target.value)
                      }
                      onKeyDown={handleEnterNext}
                    />

                    {/* Department */}
                    <div className="flex flex-col gap-2">
                      <select
                        className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                        value={member.department}
                        onChange={(e) =>
                          handleMemberChange(
                            index,
                            "department",
                            e.target.value,
                          )
                        }
                        onKeyDown={handleEnterNext}
                      >
                        <option value="">Select Department</option>

                        {departmentOptions.map((dept) => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>

                      {/* If OTHER selected → show input */}
                      {member.department === "OTHER" && (
                        <input
                          type="text"
                          placeholder="Enter your Department"
                          className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg"
                          value={member.otherDepartment || ""}
                          onChange={(e) =>
                            handleMemberChange(
                              index,
                              "otherDepartment",
                              e.target.value,
                            )
                          }
                          onKeyDown={handleEnterNext}
                        />
                      )}
                    </div>

                    <select
                      className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                      value={member.year}
                      onChange={(e) =>
                        handleMemberChange(index, "year", e.target.value)
                      }
                      onKeyDown={handleEnterNext}
                    >
                      <option value="">Select Year</option>
                      <option>1st</option>
                      <option>2nd</option>
                      <option>3rd</option>
                      <option>4th</option>
                    </select>
                    <select
                      className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                      value={member.selectedCollege}
                      onChange={(e) =>
                        handleMemberChange(
                          index,
                          "selectedCollege",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Select College</option>
                      <option value="AUS">Aditya University (AUS)</option>
                      <option value="ACET">
                        Aditya College of Engineering & Technology (ACET)
                      </option>
                      <option value="OTHER">Other College</option>
                    </select>
                    {member.selectedCollege === "OTHER" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <input
                          type="text"
                          placeholder="College Name"
                          className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                          value={member.college}
                          onChange={(e) =>
                            handleMemberChange(index, "college", e.target.value)
                          }
                          onKeyDown={handleEnterNext}
                        />

                        <input
                          type="text"
                          placeholder="Pincode"
                          className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                          value={member.collegePincode}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (/^\d{0,6}$/.test(value)) {
                              handleMemberChange(
                                index,
                                "collegePincode",
                                value,
                              );

                              if (value.length === 6) {
                                fetchPincodeDetails(value, index);
                              }
                            }
                          }}
                          inputMode="numeric"
                          onKeyDown={handleEnterNext}
                        />
                        <input
                          type="text"
                          placeholder={
                            loadingPincode === index
                              ? "Auto-detecting location..."
                              : "City"
                          }
                          className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
  focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                          value={
                            loadingPincode === index
                              ? "Auto-detecting location..."
                              : member.collegeCity
                          }
                          readOnly
                        />

                        <input
                          type="text"
                          placeholder="District"
                          className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                          value={
                            loadingPincode === index
                              ? "Auto-detecting location..."
                              : member.collegeDistrict
                          }
                          readOnly
                        />

                        <input
                          type="text"
                          placeholder="State"
                          className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                          value={
                            loadingPincode === index
                              ? "Auto-detecting location..."
                              : member.collegeState
                          }
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Startup Idea Question */}
              <div className="mb-8">
                <label className="block mb-2">
                  Are you planning for any start-up? *
                </label>

                <select
                  className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                  value={startupAnswer}
                  onChange={(e) => setStartupAnswer(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>

                {startupAnswer === "yes" && (
                  <textarea
                    placeholder="Describe your start-up idea"
                    className="mt-4 w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                    value={startupIdea}
                    onChange={(e) => setStartupIdea(e.target.value)}
                  />
                )}
              </div>

              {/* Accommodation */}
              <div className="mb-8">
                <label className="block mb-2">
                  Hostel Accommodation Required? (₹150 per student/day —
                  Includes Breakfast, Lunch & Dinner) *
                </label>

                <select
                  className="w-full p-3 bg-black/70 border border-cyan-400/20 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                  value={accommodationRequired ? "yes" : "no"}
                  onChange={(e) => {
                    const isYes = e.target.value === "yes";
                    setAccommodationRequired(isYes);
                    if (!isYes) setAccommodationMembers([]);
                  }}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
                {accommodationRequired && (
                  <div className="mt-6 p-6 border border-yellow-400/30 rounded-lg bg-yellow-900/10">
                    <h2 className="text-lg font-semibold mb-4 text-yellow-300">
                      Select Members for Accommodation
                    </h2>

                    {members.map((member, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-3 mb-3"
                      >
                        <input
                          type="checkbox"
                          checked={accommodationMembers.includes(index)}
                          onChange={() => handleAccommodationToggle(index)}
                        />
                        {member.fullName || `Member ${index + 1}`}
                      </label>
                    ))}

                    {/* Arrival Date & Time */}
                    <div className="mt-6">
                      <label className="block text-yellow-300 mb-2">
                        Arrival Date & Time
                      </label>

                      <div className="flex gap-3">
                        <input
                          type="date"
                          min="2026-03-22"
                          max="2026-03-26"
                          value={arrivalDate}
                          onChange={(e) => setArrivalDate(e.target.value)}
                          className="p-2 bg-black/70 border border-yellow-400/20 rounded"
                        />

                        <input
                          type="time"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="p-2 bg-black/70 border border-yellow-400/20 rounded"
                        />
                      </div>
                    </div>

                    {/* Departure Date & Time */}
                    <div className="mt-4">
                      <label className="block text-yellow-300 mb-2">
                        Departure Date & Time
                      </label>

                      <div className="flex gap-3">
                        <input
                          type="date"
                          min="2026-03-22"
                          max="2026-03-26"
                          value={departureDate}
                          onChange={(e) => setDepartureDate(e.target.value)}
                          className="p-2 bg-black/70 border border-yellow-400/20 rounded"
                        />

                        <input
                          type="time"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          className="p-2 bg-black/70 border border-yellow-400/20 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={loading}
                onClick={handleNext}
                className={`w-full font-bold py-3 rounded-lg transition ${
                  loading
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-400 to-blue-400 text-black hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/30"
                }`}
              >
                {loading ? "Checking Details..." : "Go to Payment"}
              </button>
            </>
          )}

          {showSummary && !showPayment && (
            <div className="mt-10 p-8 border border-blue-400/30 rounded-lg">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
                Registration Summary
              </h2>

              <p className="mb-4">
                <strong>Team Name:</strong> {teamName}
              </p>

              {members.map((member, index) => (
                <div
                  key={index}
                  className="mb-6 p-5 border border-gray-600 rounded-lg bg-black/40"
                >
                  <p>
                    <strong>Member {index + 1}</strong>
                  </p>
                  <p>Name: {member.fullName}</p>
                  <p>Roll No: {member.rollNo}</p>
                  <p>Email: {member.email}</p>
                  <p>Phone: {member.phone}</p>
                  <p>
                    Department:{" "}
                    {member.department === "OTHER"
                      ? member.otherDepartment
                      : departmentMap[member.department] || member.department}
                  </p>
                  <p>Year: {member.year}</p>
                  <p>College: {collegeMap[member.college] || member.college}</p>
                </div>
              ))}

              {accommodationRequired && accommodationMembers.length > 0 && (
                <div className="mb-6 p-4 border border-yellow-400/30 rounded">
                  <p className="font-semibold text-yellow-400">
                    Hostel Selected For:
                  </p>
                  {accommodationMembers.map((index) => (
                    <p key={index}>{members[index].fullName}</p>
                  ))}
                </div>
              )}
              {/* Rules Agreement */}
              <div className="mt-6 p-4 border border-cyan-400/30 rounded bg-cyan-900/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedRules}
                    onChange={(e) => {
                      setAgreedRules(e.target.checked);
                      if (e.target.checked) setRulesError(false);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-cyan-300">
                    I agree to the{" "}
                    <span
                      className="underline cursor-pointer text-cyan-400"
                      onClick={() => setShowRulesModal(true)}
                    >
                      Event Rules & Regulations
                    </span>
                  </span>
                </label>

                {/* 🔴 Error Message */}
                {rulesError && (
                  <p className="text-red-400 text-sm mt-2">
                    You must agree to the Rules & Regulations before proceeding.
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <button
                  className="flex-1 bg-red-400 text-black font-bold py-3 rounded"
                  onClick={() => setShowSummary(false)}
                >
                  Edit Details
                </button>

                <button
                  disabled={loading}
                  className={`flex-1 font-bold py-3 rounded transition ${
                    loading
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-green-400 text-black hover:scale-105"
                  }`}
                  onClick={() => {
                    if (!agreedRules) {
                      setRulesError(true);
                      return;
                    }
                    setShowPayment(true);
                  }}
                >
                  Confirm & Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {showPayment && !paymentSubmitted && (
            <>
              <div className="mb-6 text-right">
                <button
                  className="text-red-400 underline"
                  onClick={() => setShowPayment(false)}
                >
                  Edit Details
                </button>
              </div>

              <div className="mt-10 p-5 md:p-8 border border-green-400/30 rounded-lg">
                <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
                  Payment Section
                </h2>

                <div className="mb-6 p-6 border border-cyan-400/30 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-300">
                    Fee Breakdown
                  </h3>

                  <p>Event Fee: ₹{perPersonFee} per student</p>
                  <p>Team Size: {teamSize}</p>

                  <hr className="my-3 border-gray-600" />

                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-400">Amount to Pay</p>

                    <p className="text-4xl font-bold text-green-400 tracking-wide">
                      ₹{totalAmount}
                    </p>
                  </div>
                  {accommodationRequired && accommodationMembers.length > 0 && (
                    <div className="mt-4 p-4 border border-yellow-400/40 rounded-lg bg-yellow-900/10 text-yellow-300 text-sm">
                      For hostel accommodation Fees, our team will personally
                      contact the selected members after registration.
                    </div>
                  )}
                </div>

                <p className="mb-4 text-center">
                  Transfer the above amount using Bank Transfer (PhonePe / GPay
                  / NetBanking).
                </p>
                <div className="text-center text-sm text-gray-400 mb-4">
                  Secure payment via bank transfer. Your registration will be
                  confirmed after verification.
                </div>

                {/* Payment Card */}
                <div
                  className="mb-8 p-5 md:p-8 rounded-2xl border border-cyan-400/30 
bg-gradient-to-br from-[#07111b] to-[#02060c]
shadow-[0_10px_40px_rgba(0,0,0,0.6)]
backdrop-blur-md"
                >
                  <h3 className="text-xl font-semibold text-cyan-400 mb-6 text-center">
                    🏦 Bank Transfer Details
                  </h3>

                  <div className="space-y-4">
                    {/* Account Name */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 bg-black/40 p-3 rounded">
                      <span>Account Name</span>

                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300 break-words">
                          ADITYA UNIVERSITY / ADITYA ACADEMY
                        </span>

                        <button
                          onClick={() =>
                            copyToClipboard(
                              "ADITYA UNIVERSITY / ADITYA ACADEMY",
                              "accountName",
                            )
                          }
                          className="text-xs md:text-sm px-2 md:px-3 py-1 bg-cyan-400 text-black rounded"
                        >
                          {copiedField === "accountName" ? "✓ copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 bg-black/40 p-3 rounded">
                      <span>Account Number</span>

                      <div className="flex items-center gap-3">
                        <span className="text-green-400 font-semibold">
                          120028094544
                        </span>

                        <button
                          onClick={() =>
                            copyToClipboard("120028094544", "accountNumber")
                          }
                          className="text-xs md:text-sm px-2 md:px-3 py-1 bg-cyan-400 text-black rounded"
                        >
                          {copiedField === "accountNumber"
                            ? "Copied ✓"
                            : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* IFSC */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 bg-black/40 p-3 rounded">
                      <span>IFSC Code</span>

                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-semibold">
                          CNRB0013268
                        </span>

                        <button
                          onClick={() => copyToClipboard("CNRB0013268", "ifsc")}
                          className="text-xs md:text-sm px-2 md:px-3 py-1 bg-cyan-400 text-black rounded"
                        >
                          {copiedField === "ifsc" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Bank */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 bg-black/40 p-3 rounded">
                      <span>Bank Name</span>

                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300">CANARA BANK</span>

                        <button
                          onClick={() => copyToClipboard("CANARA BANK", "bank")}
                          className="text-xs md:text-sm px-2 md:px-3 py-1 bg-cyan-400 text-black rounded"
                        >
                          {copiedField === "bank" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Branch */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 bg-black/40 p-3 rounded">
                      <span>Branch</span>

                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300">Surampalem</span>

                        <button
                          onClick={() =>
                            copyToClipboard("Surampalem", "branch")
                          }
                          className="text-xs md:text-sm px-2 md:px-3 py-1 bg-cyan-400 text-black rounded"
                        >
                          {copiedField === "branch" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* PhonePe Guide */}
                <div className="mb-6 p-6 rounded-xl border border-green-400/30 bg-[#071018]">
                  <h3 className="text-lg font-semibold text-green-400 mb-4 text-center">
                    📱 How to Pay Using PhonePe
                  </h3>

                  <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                    <li>
                      Open the <b>PhonePe App</b>
                    </li>

                    <li>
                      Select <b>To Bank Account</b>
                    </li>

                    <li>Paste Account Number & IFSC</li>

                    <li>
                      Enter Amount: <b>₹{totalAmount}</b>
                    </li>

                    <li>
                      Add Note: <b>Your TeamName</b>
                    </li>

                    <li>Complete the payment</li>

                    <li>
                      Copy the <b>UTR ID</b>
                    </li>
                  </ol>
                </div>
                <div className="mb-4 text-yellow-400 text-sm text-center">
                  ⚠️ After payment, upload screenshot that contains UTR ID and
                  enter correct UTR ID.
                </div>

                <input
                  type="text"
                  placeholder="Enter 12 digit UTR ID"
                  value={transactionId}
                  maxLength={12}
                  pattern="\d{12}"
                  inputMode="numeric"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (/^\d*$/.test(value)) {
                      setTransactionId(value);
                    }
                  }}
                  className="w-full p-3 bg-black/70 border border-cyan-400/30 rounded-lg
focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                />
                <div className="border border-dashed border-cyan-400/30 p-6 rounded-xl text-center mb-6 bg-black/30">
                  <p className="text-gray-400 mb-3">
                    Upload Payment Screenshot
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="text-sm"
                    onChange={(e) => {
                      if (e.target.files) {
                        setScreenshot(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <button
                  disabled={loading}
                  className={`w-full font-bold py-3 rounded transition ${
                    loading
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-400 to-emerald-400 text-black hover:scale-105 hover:shadow-lg hover:shadow-green-400/30"
                  }`}
                  onClick={async () => {
                    // Validate UTR ID
                    if (!/^\d{12}$/.test(transactionId)) {
                      alert("UPI UTR ID must be exactly 12 digits.");
                      return;
                    }
                    if (!screenshot) {
                      alert("Please upload payment screenshot.");
                      return;
                    }

                    try {
                      setLoading(true);

                      // 1️⃣ Upload Screenshot to Cloudinary
                      const formData = new FormData();
                      formData.append("image", screenshot);

                      const uploadRes = await axios.post(
                        "https://ieee-sps-website.onrender.com/api/upload",
                        formData,
                      );

                      if (!uploadRes.data?.url) {
                        alert("Screenshot upload failed. Try again.");
                        setLoading(false);
                        return;
                      }

                      const screenshotUrl = uploadRes.data.url;

                      // 2️⃣ Prepare hostel members
                      const selectedHostelMembers = accommodationMembers.map(
                        (index) => members[index],
                      );

                      // 3️⃣ Send registration data to backend
                      const res = await axios.post(
                        "https://ieee-sps-website.onrender.com/api/register",
                        {
                          eventType:
                            event === "buildathon" ? "buildathon" : "combo",
                          eventName:
                            event === "combo"
                              ? "Skill Forze + Buildathon"
                              : "Buildathon",
                          teamName,
                          teamSize,
                          teamMembers: members.map((m) => ({
                            ...m,
                            department:
                              m.department === "OTHER"
                                ? m.otherDepartment
                                : m.department,
                          })),
                          startupAnswer,
                          startupIdea,
                          honeypot,
                          accommodationRequired,
                          hostelMembers: selectedHostelMembers,

                          arrivalDate: accommodationRequired
                            ? arrivalDate
                            : null,
                          arrivalTime: accommodationRequired
                            ? arrivalTime
                            : null,
                          departureDate: accommodationRequired
                            ? departureDate
                            : null,
                          departureTime: accommodationRequired
                            ? departureTime
                            : null,

                          expectedAmount: totalAmount,
                          userTransactionId: transactionId,
                          screenshotUrl: screenshotUrl,
                        },
                      );

                      setPaymentSubmitted(true);
                      setTimeout(() => {
                        successRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        setRegistrationId(res.data.data.registrationId);
                      }, 200);
                      launchConfetti();
                      setLoading(false);
                    } catch (error: any) {
                      console.error("REGISTRATION ERROR:", error);

                      if (error.response?.status === 403) {
                        setRegistrationClosed(true);
                        setLoading(false);
                        return;
                      }

                      if (error.response?.data?.message) {
                        alert(error.response.data.message);
                      } else {
                        alert("Something went wrong. Please try again.");
                      }

                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "Processing Payment..." : "Payment Done"}
                </button>
              </div>
            </>
          )}

          {paymentSubmitted && (
            <div
              ref={successRef}
              className="mt-12 w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center 
  p-8 md:p-12 rounded-2xl border border-green-400/30 
  bg-gradient-to-br from-[#07111b] to-[#02060c] shadow-xl"
            >
              {/* Animated Check Circle */}
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-green-400/20 flex items-center justify-center mb-6">
                <motion.svg
                  viewBox="0 0 52 52"
                  className="w-16 h-16"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.circle
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6 }}
                  />

                  <motion.path
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    d="M14 27 L22 35 L38 18"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  />
                </motion.svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-green-400 mb-4">
                Payment Submitted Successfully
              </h2>
              <p className="mt-4 text-cyan-400 font-semibold">
                Registration ID: {registrationId}
              </p>
              <p className="text-gray-300 max-w-xl text-lg">
                Your payment has been received. Our team will verify it and send
                the confirmation details to your email shortly.
              </p>
              <p className="mt-6 text-sm text-gray-300">
                📧 After payment verification, a
                <span className="text-cyan-400 font-semibold">
                  confirmation email with your event pass (PDF)
                </span>
                will be sent to all registered team members.
              </p>
            </div>
          )}

          <AnimatePresence>
            {showRulesModal && (
              <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowRulesModal(false)}
              >
                <motion.div
                  className="bg-[#0b1622] max-w-3xl w-full p-8 rounded-xl border border-cyan-400/30 overflow-y-auto max-h-[80vh]"
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                    Event Rules & Regulations
                  </h2>

                  <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
                    <div>
                      <h3 className="text-lg text-green-400 font-semibold mb-2">
                        Event Rules & Guidelines
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          The event is open to all branches and all years.
                        </li>
                        <li>
                          Participants must carry a valid student ID card.
                        </li>
                        <li>
                          A working laptop with latest Arduino IDE must be
                          installed before the event.
                        </li>
                        <li>Participation certificates will be provided.</li>
                        <li>Accommodation will be provided as per norms.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg text-cyan-400 font-semibold mb-2">
                        Skill Forze (23<sup>rd</sup> & 24<sup>th</sup> March) –
                        Workshop Guidelines
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Team registration is compulsory.</li>
                        <li>
                          Students must be registered as a Team (3-4 members).
                        </li>
                        <li>
                          The workshop covers Arduino and IoT Fundamentals.
                        </li>
                        <li>Active participation on both days is required.</li>
                        <li>
                          Teams are encouraged to participate in the Buildathon.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg text-yellow-400 font-semibold mb-2">
                        Buildathon (25<sup>th</sup> March) – Hackathon
                        Guidelines
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Students must be registered as a Team (3-4 members).
                        </li>
                        <li>
                          Problem statements will be provided by the organizers.
                        </li>
                        <li>
                          Projects must be original and developed during the
                          event.
                        </li>
                        <li>
                          Minimum one working laptop per team is mandatory.
                        </li>
                        <li>
                          Participants may choose to attend only Buildathon if
                          preferred.
                        </li>
                        <li>Teams must present a working prototype.</li>
                        <li>
                          Winners will receive prizes and merit certificates.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowRulesModal(false)}
                      className="bg-cyan-400 text-black px-6 py-2 rounded font-semibold hover:scale-105 transition"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
};

export default Register;

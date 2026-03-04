import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

type Member = {
  fullName: string;
  rollNo: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  college: string; // Final college value
  selectedCollege: string; // AUS / ACET / OTHER
};

const createEmptyMember = (): Member => ({
  fullName: "",
  rollNo: "",
  email: "",
  phone: "",
  department: "",
  year: "",
  college: "",
  selectedCollege: "",
});

const Register = () => {
  const [searchParams] = useSearchParams();
  const event = searchParams.get("event");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [teamSize, setTeamSize] = useState<number>(2);
  const [teamName, setTeamName] = useState("");
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [accommodationMembers, setAccommodationMembers] = useState<number[]>(
    [],
  );
  const [showSummary, setShowSummary] = useState(false);
  const [agreedRules, setAgreedRules] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesError, setRulesError] = useState(false);

  const [members, setMembers] = useState<Member[]>([
    createEmptyMember(),
    createEmptyMember(),
  ]);

  const handleAccommodationToggle = (index: number) => {
    setAccommodationMembers((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
    setMembers(Array.from({ length: size }, createEmptyMember));

    // RESET accommodation selections when team size changes
    setAccommodationMembers([]);
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
    ];

    let updatedValue = value;

    if (forceUppercase.includes(field)) {
      updatedValue = value.toUpperCase();
    }

    // Phone → numbers only
    if (field === "phone") {
      updatedValue = value.replace(/\D/g, "");
    }

    setMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: updatedValue } : member,
      ),
    );
  };

  const validateForm = () => {
    if (!teamName.trim()) {
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
        !member.selectedCollege.trim() ||
        !member.college.trim()
      ) {
        alert("Please fill all required fields.");
        return false;
      }

      // 🔥 10 Digit Phone Check
      if (!/^\d{10}$/.test(member.phone)) {
        alert("Phone number must be exactly 10 digits.");
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
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

  const baseFee = event === "combo" ? 400 : 200;

  const totalAmount = baseFee;

  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#050a12] text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {!showSummary && !showPayment && (
          <>
            <h1 className="text-3xl font-bold mb-8 text-center text-cyan-400">
              Register for{" "}
              {event === "combo" ? "Skill Forze + Buildathon" : "Buildathon"}
            </h1>

            {/* Team Name */}
            <div className="mb-6">
              <label className="block mb-2">Team Name</label>
              <input
                type="text"
                className="w-full p-3 bg-black border border-gray-600 rounded"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value.toUpperCase())}
              />
            </div>

            {/* Team Size */}
            <div className="mb-8">
              <label className="block mb-2">Select Team Size</label>
              <select
                className="w-full p-3 bg-black border border-gray-600 rounded"
                value={teamSize}
                onChange={(e) => handleTeamSizeChange(Number(e.target.value))}
              >
                <option value={2}>2 Members</option>
                <option value={3}>3 Members</option>
                <option value={4}>4 Members</option>
              </select>
            </div>

            {/* Members */}
            {members.map((member, index) => (
              <div
                key={index}
                className="mb-10 p-6 border border-cyan-400/30 rounded-lg"
              >
                <h2 className="text-xl font-semibold mb-4 text-cyan-300">
                  Member {index + 1}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="p-3 bg-black border border-gray-600 rounded"
                    value={member.fullName}
                    onChange={(e) =>
                      handleMemberChange(index, "fullName", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Roll Number"
                    className="p-3 bg-black border border-gray-600 rounded"
                    value={member.rollNo}
                    onChange={(e) =>
                      handleMemberChange(index, "rollNo", e.target.value)
                    }
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    className="p-3 bg-black border border-gray-600 rounded"
                    value={member.email}
                    onChange={(e) =>
                      handleMemberChange(index, "email", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Phone"
                    className="p-3 bg-black border border-gray-600 rounded"
                    value={member.phone}
                    onChange={(e) =>
                      handleMemberChange(index, "phone", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Department"
                    className="p-3 bg-black border border-gray-600 rounded"
                    value={member.department}
                    onChange={(e) =>
                      handleMemberChange(index, "department", e.target.value)
                    }
                  />

                  <select
                    className="p-3 bg-black border border-gray-600 rounded"
                    value={member.year}
                    onChange={(e) =>
                      handleMemberChange(index, "year", e.target.value)
                    }
                  >
                    <option value="">Select Year</option>
                    <option>1st</option>
                    <option>2nd</option>
                    <option>3rd</option>
                    <option>4th</option>
                  </select>
                  <select
                    className="p-3 bg-black border border-gray-600 rounded"
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
                    <option value="AUS">AUS</option>
                    <option value="ACET">ACET</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                  {member.selectedCollege === "OTHER" && (
                    <input
                      type="text"
                      placeholder="Enter College Name"
                      className="p-3 bg-black border border-gray-600 rounded mt-3"
                      value={member.college}
                      onChange={(e) =>
                        handleMemberChange(index, "college", e.target.value)
                      }
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Accommodation */}
            <div className="mb-8">
              <label className="block mb-2">
                Hostel Accommodation Required? (₹150 per day)
              </label>

              <select
                className="w-full p-3 bg-black border border-gray-600 rounded"
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
                <div className="mb-8 p-6 border border-yellow-400/30 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4 text-yellow-300">
                    Select Members for Accommodation
                  </h2>

                  {members.map((member, index) => (
                    <label key={index} className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={accommodationMembers.includes(index)}
                        onChange={() => handleAccommodationToggle(index)}
                      />
                      {member.fullName || `Member ${index + 1}`}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-cyan-400 text-black font-bold py-3 rounded hover:scale-105 transition"
            >
              {loading ? "Loading..." : "Go to Payment"}
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
                className="mb-6 p-4 border border-gray-600 rounded"
              >
                <p>
                  <strong>Member {index + 1}</strong>
                </p>
                <p>Name: {member.fullName}</p>
                <p>Roll No: {member.rollNo}</p>
                <p>Email: {member.email}</p>
                <p>Phone: {member.phone}</p>
                <p>Department: {member.department}</p>
                <p>Year: {member.year}</p>
                <p>College: {member.college}</p>
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

            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 bg-red-400 text-black font-bold py-3 rounded"
                onClick={() => setShowSummary(false)}
              >
                Edit Details
              </button>

              <button
                className="flex-1 bg-green-400 text-black font-bold py-3 rounded hover:scale-105 transition"
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

            <div className="mt-10 p-8 border border-green-400/30 rounded-lg">
              <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
                Payment Section
              </h2>

              <div className="mb-6 p-6 border border-cyan-400/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-cyan-300">
                  Fee Breakdown
                </h3>

                <p>Event Fee: ₹{baseFee}</p>

                <hr className="my-3 border-gray-600" />

                <p className="text-xl font-bold text-yellow-400">
                  Total Amount: ₹{totalAmount}
                </p>
                {accommodationRequired && accommodationMembers.length > 0 && (
                  <div className="mt-4 p-4 border border-yellow-400/40 rounded-lg bg-yellow-900/10 text-yellow-300 text-sm">
                    For hostel accommodation, our team will personally contact
                    the selected members after registration.
                  </div>
                )}
              </div>

              <p className="mb-4 text-center">
                Pay the above amount using any of the methods below:
              </p>

              <img
                src="/qr.png"
                alt="UPI QR"
                className="w-64 mx-auto mb-6 rounded-lg"
              />

              <div className="text-center mb-6">
                <p className="font-semibold">UPI ID 1: 7095009441@ybl</p>
                <p className="font-semibold">UPI ID 2: yourupi@okhdfc</p>
              </div>

              <input
                type="text"
                placeholder="Enter 12-16 digit Transaction ID"
                value={transactionId}
                maxLength={16}
                pattern="\d{12}"
                onChange={(e) => {
                  const value = e.target.value;

                  if (/^\d*$/.test(value)) {
                    setTransactionId(value);
                  }
                }}
                className="w-full p-3 bg-black border border-gray-700 rounded"
              />

              <input
                type="file"
                accept="image/*"
                className="w-full mb-6"
                onChange={(e) => {
                  if (e.target.files) {
                    setScreenshot(e.target.files[0]);
                  }
                }}
              />

              <button
                disabled={loading}
                className={`w-full font-bold py-3 rounded transition ${
                  loading
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-green-400 text-black hover:scale-105"
                }`}
                onClick={async () => {
                  // Validate Transaction ID
                  if (!/^\d{12,16}$/.test(transactionId)) {
                    alert("Transaction ID must be exactly 12 to 16 digits.");
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

                    const screenshotUrl = uploadRes.data.url;

                    // 2️⃣ Prepare hostel members
                    const selectedHostelMembers = accommodationMembers.map(
                      (index) => members[index],
                    );

                    // 3️⃣ Send registration data to backend
                    await axios.post(
                      "https://ieee-sps-website.onrender.com/api/register",
                      {
                        eventType: event,
                        eventName:
                          event === "combo"
                            ? "Skill Forze + Buildathon"
                            : "Buildathon",
                        teamName,
                        teamSize,
                        teamMembers: members,
                        accommodationRequired,
                        hostelMembers: selectedHostelMembers,
                        payment: {
                          userTransactionId: transactionId,
                          screenshotUrl,
                        },
                      },
                    );

                    setPaymentSubmitted(true);
                    setLoading(false);
                  } catch (error: any) {
                    console.error("REGISTRATION ERROR:", error);

                    if (error.response?.data?.message) {
                      alert(error.response.data.message);
                    } else {
                      alert("Something went wrong. Please try again.");
                    }

                    setLoading(false);
                  }
                }}
              >
                {loading ? "Processing..." : "Payment Done"}
              </button>
            </div>
          </>
        )}

        {paymentSubmitted && (
          <div className="mt-10 p-8 border border-yellow-400/30 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Payment Submitted Successfully
            </h2>

            <p>
              We will verify your payment and send confirmation details to your
              Email and WhatsApp shortly.
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
                      <li>The event is open to all branches and all years.</li>
                      <li>Participants must carry a valid student ID card.</li>
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
                      Skill Forze (23rd & 24th March) – Workshop Guidelines
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Team registration is compulsory.</li>
                      <li>Team size: 2–4 members.</li>
                      <li>The workshop covers Arduino and IoT Fundamentals.</li>
                      <li>Active participation on both days is required.</li>
                      <li>
                        Teams are encouraged to participate in the Buildathon.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg text-yellow-400 font-semibold mb-2">
                      Buildathon (25th March) – Hackathon Guidelines
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Team size: 2–4 members.</li>
                      <li>
                        Problem statements will be provided by the organizers.
                      </li>
                      <li>
                        Projects must be original and developed during the
                        event.
                      </li>
                      <li>Minimum one working laptop per team is mandatory.</li>
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
      </div>
    </div>
  );
};

export default Register;

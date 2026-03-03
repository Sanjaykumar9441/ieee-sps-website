import { useSearchParams } from "react-router-dom";
import { useState } from "react";

type Member = {
  fullName: string;
  RollNo: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  college: string;
};

const createEmptyMember = (): Member => ({
  fullName: "",
  RollNo: "",
  email: "",
  phone: "",
  department: "",
  year: "",
  college: "",
});

const Register = () => {
  const [searchParams] = useSearchParams();
  const event = searchParams.get("event");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [teamSize, setTeamSize] = useState<number>(2);
  const [teamName, setTeamName] = useState("");
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [accommodationMembers, setAccommodationMembers] = useState<number[]>([]);

  const [members, setMembers] = useState<Member[]>([
    createEmptyMember(),
    createEmptyMember(),
  ]);

  const handleAccommodationToggle = (index: number) => {
  setAccommodationMembers((prev) =>
    prev.includes(index)
      ? prev.filter((i) => i !== index)
      : [...prev, index]
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
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const validateForm = () => {
  if (!teamName.trim()) return false;

  for (let member of members) {
    if (
      !member.fullName.trim() ||
      !member.RollNo.trim() ||
      !member.email.trim() ||
      !member.phone.trim() ||
      !member.department.trim() ||
      !member.year.trim() ||
      !member.college.trim()
    ) {
      return false;
    }
  }

  return true;
};

  const handleNext = async () => {
  if (!validateForm()) {
    alert("Please fill all required fields.");
    return;
  }

  setLoading(true);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  setLoading(false);

  setShowPayment(true);
};

const baseFee = event === "combo" ? 400 : 200;
const accommodationCost = accommodationMembers.length * 150;
const totalAmount = baseFee + accommodationCost;

const [transactionId, setTransactionId] = useState("");
const [screenshot, setScreenshot] = useState<File | null>(null);
const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#050a12] text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {!showPayment && (
  <>

        <h1 className="text-3xl font-bold mb-8 text-center text-cyan-400">
          Register for{" "}
          {event === "combo"
            ? "Skill Forze + Buildathon"
            : "Buildathon"}
        </h1>

        {/* Team Name */}
        <div className="mb-6">
          <label className="block mb-2">Team Name</label>
          <input
            type="text"
            className="w-full p-3 bg-black border border-gray-600 rounded"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
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
                value={member.RollNo}
                onChange={(e) =>
                  handleMemberChange(index, "RollNo", e.target.value)
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
                value={member.college}
                onChange={(e) =>
                  handleMemberChange(index, "college", e.target.value)
                }
              >
                <option value="">Select College</option>
                <option>AUS</option>
                <option>ACET</option>
                <option>Other</option>
              </select>

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
{accommodationRequired && (
  <div className="mb-6 text-yellow-400 font-semibold">
    Accommodation Cost: ₹{accommodationMembers.length * 150}
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

{showPayment && !paymentSubmitted && (
  <div className="mt-10 p-8 border border-green-400/30 rounded-lg">

    <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
      Payment Section
    </h2>

    <div className="mb-6 p-6 border border-cyan-400/30 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-cyan-300">
        Fee Breakdown
      </h3>

      <p>Event Fee: ₹{baseFee}</p>

      {accommodationRequired && (
        <p>Accommodation: ₹{accommodationCost}</p>
      )}

      <hr className="my-3 border-gray-600" />

      <p className="text-xl font-bold text-yellow-400">
        Total Amount: ₹{totalAmount}
      </p>
    </div>

    <p className="mb-4 text-center">
      Pay the above amount using any of the methods below:
    </p>

    {/* QR IMAGE */}
    <img
      src="/your-qr.png"
      alt="UPI QR"
      className="w-64 mx-auto mb-6 rounded-lg"
    />

    <div className="text-center mb-6">
      <p className="font-semibold">UPI ID 1: yourupi@okaxis</p>
      <p className="font-semibold">UPI ID 2: yourupi@okhdfc</p>
    </div>

    <input
      type="text"
      placeholder="Enter Transaction ID"
      className="w-full p-3 bg-black border border-gray-600 rounded mb-4"
      value={transactionId}
      onChange={(e) => setTransactionId(e.target.value)}
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
      className="w-full bg-green-400 text-black font-bold py-3 rounded hover:scale-105 transition"
      onClick={() => {
        if (!transactionId || !screenshot) {
          alert("Please enter transaction ID and upload screenshot.");
          return;
        }

        setPaymentSubmitted(true);
      }}
    >
      Payment Done
    </button>

  </div>
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

      </div>
    </div>
  );
};

export default Register;
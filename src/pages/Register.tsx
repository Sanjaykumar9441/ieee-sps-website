import { useSearchParams } from "react-router-dom";
import { useState } from "react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const event = searchParams.get("event");

  const [loading, setLoading] = useState(false);
  const [teamSize, setTeamSize] = useState(2);
  const [teamName, setTeamName] = useState("");
  const [accommodationRequired, setAccommodationRequired] = useState(false);

  const [members, setMembers] = useState(
    Array.from({ length: 2 }, () => ({
      fullName: "",
      email: "",
      phone: "",
      department: "",
      year: "",
      college: "",
    }))
  );

  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
    setMembers(
      Array.from({ length: size }, () => ({
        fullName: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        college: "",
      }))
    );
  };

  const handleMemberChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...members];
    updated[index][field as keyof typeof updated[0]] = value;
    setMembers(updated);
  };

  const handleNext = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);

    console.log({
      eventName: event,
      teamSize,
      teamName,
      teamMembers: members,
      accommodationRequired,
    });

    alert("Step 1 Completed (Payment next)");
  };

  return (
    <div className="min-h-screen bg-[#050a12] text-white px-6 py-12">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-8 text-center text-cyan-400">
          Register for {event === "combo" ? "Skill Forze + Buildathon" : "Buildathon"}
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
          <div key={index} className="mb-10 p-6 border border-cyan-400/30 rounded-lg">

            <h2 className="text-xl font-semibold mb-4 text-cyan-300">
              Member {index + 1}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                type="text"
                placeholder="Full Name"
                className="p-3 bg-black border border-gray-600 rounded"
                onChange={(e) =>
                  handleMemberChange(index, "fullName", e.target.value)
                }
              />

              <input
                type="email"
                placeholder="Email"
                className="p-3 bg-black border border-gray-600 rounded"
                onChange={(e) =>
                  handleMemberChange(index, "email", e.target.value)
                }
              />

              <input
                type="text"
                placeholder="Phone"
                className="p-3 bg-black border border-gray-600 rounded"
                onChange={(e) =>
                  handleMemberChange(index, "phone", e.target.value)
                }
              />

              <input
                type="text"
                placeholder="Department"
                className="p-3 bg-black border border-gray-600 rounded"
                onChange={(e) =>
                  handleMemberChange(index, "department", e.target.value)
                }
              />

              <select
                className="p-3 bg-black border border-gray-600 rounded"
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
            onChange={(e) =>
              setAccommodationRequired(e.target.value === "yes")
            }
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full bg-cyan-400 text-black font-bold py-3 rounded hover:scale-105 transition"
        >
          {loading ? "Loading..." : "Go to Payment"}
        </button>

      </div>
    </div>
  );
};

export default Register;
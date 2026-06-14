import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const TeamDetails = () => {
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const res = await axios.get(
        `https://ieee-sps-website.onrender.com/team/${id}`,
      );
      setMember(res.data);
    } catch (error) {
      console.error("Error fetching team member:", error);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="
  mb-8
  text-[#00629B]
  font-medium
  hover:underline
  "
        >
          ← Back to Team
        </button>
        {/* MAIN CARD */}
        <div
          className="
        relative
        overflow-hidden
        bg-white
border
border-slate-200
rounded-2xl
shadow-sm
      "
        >
          <div className="grid lg:grid-cols-[380px_1fr] gap-12 p-10 lg:p-16 items-center">
            {/* ===== LEFT PHOTO SECTION ===== */}
            <div className="flex flex-col items-center">
              {/* IMAGE CONTAINER */}
              <div className="relative">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="
                  relative
                  w-72
h-72
object-cover
rounded-full
border-4
border-slate-100
shadow-md
                "
                />
              </div>

              {/* ROLE BADGE */}
              <div
                className="
              mt-8
              px-6 py-3
              rounded-full
              bg-blue-50
text-[#00629B]
font-medium
text-sm
            "
              >
                {member.role}
              </div>
            </div>

            {/* ===== RIGHT CONTENT ===== */}
            <div>
              {/* TOP LABEL */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#00629B] font-medium mb-6">
                <div className="w-2 h-2 rounded-full bg-[#00629B]" />

                <span className="text-sm">IEEE SPS Team Member</span>
              </div>

              {/* NAME */}
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
                {member.name}
              </h1>

              {/* ROLE TEXT */}
              <p className="text-xl text-[#00629B] mb-12">{member.role}</p>

              {/* INFO GRID */}
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoCard label="Department" value={member.department} />

                <InfoCard label="Roll Number" value={member.rollNumber} />

                <InfoCard
                  label="Registration Number"
                  value={member.registrationNumber}
                />

                <InfoCard label="Email" value={member.email} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Reusable Info Row ===== */
const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div
    className="
rounded-2xl
border
border-slate-200
bg-white
p-5
shadow-sm
hover:shadow-md
transition
"
  >
    <p className="text-sm text-slate-500 mb-2">{label}</p>

    <p className="text-lg font-medium text-slate-900 break-words">{value}</p>
  </div>
);

export default TeamDetails;

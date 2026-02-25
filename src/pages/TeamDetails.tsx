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
        `https://ieee-sps-website.onrender.com/team/${id}`
      );
      setMember(res.data);
    } catch (error) {
      console.error("Error fetching team member:", error);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">

      <div className="max-w-4xl mx-auto flex items-center justify-center">

        {/* Glass Card */}
        <div className="relative bg-card/80 backdrop-blur-xl
                        border border-border
                        rounded-3xl p-12
                        w-full text-center
                        shadow-xl">

          {/* ===== Avatar ===== */}
          <div className="relative w-52 h-52 mx-auto mb-10">

            <img
              src={member.photo}
              alt={member.name}
              className="w-52 h-52 object-cover rounded-full
                         border-4 border-primary
                         shadow-[0_0_25px_hsl(var(--primary))]
                         dark:shadow-[0_0_45px_hsl(var(--primary))]"
            />
          </div>

          {/* ===== Name ===== */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-2">
            {member.name}
          </h1>

          {/* ===== Role ===== */}
          <p className="text-primary text-lg mb-10">
            {member.role}
          </p>

          {/* ===== Info Section ===== */}
          <div className="space-y-4 text-sm md:text-base">

            <InfoRow label="Department" value={member.department} />
            <InfoRow label="Roll Number" value={member.rollNumber} />
            <InfoRow label="Registration Number" value={member.registrationNumber} />
            <InfoRow label="Email" value={member.email} />

          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Reusable Info Row ===== */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-border pb-2">
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </div>
);

export default TeamDetails;
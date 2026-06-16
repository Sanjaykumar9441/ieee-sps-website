import { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/admin-access/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) {
    return <div className="p-6">Loading Profile...</div>;
  }

  const isExternal = profile.isExternal;

  const member = profile.memberId;

  const photo = isExternal
    ? "https://ui-avatars.com/api/?name=Admin"
    : member?.photo;

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: "#0f1624",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      {profile.isPaused && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444",
          }}
        >
          <>
            <div className="font-semibold text-lg">⚠ Access Restricted</div>

            <div className="mt-2">
              Your administrative access has been temporarily restricted.
            </div>

            <div className="mt-3">
              <strong>Reason:</strong>{" "}
              {profile.pauseReason || "Temporary Committee Restriction"}
            </div>
          </>
        </div>
      )}

      <div className="flex items-center gap-5 mb-6">
        <img
          src={photo}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover"
        />

        <div>
          <h2 className="text-2xl font-bold">
            {isExternal ? profile.name : member?.name}
          </h2>

          <p
            style={{
              color: "#64748b",
            }}
          >
            {isExternal ? profile.role : member?.role}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {!isExternal && (
          <>
            <InfoCard label="Department" value={member?.department} />

            <InfoCard label="Roll Number" value={member?.rollNumber} />

            <InfoCard
              label="Registration Number"
              value={member?.registrationNumber}
            />

            <InfoCard label="Email" value={member?.email} />

            <InfoCard label="Phone" value={member?.phone} />
          </>
        )}

        <InfoCard label="Username" value={profile.username} />

        <InfoCard
          label="Last Login"
          value={
            profile.lastLogin
              ? new Date(profile.lastLogin).toLocaleString()
              : "Never"
          }
        />

        <InfoCard
          label="Last Password Change"
          value={
            profile.lastPasswordChange
              ? new Date(profile.lastPasswordChange).toLocaleString()
              : "Never"
          }
        />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Permissions</h3>

        <div className="flex flex-wrap gap-2">
          {Object.entries(profile.permissions)
            .filter(([, value]) => value)
            .map(([key]) => (
              <span
                key={key}
                className="px-3 py-1 rounded-lg text-sm"
                style={{
                  backgroundColor: "rgba(59,130,246,0.15)",
                  color: "#93c5fd",
                }}
              >
                {key}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: any }) => (
  <div
    className="p-3 rounded-lg"
    style={{
      backgroundColor: "rgba(255,255,255,0.03)",
    }}
  >
    <div
      className="text-xs mb-1"
      style={{
        color: "#64748b",
      }}
    >
      {label}
    </div>

    <div>{value || "-"}</div>
  </div>
);

export default Profile;

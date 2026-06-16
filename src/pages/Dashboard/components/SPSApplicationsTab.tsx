import { useEffect, useState } from "react";
import axios from "axios";

const SPSApplicationsTab = () => {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/sps-applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `https://ieee-sps-website.onrender.com/api/sps-applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">SPS Applications</h2>

      <div className="space-y-4">
        {applications.length === 0 && (
          <div className="text-center py-10" style={{ color: "#64748b" }}>
            No SPS applications yet.
          </div>
        )}

        {applications.map((app) => (
          <div
            key={app._id}
            className="p-4 rounded-xl"
            style={{
              backgroundColor: "#0f1624",
              border: "1px solid rgba(99,179,237,0.08)",
            }}
          >
            <div className="font-semibold">{app.fullName}</div>

            <div>{app.rollNumber}</div>

            <div>
              {app.department} • {app.year}
            </div>

            <div>{app.email}</div>

            <div>{app.mobile}</div>

            <div className="mt-2 text-xs text-slate-500">
              Applied: {new Date(app.createdAt).toLocaleString()}
            </div>

            <button
              onClick={() => {
                if (window.confirm("Delete this application?")) {
                  deleteApplication(app._id);
                }
              }}
              className="mt-3 px-3 py-1 rounded-lg text-sm"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SPSApplicationsTab;

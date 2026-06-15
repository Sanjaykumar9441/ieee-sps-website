import { useEffect, useState } from "react";
import axios from "axios";

const ActivityLogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/activity-logs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2
        className="text-2xl font-bold mb-6"
        style={{
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        Activity Logs
      </h2>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log._id}
            className="p-4 rounded-xl"
            style={{
              backgroundColor: "#0f1624",
              border:
                "1px solid rgba(99,179,237,0.08)",
            }}
          >
            <div className="font-semibold">
              {log.adminName}
            </div>

            <div>{log.action}</div>

            <div
              className="text-sm"
              style={{ color: "#64748b" }}
            >
              {log.details}
            </div>

            <div
              className="text-xs mt-2"
              style={{ color: "#475569" }}
            >
              {new Date(
                log.createdAt
              ).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLogsTab;
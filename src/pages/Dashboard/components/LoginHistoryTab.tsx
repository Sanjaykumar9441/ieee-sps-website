import { useEffect, useState } from "react";
import axios from "axios";

const LoginHistoryTab = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredAdmins = admins.filter((admin) =>
    admin.username.toLowerCase().includes(search.toLowerCase()),
  );

  const fetchAdmins = async () => {
    try {
      setRefreshing(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/admin-access",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Login History</h2>

        <button
          onClick={fetchAdmins}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg disabled:opacity-60"
          style={{
            background: "#2563eb",
            color: "white",
          }}
        >
          {refreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      <div className="mb-4" style={{ color: "#64748b" }}>
        Total Admins: {admins.length}
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search Admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-xl mb-6 bg-[#0f1624] border border-slate-700"
        />

        {filteredAdmins.length === 0 && (
          <div className="text-center py-10" style={{ color: "#64748b" }}>
            No admins found.
          </div>
        )}

        {filteredAdmins.map((admin) => (
          <div
            key={admin._id}
            className="p-4 rounded-xl"
            style={{
              backgroundColor: "#0f1624",
              border: "1px solid rgba(99,179,237,0.08)",
            }}
          >
            <div className="font-semibold">{admin.username}</div>

            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Total Logins: {admin.loginHistory?.length || 0}
            </div>

            <div
              style={{
                color: "#64748b",
              }}
            >
              Last Login:{" "}
              {admin.lastLogin
                ? new Date(admin.lastLogin).toLocaleString()
                : "Never"}
            </div>

            <div className="mt-3 space-y-2">
              {admin.loginHistory
                ?.slice(0, 5)
                .map((login: any, index: number) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div>{new Date(login.loginAt).toLocaleString()}</div>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      {login.device}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoginHistoryTab;

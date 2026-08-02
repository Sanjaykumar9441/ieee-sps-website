import { useEffect, useState } from "react";  
import axios from "axios";  
import { RefreshCw, Download, Trash2 } from "lucide-react";  
import * as XLSX from "xlsx";

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
        { headers: { Authorization: `Bearer ${token}` } },  
      );  
      setAdmins(res.data);  
    } catch (err) {  
      console.error(err);  
    } finally {  
      setRefreshing(false);  
    }  
  };

  const deleteAllHistory = async () => {  
    if (!window.confirm("Delete all login history?")) return;

    try {  
      const token = localStorage.getItem("token");

      await axios.delete(  
        "https://ieee-sps-website.onrender.com/api/admin-access/clear-all",  
        {  
          headers: {  
            Authorization: `Bearer ${token}`,  
          },  
        },  
      );

      fetchAdmins();  
    } catch (err) {  
      console.error(err);  
    }  
  };

  const deleteAdminHistory = async (id: string) => {  
    if (!window.confirm("Delete this admin login history?")) return;

    try {  
      const token = localStorage.getItem("token");

      await axios.delete(  
        `https://ieee-sps-website.onrender.com/api/admin-access/${id}/login-history`,  
        {  
          headers: {  
            Authorization: `Bearer ${token}`,  
          },  
        },  
      );

      fetchAdmins();  
    } catch (err) {  
      console.error(err);  
    }  
  };

  const exportToExcel = () => {  
    const rows: any[] = [];

    admins.forEach((admin) => {  
      if (admin.loginHistory && admin.loginHistory.length > 0) {  
        admin.loginHistory.forEach((login: any) => {  
          rows.push({  
            Username: admin.username,  
            "Total Logins": admin.loginHistory.length,  
            "Last Login": admin.lastLogin  
              ? new Date(admin.lastLogin).toLocaleString()  
              : "Never",  
            "Login At": new Date(login.loginAt).toLocaleString(),  
            Device: login.device || "—",  
          });  
        });  
      } else {  
        rows.push({  
          Username: admin.username,  
          "Total Logins": 0,  
          "Last Login": "Never",  
          "Login At": "—",  
          Device: "—",  
        });  
      }  
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Column widths  
    worksheet["!cols"] = [  
      { wch: 20 }, // Username  
      { wch: 14 }, // Total Logins  
      { wch: 24 }, // Last Login  
      { wch: 24 }, // Login At  
      { wch: 30 }, // Device  
    ];

    const workbook = XLSX.utils.book_new();  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Login History");

    const date = new Date().toISOString().slice(0, 10);  
    XLSX.writeFile(workbook, `IEEE_SPS_Login_History_${date}.xlsx`);  
  };

  return (  
    <div>  
      <div className="flex justify-between items-center mb-6">  
        <h2 className="text-3xl font-bold">Login History</h2>

        <div className="flex items-center gap-2">  
          <button  
            onClick={deleteAllHistory}  
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"  
            style={{  
              background: "linear-gradient(135deg,#ef4444,#dc2626)",  
              color: "#fff",  
            }}  
          >  
            <Trash2 size={14} />  
            Delete All  
          </button>  
          <button  
            onClick={exportToExcel}  
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"  
            style={{  
              background: "linear-gradient(135deg, #22c55e, #16a34a)",  
              color: "#fff",  
              boxShadow: "0 2px 12px rgba(34,197,94,0.25)",  
            }}  
          >  
            <Download size={14} />  
            Export Excel  
          </button>

          <button  
            onClick={fetchAdmins}  
            disabled={refreshing}  
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"  
            style={{  
              background: "linear-gradient(135deg, #22c55e, #16a34a)",  
              color: "#fff",  
              boxShadow: "0 2px 12px rgba(34,197,94,0.25)",  
            }}  
          >  
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />  
            {refreshing ? "Refreshing..." : "Refresh"}  
          </button>  
        </div>  
      </div>

      <div className="mb-4" style={{ color: "#8A8578" }}>  
        Total Admins: {admins.length}  
      </div>

      <div className="space-y-4">  
        <input  
          type="text"  
          placeholder="Search Admin..."  
          value={search}  
          onChange={(e) => setSearch(e.target.value)}  
          className="w-full p-3 rounded-xl mb-6 bg-[#FFFFFF] border border-[#EBE8E2]"  
        />

        {filteredAdmins.length === 0 && (  
          <div className="text-center py-10" style={{ color: "#8A8578" }}>  
            No admins found.  
          </div>  
        )}

        {filteredAdmins.map((admin) => (  
          <div  
            key={admin._id}  
            className="p-4 rounded-xl"  
            style={{  
              backgroundColor: "#FFFFFF",  
              border: "1px solid #EBE8E2",  
            }}  
          >  
            {/* Header */}  
            <div className="flex justify-between items-start mb-4">  
              <div>  
                <div className="font-semibold text-lg">{admin.username}</div>

                <div style={{ color: "#8A8578", fontSize: "12px" }}>  
                  Total Logins: {admin.loginHistory?.length || 0}  
                </div>

                <div style={{ color: "#8A8578" }}>  
                  Last Login:{" "}  
                  {admin.lastLogin  
                    ? new Date(admin.lastLogin).toLocaleString()  
                    : "Never"}  
                </div>  
              </div>

              <button  
                onClick={() => deleteAdminHistory(admin._id)}  
                className="  
          flex items-center gap-2  
          px-4 py-2  
          rounded-lg  
          bg-red-500/10  
          border border-red-500/20  
          text-red-400  
          hover:bg-red-500/20  
          transition  
        "  
              >  
                <Trash2 size={15} />  
                Delete  
              </button>  
            </div>

            {/* Login History */}  
            <div className="mt-3 space-y-2">  
              {admin.loginHistory  
                ?.slice(0, 5)  
                .map((login: any, index: number) => (  
                  <div  
                    key={index}  
                    className="p-2 rounded-lg"  
                    style={{  
                      backgroundColor: "rgba(28,27,34,0.045)",  
                    }}  
                  >  
                    <div>{new Date(login.loginAt).toLocaleString()}</div>

                    <div  
                      style={{  
                        color: "#8A8578",  
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
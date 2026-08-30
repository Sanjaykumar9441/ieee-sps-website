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
        `${import.meta.env.VITE_API_URL}/api/activity-logs`,
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

  const deleteLog = async (id: string) => {  
    try {  
      const token = localStorage.getItem("token");

      await axios.delete(  
        `${import.meta.env.VITE_API_URL}/api/activity-logs/${id}`, 
        {  
          headers: {  
            Authorization: `Bearer ${token}`,  
          },  
        },  
      );

      fetchLogs();  
    } catch (err) {  
      console.error(err);  
    }  
  };

  const clearLogs = async () => {  
    if (!window.confirm("Are you sure you want to clear all activity logs?"))  
      return;

    try {  
      const token = localStorage.getItem("token");

      await axios.delete(  
        `${import.meta.env.VITE_API_URL}/api/activity-logs`,
        {  
          headers: {  
            Authorization: `Bearer ${token}`,  
          },  
        },  
      );

      fetchLogs();  
    } catch (err) {  
      console.error(err);  
    }  
  };

  return (  
    <div>  
      <div className="flex justify-between items-center mb-6">  
        <h2 className="text-3xl font-bold">Activity Logs</h2>

        <button  
          onClick={clearLogs}  
          className="px-4 py-2 rounded-lg"  
          style={{  
            background: "#dc2626",  
            color: "white",  
          }}  
        >  
          🗑 Clear Logs  
        </button>  
      </div>

      <div className="space-y-3">  
        {logs.map((log) => (  
          <div  
            key={log._id}  
            className="p-4 rounded-xl"  
            style={{  
              backgroundColor: "#FFFFFF",  
              border: "1px solid #EBE8E2",  
            }}  
          >  
            <div className="font-semibold">{log.adminName}</div>

            <div>{log.action}</div>

            <div className="text-sm" style={{ color: "#8A8578" }}>  
              {log.details}  
            </div>

            <div className="flex justify-between items-center mt-2">  
              <div className="text-xs" style={{ color: "#8A8578" }}>  
                {new Date(log.createdAt).toLocaleString()}  
              </div>

              <button  
                onClick={() => {  
                  if (window.confirm("Delete this log permanently?")) {  
                    deleteLog(log._id);  
                  }  
                }}  
                className="px-3 py-1 rounded-lg text-sm"  
                style={{  
                  background: "rgba(239,68,68,0.15)",  
                  color: "#ef4444",  
                }}  
              >  
                🗑 Delete  
              </button>  
            </div>  
          </div>  
        ))}  
      </div>  
    </div>  
  );  
};

export default ActivityLogsTab;
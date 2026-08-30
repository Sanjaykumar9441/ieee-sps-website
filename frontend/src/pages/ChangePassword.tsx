import { useState } from "react";  
import axios from "axios";

const ChangePassword = () => {  
  const [currentPassword, setCurrentPassword] = useState("");  
  const [newPassword, setNewPassword] = useState("");  
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {  
    if (newPassword !== confirmPassword) {  
      alert("Passwords do not match");  
      return;  
    }

    try {  
      const token = localStorage.getItem("token");

      await axios.post(  
        "VITE_API_URL/api/admin-access/change-password",  
        {  
          currentPassword,  
          newPassword,  
        },  
        {  
          headers: {  
            Authorization: `Bearer ${token}`,  
          },  
        },  
      );

      alert("Password updated successfully");

      window.location.href = "/dashboard";  
    } catch (err: any) {  
      console.error(err);

      alert(  
        err.response?.data?.message ||  
          "Failed to update password",  
      );  
    }  
  };

  return (  
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">  
      <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-[#EBE8E2]" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.06)" }}>  
        <h2 className="text-2xl font-bold mb-6 text-[#1C1B22]">  
          Change Password  
        </h2>

        <div className="space-y-4">  
          <input  
            type="password"  
            placeholder="Current Password"  
            value={currentPassword}  
            onChange={(e) =>  
              setCurrentPassword(e.target.value)  
            }  
            className="w-full p-3 rounded-lg border border-[#EBE8E2] bg-[#FAF9F7] text-[#1C1B22] placeholder:text-[#B5B1A8] outline-none focus:border-[#7C6FEF] transition"  
          />

          <input  
            type="password"  
            placeholder="New Password"  
            value={newPassword}  
            onChange={(e) =>  
              setNewPassword(e.target.value)  
            }  
            className="w-full p-3 rounded-lg border border-[#EBE8E2] bg-[#FAF9F7] text-[#1C1B22] placeholder:text-[#B5B1A8] outline-none focus:border-[#7C6FEF] transition"  
          />

          <input  
            type="password"  
            placeholder="Confirm Password"  
            value={confirmPassword}  
            onChange={(e) =>  
              setConfirmPassword(e.target.value)  
            }  
            className="w-full p-3 rounded-lg border border-[#EBE8E2] bg-[#FAF9F7] text-[#1C1B22] placeholder:text-[#B5B1A8] outline-none focus:border-[#7C6FEF] transition"  
          />

          <button  
            onClick={handleChangePassword}  
            className="w-full py-3 rounded-lg bg-[#7C6FEF] text-white hover:bg-[#6C5FE0] transition"  
          >  
            Update Password  
          </button>  
        </div>  
      </div>  
    </div>  
  );  
};

export default ChangePassword;
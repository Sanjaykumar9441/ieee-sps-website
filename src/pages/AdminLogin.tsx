import { useState } from "react";
import axios from "axios";

const AdminLogin = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const res = await axios.post("https://ieee-sps-website.onrender.com/admin/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);

      window.location.href = "/dashboard";

    } catch (err: any) {
  console.log(err.response?.data);
  alert(err.response?.data?.msg || "Login Failed");
}
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">

      <h1 className="text-3xl mb-6">Admin Login</h1>

      <input
        placeholder="Email"
        className="p-2 mb-4 text-black"
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="p-2 mb-4 text-black"
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} className="bg-blue-500 px-4 py-2">
        Login
      </button>

    </div>
  );
};

export default AdminLogin;

import { useState } from "react";
import axios from "axios";
import { Lock, Zap } from "lucide-react";

const AdminLogin = () => {
  const [loginType, setLoginType] = useState("superadmin");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      let res;

      if (loginType === "superadmin") {
        res = await axios.post(
          "https://ieee-sps-website.onrender.com/admin/login",
          {
            email,
            password,
          },
        );

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", "superadmin");
        localStorage.setItem("adminId", res.data.adminId);

        localStorage.setItem(
          "permissions",
          JSON.stringify({
            dashboardOverview: true,
            events: true,
            team: true,
            arduinoRegistrations: true,
            spaceDayRegistrations: true,
            spaceDayAttendance: true,
            membershipRegistrations: true,
            messages: true,
            spsApplications: true,
            admins: true,
          }),
        );

        window.location.href = "/dashboard";
      } else {
        res = await axios.post(
          "https://ieee-sps-website.onrender.com/api/admin-access/login",
          {
            username,
            password,
          },
        );

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", "admin");
        localStorage.setItem("adminId", res.data.adminId);

        localStorage.setItem(
          "permissions",
          JSON.stringify(res.data.permissions),
        );

        localStorage.setItem("isPaused", JSON.stringify(res.data.isPaused));

        if (res.data.mustChangePassword) {
          window.location.href = "/change-password";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err: any) {
      console.log(err.response?.data);

      alert(err.response?.data?.message || "Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#080c14" }}
    >
      {/* Animated background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: "radial-gradient(circle, #3b82f6, transparent)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent)",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #3b82f6, #06b6d4, transparent)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Branding */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              boxShadow: "0 0 32px rgba(59,130,246,0.4)",
            }}
          >
            <Zap size={28} className="text-foreground" />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight text-foreground mb-1"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            IEEE SPS
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Admin Control Panel
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "#0f1624",
            border: "1px solid rgba(99,179,237,0.12)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)",
          }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Welcome back
          </h2>
          <div
            className="flex gap-2 mt-5 mb-6 p-1 rounded-xl"
            style={{
              backgroundColor: "#080c14",
              border: "1px solid rgba(99,179,237,0.12)",
            }}
          >
            <button
              type="button"
              onClick={() => setLoginType("superadmin")}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor:
                  loginType === "superadmin"
                    ? "rgba(59,130,246,0.15)"
                    : "transparent",
                color: loginType === "superadmin" ? "#60a5fa" : "#64748b",
              }}
            >
              Main Admin
            </button>

            <button
              type="button"
              onClick={() => setLoginType("admin")}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor:
                  loginType === "admin"
                    ? "rgba(59,130,246,0.15)"
                    : "transparent",
                color: loginType === "admin" ? "#60a5fa" : "#64748b",
              }}
            >
              Team Admin
            </button>
          </div>
          <p className="text-sm mb-8" style={{ color: "#64748b" }}>
            Sign in to access the dashboard
          </p>

          {loginType === "superadmin" ? (
            <div className="mb-5">
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ieee-sps.org"
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#080c14",
                  border: "1px solid rgba(99,179,237,0.12)",
                  color: "#f0f4ff",
                }}
              />
            </div>
          ) : (
            <div className="mb-5">
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#080c14",
                  border: "1px solid rgba(99,179,237,0.12)",
                  color: "#f0f4ff",
                }}
              />
            </div>
          )}

          {/* Password field */}
          <div className="mb-8">
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-widest"
              style={{ color: "#64748b" }}
            >
              Password
            </label>
            <div className="relative">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "#64748b" }}
              >
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-foreground text-sm outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#080c14",
                  border: "1px solid rgba(99,179,237,0.12)",
                  color: "#f0f4ff",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(59,130,246,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(99,179,237,0.12)";
                  e.target.style.boxShadow = "none";
                }}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {/* Login button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-foreground font-semibold text-sm tracking-wide transition-all duration-200 relative overflow-hidden"
            style={{
              background: isLoading
                ? "rgba(59,130,246,0.4)"
                : "linear-gradient(135deg, #3b82f6, #06b6d4)",
              boxShadow: isLoading ? "none" : "0 0 24px rgba(59,130,246,0.35)",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.target as HTMLButtonElement).style.boxShadow =
                  "0 0 36px rgba(59,130,246,0.55)";
                (e.target as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 0 24px rgba(59,130,246,0.35)";
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
          IEEE Signal Processing Society · Restricted Access
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

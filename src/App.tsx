import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import AllEvents from "./pages/AllEvents";
import TeamDetails from "./pages/TeamDetails";
import ArduinoDays from "./pages/ArduinoDays"; // temporary
import Register from "./pages/Register"; // temporary
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./components/LoadingScreen";
import Scanner from "./pages/Scanner";
function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

        {/* Global Animated Gradient */}
        <div className="fixed inset-0 -z-20 
                        bg-gradient-to-br 
                        from-cyan-500/10 
                        via-blue-500/10 
                        to-purple-500/10 
                        animate-globalGradient" />

        {/* Top Left Glow Blob */}
        <div className="fixed -top-40 -left-40 w-[500px] h-[500px]
                        bg-cyan-500/20 
                        rounded-full blur-[150px]
                        animate-floatSlow 
                        -z-10" />

        {/* Bottom Right Glow Blob */}
        <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px]
                        bg-blue-500/20 
                        rounded-full blur-[150px]
                        animate-floatSlow delay-1000
                        -z-10" />

        {/* Main Content */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/all-events" element={<AllEvents />} />
            <Route path="/team/:id" element={<TeamDetails />} />
            <Route path="/arduino-days" element={<ArduinoDays />} />
            <Route path="/register" element={<Register />} />
            <Route path="/scan" element={<Scanner />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;
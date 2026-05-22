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
function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

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
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;
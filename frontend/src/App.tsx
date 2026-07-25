import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import AllEvents from "./pages/AllEvents";
import AllMembers from "./pages/AllMembers";
import TeamDetails from "./pages/TeamDetails";
import ArduinoDays from "./pages/ArduinoDays";
import MembershipDrive from "./pages/MembershipDrive";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./components/LoadingScreen";
import ChangePassword from "./pages/ChangePassword";
import JoinSPS from "./pages/JoinSPS";
import SpaceDay from "./pages/SpaceDay";
import ScrollToTop from "./components/ScrollToTop";
import SpaceDayRegistration from "./pages/SpaceDayRegistration";
import RegistrationSuccess from "./pages/RegistrationSuccess";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800); // 1.8 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <div className="relative min-h-screen bg-white text-slate-900">

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
            <Route path="/membership-drive" element={<MembershipDrive />} />
            <Route path="/all-members" element={<AllMembers />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/join-sps" element={<JoinSPS />} />
            <Route path="/space-day" element={<SpaceDay />} />
            <Route path="/space-day/register" element={<SpaceDayRegistration />} />
            <Route path="/space-day/registration-success" element={<RegistrationSuccess />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;
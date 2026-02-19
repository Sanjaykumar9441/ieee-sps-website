import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import AllEvents from "./pages/AllEvents";
import TeamDetails from "./pages/TeamDetails";



function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/All events" element={<AllEvents />} />
        <Route path="/team/:id" element={<TeamDetails />} />

 


      </Routes>
    </Router>
  );
}

export default App;

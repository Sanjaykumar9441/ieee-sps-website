import { useEffect, useState } from "react";
import axios from "axios";

export default function SpaceDayRegistrationsTab() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/space-day/registrations`
      );

      setRegistrations(res.data.registrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        Loading registrations...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        National Space Day Registrations
      </h1>

      <p className="text-slate-500">
        Total Registrations: {registrations.length}
      </p>

    </div>
  );
}
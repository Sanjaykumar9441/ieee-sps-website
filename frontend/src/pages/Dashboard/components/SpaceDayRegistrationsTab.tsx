import { useEffect, useState } from "react";

export default function SpaceDayRegistrationsTab() {
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {};

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        National Space Day Registrations
      </h1>

    </div>
  );
}
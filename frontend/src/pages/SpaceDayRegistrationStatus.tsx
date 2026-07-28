import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRegistrationStatus } from "../services/spaceDayRegistrationService";

export default function RegistrationStatus() {
  const { registrationId } = useParams();

  const [loading, setLoading] = useState(true);

  const [registration, setRegistration] = useState<any>(null);

  useEffect(() => {
    const loadRegistration = async () => {
      try {
        const data = await getRegistrationStatus(
          registrationId!
        );

        setRegistration(data.registration);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRegistration();
  }, [registrationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Registration not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow p-8">

        <h1 className="text-3xl font-bold mb-8">
          Registration Status
        </h1>

        <div className="space-y-4">

          <p>
            <strong>Registration ID:</strong>{" "}
            {registration.registrationId}
          </p>

          <p>
            <strong>Event:</strong>{" "}
            {registration.eventType}
          </p>

          <p>
            <strong>Payment:</strong>{" "}
            {registration.paymentStatus}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {registration.status}
          </p>

        </div>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold mb-4">
          Participants
        </h2>

        <div className="space-y-4">

          {registration.members.map(
            (member: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border p-4"
              >
                <h3 className="font-semibold">
                  {member.fullName}
                </h3>

                <p>{member.rollNumber}</p>

                <p>
                  Attendance:{" "}
                  {member.attendance?.present
                    ? "Present"
                    : "Absent"}
                </p>
              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}
import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

interface Props {
  registration: SpaceDayRegistration;
}

const eventNames: Record<string, string> = {
  astroquiz: "Astro Quiz",
  astrodesign: "AI Astro Design",
  astromodeler: "Astro Modeler",
};

export default function OverviewTab({ registration }: Props) {
  const overview = [
    {
      label: "Registration ID",
      value: registration.registrationId,
    },
    {
      label: "Event",
      value: eventNames[registration.eventType],
    },
    {
      label: "Registration Type",
      value:
        registration.registrationType === "team"
          ? "Team"
          : "Individual",
    },
    {
      label: "Participant / Team",
      value:
        registration.registrationType === "team"
          ? registration.teamName
          : registration.members[0].fullName,
    },
    {
      label: "Payment Status",
      value: registration.paymentStatus,
    },
    {
      label: "Registration Status",
      value: registration.status,
    },
    {
      label: "Total Fee",
      value: `₹${registration.totalFee}`,
    },
    {
      label: "Created At",
      value: new Date(
        registration.createdAt
      ).toLocaleString(),
    },
    {
      label: "Last Updated",
      value: new Date(
        registration.updatedAt
      ).toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {overview.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border bg-slate-50 p-5"
        >
          <p className="text-sm text-slate-500">
            {item.label}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {item.value || "-"}
          </h3>
        </div>
      ))}

      {registration.selectedTheme && (
        <div className="rounded-2xl border bg-orange-50 border-orange-200 p-5 md:col-span-2">
          <p className="text-sm text-orange-600">
            Selected Prototype Theme
          </p>

          <h3 className="mt-2 text-xl font-bold text-orange-700">
            {registration.selectedTheme}
          </h3>
        </div>
      )}

    </div>
  );
}
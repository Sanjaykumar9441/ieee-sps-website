import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";
import { astroModelerThemes } from "../../../../components/spaceDay/registration/data/themeConfig";

interface Props {
  registration: SpaceDayRegistration;
}

const eventNames: Record<string, string> = {
  astroquiz: "Astro Quiz",
  astrodesign: "AI Astro Design",
  astromodeler: "Astro Modeler",
};

export default function OverviewTab({ registration }: Props) {
  const selectedTheme = astroModelerThemes.find(
    (theme) => theme.id === registration.selectedTheme,
  );

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
      value: registration.registrationType === "team" ? "Team" : "Individual",
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
      value: new Date(registration.createdAt).toLocaleString(),
    },
    {
      label: "Last Updated",
      value: new Date(registration.updatedAt).toLocaleString(),
    },
    {
      label: "Selected Prototype Theme",
      value:
        registration.eventType === "astromodeler"
          ? selectedTheme?.title || "-"
          : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {overview
        .filter((item) => item.value !== null)
        .map((item) => (
          <div key={item.label} className="rounded-2xl border bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{item.label}</p>

            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {item.value || "-"}
            </h3>
          </div>
        ))}
    </div>
  );
}

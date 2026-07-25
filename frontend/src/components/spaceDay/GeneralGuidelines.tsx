import {
  AlertCircle,
  Award,
  BedDouble,
  Clock3,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const guidelines = [
  {
    icon: GraduationCap,
    title: "College ID Required",
    description:
      "Every participant must carry a valid College ID card during reporting and verification.",
  },
  {
    icon: Clock3,
    title: "Reporting Time",
    description:
      "Participants must report at the venue at least 30 minutes before the scheduled event.",
  },
  {
    icon: ShieldCheck,
    title: "Registration Rules",
    description:
      "Registration fee is non-refundable. The organizing committee reserves the right to modify schedules if necessary.",
  },
  {
    icon: BedDouble,
    title: "Accommodation",
    description:
      "Hostel accommodation is available at ₹150 per student per day including Breakfast, Lunch and Dinner.",
  },
  {
    icon: Award,
    title: "Certificates & Prizes",
    description:
      "Participation certificates will be issued to all registered participants. Winners and runners-up will receive prizes and certificates.",
  },
  {
    icon: AlertCircle,
    title: "Code of Conduct",
    description:
      "Participants are expected to maintain discipline throughout the event. The judges' decision will be final and binding.",
  },
];

const GeneralGuidelines = () => {
  const navigate = useNavigate();

  return (
    <section className="mt-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <div className="text-center">
          <span className="rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-700">
            General Guidelines
          </span>

          <h2 className="mt-5 text-3xl font-bold text-slate-900">
            Important Information for Participants
          </h2>

          <p className="mt-3 max-w-3xl mx-auto text-slate-600">
            Please read these guidelines carefully before completing your
            registration.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guidelines.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Register CTA */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
          <h3 className="text-3xl font-bold">
            Ready to Join National Space Day?
          </h3>

          <p className="mt-3 text-blue-100">
            Explore, innovate, compete, and celebrate the spirit of space
            technology with us.
          </p>

          <button
            onClick={() => navigate("/space-day/register")}
            className="mt-8 rounded-xl bg-white px-8 py-3 text-base font-semibold text-blue-700 transition hover:scale-105"
          >
            Register Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default GeneralGuidelines;
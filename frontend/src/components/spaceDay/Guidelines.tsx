import { guidelinesData } from "./registration/data/guidelinesData";
import EventGuidelineCard from "./EventGuidelineCard";
import GeneralGuidelines from "./GeneralGuidelines";

const Guidelines = () => {
  return (
    <section
      id="guidelines"
      className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-100"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
            Event Guidelines
          </span>

          <h2 className="mt-5 text-4xl md:text-5xl font-extrabold text-slate-900">
            Know Your Event Before You Register
          </h2>

          <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
            Explore the three exciting competitions of National Space Day and
            find the one that matches your passion for space, innovation, and
            creativity.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {guidelinesData.map((event) => (
            <EventGuidelineCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
        <GeneralGuidelines />
      </div>
    </section>
  );
};

export default Guidelines;
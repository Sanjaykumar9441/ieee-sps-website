import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "General",
    questions: [
      {
        q: "What is National Space Day 2026?",
        a: "National Space Day 2026 is an IEEE SPS Student Branch Chapter initiative at Aditya University featuring space-themed competitions that promote innovation, creativity, and technical excellence.",
      },
      {
        q: "Who can participate?",
        a: "Students from any recognized college or university are eligible to participate.",
      },
      {
        q: "What competitions are conducted?",
        a: "AstroQuiz Competition, AI Astro-Design Competition, and Astro-Modeler Competition.",
      },
      {
        q: "Is there any registration fee?",
        a: "Yes. Registration fees depend on the selected competition and are shown during registration.",
      },
      {
        q: "Can I register for more than one competition?",
        a: "Yes, provided the competition schedules do not overlap.",
      },
      {
        q: "How will I know if my registration is successful?",
        a: "You will receive a Registration ID, can download your acknowledgement, and will receive a confirmation email.",
      },
      {
        q: "Is AstroQuiz an individual event?",
        a: "Yes. AstroQuiz is an individual competition.",
      },
      {
        q: "Is AI Astro-Design an individual or team competition?",
        a: "AI Astro-Design is a team competition. Participants may use AI image generation tools while ensuring originality and following the competition rules.",
      },
      {
        q: "Will all participants receive certificates?",
        a: "Yes. Every eligible participant will receive a participation certificate. Winners and runners-up will also receive prizes and certificates.",
      },
      {
        q: "Where is the event conducted?",
        a: "The event is conducted at Aditya University, Surampalem, Andhra Pradesh.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-white py-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>

          <p className="mt-4 text-slate-600">
            Find answers to the most commonly asked questions about National
            Space Day 2026.
          </p>
        </motion.div>

        <Accordion type="multiple" className="space-y-6">
          {faqSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              className="rounded-2xl border bg-white shadow-sm"
            >
              <div className="border-b bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-blue-700">
                  {section.title}
                </h3>
              </div>

              <div className="px-6 py-2">
                {section.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${sectionIndex}-${index}`}
                  >
                    <AccordionTrigger className="text-left font-medium">
                      {item.q}
                    </AccordionTrigger>

                    <AccordionContent className="text-slate-600 leading-7">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

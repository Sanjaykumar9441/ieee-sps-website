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
        q: "What competitions are conducted?",
        a: "AstroQuiz Competition, AI Astro-Design Competition, and Astro-Modeler Competition.",
      },
      {
        q: "Who can participate?",
        a: "Students from any recognized college or university are eligible to participate.",
      },
      {
        q: "Can students from other colleges participate?",
        a: "Yes. Students from all colleges are welcome.",
      },
      {
        q: "Is there any registration fee?",
        a: "Yes. Registration fees depend on the selected competition and are shown during registration.",
      },
    ],
  },

  {
    title: "Registration",
    questions: [
      {
        q: "Can I register for more than one competition?",
        a: "Yes, provided the competition schedules do not overlap.",
      },
      {
        q: "Can I edit my registration after submission?",
        a: "No. Please verify all information carefully before submitting the registration form.",
      },
      {
        q: "How will I know if my registration is successful?",
        a: "You will receive a Registration ID, can download your acknowledgement, and will receive a confirmation email.",
      },
      {
        q: "What if my payment verification is pending?",
        a: "Your registration is safe. The organizing team will verify your payment shortly.",
      },
      {
        q: "What payment methods are accepted?",
        a: "Payments can be made only through the official QR code or bank details provided during registration.",
      },
    ],
  },

  {
    title: "AstroQuiz Competition",
    questions: [
      {
        q: "Is AstroQuiz an individual event?",
        a: "Yes. AstroQuiz is an individual competition.",
      },
      {
        q: "Will there be negative marking?",
        a: "No, unless announced otherwise by the organizers.",
      },
      {
        q: "Can I use my mobile phone during the quiz?",
        a: "No. Unauthorized assistance may lead to disqualification.",
      },
    ],
  },

  {
    title: "AI Astro-Design Competition",
    questions: [
      {
        q: "Is this an individual or team competition?",
        a: "AI Astro-Design is a team competition.",
      },
      {
        q: "Can AI tools be used?",
        a: "Yes. Participants may use AI image generation tools while ensuring originality and following the competition rules.",
      },
    ],
  },

  {
    title: "Astro-Modeler Competition",
    questions: [
      {
        q: "What type of models are allowed?",
        a: "Physical or conceptual models related to space science, rockets, satellites, astronomy, or aerospace technologies.",
      },
      {
        q: "Can we bring pre-built models?",
        a: "Yes, unless the event guidelines specify an on-site model-building round.",
      },
    ],
  },

  {
    title: "Accommodation",
    questions: [
      {
        q: "Is accommodation available?",
        a: "Yes. Accommodation can be requested during registration.",
      },
      {
        q: "Is accommodation free?",
        a: "Please refer to the registration page for accommodation details and applicable charges.",
      },
    ],
  },

  {
    title: "Certificates & Prizes",
    questions: [
      {
        q: "Will all participants receive certificates?",
        a: "Yes. Every eligible participant will receive a participation certificate.",
      },
      {
        q: "Are prizes provided?",
        a: "Yes. Winners and runners-up of each competition will receive prizes and certificates.",
      },
    ],
  },

  {
    title: "Event Day",
    questions: [
      {
        q: "What should I bring?",
        a: "Carry your College ID Card, Registration Acknowledgement, Payment Proof (if required), and any materials needed for your competition.",
      },
      {
        q: "When should I report?",
        a: "Participants should report at least 30 minutes before their scheduled event.",
      },
      {
        q: "Where is the event conducted?",
        a: "Aditya University, Surampalem, Andhra Pradesh.",
      },
    ],
  },

  {
    title: "Support",
    questions: [
      {
        q: "How can I contact the organizers?",
        a: "Visit the Help Desk section on the website or contact the coordinators using the provided phone numbers or email.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      className="bg-white py-20"
    >
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

        <Accordion
          type="multiple"
          className="space-y-6"
        >
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
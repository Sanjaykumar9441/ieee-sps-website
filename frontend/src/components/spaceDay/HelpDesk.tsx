import { motion } from "framer-motion";
import {
  studentCoordinators,
  facultyCoordinators,
} from "./helpDeskData";

export default function HelpDesk() {
  return (
    <section id="help" className="py-28 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.25em] text-[#00629B] font-semibold">
            Help Desk
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            Need Assistance?
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            For any queries regarding registration, participation, or the
            event, feel free to contact our student coordinators or faculty
            advisor.
          </p>
        </motion.div>

        {/* Student Coordinators */}

        <div className="mt-20 mb-20">
          <h3 className="text-2xl font-bold text-center text-slate-900 mb-10">
            Student Coordinators
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentCoordinators.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="bg-white border border-slate-200 rounded-3xl p-7 text-center shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-[#00629B] text-white flex items-center justify-center mx-auto text-2xl font-bold">
                  {member.name.charAt(0)}
                </div>

                <h4 className="mt-5 text-xl font-bold text-slate-900">
                  {member.name}
                </h4>

                <p className="mt-2 text-[#00629B] font-medium">
                  {member.designation}
                </p>

                <p className="mt-1 text-slate-500 text-sm">
                  {member.department}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Faculty */}

        <div>
          <h3 className="text-2xl font-bold text-center text-slate-900 mb-10">
            Faculty Advisor
          </h3>

          <div className="flex justify-center">
            {facultyCoordinators.map((faculty) => (
              <motion.div
                key={faculty.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm"
              >
                <div className="w-20 h-20 rounded-full bg-[#00629B] text-white flex items-center justify-center mx-auto text-3xl font-bold">
                  {faculty.name.charAt(0)}
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-900">
                  {faculty.name}
                </h3>

                <p className="mt-2 text-[#00629B] font-medium">
                  {faculty.designation}
                </p>

                <p className="mt-1 text-slate-500">
                  {faculty.department}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
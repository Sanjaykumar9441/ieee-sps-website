import { motion } from "framer-motion";  
import type { CSSProperties } from "react";  
import type { LucideIcon } from "lucide-react";  
import {  
  Calendar,  
  Users,  
  MessageSquare,  
  FileText,  
  UserPlus,  
  ShieldCheck,  
  Crown,  
  Star,  
} from "lucide-react";

interface EventItem {  
  status?: string;  
  [key: string]: any;  
}

interface MemberItem {  
  role?: string;  
  name?: string;  
  department?: string;  
  year?: string;  
  [key: string]: any;  
}

interface RegistrationItem {  
  event?: string;  
  [key: string]: any;  
}

interface DashboardOverviewTabProps {  
  cardStyle: CSSProperties;  
  events: EventItem[];  
  members: MemberItem[];  
  membershipRegistrations: unknown[];  
  spsApplications: unknown[];  
  messages: unknown[];  
  admins: unknown[];  
  setActiveTab: (tab: string) => void;  
}

/** Capacity constants — these are manual caps, not derived from data. Adjust as needed. */  
const MEMBERSHIP_LIMIT = 100;

const ARDUINO_STATS = {  
  eventName: "Arduino Days 2026",  
  registrations: 50,  
  maxRegistrations: 49,  
  revenue: 30600,  
  confirmedTeams: 49,  
};

const initials = (name?: string) =>  
  name  
    ? name  
        .split(" ")  
        .filter(Boolean)  
        .map((p) => p[0])  
        .join("")  
        .slice(0, 2)  
        .toUpperCase()  
    : "—";

const StatCard = ({  
  title,  
  value,  
  color,  
  icon: Icon,  
  cardStyle,  
  delay = 0,  
}: {  
  title: string;  
  value: number;  
  color: string;  
  icon: LucideIcon;  
  cardStyle: CSSProperties;  
  delay?: number;  
}) => (  
  <motion.div  
    initial={{ opacity: 0, y: 12 }}  
    animate={{ opacity: 1, y: 0 }}  
    transition={{ duration: 0.4, delay }}  
    className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"  
    style={cardStyle}  
  >  
    <div className="flex items-center justify-between">  
      <p className="text-sm text-[#8A8578]">{title}</p>  
      <Icon size={18} color={color} />  
    </div>  
    <h2 className="text-3xl font-bold mt-3" style={{ color }}>  
      {value}  
    </h2>  
  </motion.div>  
);

const RoleChip = ({ name, subtitle }: { name?: string; subtitle?: string }) => (  
  <div className="flex items-center gap-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-full pl-1 pr-3 py-1">  
    <span className="w-6 h-6 rounded-full bg-[#EFEBFF] text-[10px] font-semibold text-[#6C5FE0] flex items-center justify-center">  
      {initials(name)}  
    </span>  
    <span className="text-xs text-slate-200">{name || "Unassigned"}</span>  
    {subtitle && <span className="text-[10px] text-[#B5B1A8]">· {subtitle}</span>}  
  </div>  
);

const DashboardOverviewTab = ({  
  cardStyle,  
  events,  
  members,  
  membershipRegistrations,  
  spsApplications,  
  messages,  
  admins,  
  setActiveTab,  
}: DashboardOverviewTabProps) => {  
  const membershipPercentage = Math.min(  
    (membershipRegistrations.length / MEMBERSHIP_LIMIT) * 100,  
    100  
  );

  const arduinoRegistrations = ARDUINO_STATS.registrations;  
  const arduinoPercentage = Math.min(  
  (arduinoRegistrations / ARDUINO_STATS.maxRegistrations) * 100,  
  100  
);

  const upcomingEvents = events.filter((event) => event.status === "Upcoming").length;  
  const completedEvents = events.filter((event) => event.status === "Completed").length;

  const chair = members.find((member) => member.role === "Chair");  
  const viceChairs = members.filter((member) => member.role === "Vice Chair");  
  const secretaries = members.filter((member) => member.role === "Secretary");  
  const treasurers = members.filter((member) => member.role === "Treasurer");  
  const webmasters = members.filter((member) => member.role === "Webmaster");  
  const executiveMembers = members.filter((member) => member.role === "Executive Member");

  const chairSubtitle = [chair?.department, chair?.year].filter(Boolean).join(" • ");

  const leadershipGroups = [  
    { label: "Vice Chairs", list: viceChairs },  
    { label: "Secretaries", list: secretaries },  
    { label: "Treasurers", list: treasurers },  
    { label: "Webmasters", list: webmasters },  
  ].filter((group) => group.list.length > 0);

  return (  
    <motion.div  
      initial={{ opacity: 0, y: 15 }}  
      animate={{ opacity: 1, y: 0 }}  
      className="space-y-8"  
    >  
      {/* HEADER */}  
      <div className="rounded-2xl p-6" style={cardStyle}>  
        <h1 className="text-3xl font-bold text-[#1C1B22]">Dashboard Overview</h1>  
        <p className="text-[#8A8578] mt-2">  
          Welcome to IEEE SPS Student Branch Chapter Admin Dashboard.  
        </p>  
      </div>

      {/* STATISTICS */}  
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5">  
        <StatCard title="Events" value={events.length} color="#3B82F6" icon={Calendar} cardStyle={cardStyle} delay={0} />  
        <StatCard title="Team Members" value={members.length} color="#10B981" icon={Users} cardStyle={cardStyle} delay={0.05} />  
        <StatCard title="Messages" value={messages.length} color="#F59E0B" icon={MessageSquare} cardStyle={cardStyle} delay={0.1} />  
        <StatCard title="SPS Applications" value={spsApplications.length} color="#EF4444" icon={FileText} cardStyle={cardStyle} delay={0.15} />  
        <StatCard title="Membership Drive" value={membershipRegistrations.length} color="#8B5CF6" icon={UserPlus} cardStyle={cardStyle} delay={0.2} />  
        <StatCard title="Admins" value={admins.length} color="#06B6D4" icon={ShieldCheck} cardStyle={cardStyle} delay={0.25} />  
      </div>

      {/* REGISTRATION ANALYTICS */}  
      <div className="rounded-2xl p-6" style={cardStyle}>  
        <h2 className="text-2xl font-bold text-[#1C1B22]">Registration Analytics</h2>  
        <p className="text-[#8A8578] mt-2">Registration progress of IEEE SPS events.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">  
          <div className="rounded-2xl bg-[#FAF9F7] border border-[#EBE8E2] p-6">  
            <div className="flex items-center justify-between">  
              <h3 className="text-lg font-semibold text-[#1C1B22]">{ARDUINO_STATS.eventName}</h3>  
              <span className="text-blue-400 font-semibold">{arduinoPercentage.toFixed(0)}%</span>  
            </div>

            <div className="w-full h-3 bg-[#EBE8E2] rounded-full mt-5 overflow-hidden">  
              <div  
                className="h-full rounded-full bg-blue-500 transition-all duration-700"  
                style={{ width: `${arduinoPercentage}%` }}  
              />  
            </div>

            <div className="flex justify-between mt-4 text-sm text-[#8A8578]">  
              <span>{arduinoRegistrations} Registered</span>  
              <span>Max {ARDUINO_STATS.maxRegistrations}</span>  
            </div>  
          </div>

          <div className="rounded-2xl bg-[#FAF9F7] border border-[#EBE8E2] p-6">  
            <div className="flex items-center justify-between">  
              <h3 className="text-lg font-semibold text-[#1C1B22]">Membership Drive</h3>  
              <span className="text-violet-400 font-semibold">{membershipPercentage.toFixed(0)}%</span>  
            </div>

            <div className="w-full h-3 bg-[#EBE8E2] rounded-full mt-5 overflow-hidden">  
              <div  
                className="h-full rounded-full bg-violet-500 transition-all duration-700"  
                style={{ width: `${membershipPercentage}%` }}  
              />  
            </div>

            <div className="flex justify-between mt-4 text-sm text-[#8A8578]">  
              <span>{membershipRegistrations.length} Registered</span>  
              <span>Max {MEMBERSHIP_LIMIT}</span>  
            </div>  
          </div>  
        </div>  
      </div>

      {/* EVENTS ANALYTICS */}  
      <div className="rounded-2xl p-6" style={cardStyle}>  
        <h2 className="text-2xl font-bold text-[#1C1B22]">Event Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">  
          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Total Events</p>  
            <h3 className="text-3xl font-bold text-blue-400 mt-2">{events.length}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Upcoming Events</p>  
            <h3 className="text-3xl font-bold text-emerald-400 mt-2">{upcomingEvents}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Completed Events</p>  
            <h3 className="text-3xl font-bold text-orange-400 mt-2">{completedEvents}</h3>  
          </div>  
        </div>  
      </div>

      {/* TEAM OVERVIEW */}  
      <div className="rounded-2xl p-6" style={cardStyle}>  
        <h2 className="text-2xl font-bold text-[#1C1B22]">Team Overview</h2>  
        <p className="text-[#8A8578] mt-2">Committee member distribution by role.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">  
          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Total Members</p>  
            <h3 className="text-3xl font-bold text-blue-400 mt-2">{members.length}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Chair</p>  
            <h3 className="text-3xl font-bold text-emerald-400 mt-2">{chair ? 1 : 0}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Vice Chair</p>  
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">{viceChairs.length}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Secretary</p>  
            <h3 className="text-3xl font-bold text-yellow-400 mt-2">{secretaries.length}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Treasurer</p>  
            <h3 className="text-3xl font-bold text-pink-400 mt-2">{treasurers.length}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5">  
            <p className="text-[#8A8578] text-sm">Webmaster</p>  
            <h3 className="text-3xl font-bold text-violet-400 mt-2">{webmasters.length}</h3>  
          </div>

          <div className="rounded-xl bg-[#FAF9F7] border border-[#EBE8E2] p-5 md:col-span-2 lg:col-span-3">  
            <p className="text-[#8A8578] text-sm">Executive Members</p>  
            <h3 className="text-3xl font-bold text-orange-400 mt-2">{executiveMembers.length}</h3>  
          </div>  
        </div>

        {/* Chair spotlight */}  
        <div className="flex items-center justify-between py-4 mt-6 border-t border-[#EBE8E2]">  
          <div className="flex items-center gap-3">  
            <span className="w-10 h-10 rounded-full bg-[#EFEBFF] text-sm font-semibold text-[#6C5FE0] flex items-center justify-center">  
              {initials(chair?.name)}  
            </span>  
            <div>  
              <p className="font-semibold text-[#1C1B22]">{chair?.name || "Not assigned"}</p>  
              <p className="text-sm text-[#8A8578]">{chairSubtitle || "—"}</p>  
            </div>  
          </div>  
          <span className="flex items-center gap-1 text-blue-400 font-medium text-sm">  
            <Crown size={14} /> Chair  
          </span>  
        </div>

        {/* Leadership chips — actual names, previously computed but never shown */}  
        {leadershipGroups.length > 0 && (  
          <div className="mt-4 flex flex-col gap-4">  
            {leadershipGroups.map((group) => (  
              <div key={group.label}>  
                <p className="text-xs uppercase tracking-wide text-[#B5B1A8] mb-2">  
                  {group.label}  
                </p>  
                <div className="flex flex-wrap gap-2">  
                  {group.list.map((m, i) => (  
                    <RoleChip  
                      key={i}  
                      name={m.name}  
                      subtitle={[m.department, m.year].filter(Boolean).join(" • ")}  
                    />  
                  ))}  
                </div>  
              </div>  
            ))}  
          </div>  
        )}

        <div className="mt-6 flex items-center justify-between">  
          <p className="text-[#8A8578] flex items-center gap-1.5">  
            <Star size={14} /> Executive Members  
          </p>  
          <span className="font-semibold text-[#1C1B22]">{executiveMembers.length}</span>  
        </div>

        <button  
          type="button"  
          onClick={() => setActiveTab("team")}  
          className="mt-4 text-blue-400 hover:text-blue-300 font-medium"  
        >  
          View All Team Members →  
        </button>  
      </div>  
    </motion.div>  
  );  
};

export default DashboardOverviewTab;
import { useEffect, useState } from "react";
import axios from "axios";
import SpaceDayRegistrationDetailsModal from "./SpaceDayRegistrationDetailsModal";
import { eventThemes } from "@/components/spaceDay/registration/eventTheme";
import {
  Member,
  SpaceDayRegistration,
} from "@/components/spaceDay/registration/types";
import {
  departments,
  colleges,
  years,
} from "../../../components/spaceDay/registration/data/formOptions";
import {
  updatePaymentStatus,
  exportRegistrations,
} from "../../../api/spaceDayAdmin";
import toast from "react-hot-toast";
import { Eye, CheckCircle, XCircle, Download, User, Users } from "lucide-react";

export default function SpaceDayRegistrationsTab() {
  const [registrations, setRegistrations] = useState<SpaceDayRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedRegistration, setSelectedRegistration] =
    useState<SpaceDayRegistration | null>(null);
  const stats = {
    total: registrations.length,

    pending: registrations.filter((r) => r.paymentStatus === "Pending").length,

    verified: registrations.filter((r) => r.paymentStatus === "Verified")
      .length,

    rejected: registrations.filter((r) => r.paymentStatus === "Rejected")
      .length,

    revenue: registrations
      .filter((r: any) => r.paymentStatus === "Verified")
      .reduce((sum: number, r: any) => sum + r.totalFee, 0),
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await axios.get<{
        success: boolean;
        registrations: SpaceDayRegistration[];
      }>(`${import.meta.env.VITE_API_URL}/api/space-day/registrations`);

      setRegistrations(res.data.registrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatus = async (
    registrationId: string,
    paymentStatus: "Verified" | "Rejected",
  ) => {
    try {
      await updatePaymentStatus(registrationId, paymentStatus);

      toast.success(`Payment ${paymentStatus}`);

      fetchRegistrations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const downloadExcel = async () => {
    try {
      const blob = await exportRegistrations();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "SpaceDay_Registrations.xlsx";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to download Excel.");
    }
  };

  const filteredRegistrations = registrations.filter((registration) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      registration.registrationId.toLowerCase().includes(keyword) ||
      registration.transactionId.toLowerCase().includes(keyword) ||
      registration.teamName?.toLowerCase().includes(keyword) ||
      registration.members.some(
        (member: Member) =>
          member.fullName.toLowerCase().includes(keyword) ||
          member.rollNumber.toLowerCase().includes(keyword),
      );

    const matchesCollege =
      collegeFilter === "all" ||
      registration.members.some(
        (member: Member) => member.college === collegeFilter,
      );

    const matchesDepartment =
      departmentFilter === "all" ||
      registration.members.some(
        (member: Member) => member.department === departmentFilter,
      );

    const matchesYear =
      yearFilter === "all" ||
      registration.members.some((member: Member) => member.year === yearFilter);

    const matchesEvent =
      eventFilter === "all" || registration.eventType === eventFilter;

    const matchesPayment =
      paymentFilter === "all" || registration.paymentStatus === paymentFilter;

    return (
      matchesSearch &&
      matchesEvent &&
      matchesPayment &&
      matchesCollege &&
      matchesDepartment &&
      matchesYear
    );
  });

  if (loading) {
    return <div className="p-8 text-center">Loading registrations...</div>;
  }

  const eventNames = {
    astroquiz: "Astro Quiz",
    astrodesign: "AI Astro Design",
    astromodeler: "Astro Modeler",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">National Space Day Registrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="rounded-2xl bg-white shadow-sm border p-6">
          <p className="text-slate-500 text-sm">Total Registrations</p>

          <h2 className="mt-2 text-3xl font-bold">{stats.total}</h2>
        </div>

        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-6">
          <p className="text-yellow-700 text-sm">Pending</p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-700">
            {stats.pending}
          </h2>
        </div>

        <div className="rounded-2xl bg-green-50 border border-green-200 p-6">
          <p className="text-green-700 text-sm">Verified</p>

          <h2 className="mt-2 text-3xl font-bold text-green-700">
            {stats.verified}
          </h2>
        </div>

        <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
          <p className="text-red-700 text-sm">Rejected</p>

          <h2 className="mt-2 text-3xl font-bold text-red-700">
            {stats.rejected}
          </h2>
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <p className="text-blue-700 text-sm">Revenue</p>

          <h2 className="mt-2 text-3xl font-bold text-blue-700">
            ₹{stats.revenue}
          </h2>
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <input
          type="text"
          placeholder="Search Registration ID, Name, Team, Roll Number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full lg:w-96 rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-3">
          {/* Event */}

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-lg border px-4 py-2"
          >
            <option value="all">All Events</option>
            <option value="astroquiz">Astro Quiz</option>
            <option value="astrodesign">AI Astro Design</option>
            <option value="astromodeler">Astro Modeler</option>
          </select>

          {/* Payment */}

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border px-4 py-2"
          >
            <option value="all">All Payments</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Department */}

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border px-4 py-2"
          >
            <option value="all">All Departments</option>

            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          {/* College */}

          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="rounded-lg border px-4 py-2"
          >
            <option value="all">All Colleges</option>

            {colleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>

          {/* Year */}

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border px-4 py-2"
          >
            <option value="all">All Years</option>

            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={downloadExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Registrations</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left">Registration ID</th>

                <th className="px-6 py-4 text-left">Event</th>

                <th className="px-6 py-4 text-center">Type</th>

                <th className="px-6 py-4 text-left">Participant / Team</th>

                <th className="px-6 py-4 text-left">Payment</th>

                <th className="px-6 py-4 text-left">Fee</th>

                <th className="px-6 py-4 text-left">Registered On</th>

                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRegistrations.map((registration) => {
                const theme = eventThemes[registration.eventType];

                return (
                  <tr
                    key={registration._id}
                    className="border-b hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-5 font-semibold">
                      {registration.registrationId}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold
      ${theme.light}
      ${theme.text}`}
                      >
                        {eventNames[registration.eventType]}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      {registration.registrationType === "individual" ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                          <User size={14} />
                          Individual
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                          <Users size={14} />
                          Team
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {registration.registrationType === "individual"
                        ? registration.members[0].fullName
                        : registration.teamName}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold
    ${
      registration.paymentStatus === "Verified"
        ? "bg-green-100 text-green-700"
        : registration.paymentStatus === "Rejected"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700"
    }`}
                      >
                        {registration.paymentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      ₹{registration.totalFee}
                    </td>

                    <td className="px-6 py-5">
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}

                        <button
                          onClick={() => setSelectedRegistration(registration)}
                          className="rounded-lg border p-2 hover:bg-slate-100"
                          title="View Registration"
                        >
                          <Eye size={18} />
                        </button>

                        {/* Verify */}

                        {registration.paymentStatus === "Pending" && (
                          <button
                            onClick={() =>
                              handlePaymentStatus(
                                registration.registrationId,
                                "Verified",
                              )
                            }
                            className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                            title="Verify Payment"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}

                        {/* Reject */}

                        {registration.paymentStatus === "Pending" && (
                          <button
                            onClick={() =>
                              handlePaymentStatus(
                                registration.registrationId,
                                "Rejected",
                              )
                            }
                            className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                            title="Reject Payment"
                          >
                            <XCircle size={18} />
                          </button>
                        )}

                        {/* Download */}

                        {registration.paymentStatus === "Verified" && (
                          <button
                            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                            title="Download Acknowledgement"
                          >
                            <Download size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedRegistration && (
        <SpaceDayRegistrationDetailsModal
          registration={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          onStatusChanged={fetchRegistrations}
        />
      )}
    </div>
  );
}

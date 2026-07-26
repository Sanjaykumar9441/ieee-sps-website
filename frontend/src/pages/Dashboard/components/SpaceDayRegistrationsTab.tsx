import { useEffect, useState } from "react";
import axios from "axios";
import SpaceDayRegistrationDetailsModal from "./SpaceDayRegistrationDetailsModal";
import {
  Member,
  SpaceDayRegistration,
} from "@/components/spaceDay/registration/types";

export default function SpaceDayRegistrationsTab() {
  const [registrations, setRegistrations] = useState<SpaceDayRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
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

  const filteredRegistrations = registrations.filter((registration) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      registration.registrationId.toLowerCase().includes(keyword) ||
      registration.teamName?.toLowerCase().includes(keyword) ||
      registration.members.some(
        (member: Member) =>
          member.fullName.toLowerCase().includes(keyword) ||
          member.rollNumber.toLowerCase().includes(keyword),
      );

    const matchesEvent =
      eventFilter === "all" || registration.eventType === eventFilter;

    const matchesPayment =
      paymentFilter === "all" || registration.paymentStatus === paymentFilter;

    return matchesSearch && matchesEvent && matchesPayment;
  });

  if (loading) {
    return <div className="p-8 text-center">Loading registrations...</div>;
  }

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

        <div className="flex gap-3">
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

                <th className="px-6 py-4 text-left">Participant / Team</th>

                <th className="px-6 py-4 text-left">Payment</th>

                <th className="px-6 py-4 text-left">Fee</th>

                <th className="px-6 py-4 text-left">Registered On</th>

                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRegistrations.map((registration) => (
                <tr
                  key={registration._id}
                  className="border-b hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-5 font-semibold">
                    {registration.registrationId}
                  </td>

                  <td className="px-6 py-5">
                    {registration.eventType === "astroquiz" && "Astro Quiz"}

                    {registration.eventType === "astrodesign" &&
                      "AI Astro Design"}

                    {registration.eventType === "astromodeler" &&
                      "Astro Modeler"}
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
                    <button
                      onClick={() => setSelectedRegistration(registration)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedRegistration && (
        <SpaceDayRegistrationDetailsModal
          registration={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
        />
      )}
    </div>
  );
}

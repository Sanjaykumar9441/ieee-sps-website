import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction, CSSProperties } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import type { LucideIcon } from "lucide-react";
import {
  RefreshCw,
  Search,
  Users,
  Download,
  FileText,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";

interface Registration {
  _id: string;
  rollNumber: string;
  fullName: string;
  gender: string;
  department: string;
  year: string;
  email: string;
  mobile: string;
  interested?: boolean;
  createdAt: string;
}

interface MembershipRegistrationsTabProps {
  registrations: Registration[];
  fetchRegistrations: () => Promise<void> | void;
  setRegistrations: Dispatch<SetStateAction<Registration[]>>;
  cardStyle: CSSProperties;
}

type SortKey = "fullName" | "rollNumber" | "department" | "year" | "createdAt";
type SortDir = "asc" | "desc";

const DEPARTMENTS = [
  "ECE",
  "CSE",
  "AI & ML",
  "CSE (DS)",
  "IT",
  "EEE",
  "Civil",
  "Mechanical",
  "Other",
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const PAGE_SIZES = [10, 25, 50, 100];

const API_BASE = "https://ieee-sps-website.onrender.com/api/membership";

/** Shared dark-theme classes for text inputs and selects */
const fieldCls =
  "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[#00629B] focus:bg-white/10 transition";

const MembershipRegistrationsTab = ({
  registrations,
  fetchRegistrations,
  setRegistrations,
  cardStyle,
}: MembershipRegistrationsTabProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Debounce search so filtering doesn't run on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Jump back to page 1 whenever the result set changes shape
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentFilter, yearFilter, genderFilter, pageSize]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => localStorage.getItem("token");

  const filteredRegistrations = useMemo(() => {
    const keyword = debouncedSearch.toLowerCase();
    return registrations.filter((reg) => {
      const matchesSearch =
        !keyword ||
        reg.fullName?.toLowerCase().includes(keyword) ||
        reg.rollNumber?.toLowerCase().includes(keyword) ||
        reg.email?.toLowerCase().includes(keyword);

      const matchesDepartment =
        !departmentFilter || reg.department === departmentFilter;
      const matchesYear = !yearFilter || reg.year === yearFilter;
      const matchesGender = !genderFilter || reg.gender === genderFilter;

      return matchesSearch && matchesDepartment && matchesYear && matchesGender;
    });
  }, [
    registrations,
    debouncedSearch,
    departmentFilter,
    yearFilter,
    genderFilter,
  ]);

  const sortedRegistrations = useMemo(() => {
    const list = [...filteredRegistrations];
    list.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortKey === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = String(a[sortKey] ?? "").toLowerCase();
        bVal = String(b[sortKey] ?? "").toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRegistrations, sortKey, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRegistrations.length / pageSize),
  );
  const paginatedRegistrations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRegistrations.slice(start, start + pageSize);
  }, [sortedRegistrations, page, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const totalRegistrations = registrations.length;
  const maleCount = registrations.filter((r) => r.gender === "Male").length;
  const femaleCount = registrations.filter((r) => r.gender === "Female").length;

  const toggleGenderFilter = (value: string) => {
    setGenderFilter((prev) => (prev === value ? "" : value));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRegistrations();
    } finally {
      setRefreshing(false);
    }
  };

  const deleteRegistration = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this registration?",
    );
    if (!confirmDelete) return;

    setBusyIds((prev) => new Set(prev).add(id));
    try {
      const token = getToken();
      await axios.delete(`${API_BASE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations((prev) => prev.filter((item) => item._id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (selectedRegistration?._id === id) setSelectedRegistration(null);
      showToast("Registration deleted.");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete registration.", "error");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected =
    paginatedRegistrations.length > 0 &&
    paginatedRegistrations.every((reg) => selectedIds.has(reg._id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginatedRegistrations.forEach((reg) => next.delete(reg._id));
      } else {
        paginatedRegistrations.forEach((reg) => next.add(reg._id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmDelete = window.confirm(
      `Delete ${selectedIds.size} selected registration(s)? This cannot be undone.`,
    );
    if (!confirmDelete) return;

    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const token = getToken();
    const results = await Promise.allSettled(
      ids.map((id) =>
        axios.delete(`${API_BASE}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    );
    const succeededIds = ids.filter(
      (_, i) => results[i].status === "fulfilled",
    );
    setRegistrations((prev) =>
      prev.filter((item) => !succeededIds.includes(item._id)),
    );
    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      showToast(
        `${succeededIds.length} deleted, ${failedCount} failed.`,
        "error",
      );
    } else {
      showToast(`${succeededIds.length} registration(s) deleted.`);
    }
    clearSelection();
    setBulkBusy(false);
  };

  const exportExcel = () => {
    const rows = sortedRegistrations.map((reg) => ({
      "Roll Number": reg.rollNumber,
      Name: reg.fullName,
      Gender: reg.gender,
      Department: reg.department,
      Year: reg.year,
      Email: reg.email,
      Mobile: reg.mobile,
      Interested: reg.interested ? "Yes" : "No",
      Registered: new Date(reg.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
  { wch: 16 }, // Roll No
  { wch: 28 }, // Name
  { wch: 10 }, // Gender
  { wch: 15 }, // Department
  { wch: 12 }, // Year
  { wch: 35 }, // Email
  { wch: 18 }, // Mobile
  { wch: 12 }, // Interested
  { wch: 24 }, // Registered
];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Membership Registrations",
    );
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Membership_Registrations_${date}.xlsx`);
  };

  const exportCSV = () => {
    const headers = [
      "Roll Number",
      "Name",
      "Gender",
      "Department",
      "Year",
      "Email",
      "Mobile",
      "Interested",
      "Registered",
    ];
    const escapeCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = sortedRegistrations.map((reg) =>
      [
        reg.rollNumber,
        reg.fullName,
        reg.gender,
        reg.department,
        reg.year,
        reg.email,
        reg.mobile,
        reg.interested ? "Yes" : "No",
        new Date(reg.createdAt).toLocaleString(),
      ]
        .map(escapeCsv)
        .join(","),
    );
    const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Membership_Registrations_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setYearFilter("");
    setGenderFilter("");
  };

  const hasActiveFilters = Boolean(
    search || departmentFilter || yearFilter || genderFilter,
  );

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[#00629B]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#00629B]" />
    );
  };

  return (
    <div>
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[1000] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Membership Registrations
          </h2>
          <p className="text-sm text-slate-400">
            Manage IEEE SPS Membership Drive registrations
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white disabled:opacity-60"
            style={{ background: "#00629B" }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
            style={{ background: "#16a34a" }}
          >
            <Download size={16} />
            Excel
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
            style={{ background: "#0f172a" }}
          >
            <FileText size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* STATS — clickable as quick filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total"
          value={totalRegistrations}
          icon={Users}
          color="#00629B"
          cardStyle={cardStyle}
        />
        <StatCard
          label="Male"
          value={maleCount}
          icon={Users}
          color="#2563eb"
          cardStyle={cardStyle}
          active={genderFilter === "Male"}
          onClick={() => toggleGenderFilter("Male")}
        />
        <StatCard
          label="Female"
          value={femaleCount}
          icon={Users}
          color="#db2777"
          cardStyle={cardStyle}
          active={genderFilter === "Female"}
          onClick={() => toggleGenderFilter("Female")}
        />
      </div>

      {/* SEARCH */}
      <div className="mb-4 relative">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by Name, Roll Number or Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-11 pr-4 py-3 ${fieldCls}`}
        />
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className={fieldCls}
        >
          <option value="" className="bg-slate-900">
            All Departments
          </option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d} className="bg-slate-900">
              {d}
            </option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className={fieldCls}
        >
          <option value="" className="bg-slate-900">
            All Years
          </option>
          {YEARS.map((y) => (
            <option key={y} value={y} className="bg-slate-900">
              {y}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className={fieldCls}
        >
          <option value="" className="bg-slate-900">
            All Genders
          </option>
          <option className="bg-slate-900">Male</option>
          <option className="bg-slate-900">Female</option>
        </select>

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-slate-300"
        >
          Clear Filters
        </button>
      </div>

      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-[#00629B]/10 border border-[#00629B]/30 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-cyan-300">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={bulkBusy}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-xs text-slate-400 hover:text-slate-200"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* TABLE (desktop) */}
      <div
        className="hidden md:block overflow-x-auto rounded-xl mb-4"
        style={cardStyle}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(99,179,237,0.08)" }}>
              <th className="px-4 py-4 text-left">
                <button
                  type="button"
                  onClick={toggleSelectAllOnPage}
                  className="flex items-center"
                >
                  {allOnPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#00629B]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </th>
              <SortableHeader
                label="Roll No"
                column="rollNumber"
                sortKey={sortKey}
                onSort={toggleSort}
                SortIcon={SortIcon}
              />
              <SortableHeader
                label="Name"
                column="fullName"
                sortKey={sortKey}
                onSort={toggleSort}
                SortIcon={SortIcon}
              />
              <SortableHeader
                label="Department"
                column="department"
                sortKey={sortKey}
                onSort={toggleSort}
                SortIcon={SortIcon}
              />
              <SortableHeader
                label="Year"
                column="year"
                sortKey={sortKey}
                onSort={toggleSort}
                SortIcon={SortIcon}
              />
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Email
              </th>
              <SortableHeader
                label="Registered"
                column="createdAt"
                sortKey={sortKey}
                onSort={toggleSort}
                SortIcon={SortIcon}
                align="center"
              />
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRegistrations.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center">
                    <Users size={45} className="text-slate-600 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-300">
                      No Registrations Found
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {hasActiveFilters
                        ? "Try adjusting your filters."
                        : "Students who register will appear here."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRegistrations.map((reg) => {
                const isBusy = busyIds.has(reg._id);
                return (
                  <tr
                    key={reg._id}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleSelectRow(reg._id)}
                      >
                        {selectedIds.has(reg._id) ? (
                          <CheckSquare className="w-4 h-4 text-[#00629B]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {reg.rollNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-200">{reg.fullName}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {reg.department}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{reg.year}</td>
                    <td className="px-5 py-4 text-slate-400">{reg.email}</td>
                    <td className="px-5 py-4 text-center text-sm text-slate-400">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRegistration(reg)}
                          className="p-2 rounded-lg bg-[#00629B] hover:bg-[#005080] text-white transition"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRegistration(reg._id)}
                          disabled={isBusy}
                          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50"
                          title="Delete"
                        >
                          {isBusy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CARD LIST (mobile) */}
      <div className="md:hidden flex flex-col gap-3 mb-4">
        {paginatedRegistrations.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={cardStyle}>
            <Users size={40} className="text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">
              No Registrations Found
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters."
                : "Students who register will appear here."}
            </p>
          </div>
        ) : (
          paginatedRegistrations.map((reg) => {
            const isBusy = busyIds.has(reg._id);
            return (
              <div key={reg._id} className="rounded-xl p-4" style={cardStyle}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-slate-100">
                      {reg.fullName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reg.rollNumber} · {reg.department} · {reg.year}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelectRow(reg._id)}
                  >
                    {selectedIds.has(reg._id) ? (
                      <CheckSquare className="w-4 h-4 text-[#00629B]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">{reg.email}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRegistration(reg)}
                      className="p-2 rounded-lg bg-[#00629B] text-white"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRegistration(reg._id)}
                      disabled={isBusy}
                      className="p-2 rounded-lg bg-red-500 text-white disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {sortedRegistrations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-slate-200"
            >
              {PAGE_SIZES.map((size) => (
                <option
                  key={size}
                  value={size}
                  className="bg-slate-900 text-slate-100"
                >
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Page {page} of {totalPages} · {sortedRegistrations.length} results
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRegistration && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-5"
          onClick={() => setSelectedRegistration(null)}
        >
          <div
            className="rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0B1220]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-slate-100">
                Membership Registration
              </h2>
              <button
                type="button"
                onClick={() => setSelectedRegistration(null)}
                className="text-3xl leading-none text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
              <DetailField
                label="Roll Number"
                value={selectedRegistration.rollNumber}
              />
              <DetailField
                label="Full Name"
                value={selectedRegistration.fullName}
              />
              <DetailField label="Gender" value={selectedRegistration.gender} />
              <DetailField
                label="Department"
                value={selectedRegistration.department}
              />
              <DetailField label="Year" value={selectedRegistration.year} />
              <DetailField label="Email" value={selectedRegistration.email} />
              <DetailField label="Mobile" value={selectedRegistration.mobile} />
              <DetailField
                label="Interested"
                value={selectedRegistration.interested ? "Yes" : "No"}
              />

              <DetailField
                label="Registered On"
                value={new Date(
                  selectedRegistration.createdAt,
                ).toLocaleString()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helper components ── */

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  cardStyle,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  cardStyle: CSSProperties;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    style={cardStyle}
    className={`rounded-xl p-4 text-left transition ${
      onClick ? "hover:-translate-y-0.5 cursor-pointer" : "cursor-default"
    } ${active ? "ring-2 ring-[#00629B]" : ""}`}
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <Icon size={16} color={color} />
    </div>
    <h2 className="text-3xl font-bold" style={{ color }}>
      {value}
    </h2>
  </button>
);

const SortableHeader = ({
  label,
  column,
  sortKey,
  onSort,
  SortIcon,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
  SortIcon: (props: { column: SortKey }) => JSX.Element;
  align?: "left" | "center";
}) => (
  <th
    className={`px-5 py-4 ${
      align === "center" ? "text-center" : "text-left"
    } text-xs font-semibold uppercase tracking-widest text-slate-400`}
  >
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 ${align === "center" ? "mx-auto" : ""}`}
    >
      {label}
      <SortIcon column={column} />
    </button>
  </th>
);

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <p className="font-semibold text-slate-100">{value}</p>
  </div>
);

export default MembershipRegistrationsTab;

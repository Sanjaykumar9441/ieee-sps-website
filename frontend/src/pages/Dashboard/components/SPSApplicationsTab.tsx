import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download, RefreshCw } from "lucide-react";

const SPSApplicationsTab = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalApplications = applications.length;

  const filteredApplications = applications.filter((app) => {
    const fullName = (app.fullName || "").toLowerCase();
    const rollNumber = (app.rollNumber || "").toLowerCase();
    const gender = (app.gender || "").toLowerCase();
    const department = (app.department || "").toLowerCase();

    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      rollNumber.includes(search.toLowerCase()) ||
      gender.includes(search.toLowerCase()) ||
      department.includes(search.toLowerCase());

    const matchesDepartment =
      !departmentFilter || app.department === departmentFilter;

    const matchesYear = !yearFilter || app.year === yearFilter;
    const matchesGender = !genderFilter || app.gender === genderFilter;

    return matchesSearch && matchesDepartment && matchesYear && matchesGender;
  });

  const applicationsPerPage = 10;

  const indexOfLastApplication = currentPage * applicationsPerPage;

  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;

  const currentApplications = filteredApplications.slice(
    indexOfFirstApplication,
    indexOfLastApplication,
  );

  const totalPages = Math.ceil(
    filteredApplications.length / applicationsPerPage,
  );

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, departmentFilter, yearFilter]);

  const fetchApplications = async () => {
    try {
      setRefreshing(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/sps-applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setApplications(
        res.data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `https://ieee-sps-website.onrender.com/api/sps-applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSelectedApplications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (
        !window.confirm(`Delete ${selectedRows.length} selected applications?`)
      ) {
        return;
      }

      await Promise.all(
        selectedRows.map((id) =>
          axios.delete(
            `https://ieee-sps-website.onrender.com/api/sps-applications/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        ),
      );

      setSelectedRows([]);

      fetchApplications();
    } catch (err) {
      console.error(err);
      alert("Failed to delete selected applications");
    }
  };

  const exportToExcel = () => {
    const excelData = applications.map((app) => ({
      "Full Name": app.fullName,
      "Roll Number": app.rollNumber,
      Gender: app.gender,
      Department: app.department,
      Year: app.year,
      Email: app.email,
      Mobile: app.mobile,
      AppliedOn: new Date(app.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "SPS Applications");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "IEEE_SPS_Applications.xlsx");
  };

  const exportSelectedToExcel = () => {
    const selectedApplications = applications.filter((app) =>
      selectedRows.includes(app._id),
    );

    const excelData = selectedApplications.map((app) => ({
      "Full Name": app.fullName,
      "Roll Number": app.rollNumber,
      Gender: app.gender,
      Department: app.department,
      Year: app.year,
      Email: app.email,
      Mobile: app.mobile,
      AppliedOn: new Date(app.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Selected SPS Applications",
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "Selected_SPS_Applications.xlsx");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">SPS Applications</h2>

        <div className="flex gap-3">
          <button
            onClick={fetchApplications}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(34,197,94,0.25)",
            }}
          >
            <RefreshCw size={14} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(34,197,94,0.25)",
            }}
          >
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Name, Roll Number or Department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-[#0f1624] text-white border border-slate-700 outline-none"
        />

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-[#0f1624] text-white border border-slate-700"
        >
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-[#0f1624] text-white border border-slate-700"
        >
          <option value="">All Departments</option>

          <option value="ECE">ECE</option>
          <option value="CSE">CSE</option>
          <option value="AI & ML">AI & ML</option>
          <option value="CSE (DS)">CSE (DS)</option>
          <option value="IT">IT</option>
          <option value="EEE">EEE</option>
          <option value="Civil">Civil</option>
          <option value="Mechanical">Mechanical</option>
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-[#0f1624] text-white border border-slate-700"
        >
          <option value="">All Years</option>

          <option value="1st Year">1st Year</option>

          <option value="2nd Year">2nd Year</option>

          <option value="3rd Year">3rd Year</option>

          <option value="4th Year">4th Year</option>
        </select>

        <button
          onClick={() => {
            setSearch("");
            setGenderFilter("");
            setDepartmentFilter("");
            setYearFilter("");
          }}
          className="px-4 py-3 rounded-xl"
          style={{
            background: "#1e293b",
            color: "white",
          }}
        >
          Clear Filters
        </button>
      </div>
      <div
        className="mb-4 text-sm"
        style={{
          color: "#64748b",
        }}
      >
        Showing {filteredApplications.length} of {applications.length}{" "}
        applications
      </div>

      {selectedRows.length > 0 && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={deleteSelectedApplications}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "#dc2626",
              color: "white",
            }}
          >
            Delete Selected ({selectedRows.length})
          </button>

          <button
            onClick={exportSelectedToExcel}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "#16a34a",
              color: "white",
            }}
          >
            Export Selected ({selectedRows.length})
          </button>
        </div>
      )}

      <div
        className="overflow-x-auto rounded-xl"
        style={{
          backgroundColor: "#0f1624",
          border: "1px solid rgba(99,179,237,0.08)",
        }}
      >
        {filteredApplications.length === 0 ? (
          <div className="text-center py-10" style={{ color: "#64748b" }}>
            No SPS applications found.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(99,179,237,0.08)",
                }}
              >
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={
                      currentApplications.length > 0 &&
                      currentApplications.every((app) =>
                        selectedRows.includes(app._id),
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(
                          currentApplications.map((app) => app._id),
                        );
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </th>

                <th className="text-left p-4">#</th>

                <th className="text-left p-4">Name</th>

                <th className="text-left p-4">Roll No</th>

                <th className="text-left p-4">Gender</th>

                <th className="text-left p-4">Department</th>

                <th className="text-left p-4">Year</th>

                <th className="text-left p-4">Applied Date</th>

                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentApplications.map((app, index) => (
                <tr
                  key={app._id}
                  className="hover:bg-slate-800/40 transition"
                  style={{
                    borderBottom: "1px solid rgba(99,179,237,0.05)",
                  }}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(app._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, app._id]);
                        } else {
                          setSelectedRows(
                            selectedRows.filter((id) => id !== app._id),
                          );
                        }
                      }}
                    />
                  </td>

                  <td className="p-4 font-semibold">
                    {indexOfFirstApplication + index + 1}
                  </td>

                  <td className="p-4">{app.fullName || "-"}</td>
                  <td className="p-4">{app.rollNumber || "-"}</td>
                  <td className="p-4">{app.department || "-"}</td>
                  <td className="p-4">{app.year || "-"}</td>
                  <td className="p-4">{app.gender || "-"}</td>

                  <td className="p-4">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="px-3 py-1 rounded-lg text-sm"
                        style={{
                          background: "rgba(59,130,246,0.15)",
                          color: "#60a5fa",
                        }}
                      >
                        View
                      </button>

                      <button
                        onClick={() => window.open(`mailto:${app.email || ""}`)}
                        className="px-3 py-1 rounded-lg text-sm"
                        style={{
                          background: "rgba(34,197,94,0.15)",
                          color: "#22c55e",
                        }}
                      >
                        Email
                      </button>

                      <button
                        onClick={() => window.open(`tel:${app.mobile || ""}`)}
                        className="px-3 py-1 rounded-lg text-sm"
                        style={{
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                        }}
                      >
                        Call
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Delete this application?")) {
                            deleteApplication(app._id);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-sm"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#ef4444",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 rounded-lg disabled:opacity-40"
          style={{
            background: "#1e293b",
            color: "white",
          }}
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 rounded-lg disabled:opacity-40"
          style={{
            background: "#1e293b",
            color: "white",
          }}
        >
          Next
        </button>
      </div>
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-lg w-full rounded-2xl p-6"
            style={{
              backgroundColor: "#0f1624",
              border: "1px solid rgba(99,179,237,0.08)",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Applicant Details</h3>

              <button
                onClick={() => setSelectedApplication(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <InfoRow label="Full Name" value={selectedApplication.fullName} />

              <InfoRow
                label="Roll Number"
                value={selectedApplication.rollNumber}
              />

              <InfoRow 
                label="Gender" value={selectedApplication.gender}
               />

              <InfoRow
                label="Department"
                value={selectedApplication.department}
              />

              <InfoRow label="Year" value={selectedApplication.year} />

              <InfoRow label="Email" value={selectedApplication.email} />

              <InfoRow label="Mobile" value={selectedApplication.mobile} />

              <InfoRow
                label="Applied On"
                value={new Date(selectedApplication.createdAt).toLocaleString()}
              />
            </div>

            <button
              onClick={() => setSelectedApplication(null)}
              className="mt-6 w-full bg-blue-600 py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div>
    <div className="text-xs" style={{ color: "#64748b" }}>
      {label}
    </div>

    <div>{value}</div>
  </div>
);

export default SPSApplicationsTab;

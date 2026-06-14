import React from "react";

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    Upcoming: {
      bg: "rgba(34,197,94,0.12)",
      color: "#22c55e",
      label: "Upcoming",
    },
    Completed: {
      bg: "rgba(59,130,246,0.12)",
      color: "#60a5fa",
      label: "Completed",
    },
    Pending: { bg: "rgba(234,179,8,0.12)", color: "#eab308", label: "Pending" },
    Confirmed: {
      bg: "rgba(34,197,94,0.12)",
      color: "#22c55e",
      label: "Confirmed",
    },
  };
  const c = config[status] || {
    bg: "rgba(100,116,139,0.12)",
    color: "#64748b",
    label: status,
  };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
};

export default StatusBadge;
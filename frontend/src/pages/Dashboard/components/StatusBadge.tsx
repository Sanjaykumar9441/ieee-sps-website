import React from "react";

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    Upcoming: { bg: "#EFEBFF", color: "#6C5FE0", label: "Upcoming" },
    Confirmed: { bg: "#E8F5EE", color: "#1E8A5F", label: "Confirmed" },
    Completed: { bg: "#EAF1FB", color: "#3B6FA6", label: "Completed" },
    Pending: { bg: "#FDF3E0", color: "#B7791F", label: "Pending" },
  };
  const c = config[status] || {
    bg: "#F1EFEA",
    color: "#8A8578",
    label: status,
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: c.color }}
      />
      {c.label}
    </span>
  );
};

export default StatusBadge;

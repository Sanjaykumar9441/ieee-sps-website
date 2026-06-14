import React from "react";

const GradientButton = ({
  onClick,
  children,
  color = "blue",
  className = "",
  disabled = false,
  small = false,
}: any) => {
  const gradients: Record<string, string> = {
    blue: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    green: "linear-gradient(135deg, #22c55e, #16a34a)",
    red: "linear-gradient(135deg, #ef4444, #dc2626)",
    gray: "linear-gradient(135deg, #475569, #334155)",
    purple: "linear-gradient(135deg, #a855f7, #7c3aed)",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-medium rounded-lg transition-all duration-150 ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{
        background: gradients[color] || gradients.blue,
        color: "#fff",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 2px 12px rgba(59,130,246,0.2)",
      }}
    >
      {children}
    </button>
  );
};

export default GradientButton;
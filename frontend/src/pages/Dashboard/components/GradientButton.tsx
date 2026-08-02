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
    blue: "linear-gradient(135deg, #8B7FF5, #6C5FE0)",
    green: "linear-gradient(135deg, #34C97E, #1E8A5F)",
    red: "linear-gradient(135deg, #F16565, #DC3D3D)",
    gray: "linear-gradient(135deg, #3A3844, #1C1B22)",
    purple: "linear-gradient(135deg, #C084FC, #A855F7)",
  };
  const shadow: Record<string, string> = {
    blue: "0 4px 14px rgba(124,111,239,0.24)",
    green: "0 4px 14px rgba(46,190,127,0.22)",
    red: "0 4px 14px rgba(220,61,61,0.22)",
    gray: "0 4px 14px rgba(28,27,34,0.18)",
    purple: "0 4px 14px rgba(168,85,247,0.22)",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-medium rounded-full transition-all duration-150 ${small ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{
        background: gradients[color] || gradients.blue,
        color: "#fff",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : shadow[color] || shadow.blue,
      }}
    >
      {children}
    </button>
  );
};

export default GradientButton;
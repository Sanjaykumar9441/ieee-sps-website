import { useState } from "react";

const inputStyle: React.CSSProperties = {
  backgroundColor: "#080c14",
  border: "1px solid rgba(99,179,237,0.12)",
  color: "#f0f4ff",
  borderRadius: "10px",
  padding: "10px 14px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  transition: "border 0.2s, box-shadow 0.2s",
};

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  as,
  children,
}: any) => {
  const [focused, setFocused] = useState(false);
  const focusStyle = focused
    ? {
        border: "1px solid rgba(59,130,246,0.6)",
        boxShadow: "0 0 0 3px rgba(59,130,246,0.08)",
      }
    : {};

  if (as === "select") {
    return (
      <div>
        <label
          className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
          style={{ color: "#64748b" }}
        >
          {label}
        </label>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle, ...focusStyle }}
          className="appearance-none"
        >
          {children}
        </select>
      </div>
    );
  }
  if (as === "textarea") {
    return (
      <div>
        <label
          className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
          style={{ color: "#64748b" }}
        >
          {label}
        </label>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle, ...focusStyle, resize: "vertical" }}
        />
      </div>
    );
  }
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
        style={{ color: "#64748b" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, ...focusStyle }}
      />
    </div>
  );
};

export default InputField;
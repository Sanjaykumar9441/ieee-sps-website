import { useState } from "react";

const inputStyle: React.CSSProperties = {
  backgroundColor: "#FAF9F7",
  border: "1px solid #EBE8E2",
  color: "#1C1B22",
  borderRadius: "12px",
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
        border: "1px solid #7C6FEF",
        boxShadow: "0 0 0 3px rgba(124,111,239,0.12)",
        backgroundColor: "#fff",
      }
    : {};

  const labelEl = (
    <label
      className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
      style={{ color: "#B5B1A8" }}
    >
      {label}
    </label>
  );

  if (as === "select") {
    return (
      <div>
        {labelEl}
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
        {labelEl}
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
      {labelEl}
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
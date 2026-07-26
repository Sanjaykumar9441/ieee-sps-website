const React = require("react");

const {
  Button,
} = require("@react-email/components");

function PrimaryButton({
  href,
  text,
  color,
}) {
  return (
    <Button
      href={href}
      style={{
        background: color,
        color: "#FFFFFF",
        padding: "14px 28px",
        borderRadius: "8px",
        textDecoration: "none",
        display: "inline-block",
        fontWeight: "600",
      }}
    >
      {text}
    </Button>
  );
}

module.exports = PrimaryButton;
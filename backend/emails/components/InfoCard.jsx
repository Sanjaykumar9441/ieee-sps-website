const React = require("react");

const {
  Section,
  Text,
} = require("@react-email/components");

function InfoCard({ label, value }) {
  return (
    <Section
      style={{
        padding: "14px",
        marginBottom: "12px",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
      }}
    >
      <Text
        style={{
          color: "#64748B",
          fontSize: 12,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        {value}
      </Text>
    </Section>
  );
}

module.exports = InfoCard;
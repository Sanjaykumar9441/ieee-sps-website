const React = require("react");

const {
  Section,
  Img,
  Heading,
  Text,
} = require("@react-email/components");

function EmailHeader({ primary }) {
  return (
    <Section
      style={{
        textAlign: "center",
        padding: "30px",
        borderBottom: `4px solid ${primary}`,
      }}
    >
      <Img
        src="https://ieeespsaditya.vercel.app/logos/ieee.png"
        width="90"
        alt="IEEE SPS Logo"
      />

      <Heading
        style={{
          marginTop: 20,
          marginBottom: 10,
        }}
      >
        National Space Day 2026
      </Heading>

      <Text>
        IEEE SPS Student Branch Chapter
      </Text>

      <Text>
        Aditya University
      </Text>
    </Section>
  );
}

module.exports = EmailHeader;
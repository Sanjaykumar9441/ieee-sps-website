import {
  Section,
  Text,
} from "@react-email/components";

interface Props {
  label: string;
  value: string;
}

export default function InfoCard({
  label,
  value,
}: Props) {
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
import {
  Section,
  Img,
  Heading,
  Text,
} from "@react-email/components";

interface Props {
  primary: string;
}

export default function EmailHeader({
  primary,
}: Props) {
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
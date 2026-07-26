import {
  Section,
  Text,
} from "@react-email/components";

export default function EmailFooter() {
  return (
    <Section
      style={{
        marginTop: 40,
        borderTop: "1px solid #ddd",
        paddingTop: 20,
        textAlign: "center",
      }}
    >
      <Text>
        IEEE SPS Student Branch Chapter
      </Text>

      <Text>
        Aditya University
      </Text>

      <Text>
        Explore • Innovate • Inspire
      </Text>
    </Section>
  );
}
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

import EmailHeader from "../components/EmailHeader";
import EmailFooter from "../components/EmailFooter";
import InfoCard from "../components/InfoCard";
import PrimaryButton from "../components/PrimaryButton";

interface Props {
  participantName: string;
  registrationId: string;
  eventName: string;
  paymentStatus: string;
  whatsappLink: string;
  statusLink: string;
  primaryColor: string;
}

export default function VerificationEmail({
  participantName,
  registrationId,
  eventName,
  paymentStatus,
  whatsappLink,
  statusLink,
  primaryColor,
}: Props) {
  return (
    <Html>
      <Head />

      <Body
        style={{
          backgroundColor: "#F8FAFC",
          fontFamily: "Inter, Arial, sans-serif",
          padding: "30px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "700px",
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >
          <EmailHeader primary={primaryColor} />

          <Section style={{ padding: "42px" }}>
            {/* Hero */}

            <Text
              style={{
                fontSize: "36px",
                fontWeight: "700",
                color: primaryColor,
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              🛰 National Space Day 2026
            </Text>

            <Text
              style={{
                fontSize: "22px",
                textAlign: "center",
                fontWeight: "600",
                marginBottom: "28px",
              }}
            >
              Registration Successfully Verified
            </Text>

            <Section
              style={{
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              <Text
                style={{
                  display: "inline-block",
                  backgroundColor:
                    paymentStatus === "Verified" ? "#DCFCE7" : "#FEE2E2",
                  color: paymentStatus === "Verified" ? "#166534" : "#991B1B",
                  padding: "10px 22px",
                  borderRadius: "999px",
                  fontSize: "18px",
                  fontWeight: "700",
                }}
              >
                {paymentStatus === "Verified" ? "🟢 VERIFIED" : "🔴 REJECTED"}
              </Text>
            </Section>

            <Text
              style={{
                fontSize: "16px",
                marginTop: "32px",
                lineHeight: "28px",
              }}
            >
              Hello <strong>{participantName}</strong>,
            </Text>

            <Text
              style={{
                fontSize: "16px",
                lineHeight: "30px",
              }}
            >
              Congratulations! Your payment has been verified successfully. Your
              registration is now confirmed for National Space Day 2026.
            </Text>

            <Hr style={{ margin: "32px 0" }} />

            {/* Registration Details */}

            <InfoCard label="Registration ID" value={registrationId} />

            <InfoCard label="Event" value={eventName} />

            <InfoCard label="Payment Status" value={paymentStatus} />

            <Section
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "30px",
                marginBottom: "30px",
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: "18px",
                  marginBottom: "10px",
                }}
              >
                📄 Verified Acknowledgement
              </Text>

              <Text
                style={{
                  fontSize: "15px",
                  lineHeight: "24px",
                  color: "#475569",
                }}
              >
                Your verified acknowledgement PDF has been attached to this
                email. Please download and keep it safe.
              </Text>
            </Section>

            <PrimaryButton
              href={whatsappLink}
              text="🟢 Join Official WhatsApp Group"
              color={primaryColor}
            />

            <Section style={{ height: "18px" }} />

            <PrimaryButton
              href={statusLink}
              text="🌐 Check Registration Status"
              color={primaryColor}
            />

            <Section
              style={{
                background: "#F1F5F9",
                borderRadius: "14px",
                padding: "22px",
                marginTop: "35px",
              }}
            >
              <Text
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "12px",
                }}
              >
                Need Assistance?
              </Text>

              <Text>📧 ieee.club.aus@gmail.com</Text>

              <Text>📞 +91 7095009441</Text>

              <Text>🌐 https://ieeespsaditya.vercel.app</Text>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

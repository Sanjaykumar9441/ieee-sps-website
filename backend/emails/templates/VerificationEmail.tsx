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
import HelpCard from "../components/HelpCard";
import SuccessBadge from "../components/SuccessBadge";
import AttachmentCard from "../components/AttachmentCard";

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

            <SuccessBadge />

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
              Congratulations! Your payment has been verified successfully.
              Your registration is now confirmed for National Space Day 2026.
            </Text>

            <Hr style={{ margin: "32px 0" }} />

            {/* Registration Details */}

            <InfoCard
              label="Registration ID"
              value={registrationId}
            />

            <InfoCard
              label="Event"
              value={eventName}
            />

            <InfoCard
              label="Payment Status"
              value={paymentStatus}
            />

            <AttachmentCard />

            <PrimaryButton
              href={whatsappLink}
              text="🟢 Join Official WhatsApp Group"
              color={primaryColor}
            />

            <div style={{ height: "18px" }} />

            <PrimaryButton
              href={statusLink}
              text="🌐 Check Registration Status"
              color={primaryColor}
            />

            <HelpCard />
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
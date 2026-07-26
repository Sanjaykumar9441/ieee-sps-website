import VerificationEmail from "../templates/VerificationEmail";

export default function Preview() {
  return (
    <VerificationEmail
      participantName="Sanjay Kumar"
      registrationId="NSD260001"
      eventName="AI Astro Design Competition"
      paymentStatus="🟢 VERIFIED"
      whatsappLink="https://chat.whatsapp.com/example"
      statusLink="https://ieeespsaditya.vercel.app/space-day/status/NSD260001"
      primaryColor="#9333EA"
    />
  );
}
import { useState } from "react";
import ProgressStepper from "./ProgressStepper";
import { EventType } from "./types";
import TeamStep1 from "./components/TeamStep1";
import TeamSummary from "./components/TeamSummary";
import TeamPayment from "./components/TeamPayment";
import { validateTeamForm } from "./components/teamValidation";
import RegistrationHeader from "./components/RegistrationHeader";
import { submitSpaceDayRegistration } from "../../../services/spaceDayRegistrationService";
interface TeamRegistrationProps {
  eventType: EventType;
  onBack: () => void;
}

export default function TeamRegistration({
  eventType,
  onBack,
}: TeamRegistrationProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [teamSize, setTeamSize] = useState<2 | 3>(2);

  const [formData, setFormData] = useState({
    teamName: "",

    members: [
      {
        fullName: "",
        gender: "",
        rollNumber: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        college: "",
        otherCollege: "",
        otherCollegeCity: "",
        otherCollegeDistrict: "",
        otherCollegeState: "",
        otherCollegePincode: "",
      },

      {
        fullName: "",
        gender: "",
        rollNumber: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        college: "",
        otherCollege: "",
        otherCollegeCity: "",
        otherCollegeDistrict: "",
        otherCollegeState: "",
        otherCollegePincode: "",
      },

      {
        fullName: "",
        gender: "",
        rollNumber: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        college: "",
        otherCollege: "",
        otherCollegeCity: "",
        otherCollegeDistrict: "",
        otherCollegeState: "",
        otherCollegePincode: "",
      },
    ],
    selectedTheme: "",
    accommodation: false,
    accommodationMembers: [false, false, false],
    arrivalDate: "",
    arrivalTime: "",

    departureDate: "",
    departureTime: "",
    transactionId: "",
    paymentScreenshot: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMember = (index: number, field: string, value: string) => {
    const updated = [...formData.members];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      members: updated,
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <RegistrationHeader eventType={eventType} onBack={onBack} />
        </div>

        <ProgressStepper currentStep={step} eventType={eventType} />

        {step === 1 && (
          <TeamStep1
            eventType={eventType}
            teamSize={teamSize}
            setTeamSize={setTeamSize}
            formData={formData}
            updateMember={updateMember}
            updateField={updateField}
            onNext={() => {
              const validationErrors =
                validateTeamForm(formData, teamSize, eventType) ?? {};

              setErrors(validationErrors);

              if (Object.keys(validationErrors).length > 0) return;

              setStep(2);
            }}
            onBack={onBack}
            errors={errors}
          />
        )}

        {step === 2 && (
          <TeamSummary
            eventType={eventType}
            teamSize={teamSize}
            formData={formData}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <TeamPayment
            eventType={eventType}
            teamSize={teamSize}
            formData={formData}
            updateField={updateField}
            onBack={() => setStep(2)}
            onSubmit={async () => {
              try {
                if (!formData.paymentScreenshot) {
                  alert("Please upload the payment screenshot.");
                  return;
                }

                const registration = {
                  eventType,
                  teamName: formData.teamName,
                  teamSize,
                  selectedTheme: formData.selectedTheme,
                  members: formData.members.slice(0, teamSize),

                  accommodation: formData.accommodation,
                  accommodationMembers: formData.accommodationMembers,

                  arrivalDate: formData.arrivalDate,
                  arrivalTime: formData.arrivalTime,

                  departureDate: formData.departureDate,
                  departureTime: formData.departureTime,

                  transactionId: formData.transactionId,
                };

                const response = await submitSpaceDayRegistration(
                  registration,
                  formData.paymentScreenshot,
                );

                alert(
                  `Registration Successful!\nRegistration ID: ${response.registrationId}`,
                );

                console.log(response);
              } catch (error: any) {
                console.error(error);

                alert(error.response?.data?.message || "Registration Failed.");
              }
            }}
          />
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import ProgressStepper from "./ProgressStepper";
import { EventType } from "./types";
import TeamStep1 from "./components/TeamStep1";
import TeamSummary from "./components/TeamSummary";
import TeamPayment from "./components/TeamPayment";
import { validateTeamForm } from "./components/teamValidation";
import RegistrationHeader from "./components/RegistrationHeader";
import toast from "react-hot-toast";
import {
  submitSpaceDayRegistration,
  checkMembers,
} from "../../../services/spaceDayRegistrationService";
import { useNavigate } from "react-router-dom";
interface TeamRegistrationProps {
  eventType: EventType;
  onBack: () => void;
}

export default function TeamRegistration({
  eventType,
  onBack,
}: TeamRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const navigate = useNavigate();
  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, [step]);
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
            onNext={async () => {
              // Local validation
              const validationErrors =
                validateTeamForm(formData, teamSize, eventType) ?? {};

              setErrors(validationErrors);

              if (Object.keys(validationErrors).length > 0) return;

              try {
                const result = await checkMembers(
                  eventType,
                  formData.teamName,
                  formData.members.slice(0, teamSize),
                );

                if (result.exists) {
                  toast.error(result.message);
                  return;
                }

                setStep(2);
              } catch (err) {
                console.error(err);
                toast.error("Unable to verify registration. Please try again.");
              }
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
            isSubmitting={isSubmitting}
            onSubmit={async () => {
              if (isSubmitting) return;

              if (!formData.paymentScreenshot) {
                toast.error("Please upload the payment screenshot.");
                return;
              }

              setIsSubmitting(true);

              const toastId = toast.loading("Submitting registration...");

              try {
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

                toast.success("Registration Submitted Successfully!", {
                  id: toastId,
                });

                navigate("/space-day/registration-success", {
                  state: response,
                });
              } catch (error: any) {
                console.error(error);

                toast.error(
                  error.response?.data?.message || "Registration Failed.",
                  {
                    id: toastId,
                  },
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        )}
      </div>
    </section>
  );
}

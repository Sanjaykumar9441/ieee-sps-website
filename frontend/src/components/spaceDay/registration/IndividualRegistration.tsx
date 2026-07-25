import { useState } from "react";
import ProgressStepper from "./ProgressStepper";
import IndividualStep1 from "./components/IndividualStep1";
import IndividualSummary from "./components/IndividualSummary";
import IndividualPayment from "./components/IndividualPayment";
import { EventType } from "./types";
import { validateIndividualForm } from "./components/individualValidation";
import RegistrationHeader from "./components/RegistrationHeader";
import {
  submitSpaceDayRegistration,
  checkIndividual,
} from "../../../services/spaceDayRegistrationService";
interface IndividualRegistrationProps {
  eventType: EventType;
  onBack: () => void;
}

export default function IndividualRegistration({
  eventType,
  onBack,
}: IndividualRegistrationProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
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

    accommodation: false,
    arrivalDate: "",
    arrivalTime: "",
    departureDate: "",
    departureTime: "",

    transactionId: "",
    paymentScreenshot: null as File | null,
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => {
      // If accommodation is turned OFF,
      // clear all accommodation-related data.
      if (field === "accommodation" && value === false) {
        return {
          ...prev,
          accommodation: false,
          arrivalDate: "",
          arrivalTime: "",
          departureDate: "",
          departureTime: "",
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-6">
        <RegistrationHeader eventType={eventType} onBack={onBack} />
        <ProgressStepper currentStep={step} eventType={eventType} />

        {step === 1 && (
          <IndividualStep1
            eventType={eventType}
            formData={formData}
            errors={errors}
            updateField={updateField}
            onNext={async () => {
              const validationErrors = validateIndividualForm(formData) ?? {};

              setErrors(validationErrors);

              if (Object.keys(validationErrors).length > 0) return;

              try {
                const duplicate = await checkIndividual(
  eventType,
  formData
);

                if (duplicate.exists) {
                  alert(duplicate.message);
                  return;
                }

                setStep(2);
              } catch (err) {
                console.error(err);
                alert("Unable to verify registration. Please try again.");
              }
            }}
            onBack={onBack}
          />
        )}

        {step === 2 && (
          <IndividualSummary
            eventType={eventType}
            formData={formData}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <IndividualPayment
            eventType={eventType}
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

                  members: [formData],

                  accommodation: formData.accommodation,

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

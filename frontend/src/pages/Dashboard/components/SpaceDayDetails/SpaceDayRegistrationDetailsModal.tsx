import { useEffect, useState } from "react";  
import OverviewTab from "../SpaceDayDetails/OverviewTab";  
import MembersTab from "../SpaceDayDetails/MembersTab";  
import PaymentTab from "../SpaceDayDetails/PaymentTab";  
import AccommodationTab from "../SpaceDayDetails/AccommodationTab";  
import DocumentsTab from "../SpaceDayDetails/DocumentsTab";  
import { eventThemes } from "../../../../components/spaceDay/registration/eventTheme";  
import { X, User, Users, CreditCard, Bed, FileText } from "lucide-react";  
import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

interface Props {  
  registration: SpaceDayRegistration;  
  onClose: () => void;  
  onStatusChanged: () => void;  
}

export default function SpaceDayRegistrationDetailsModal({  
  registration,  
  onClose,  
  onStatusChanged,  
}: Props) {  
  const [activeTab, setActiveTab] = useState("overview");  
  useEffect(() => {  
    const close = () => onClose();

    window.addEventListener("close-space-day-modal", close);

    return () => window.removeEventListener("close-space-day-modal", close);  
  }, []);

  if (!registration) return null;

  const theme = eventThemes[registration.eventType as keyof typeof eventThemes];

  const activeBorder = {  
    astroquiz: "border-b-blue-600",  
    astrodesign: "border-b-purple-600",  
    astromodeler: "border-b-orange-500",  
  }[registration.eventType as keyof typeof eventThemes];

  const tabs = [  
    { id: "overview", label: "Overview", icon: User },  
    { id: "members", label: "Members", icon: Users },  
    { id: "payment", label: "Payment", icon: CreditCard },  
    { id: "accommodation", label: "Accommodation", icon: Bed },  
    { id: "documents", label: "Documents", icon: FileText },  
  ];  
  return (  
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">  
      <div className="w-full max-w-6xl h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col">  
        {/* Header */}

        <div className="border-b border-[#EBE8E2] px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">  
          <div>  
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1B22]">Registration Details</h2>

            <div className="flex flex-wrap items-center gap-3 mt-2">  
              <span  
                className={`px-3 py-1 rounded-full text-sm font-semibold  
    ${theme.light}  
    ${theme.text}`}  
              >  
                {registration.eventType === "astroquiz" && "Astro Quiz"}

                {registration.eventType === "astrodesign" && "AI Astro Design"}

                {registration.eventType === "astromodeler" && "Astro Modeler"}  
              </span>

              <span className="text-[#8A8578]">  
                {registration.registrationId}  
              </span>  
            </div>  
          </div>

          <button  
            onClick={onClose}  
            className="self-end sm:self-auto rounded-xl border border-[#EBE8E2] p-2 hover:bg-red-50 hover:border-red-200 transition"  
          >  
            <X size={22} className="text-[#8A8578]" />  
          </button>  
        </div>

        {/* Tabs */}

        <div className="border-b border-[#EBE8E2] px-5 sm:px-8 overflow-x-auto">  
          <div className="flex gap-6 sm:gap-8 w-max min-w-full">  
            {tabs.map((tab) => {  
              const Icon = tab.icon;

              return (  
                <button  
                  key={tab.id}  
                  onClick={() => setActiveTab(tab.id)}  
                  className={`flex items-center gap-2 py-4 px-1 font-semibold border-b-2 whitespace-nowrap transition  
      ${  
        activeTab === tab.id  
          ? `${activeBorder} ${theme.text}`  
          : "border-transparent text-[#8A8578] hover:text-[#1C1B22]"  
      }`}  
                >  
                  <Icon size={18} />

                  {tab.label}  
                </button>  
              );  
            })}  
          </div>  
        </div>

        {/* Content */}

        <div className="flex-1 overflow-y-auto p-5 sm:p-8">  
          {activeTab === "overview" && (  
            <OverviewTab registration={registration} />  
          )}

          {activeTab === "members" && (  
            <MembersTab registration={registration} />  
          )}

          {activeTab === "payment" && (  
            <PaymentTab  
              registration={registration}  
              onStatusChanged={onStatusChanged}  
            />  
          )}

          {activeTab === "accommodation" && (  
            <AccommodationTab registration={registration} />  
          )}

          {activeTab === "documents" && (  
            <DocumentsTab registration={registration} />  
          )}  
        </div>  
      </div>  
    </div>  
  );  
}
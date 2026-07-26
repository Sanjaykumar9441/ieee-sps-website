export type EventType =
  | "astroquiz"
  | "astrodesign"
  | "astromodeler";

export interface Member {
  fullName: string;
  gender?: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  college: string;
  otherCollege: string;
  otherCollegeCity: string;
  otherCollegeDistrict: string;
  otherCollegeState: string;
  otherCollegePincode: string;
}


export interface TeamRegistrationData {
  eventType: EventType;

  teamName: string;
  teamSize: 2 | 3;

  members: Member[];

  accommodation: boolean;
  accommodationMembers: boolean[];

  arrivalDate: string;
  arrivalTime: string;

  departureDate: string;
  departureTime: string;
}

export interface IndividualRegistrationData {
  eventType: EventType;

  participant: Member;

  accommodation: boolean;

  arrivalDate: string;
  arrivalTime: string;

  departureDate: string;
  departureTime: string;
}

export type RegistrationType =
  | "individual"
  | "team";

export type PaymentStatus =
  | "Pending"
  | "Verified"
  | "Rejected";

export type RegistrationStatus =
  | "Pending"
  | "Approved"
  | "Rejected";

  export interface SpaceDayRegistration {
  _id: string;

  registrationId: string;

  eventType: EventType;

  registrationType: RegistrationType;

  teamName: string;

  teamSize: number;

  selectedTheme: string;

  members: Member[];

  accommodation: boolean;

  accommodationMembers: boolean[];

  arrivalDate: string;

  arrivalTime: string;

  departureDate: string;

  departureTime: string;

  transactionId: string;

  paymentScreenshot: string;

  registrationFee: number;

  accommodationFee: number;

  totalFee: number;

  paymentStatus: PaymentStatus;

  status: RegistrationStatus;

  createdAt: string;

  updatedAt: string;
}
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
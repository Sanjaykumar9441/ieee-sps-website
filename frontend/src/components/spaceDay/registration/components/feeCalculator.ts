interface FeeCalculationProps {
  eventFee: number;
  feeType: "team" | "student";

  accommodationFee: number;

  teamSize: number;

  accommodation: boolean;

  accommodationMembers?: boolean[];

  arrivalDate: string;
  departureDate: string;
}

export const calculateFees = ({
  eventFee,
  feeType,
  accommodationFee,
  teamSize,
  accommodation,
  accommodationMembers = [],
  arrivalDate,
  departureDate,
}: FeeCalculationProps) => {
  // Registration Fee
  const registrationFee =
    feeType === "team"
      ? eventFee
      : eventFee * teamSize;

  // Accommodation Fee
  let accommodationTotal = 0;
  let numberOfDays = 0;

  if (
    accommodation &&
    arrivalDate &&
    departureDate
  ) {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);

   const oneDay = 1000 * 60 * 60 * 24;

   numberOfDays =
  Math.floor(
    (departure.getTime() - arrival.getTime()) /
      oneDay
  ) + 1;

    const stayingMembers =
  accommodationMembers.length > 0
    ? accommodationMembers.filter(Boolean).length
    : teamSize;

accommodationTotal =
  accommodationFee *
  stayingMembers *
  numberOfDays;
  }

  return {
    registrationFee,
    accommodationTotal,
    numberOfDays,
    total:
      registrationFee +
      accommodationTotal,
  };
};
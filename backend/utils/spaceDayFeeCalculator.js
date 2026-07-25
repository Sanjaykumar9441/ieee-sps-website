const spaceDayConfig = require("../config/spaceDayConfig");

const calculateFees = ({
  eventType,

  teamSize,

  accommodation,

  accommodationMembers = [],

  arrivalDate,

  departureDate,
}) => {
  const config = spaceDayConfig[eventType];
  const participants = config.registrationType === "individual" ? 1 : teamSize;

  if (!config) {
    throw new Error("Invalid Event Type.");
  }

  /* ==========================
     Registration Fee
  ========================== */

  const registrationFee =
    config.feeType === "team"
      ? config.eventFee
      : config.eventFee * participants;

  /* ==========================
     Accommodation Fee
  ========================== */

  let accommodationTotal = 0;
  let numberOfDays = 0;

  if (accommodation && arrivalDate && departureDate) {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);

    const oneDay = 1000 * 60 * 60 * 24;

    numberOfDays =
      Math.floor((departure.getTime() - arrival.getTime()) / oneDay) + 1;

    const stayingMembers =
      accommodationMembers.length > 0
        ? accommodationMembers.filter(Boolean).length
        : participants;

    accommodationTotal =
      config.accommodationFee * stayingMembers * numberOfDays;
  }

  return {
    registrationFee,

    accommodationFee: accommodationTotal,

    numberOfDays,

    totalFee: registrationFee + accommodationTotal,
  };
};

module.exports = calculateFees;

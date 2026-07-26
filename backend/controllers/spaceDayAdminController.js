const SpaceDayRegistration = require("../models/SpaceDayRegistration");

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentStatus } = req.body;

    if (!["Verified", "Rejected"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    registration.paymentStatus = paymentStatus;

    registration.status =
      paymentStatus === "Verified"
        ? "Approved"
        : "Rejected";

    await registration.save();

    return res.json({
      success: true,
      message: `Payment ${paymentStatus}.`,
      registration,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
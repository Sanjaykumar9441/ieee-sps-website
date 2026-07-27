const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const { getIO } = require("../socket");
const {
  verifyRegistration,
} = require("../services/spaceDayVerificationService");

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentStatus } = req.body;

    const registration = await verifyRegistration({
      registrationId,
      paymentStatus,
      verifiedBy: "Dashboard Admin",
      method: "Dashboard",
    });

    return res.json({
      success: true,
      message: "Payment updated successfully.",
      registration,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    await SpaceDayRegistration.deleteOne({
      registrationId,
    });

    getIO().emit("registrationDeleted", {
      registrationId,
    });

    return res.json({
      success: true,
      message: "Registration deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
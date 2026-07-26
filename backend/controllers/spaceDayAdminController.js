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
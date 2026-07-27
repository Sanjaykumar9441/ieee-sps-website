const axios = require("axios");

const {
  verifyRegistration,
} = require("../services/spaceDayVerificationService");

const SpaceDayRegistration = require("../models/SpaceDayRegistration");

exports.telegramWebhook = async (req, res) => {
  try {
    console.log("Telegram Update:", JSON.stringify(req.body, null, 2));

    const callback = req.body.callback_query;

    if (!callback) {
      return res.sendStatus(200);
    }

    console.log("Callback Data:", callback.data);

    const action = callback.data.split(":")[0];

    const registrationId = callback.data.split(":")[1];

    const telegramUser = callback.from.username || callback.from.first_name;

    const paymentStatus = action === "verify" ? "Verified" : "Rejected";

    await verifyRegistration({
      registrationId,
      paymentStatus,
      verifiedBy: telegramUser,
      method: "Telegram",
    });

    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        callback_query_id: callback.id,
        text: `Payment ${paymentStatus}`,
        show_alert: false,
      },
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);

    return res.sendStatus(500);
  }
};

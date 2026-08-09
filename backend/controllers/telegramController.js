const axios = require("axios");

const {
  verifyRegistration,
} = require("../services/spaceDayVerificationService");

exports.telegramWebhook = async (req, res) => {
  const callback = req.body.callback_query;

  // Telegram expects a quick 200 response for non-callback updates.
  if (!callback) {
    return res.sendStatus(200);
  }

  const [action, registrationId] = callback.data.split(":");

  const telegramUser =
    callback.from.username || callback.from.first_name || "Telegram Admin";

  const paymentStatus = action === "verify" ? "Verified" : "Rejected";

  /*
   * IMPORTANT:
   * Answer Telegram immediately so the callback does not
   * remain pending while MongoDB / email / Telegram API work.
   */
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        callback_query_id: callback.id,
        text: `Processing ${paymentStatus}...`,
        show_alert: false,
      },
      {
        timeout: 8000,
      },
    );
  } catch (telegramError) {
    console.error(
      "Telegram callback response failed:",
      telegramError.code || telegramError.message,
    );
  }

  try {
    await verifyRegistration({
      registrationId,
      paymentStatus,
      verifiedBy: telegramUser,
      method: "Telegram",
    });

    console.log(
      `Telegram ${paymentStatus}: ${registrationId} by ${telegramUser}`,
    );

    return res.sendStatus(200);
  } catch (error) {
    /*
     * Already processed:
     * Do NOT return 500 because Telegram may retry the callback.
     */
    if (
      error.message === "Payment already verified." ||
      error.message === "Payment already rejected."
    ) {
      console.log(
        `Telegram callback already processed: ${registrationId} (${paymentStatus})`,
      );

      return res.sendStatus(200);
    }

    console.error(`Telegram ${paymentStatus} error:`, error.message);

    return res.sendStatus(200);
  }
};

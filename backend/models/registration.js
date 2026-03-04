const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  fullName: String,
  rollNo: String,
  email: String,
  phone: String,
  department: String,
  year: String,
  college: String,
});

const registrationSchema = new mongoose.Schema(
  {
    // combo | buildathon
    eventType: {
      type: String,
      required: true,
    },

    eventName: {
      type: String,
      required: true,
    },

    // Generated automatically
    registrationId: {
      type: String,
      unique: true,
    },

    teamName: {
      type: String,
      required: true,
    },

    teamSize: {
      type: Number,
      required: true,
    },

    teamMembers: [memberSchema],

    accommodationRequired: {
      type: Boolean,
      default: false,
    },

    hostelMembers: [memberSchema],

    payment: {
      userTransactionId: {
        type: String,
        unique: true,
      },
      screenshotUrl: String,
      verified: {
        type: Boolean,
        default: false,
      },
    },

    registrationStatus: {
      type: String,
      enum: ["Pending", "Confirmed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

// ✅ Generate Registration ID automatically
registrationSchema.pre("save", async function (next) {
  if (!this.registrationId) {
    const year = new Date().getFullYear();

    const lastRegistration = await this.constructor
      .findOne({ registrationId: new RegExp(`SPS${year}`) })
      .sort({ createdAt: -1 });

    let number = 1;

    if (lastRegistration) {
      const lastNumber = parseInt(
        lastRegistration.registrationId.split("-")[1],
      );
      number = lastNumber + 1;
    }

    const formattedNumber = String(number).padStart(3, "0");

    this.registrationId = `SPS${year}-${formattedNumber}`;
  }

  next();
});

module.exports = mongoose.model("Registration", registrationSchema);

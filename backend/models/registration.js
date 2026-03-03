const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  fullName: String,
  rollNo: String,
  email: String,
  phone: String,
  department: String,
  year: String,
  college: String
});

const registrationSchema = new mongoose.Schema(
  {
    // combo | buildathon
    eventType: {
      type: String,
      required: true
    },

    eventName: {
      type: String,
      required: true
    },

    // Generated automatically
    registrationId: {
      type: String,
      unique: true
    },

    teamName: {
      type: String,
      required: true
    },

    teamSize: {
      type: Number,
      required: true
    },

    teamMembers: [memberSchema],

    accommodationRequired: {
      type: Boolean,
      default: false
    },

    hostelMembers: [memberSchema],

    payment: {
      userTransactionId: String,
      screenshotUrl: String,
      verified: {
        type: Boolean,
        default: false
      }
    },

    registrationStatus: {
      type: String,
      enum: ["Pending", "Confirmed"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

// ✅ Generate Registration ID automatically
registrationSchema.pre("save", function () {
  if (!this.registrationId) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.registrationId = "SPS" + random;
  }
});

module.exports = mongoose.model("Registration", registrationSchema);
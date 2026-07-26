"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Preview;
const jsx_runtime_1 = require("react/jsx-runtime");
const VerificationEmail_1 = __importDefault(require("../templates/VerificationEmail"));
function Preview() {
    return ((0, jsx_runtime_1.jsx)(VerificationEmail_1.default, { participantName: "Sanjay Kumar", registrationId: "NSD260001", eventName: "AI Astro Design Competition", paymentStatus: "\uD83D\uDFE2 VERIFIED", whatsappLink: "https://chat.whatsapp.com/example", statusLink: "https://ieeespsaditya.vercel.app/space-day/status/NSD260001", primaryColor: "#9333EA" }));
}
//# sourceMappingURL=VerificationEmail.preview.js.map
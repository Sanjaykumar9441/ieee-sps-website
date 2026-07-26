"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VerificationEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailHeader_1 = __importDefault(require("../components/EmailHeader"));
const EmailFooter_1 = __importDefault(require("../components/EmailFooter"));
const InfoCard_1 = __importDefault(require("../components/InfoCard"));
const PrimaryButton_1 = __importDefault(require("../components/PrimaryButton"));
const HelpCard_1 = __importDefault(require("../components/HelpCard"));
const SuccessBadge_1 = __importDefault(require("../components/SuccessBadge"));
const AttachmentCard_1 = __importDefault(require("../components/AttachmentCard"));
function VerificationEmail({ participantName, registrationId, eventName, paymentStatus, whatsappLink, statusLink, primaryColor, }) {
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsx)(components_1.Head, {}), (0, jsx_runtime_1.jsx)(components_1.Body, { style: {
                    backgroundColor: "#F8FAFC",
                    fontFamily: "Inter, Arial, sans-serif",
                    padding: "30px 0",
                }, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: {
                        maxWidth: "700px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "18px",
                        overflow: "hidden",
                    }, children: [(0, jsx_runtime_1.jsx)(EmailHeader_1.default, { primary: primaryColor }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: { padding: "42px" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                                        fontSize: "36px",
                                        fontWeight: "700",
                                        color: primaryColor,
                                        textAlign: "center",
                                        marginBottom: "8px",
                                    }, children: "\uD83D\uDEF0 National Space Day 2026" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                                        fontSize: "22px",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        marginBottom: "28px",
                                    }, children: "Registration Successfully Verified" }), (0, jsx_runtime_1.jsx)(SuccessBadge_1.default, {}), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: {
                                        fontSize: "16px",
                                        marginTop: "32px",
                                        lineHeight: "28px",
                                    }, children: ["Hello ", (0, jsx_runtime_1.jsx)("strong", { children: participantName }), ","] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                                        fontSize: "16px",
                                        lineHeight: "30px",
                                    }, children: "Congratulations! Your payment has been verified successfully. Your registration is now confirmed for National Space Day 2026." }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: { margin: "32px 0" } }), (0, jsx_runtime_1.jsx)(InfoCard_1.default, { label: "Registration ID", value: registrationId }), (0, jsx_runtime_1.jsx)(InfoCard_1.default, { label: "Event", value: eventName }), (0, jsx_runtime_1.jsx)(InfoCard_1.default, { label: "Payment Status", value: paymentStatus }), (0, jsx_runtime_1.jsx)(AttachmentCard_1.default, {}), (0, jsx_runtime_1.jsx)(PrimaryButton_1.default, { href: whatsappLink, text: "\uD83D\uDFE2 Join Official WhatsApp Group", color: primaryColor }), (0, jsx_runtime_1.jsx)("div", { style: { height: "18px" } }), (0, jsx_runtime_1.jsx)(PrimaryButton_1.default, { href: statusLink, text: "\uD83C\uDF10 Check Registration Status", color: primaryColor }), (0, jsx_runtime_1.jsx)(HelpCard_1.default, {})] }), (0, jsx_runtime_1.jsx)(EmailFooter_1.default, {})] }) })] }));
}
//# sourceMappingURL=VerificationEmail.js.map
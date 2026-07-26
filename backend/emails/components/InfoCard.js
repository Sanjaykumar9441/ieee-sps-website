"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InfoCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
function InfoCard({ label, value, }) {
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: {
            padding: "14px",
            marginBottom: "12px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
        }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                    color: "#64748B",
                    fontSize: 12,
                }, children: label }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                    fontWeight: "bold",
                    fontSize: 16,
                }, children: value })] }));
}
//# sourceMappingURL=InfoCard.js.map
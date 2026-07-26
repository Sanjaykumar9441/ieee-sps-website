"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PrimaryButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
function PrimaryButton({ href, text, color, }) {
    return ((0, jsx_runtime_1.jsx)(components_1.Button, { href: href, style: {
            background: color,
            color: "#fff",
            padding: "14px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block",
        }, children: text }));
}
//# sourceMappingURL=PrimaryButton.js.map
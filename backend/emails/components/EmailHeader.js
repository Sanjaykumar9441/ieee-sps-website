"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EmailHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
function EmailHeader({ primary, }) {
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: {
            textAlign: "center",
            padding: "30px",
            borderBottom: `4px solid ${primary}`,
        }, children: [(0, jsx_runtime_1.jsx)(components_1.Img, { src: "https://ieeespsaditya.vercel.app/logos/ieee.png", width: "90" }), (0, jsx_runtime_1.jsx)(components_1.Heading, { style: {
                    marginTop: 20,
                    marginBottom: 10,
                }, children: "National Space Day 2026" }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: "IEEE SPS Student Branch Chapter" }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: "Aditya University" })] }));
}
//# sourceMappingURL=EmailHeader.js.map
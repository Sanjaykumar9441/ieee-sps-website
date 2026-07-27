import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />

    <Toaster
      position="top-right"
      gutter={12}
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "16px",
          background: "#fff",
          color: "#0f172a",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          padding: "16px",
        },
        success: {
          iconTheme: {
            primary: "#16a34a",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#fff",
          },
        },
      }}
    />
  </React.StrictMode>,
);

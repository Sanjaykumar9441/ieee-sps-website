import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";
import { Toaster } from "react-hot-toast";

<>
  <App />

  <Toaster
    position="top-right"
    reverseOrder={false}
    toastOptions={{
      duration: 4000,
      style: {
        borderRadius: "14px",
        background: "#ffffff",
        color: "#0f172a",
      },
    }}
  />
</>

createRoot(document.getElementById("root")!).render(<App />);

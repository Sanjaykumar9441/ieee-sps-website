import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

interface Props {
  onScan: (registrationId: string) => void;
}

export default function QRScanner({ onScan }: Props) {
  const scanned = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        if (scanned.current) return;

        scanned.current = true;

        const registrationId = decodedText.split("/").pop();

        if (!registrationId) {
          console.error("Invalid QR Code");
          return;
        }

        onScan(registrationId);
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return <div id="reader" />;
}
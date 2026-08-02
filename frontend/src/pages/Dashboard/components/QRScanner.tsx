import { Html5Qrcode } from "html5-qrcode";  
import { useEffect, useRef } from "react";

interface Props {  
  onScan: (registrationId: string) => void;  
  paused: boolean;  
}

export default function QRScanner({  
  onScan,  
  paused,  
}: Props) {  
  const qrRef = useRef<Html5Qrcode | null>(null);  
  const scanning = useRef(false);

  useEffect(() => {  
    const qr = new Html5Qrcode("reader");

    qrRef.current = qr;

    qr.start(  
      { facingMode: "environment" },  
      {  
        fps: 10,  
        qrbox: 250,  
      },  
      (decodedText) => {  
        if (paused) return;

        if (scanning.current) return;

        scanning.current = true;

        const registrationId =  
          decodedText.split("/").pop();

        if (registrationId) {  
          onScan(registrationId);  
        }  
      },  
      () => {},  
    );

    return () => {  
      qr.stop()  
        .then(() => qr.clear())  
        .catch(() => {});  
    };  
  }, []);

  useEffect(() => {  
    if (!paused) {  
      scanning.current = false;  
    }  
  }, [paused]);

  return <div id="reader" />;  
}
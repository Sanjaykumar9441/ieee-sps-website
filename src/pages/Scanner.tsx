import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

const Scanner = () => {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [team, setTeam] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [message, setMessage] = useState("Scan QR Code");
  const [color, setColor] = useState("text-white");
  const [entered, setEntered] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [scanLock, setScanLock] = useState(false);

  useEffect(() => {

    if (!token) {
      navigate("/");
      return;
    }

    const scanner = new Html5Qrcode("reader");

    const startScanner = async () => {

      try {

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },

          async (decodedText) => {

            if (scanLock) return;

            setScanLock(true);

            const registrationId = decodedText.split("/").pop();

            try {

              const res = await fetch(
                `https://ieee-sps-website.onrender.com/api/scan/${registrationId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );

              const data = await res.json();

              if (data.success) {

                new Audio("/beep.mp3").play();

                setColor("text-green-400");
                setMessage("✅ ENTRY SUCCESS");

                setTeam(data.teamName);
                setMembers(data.members);

              }

              else if (data.reason === "already") {

                new Audio("/beep.mp3").play();

                setColor("text-red-400");
                setMessage("⚠ ALREADY CHECKED IN");

                setTeam(data.teamName);
                setMembers([]);

              }

              else {

                setColor("text-red-400");
                setMessage("❌ INVALID QR");

              }

            } catch {

              setColor("text-yellow-400");
              setMessage("📴 Offline Scan Saved");

            }

            setTimeout(() => {

              setTeam("");
              setMembers([]);
              setMessage("Scan QR Code");
              setColor("text-white");
              setScanLock(false);

            }, 1500);

          },
          (error) => {
            console.log("QR Code scan error", error);
          }
        );

      } catch (err) {

        console.log("Camera start error", err);

      }

    };

    startScanner();

    return () => {
      scanner.stop().catch(() => {});
      scanner.clear();
    };

  }, []);

  return (

    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <h1 className="text-3xl text-cyan-400 mb-6">
        Arduino Days Entry Scanner
      </h1>

      <div className="mb-6 text-center">

        <p className="text-green-400 text-lg">
          Participants Entered: {entered}
        </p>

        <p className="text-yellow-400 text-lg">
          Remaining: {remaining}
        </p>

      </div>

      <div
        id="reader"
        style={{ width: "350px" }}
        className="border border-cyan-400 rounded"
      />

      <div className="mt-6 text-center">

        <h2 className={`text-2xl ${color}`}>
          {message}
        </h2>

        {team && (
          <>
            <p className="mt-2 text-lg">Team: {team}</p>

            {members.map((m, i) => (
              <div key={i}>{m}</div>
            ))}
          </>
        )}

      </div>

    </div>

  );

};

export default Scanner;
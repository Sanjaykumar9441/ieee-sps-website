import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const Scanner = () => {

  const [team, setTeam] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [message, setMessage] = useState("Scan QR Code");
  const [color, setColor] = useState("text-white");
  const [entered, setEntered] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [scanLock, setScanLock] = useState(false);

  useEffect(() => {

    const fetchStats = async () => {

      try {

        const res = await fetch(
          "https://ieee-sps-website.onrender.com/api/entry-stats"
        );

        const data = await res.json();

        setEntered(data.enteredParticipants);
        setRemaining(data.remainingParticipants);

      } catch {
        console.log("Stats error");
      }

    };

    fetchStats();

    const interval = setInterval(fetchStats, 5000);

    const scanner = new Html5Qrcode("reader");

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },

      async (decodedText) => {

  if (scanLock) return;

  setScanLock(true);

        try {

          const parts = decodedText.split("/");
          const registrationId = parts[parts.length - 1];

          const res = await fetch(
            `https://ieee-sps-website.onrender.com/api/entry/${registrationId}`
          );

          const data = await res.json();

          if (data.success) {

            setColor("text-green-400");
            setMessage("✅ ENTRY SUCCESS");

            setTeam(data.teamName);
            setMembers(data.members);

          }

          else if (data.reason === "already") {

             const beep = new Audio("/beep.mp3");
            beep.play();

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

          setColor("text-red-400");
          setMessage("❌ SCAN ERROR");

        }

        setTimeout(() => {
  setTeam("");
  setMembers([]);
  setMessage("Scan QR Code");
  setColor("text-white");
  setScanLock(false); // unlock scanner
}, 2500);

      },

      () => {}
    );

    // CLEANUP
    return () => {
      scanner.stop();
      clearInterval(interval);
    };

  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <h1 className="text-3xl text-cyan-400 mb-6">
        Arduino Days Entry Scanner
      </h1>

      {/* LIVE STATS */}
      <div className="mb-6 text-center">

        <p className="text-green-400 text-lg">
          Participants Entered: {entered}
        </p>

        <p className="text-yellow-400 text-lg">
          Remaining: {remaining}
        </p>

      </div>

      {/* CAMERA */}
      <div
        id="reader"
        style={{ width: "350px" }}
        className="border border-cyan-400 rounded"
      />

      {/* RESULT */}
      <div className="mt-6 text-center">

        <h2 className={`text-2xl ${color}`}>
          {message}
        </h2>

        {team && (
          <>
            <p className="mt-2 text-lg">Team: {team}</p>

            {members.length > 0 && (
              <>
                <p className="mt-2 font-semibold">Members:</p>

                {members.map((m, i) => (
                  <div key={i}>{m}</div>
                ))}

              </>
            )}

          </>
        )}

      </div>

    </div>
  );

};

export default Scanner;
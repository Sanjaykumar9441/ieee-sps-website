const ArduinoDays = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          Arduino Days 2026
        </h1>

        <div className="bg-card border border-border rounded-xl p-8 space-y-6">

          <p>
            IEEE SPS proudly presents <strong>Arduino Days 2026</strong> —
            a 4-day technical event designed to introduce students to
            Arduino, IoT fundamentals, and real-world embedded systems.
          </p>

          <ul className="space-y-2 list-disc pl-6">
            <li>📅 23–24 March: Two-Day Arduino & IoT Workshop</li>
            <li>📅 25 March: Full-Day Hackathon</li>
            <li>📅 26 March: Project Expo & Certification</li>
          </ul>

          <p>
            This event aims to build practical hardware development skills
            and encourage innovation among students.
          </p>

        </div>

      </div>
    </div>
  );
};

export default ArduinoDays;
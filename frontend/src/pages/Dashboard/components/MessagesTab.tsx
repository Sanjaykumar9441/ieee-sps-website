import { Trash2 } from "lucide-react";

const MessagesTab = ({
  messages,
  deleteMessage,
  cardStyle,
}: any) => {
  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Messages
        </h2>

        <p className="text-sm" style={{ color: "#64748b" }}>
          {messages.length} contact messages
        </p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {messages.map((m: any) => (
          <div
            key={m._id}
            className="p-5 rounded-xl relative group"
            style={cardStyle}
          >
            <button
              onClick={() => deleteMessage(m._id)}
              className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <Trash2 size={14} />
            </button>

            <p
              className="font-semibold text-sm mb-0.5"
              style={{ color: "#f0f4ff" }}
            >
              {m.name}
            </p>

            <p
              className="text-xs mb-3"
              style={{ color: "#64748b" }}
            >
              {m.email}
            </p>

            <p
              className="text-sm leading-relaxed"
              style={{ color: "#94a3b8" }}
            >
              {m.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessagesTab;
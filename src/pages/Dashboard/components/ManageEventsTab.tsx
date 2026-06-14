import EditableEvent from "./EditableEvent";

const ManageEventsTab = ({
  events,
  handleUpdate,
  deleteEvent,
  cardStyle,
}: any) => {
  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Manage Events
        </h2>

        <p className="text-sm" style={{ color: "#64748b" }}>
          {events.length} events total
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl" style={cardStyle}>
        <table className="w-full">
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(99,179,237,0.08)",
              }}
            >
              <th
                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Event Name
              </th>

              <th
                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Status
              </th>

              <th
                className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {events.map((event: any) => (
              <EditableEvent
                key={event._id}
                event={event}
                onUpdate={handleUpdate}
                onDelete={deleteEvent}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageEventsTab;
import { useState } from "react";
import EditableEvent from "./EditableEvent";

const ManageEventsTab = ({
  events,
  handleUpdate,
  deleteEvent,
  cardStyle,
}: any) => {
  const [search, setSearch] = useState("");

  const filteredEvents = events.filter((event: any) =>
    event.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Manage Events
          </h2>

          <p className="text-sm text-slate-500">{events.length} events total</p>
        </div>

        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
      w-full md:w-72
      px-4 py-3
      rounded-xl
      bg-[#0F172A]
      border border-slate-700
      text-white
      placeholder:text-slate-500
      outline-none
      focus:border-[#00629B]
      transition
    "
        />
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
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-500">
                  No events found.
                </td>
              </tr>
            ) : (
              filteredEvents.map((event: any) => (
                <EditableEvent
                  key={event._id}
                  event={event}
                  onUpdate={handleUpdate}
                  onDelete={deleteEvent}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageEventsTab;

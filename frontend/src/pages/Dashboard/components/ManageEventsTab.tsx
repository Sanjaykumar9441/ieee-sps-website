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
            style={{ fontFamily: "'Inter', sans-serif" }}  
          >  
            Manage Events  
          </h2>

          <p className="text-sm text-[#B5B1A8]">{events.length} events total</p>  
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
      bg-[#FAF9F7]  
      border border-[#EBE8E2]  
      text-[#1C1B22]  
      placeholder:text-[#B5B1A8]  
      outline-none  
      focus:border-[#7C6FEF]  
      transition  
    "  
        />  
      </div>

      <div className="overflow-x-auto rounded-xl" style={cardStyle}>  
        <table className="w-full">  
          <thead>  
            <tr  
              style={{  
                borderBottom: "1px solid #EBE8E2",  
              }}  
            >  
              <th  
                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"  
                style={{ color: "#8A8578" }}  
              >  
                Event Name  
              </th>

              <th  
                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"  
                style={{ color: "#8A8578" }}  
              >  
                Status  
              </th>

              <th  
                className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-widest"  
                style={{ color: "#8A8578" }}  
              >  
                Actions  
              </th>  
            </tr>  
          </thead>

          <tbody>  
            {filteredEvents.length === 0 ? (  
              <tr>  
                <td colSpan={3} className="text-center py-10 text-[#B5B1A8]">  
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
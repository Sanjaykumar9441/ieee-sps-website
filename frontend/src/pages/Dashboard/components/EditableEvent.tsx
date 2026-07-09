import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
} from "lucide-react";

import InputField from "./InputField";
import GradientButton from "./GradientButton";
import StatusBadge from "./StatusBadge";

/* ── EDITABLE EVENT ── */
const EditableEvent = ({ event, onUpdate, onDelete }: any) => {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    status: event.status,
    pageType: event.pageType || "regular",
    customPage: event.customPage || "",
    images: null,
  });

  return (
    <>
      <tr
        className="border-b transition-colors"
        style={{ borderColor: "rgba(99,179,237,0.08)" }}
      >
        <td
          className="px-5 py-4 text-sm font-medium"
          style={{ color: "#f0f4ff" }}
        >
          {event.title}
        </td>
        <td className="px-5 py-4">
          <StatusBadge status={event.status} />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setEdit(!edit)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: "rgba(59,130,246,0.12)",
                color: "#60a5fa",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              {edit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {edit ? "Collapse" : "Edit"}
            </button>
            <button
              onClick={() => onDelete(event._id)}
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {edit && (
        <tr style={{ backgroundColor: "rgba(15,22,36,0.8)" }}>
          <td colSpan={3} className="px-5 py-5">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Title"
                value={data.title}
                onChange={(e: any) =>
                  setData({ ...data, title: e.target.value })
                }
                placeholder="Event title"
              />
              <InputField
                label="Date"
                type="date"
                value={data.date}
                onChange={(e: any) =>
                  setData({ ...data, date: e.target.value })
                }
              />
              <InputField
                label="Location"
                value={data.location}
                onChange={(e: any) =>
                  setData({ ...data, location: e.target.value })
                }
                placeholder="Location"
              />
              <InputField
                label="Status"
                as="select"
                value={data.status}
                onChange={(e: any) =>
                  setData({ ...data, status: e.target.value })
                }
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </InputField>
              <InputField
                label="Page Type"
                as="select"
                value={data.pageType}
                onChange={(e: any) =>
                  setData({ ...data, pageType: e.target.value })
                }
              >
                <option value="regular">Regular Event</option>
                <option value="custom">Custom Event</option>
              </InputField>

              {data.pageType === "custom" && (
                <InputField
                  label="Custom Page"
                  as="select"
                  value={data.customPage}
                  onChange={(e: any) =>
                    setData({ ...data, customPage: e.target.value })
                  }
                >
                  <option value="">Select Page</option>
                  <option value="arduino-days">Arduino Days</option>
                  <option value="membership-drive">Membership Drive</option>
                </InputField>
              )}
              <div className="col-span-2">
                <InputField
                  label="Description"
                  as="textarea"
                  value={data.description}
                  onChange={(e: any) =>
                    setData({ ...data, description: e.target.value })
                  }
                  placeholder="Event description"
                />
              </div>
              {data.status === "Completed" && (
                <div className="col-span-2">
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                    style={{ color: "#64748b" }}
                  >
                    Event Images
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e: any) =>
                      setData({ ...data, images: e.target.files })
                    }
                    className="text-sm"
                    style={{ color: "#94a3b8" }}
                  />
                </div>
              )}
              <div className="col-span-2 flex gap-3 pt-2">
                <GradientButton
                  color="green"
                  small
                  onClick={() => {
                    onUpdate(event, data);
                    setEdit(false);
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <Check size={12} /> Save Changes
                  </span>
                </GradientButton>
                <GradientButton
                  color="gray"
                  small
                  onClick={() => setEdit(false)}
                >
                  Cancel
                </GradientButton>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default EditableEvent;
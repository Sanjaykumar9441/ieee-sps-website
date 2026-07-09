import { Upload } from "lucide-react";

import InputField from "../components/InputField";
import GradientButton from "../components/GradientButton";

const UploadEventTab = ({
  handleEventUpload,

  title,
  setTitle,

  description,
  setDescription,

  date,
  setDate,

  location,
  setLocation,

  status,
  setStatus,

  pageType,
  setPageType,

  customPage,
  setCustomPage,

  setImages,

  cardStyle,
}: any) => {
  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Upload Event
        </h2>

        <p className="text-sm" style={{ color: "#64748b" }}>
          Add a new event to the website
        </p>
      </div>

      <form
        onSubmit={handleEventUpload}
        style={{ ...cardStyle, padding: "28px", maxWidth: "560px" }}
      >
        <div className="space-y-4">
          <InputField
            label="Event Title"
            value={title}
            onChange={(e: any) => setTitle(e.target.value)}
            placeholder="e.g. Arduino Days 2026"
          />

          <InputField
            label="Description"
            as="textarea"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
            placeholder="Brief event description..."
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Date"
              type="date"
              value={date}
              onChange={(e: any) => setDate(e.target.value)}
            />

            <InputField
              label="Location"
              value={location}
              onChange={(e: any) => setLocation(e.target.value)}
              placeholder="Venue / Online"
            />
          </div>

          <InputField
            label="Status"
            as="select"
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </InputField>

          <InputField
            label="Page Type"
            as="select"
            value={pageType}
            onChange={(e: any) => setPageType(e.target.value)}
          >
            <option value="regular">Regular Event</option>
            <option value="custom">Custom Event</option>
          </InputField>

          {pageType === "custom" && (
            <InputField
              label="Custom Page"
              as="select"
              value={customPage}
              onChange={(e: any) => setCustomPage(e.target.value)}
            >
              <option value="">Select Page</option>
              <option value="arduino-days">Arduino Days</option>
              <option value="membership-drive">Membership Drive</option>
            </InputField>
          )}

          {status === "Completed" && (
            <div>
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{ color: "#64748b" }}
              >
                Event Images
              </label>

              <div
                className="rounded-xl p-5 text-center text-sm"
                style={{
                  border: "2px dashed rgba(99,179,237,0.2)",
                  backgroundColor: "rgba(59,130,246,0.04)",
                  color: "#64748b",
                }}
              >
                <Upload
                  size={20}
                  className="mx-auto mb-2"
                  style={{ color: "#3b82f6" }}
                />

                <input
                  type="file"
                  multiple
                  required
                  onChange={(e: any) => setImages(e.target.files)}
                  className="text-sm"
                  style={{ color: "#94a3b8" }}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <GradientButton>
              <span className="flex items-center gap-2">
                <Upload size={14} />
                Upload Event
              </span>
            </GradientButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UploadEventTab;
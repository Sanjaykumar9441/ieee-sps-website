import { X, Download } from "lucide-react";

interface Props {
  image: string;
  title?: string;
  onClose: () => void;
}

export default function SpaceDayImagePreviewModal({
  image,
  title = "Image Preview",
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="relative w-full max-w-5xl">

        {/* Header */}

        <div className="flex items-center justify-between mb-4">

          <h2 className="text-white text-xl font-bold">
            {title}
          </h2>

          <div className="flex gap-3">

            <a
              href={image}
              download
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white p-2 hover:bg-slate-100"
            >
              <Download size={20} />
            </a>

            <button
              onClick={onClose}
              className="rounded-lg bg-white p-2 hover:bg-red-100"
            >
              <X size={20} />
            </button>

          </div>

        </div>

        {/* Image */}

        <div className="rounded-2xl overflow-hidden bg-white shadow-2xl">

          <img
            src={image}
            alt="Preview"
            className="w-full max-h-[80vh] object-contain"
          />

        </div>

      </div>

    </div>
  );
}
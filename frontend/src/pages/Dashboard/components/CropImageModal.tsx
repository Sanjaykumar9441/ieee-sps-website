import Cropper from "react-easy-crop";
import { useState } from "react";
import getCroppedImg from "../../../utils/cropImage";

interface Props {
  image: string;
  onClose: () => void;
  onSave: (file: File) => void;
}

const CropImageModal = ({ image, onClose, onSave }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleSave = async () => {
    try {
      const croppedFile = await getCroppedImg(
        image,
        croppedAreaPixels
      );

      onSave(croppedFile);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        
        {/* Header */}
        <h2 className="text-xl font-bold text-center text-slate-900">
          Crop Profile Photo
        </h2>

        <p className="text-sm text-slate-500 text-center mt-1 mb-5">
          Adjust and zoom your image before saving
        </p>

        {/* Crop Area */}
        <div className="relative h-72 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) =>
              setCroppedAreaPixels(croppedAreaPixels)
            }
          />
        </div>

        {/* Zoom Slider */}
        <div className="mt-5">
          <label className="text-sm font-medium text-slate-600">
            Zoom Image
          </label>

          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full mt-2 accent-[#00629B]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="
              flex-1
              py-3
              rounded-xl
              border
              border-slate-300
              text-slate-700
              font-medium
              hover:bg-slate-50
              transition
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="
              flex-1
              py-3
              rounded-xl
              bg-[#00629B]
              text-white
              font-medium
              hover:bg-[#00517f]
              transition
            "
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropImageModal;
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
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-xl p-5 w-[90%] max-w-lg">
        <div className="relative h-80">
          <Cropper
  image={image}
  crop={crop}
  zoom={zoom}
  aspect={1}
  cropShape="round"
  onCropChange={setCrop}
  onZoomChange={setZoom}
  onCropComplete={(_, croppedAreaPixels) =>
    setCroppedAreaPixels(croppedAreaPixels)
  }
/>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#00629B] text-white rounded"
          >
            Save Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropImageModal;
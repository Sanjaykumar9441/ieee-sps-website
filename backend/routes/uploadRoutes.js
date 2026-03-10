const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG images allowed"));
    }
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "registrations" },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );

      stream.end(file.buffer);
    });

    res.json({ url: result.secure_url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
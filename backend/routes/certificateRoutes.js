const express = require("express");
const multer = require("multer");

const verifyToken = require("../middleware/verifyToken");

const {
  importCertificates,
  getCertificate,
  downloadCertificate,
} = require("../controllers/certificateController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/import",
  verifyToken,
  upload.single("file"),
  importCertificates
);

router.get("/verify/:rollNo", getCertificate);

router.get("/download/:rollNo", downloadCertificate);

module.exports = router;
const express = require("express");
const multer = require("multer");

const {
  importCertificates,
  getCertificate,
  downloadCertificate,
  getAdminCertificates,
  updateAdminCertificate,
  exportAdminCertificates,
} = require("../controllers/certificateController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ============================================================
// IMPORT CERTIFICATE EXCEL
// ============================================================

router.post("/import", upload.single("file"), importCertificates);

// ============================================================
// ADMIN CERTIFICATE MANAGEMENT
// ============================================================

router.get("/admin", getAdminCertificates);

router.put("/admin/:certificateId", updateAdminCertificate);

router.get("/admin/export", exportAdminCertificates);

// ============================================================
// PUBLIC CERTIFICATE
// ============================================================

router.get("/verify/:rollNo", getCertificate);

router.get("/download/:rollNo", downloadCertificate);

module.exports = router;

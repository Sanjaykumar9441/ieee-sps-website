const express = require("express");
const multer = require("multer");

const {
  getCertificateEvents,
  createCertificateEvent,
} = require("../controllers/certificateEventController");

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
// ADMIN CERTIFICATE EVENTS
// ============================================================

router.get("/events", getCertificateEvents);
router.post("/events", createCertificateEvent);

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

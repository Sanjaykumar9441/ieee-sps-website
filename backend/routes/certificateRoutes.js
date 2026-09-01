const express = require("express");
const multer = require("multer");

const {
  importCertificates,
  getCertificate,
  downloadCertificate,
  getAdminCertificates,
  updateAdminCertificate,
  exportAdminCertificates,
  exportAdminCertificatePdfs,
} = require("../controllers/certificateController");

const {
  listEvents,
  createEvent,
  deleteEvent,
} = require("../controllers/certificateEventController");

const {
  listMembers,
  addMember,
  editMember,
  deleteMember,
  deleteMembers,
} = require("../controllers/certificateMemberController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ============================================================
// EVENTS
// ============================================================

router.get("/events", listEvents);

router.post("/events", createEvent);

router.delete("/events/:eventCode", deleteEvent);

// ============================================================
// IMPORT
// ============================================================

router.post("/import", upload.single("file"), importCertificates);

// ============================================================
// ADMIN CERTIFICATE MANAGEMENT
// ============================================================

// List certificates
router.get("/admin", getAdminCertificates);

// Add member
router.post("/admin/member", addMember);

// Edit member
router.put("/admin/member/:id", editMember);

// Delete one member
router.delete("/admin/member/:id", deleteMember);

// Delete selected members
router.post("/admin/members/delete", deleteMembers);

// Existing edit endpoint
router.put("/admin/:certificateId", updateAdminCertificate);

// Export
router.get("/admin/export", exportAdminCertificates);

router.get("/admin/export-pdfs", exportAdminCertificatePdfs);

// ============================================================
// PUBLIC CERTIFICATE
// ============================================================

router.get("/verify/:rollNo", getCertificate);

router.get("/download/:rollNo", downloadCertificate);

module.exports = router;

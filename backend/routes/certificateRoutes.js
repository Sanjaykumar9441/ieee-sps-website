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
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/events", listEvents);
router.post("/events", createEvent);
router.delete("/events/:eventCode", deleteEvent);

router.post("/import", upload.single("file"), importCertificates);

router.get("/admin", getAdminCertificates);
router.post("/admin/member", addMember);
router.put("/admin/member/:id", editMember);
router.delete("/admin/member/:id", deleteMember);
router.post("/admin/members/delete", deleteMembers);
router.put("/admin/:certificateId", updateAdminCertificate);
router.get("/admin/export", exportAdminCertificates);

// Downloads ONE combined PDF. This intentionally does not use archiver/ZIP.
router.get("/admin/export-pdfs", exportAdminCertificatePdfs);

router.get("/verify/:rollNo", getCertificate);
router.get("/download/:rollNo", downloadCertificate);

module.exports = router;

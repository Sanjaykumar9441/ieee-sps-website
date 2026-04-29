const express = require("express");
const router = express.Router();

const { getGalleryByDay } = require("../controllers/galleryController");

router.get("/gallery/:day", getGalleryByDay);

module.exports = router;
/** Materials: POST /upload — multipart field `file` (PDF) **or** body field `url` (https). */
const express = require("express");
const multer = require("multer");
const { uploadMaterial, getMyMaterials } = require("../controllers/materials.controller");
const upload = require("../middlewares/uploadMaterial.middleware");

const router = express.Router();

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message || "Upload error" });
  });
};

router.post("/upload", handleUpload, uploadMaterial);
router.get("/mine", getMyMaterials);

module.exports = router;

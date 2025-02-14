const express = require('express');
const driveController = require('../controllers/driveController');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Import the JWT authentication middleware
const authenticateJWT = require('../middlewares/authenticateJWT');

const router = express.Router();

router.get("/files", authenticateJWT, driveController.getFiles);
router.delete("/delete", authenticateJWT, driveController.deleteFile);
router.post("/upload", authenticateJWT, upload.single("file"), driveController.uploadFile);

module.exports = router;

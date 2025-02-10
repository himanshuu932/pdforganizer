const express = require('express');
const driveController = require('../controllers/driveController');

const router = express.Router();
const multer=require("multer"); 
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/files", driveController.getFiles);
router.delete("/delete", driveController.deleteFile);
router.post("/upload", upload.single("file"), driveController.uploadFile);
module.exports = router;

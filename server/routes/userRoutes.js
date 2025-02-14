// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

// Import the JWT authentication middleware
const authenticateJWT = require('../middlewares/authenticateJWT');

const router = express.Router();

// Route to get texts for the logged-in user
router.get('/texts', authenticateJWT, userController.getUserTexts);

// Route to get folder links for the logged-in user
router.get('/folder-links', authenticateJWT, userController.getUserFolderLinks);

// Route to save a folder link for the logged-in user
router.post('/save-folder', authenticateJWT, userController.saveFolderLink);

// Route to delete a folder link for the logged-in user
router.post('/delete-folder', authenticateJWT, userController.deleteFolderLink);

module.exports = router;

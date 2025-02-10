const express = require('express');
const userController = require('../controllers/userController');
const { ensureUserExists } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get texts for the logged-in user
router.get('/texts', ensureUserExists, userController.getUserTexts);

// Route to get folder links for the logged-in user
router.get('/folder-links', ensureUserExists, userController.getUserFolderLinks);

// Route to save a folder link for the logged-in user
router.post('/save-folder', ensureUserExists, userController.saveFolderLink);

// Route to delete a folder link for the logged-in user
router.post('/delete-folder', ensureUserExists, userController.deleteFolderLink);

module.exports = router;

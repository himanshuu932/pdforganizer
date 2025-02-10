const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');

const router = express.Router();

router.get("/google", authController.googleAuth);
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/" }), authController.googleAuthCallback);
router.get("/logout", authController.logout);
router.get("/current_user", authController.getCurrentUser);

module.exports = router;

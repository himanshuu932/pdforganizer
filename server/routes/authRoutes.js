const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authenticateJWT');
const router = express.Router();

router.get("/google", authController.googleAuth);
router.get("/google/callback", passport.authenticate("google", {session: false, failureRedirect: "/" }), authController.googleAuthCallback);
router.get("/logout", authController.logout);
router.get("/current_user",authenticateJWT, authController.getCurrentUser);

module.exports = router;

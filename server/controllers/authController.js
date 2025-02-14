const passport = require("passport");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const authController = {
  // Initiates Google OAuth2 flow
  googleAuth: passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"],
    accessType: "offline",
    prompt: "consent",
  }),

  // Callback after Google authentication; generates a JWT
  googleAuthCallback: (req, res) => {
  
    // Generate a JWT payload with user information and OAuth2 credentials
    const payload = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    };

    // Sign the token using your JWT secret; adjust expiration as needed
    const token = jwt.sign(payload, '1234', { expiresIn: '1d' });
   
    const encodedUsername = encodeURIComponent(req.user.name);
    // Redirect to the client with the token (you may also choose to send JSON)
    res.redirect(`https://iridescent-raindrop-1c2f36.netlify.app?username=${encodedUsername}&token=${token}&status=success`);
  },

  // Since JWTs are stateless, logging out is handled client-side by discarding the token.
  logout: async (req, res) => {
    res.json({ message: "Logout successful. Please remove the token from your client." });
  },

  // Returns the current user and creates an OAuth2 client using JWT credentials
  getCurrentUser: (req, res) => {
   
    if (req.user) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.CALLBACK_URL2,
      );

      oauth2Client.setCredentials({
        access_token: req.user.accessToken,
        refresh_token: req.user.refreshToken,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });
    
      
      res.json({ user: req.user, drive });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  },
};

module.exports = authController;

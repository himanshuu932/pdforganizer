const passport = require("passport");
const { google } = require("googleapis");
const axios = require("axios");
const authController = {
  googleAuth: passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"],
    accessType: "offline",
    prompt: "consent",
  }),

  googleAuthCallback: (req, res) => {
    req.session.save((err) => {
      if (err) {
        console.error("❌ Error saving session:", err);
        return res.redirect(`http://localhost:3000?status=error`);
      }
    
      // Store Google OAuth2 credentials in session
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:5000/auth/google/callback"
      );
    
      oauth2Client.setCredentials({
        access_token: req.user.accessToken,
        refresh_token: req.user.refreshToken,
      });
    
      req.session.oauth2Credentials = {
        access_token: req.user.accessToken,
        refresh_token: req.user.refreshToken,
      };
      console.log("✅ Google OAuth2 credentials stored in session");
    
      const encodedUsername = encodeURIComponent(req.user.name);
      res.redirect(`http://localhost:3000?username=${encodedUsername}&status=success`);
    
     
    });
    
  },

  logout: async (req, res) => {
    if (req.isAuthenticated()) {
      const sessionID = req.sessionID;
      console.log("🔍 Session ID before logout:", sessionID);

      req.logout((err) => {
        if (err) {
          console.error("❌ Logout Error:", err);
          return res.status(500).json({ message: "Logout Error" });
        }

        req.session.destroy((err) => {
          if (err) {
            console.error("❌ Session destroy error:", err);
            return res.status(500).json({ message: "Session destroy error" });
          }

          res.clearCookie("connect.sid");
          console.log("✅ User logged out and session destroyed");
          res.json({ message: "OK" });
        });
      });
    } else {
      res.status(400).json({ message: "No user logged in" });
    }
  },

  getCurrentUser: (req, res) => {
    if (req.user) {
    
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:5000/auth/google/callback"
      );

      // Set credentials from the session
      if (req.session.oauth2Credentials) {
        oauth2Client.setCredentials(req.session.oauth2Credentials);
      }

      const drive = google.drive({ version: "v3", auth: oauth2Client });
      
      res.json({ user: req.user, drive });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  },
};

module.exports = authController;

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { User } = require('../models/text'); // Ensure correct path
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL2,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔄 Google Profile Received:", profile.displayName);

        // Find user in DB by their Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create new user with Drive permissions
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            accessToken,
            refreshToken,
            hasDrivePermissions: true, // Assuming they grant Drive permissions on first login
          });
          console.log("✅ New User Created:", user.name);
        } else {
          console.log("✅ User Found:", user.name);

          // Update tokens if Drive permissions weren't granted yet
          if (!user.hasDrivePermissions) {
            console.log("🔑 Updating tokens for Drive access...");
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            user.hasDrivePermissions = true;
            await user.save();
          } else {
            console.log("🚀 User already granted Drive permissions.");
          }
        }

        // Pass the user object to the next middleware (your auth controller)
        done(null, user);
      } catch (error) {
        console.error("❌ Error in Google Strategy:", error);
        done(error, null);
      }
    }
  )
);

// Since we are using JWTs, session serialization/deserialization is not needed.
// You can remove or comment out these functions.

// passport.serializeUser((user, done) => {
//   console.log("🔒 Serializing User ID:", user.id);
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   console.log("🔍 Deserializing User by ID:", id);
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

module.exports = passport;

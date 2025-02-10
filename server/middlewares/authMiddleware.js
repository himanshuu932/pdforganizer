const {User} =require("../models/text.js");
const ensureUserExists = async (req, res, next) => {

  if (!req.isAuthenticated() ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      req.logout(err => {
        if (err) console.error("❌ Logout Error:", err);
        req.session.destroy(() => res.status(401).json({ message: "User no longer exists" }));
      });
    } else {
      req.user = user;
      next();
    }
  } catch (error) {
    console.error("❌ Error checking user existence:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { ensureUserExists };

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('dotenv').config();
const pdfController = require('./controllers/pdfController');
// ✅ Import Passport Configuration
require('./config/passport');  // 🔥 Ensure Google Strategy is registered

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const driveRoutes = require('./routes/driveRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const app = express();
const port = 5000;

// CORS Configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session Configuration
app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 86400000,  
  },
}));

// Initialize Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/pdf', pdfController.router);
// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pdfController = require('./controllers/pdfController');

// Import Passport Configuration (for Google OAuth or other strategies)
require('./config/passport');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const driveRoutes = require('./routes/driveRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

// Import JWT authentication middleware from the middlewares folder
const authenticateJWT = require('./middlewares/authenticateJWT');

const app = express();
const port = 5000;

// CORS Configuration
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Remove session middleware since we're using JWT
// app.use(session({...}));

// Initialize Passport (if using Passport for OAuth)
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/pdf',authenticateJWT ,pdfController.router);

// Example: Protected route using JWT middleware
app.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'You are authorized!', user: req.user });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

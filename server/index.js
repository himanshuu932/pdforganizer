import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/routes.js"; // Ensure the correct file extension

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", router);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

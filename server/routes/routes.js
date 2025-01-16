import { Router } from "express";
import  base  from "../controllers/index.js";
const router = Router();

// Define the route
router.get("/", base);

export default router;

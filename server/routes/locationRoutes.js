import express from "express";
import { getLocations, createLocation } from "../controllers/locationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getLocations);
router.post("/", protect, admin, createLocation);

export default router;
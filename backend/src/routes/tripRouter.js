import express from "express";
import { generateTripPlan } from "../controllers/tripController.js";

const router = express.Router();

// ============================================================
// TRIP PLANNER ROUTES
// POST /api/v1/trip         - Generate AI trip plan
// POST /api/v1/trip/plan    - Alternative endpoint
// POST /api/v1/trip/trip    - Compatible nested endpoint
// ============================================================
router.post("/", generateTripPlan);
router.post("/plan", generateTripPlan);
router.post("/trip", generateTripPlan);

export default router;

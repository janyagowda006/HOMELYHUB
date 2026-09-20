import express from "express";
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  generatePropertyDescription,
  getMyAccomodations,
} from "../controllers/propertyController.js";
import { generateTripPlan } from "../controllers/tripController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// ============================================================
// PROPERTY ROUTES
// ============================================================

// GET /api/v1/properties/myAccomodation or /api/v1/rent/user/myAccomodation
router.get("/myAccomodation", protect, getMyAccomodations);
router.get("/user/myAccomodation", protect, getMyAccomodations);

// GET /api/v1/properties - Filter, search, sort, and paginate properties
// POST /api/v1/properties - Host creates/lists a new property (Protected)
router
  .route("/")
  .get(getAllProperties)
  .post(protect, createProperty);

// AI & Trip Planner endpoints (defined before /:id)
// POST /api/v1/rent/trip or /api/v1/properties/trip
router.post("/trip", generateTripPlan);

// POST /api/v1/rent/user/generateDescription or /api/v1/properties/user/generateDescription
router.post("/user/generateDescription", generatePropertyDescription);

// GET /api/v1/properties/slug/:id - Find by human-friendly slug
router.get("/slug/:id", getPropertyById);

// GET /api/v1/properties/:id - Get property details by ID (or slug)
// PATCH /api/v1/properties/:id - Update property details (Protected, host only)
// DELETE /api/v1/properties/:id - Delete property & remove its ImageKit images (Protected)
router
  .route("/:id")
  .get(getPropertyById)
  .patch(protect, updateProperty)
  .delete(protect, deleteProperty);

export default router;


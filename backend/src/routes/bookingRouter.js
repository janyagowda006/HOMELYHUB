import express from "express";
import {
  createOrder,
  confirmPayment,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
} from "../controllers/bookingController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// 1. Create order & get all bookings (admin/host)
router
  .route("/")
  .get(restrictTo("admin", "host"), getAllBookings)
  .post(createOrder);

// 2. Direct alias for creating booking order
router.post("/createOrder", createOrder);

// 3. Confirm payment & finalize booking
router.post("/confirmPayment", confirmPayment);

// 4. Current user's booking history
router.get("/myBookings", getMyBookings);

// 5. Single booking details & cancellation
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);

export default router;

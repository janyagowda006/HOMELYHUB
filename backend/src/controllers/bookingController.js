import crypto from "node:crypto";
import mongoose from "mongoose";
import Property from "../Models/propertyModel.js";
import Booking from "../Models/bookingModel.js";

// ============================================================
// ERROR RESPONSE HELPER
// Consistent error formatting across controllers
// ============================================================
const sendErrorResponse = (res, error, defaultStatusCode = 400) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      status: "fail",
      message: messages.join(". "),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
    return res.status(409).json({
      status: "fail",
      message: `A record with this ${field} already exists.`,
    });
  }

  const statusCode =
    typeof error.statusCode === "number" ? error.statusCode : defaultStatusCode;

  return res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message: error.message || "An unexpected error occurred.",
  });
};

// ============================================================
// 1. CREATE ORDER (Booking checkout intent)
// Verifies property exists, checks dates availability in DB,
// calculates pricing, generates unique orderId, and creates booking.
// ============================================================
export const createOrder = async (req, res) => {
  try {
    const {
      propertyId,
      property: propParam,
      checkInDate: checkInParam,
      fromDate,
      checkOutDate: checkOutParam,
      toDate,
      guests,
      specialRequests,
      guestContact,
    } = req.body;

    const targetPropertyId = propertyId || propParam;
    const checkIn = new Date(checkInParam || fromDate);
    const checkOut = new Date(checkOutParam || toDate);

    // 1) Validate required inputs
    if (!targetPropertyId) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide a valid propertyId.",
      });
    }

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide valid check-in and check-out dates.",
      });
    }

    // 2) Validate dates range
    if (checkOut <= checkIn) {
      return res.status(400).json({
        status: "fail",
        message: "Check-out date must be after check-in date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      return res.status(400).json({
        status: "fail",
        message: "Check-in date cannot be in the past.",
      });
    }

    // 3) Check with database if property exists
    const property = await Property.findById(targetPropertyId);
    if (!property) {
      return res.status(404).json({
        status: "fail",
        message: "Property not found with the provided ID.",
      });
    }

    if (!property.isAvailable) {
      return res.status(400).json({
        status: "fail",
        message: "This property is currently not available for booking.",
      });
    }

    // 4) Check availability in database (no date clash with currentBookings)
    if (Array.isArray(property.currentBookings) && property.currentBookings.length > 0) {
      const hasClash = property.currentBookings.some((booking) => {
        const existingStart = new Date(booking.fromDate);
        const existingEnd = new Date(booking.toDate);
        // Overlap condition: booking.fromDate < checkOut && booking.toDate > checkIn
        return existingStart < checkOut && existingEnd > checkIn;
      });

      if (hasClash) {
        return res.status(400).json({
          status: "fail",
          message:
            "This property is already booked for the selected dates. Please choose different dates.",
        });
      }
    }

    // 5) Validate guest count against property maximumGuest capacity
    let totalGuestsCount = 1;
    if (typeof guests === "number") {
      totalGuestsCount = guests;
    } else if (guests && typeof guests === "object") {
      totalGuestsCount =
        Number(guests.totalGuests) ||
        (Number(guests.adults) || 1) + (Number(guests.children) || 0);
    }

    if (totalGuestsCount > property.maximumGuest) {
      return res.status(400).json({
        status: "fail",
        message: `This property can accommodate a maximum of ${property.maximumGuest} guests. You requested ${totalGuestsCount}.`,
      });
    }

    // 6) Calculate nights and price securely from database
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const numberOfNights = Math.max(
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
      1
    );

    const pricePerNight = Number(property.price) || 0;
    const cleaningFee = Number(property.cleaningFee) || 0;
    const serviceFee = Number(property.serviceFee) || 0;
    const totalPrice = pricePerNight * numberOfNights + cleaningFee + serviceFee;

    // 7) Generate unique orderId
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const orderId = `ORD_${Date.now()}_${randomHex}`;

    // 8) Ensure userId is attached
    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "You must be logged in to create a booking order.",
      });
    }

    // 9) Create booking order in database with pending payment status
    const newBooking = await Booking.create({
      property: property._id,
      user: userId,
      orderId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      guests: guests || { totalGuests: totalGuestsCount, adults: totalGuestsCount },
      price: totalPrice,
      priceBreakdown: {
        pricePerNight,
        cleaningFee,
        serviceFee,
        currency: "INR",
      },
      paid: false,
      paymentStatus: "pending",
      status: "pending",
      guestContact: guestContact || {
        name: req.user?.name || "",
        email: req.user?.email || "",
        phone: req.user?.phoneNumber || "",
      },
      specialRequests: specialRequests || "",
    });

    res.status(201).json({
      status: "success",
      message: "Order created successfully! Proceed to payment.",
      data: {
        orderId,
        bookingId: newBooking._id,
        amount: totalPrice,
        currency: "INR",
        numberOfNights,
        propertyName: property.propertyName,
        booking: newBooking,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 400);
  }
};

// ============================================================
// 2. VERIFY / CONFIRM PAYMENT
// Confirms booking payment, marks status as confirmed, and
// adds the booking to the property's currentBookings in database.
// ============================================================
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, bookingId, transactionId, paymentMethod } = req.body;

    if (!orderId && !bookingId) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide orderId or bookingId to confirm payment.",
      });
    }

    // Check with database for the booking
    const query = orderId ? { orderId } : { _id: bookingId };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "Booking order not found with provided details.",
      });
    }

    if (booking.paid && booking.status === "confirmed") {
      return res.status(200).json({
        status: "success",
        message: "Booking is already confirmed and paid.",
        data: { booking },
      });
    }

    // Update booking state
    booking.paid = true;
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.paymentMethod = paymentMethod || booking.paymentMethod || "card";
    booking.paymentInfo = {
      transactionId: transactionId || orderId || `TXN_${Date.now()}`,
      paidAt: new Date(),
    };

    await booking.save({ validateBeforeSave: true });

    // Sync booking with property.currentBookings in database
    await Property.findByIdAndUpdate(booking.property, {
      $push: {
        currentBookings: {
          bookingId: booking._id,
          fromDate: booking.checkInDate,
          toDate: booking.checkOutDate,
          userId: booking.user,
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: "Booking payment confirmed successfully!",
      data: {
        booking,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 400);
  }
};

// ============================================================
// 3. GET MY BOOKINGS
// Fetches all bookings belonging to the currently logged in user
// ============================================================
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId }).sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 4. GET BOOKING BY ID OR ORDER ID
// Allows fetching by 24-char ObjectId OR by unique orderId
// ============================================================
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderId: id };
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: `No booking found with ID or orderId: ${id}`,
      });
    }

    // Authorization check: only owner or admin can view booking
    if (
      req.user &&
      req.user.role !== "admin" &&
      booking.user?._id?.toString() !== req.user._id.toString() &&
      booking.user?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to view this booking.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        booking,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 5. CANCEL BOOKING
// Cancels booking and removes from property's currentBookings
// ============================================================
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: `No booking found with ID: ${id}`,
      });
    }

    // Authorization check
    if (
      req.user &&
      req.user.role !== "admin" &&
      booking.user?._id?.toString() !== req.user._id.toString() &&
      booking.user?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to cancel this booking.",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        status: "fail",
        message: "This booking is already cancelled.",
      });
    }

    booking.status = "cancelled";
    booking.cancellationReason = cancellationReason || "Cancelled by user";
    booking.cancelledAt = new Date();

    await booking.save({ validateBeforeSave: false });

    // Remove from property's currentBookings in database
    await Property.findByIdAndUpdate(booking.property, {
      $pull: {
        currentBookings: {
          bookingId: booking._id,
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully.",
      data: {
        booking,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 6. GET ALL BOOKINGS (Admin/Host)
// ============================================================
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

export default {
  createOrder,
  confirmPayment,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
};

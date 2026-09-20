import { createSlice } from "@reduxjs/toolkit";

const initialBookingState = {
  bookings: [],
  bookingDetails: null,
  paymentDetails: null,
  orderData: null,
  loading: false,
  error: null,
  success: false,
  message: null,
};

// ============================================================
// BOOKING SLICE
// Manages bookings list, single booking details, checkout, and payment
// ============================================================
const bookingSlice = createSlice({
  name: "booking",
  initialState: initialBookingState,
  reducers: {
    // 1. Generic request indicator
    getRequest(state) {
      state.loading = true;
      state.error = null;
    },

    // 2. Set checkout / payment details before payment
    setPaymentDetails(state, action) {
      state.paymentDetails = action.payload;
    },

    // 3. Create booking order (payment intent created)
    createOrderSuccess(state, action) {
      const payload = action.payload || {};
      state.orderData = payload.data || payload;
      state.loading = false;
      state.error = null;
      state.success = true;
    },

    // 4. Confirm payment (booking finalized)
    confirmPaymentSuccess(state, action) {
      const payload = action.payload || {};
      const confirmedBooking = payload.data?.booking || payload.booking || payload;
      state.bookingDetails = confirmedBooking;
      state.orderData = null;
      state.loading = false;
      state.success = true;
      state.error = null;
      state.message = payload.message || "Payment confirmed successfully!";
    },

    // 5. Fetch all bookings belonging to user
    getBookings(state, action) {
      const payload = action.payload || {};
      if (Array.isArray(payload)) {
        state.bookings = payload;
      } else if (payload.data && Array.isArray(payload.data.bookings)) {
        state.bookings = payload.data.bookings;
      } else if (Array.isArray(payload.bookings)) {
        state.bookings = payload.bookings;
      } else {
        state.bookings = [];
      }
      state.loading = false;
      state.error = null;
    },

    // 6. Fetch single booking details by ID
    getBookingDetails(state, action) {
      const payload = action.payload || {};
      state.bookingDetails =
        payload.data?.booking ?? payload.booking ?? payload;
      state.loading = false;
      state.error = null;
    },

    // 7. Cancel booking
    cancelBookingSuccess(state, action) {
      const payload = action.payload || {};
      const updatedBooking = payload.data?.booking || payload.booking;
      if (updatedBooking && updatedBooking._id) {
        state.bookings = state.bookings.map((b) =>
          b._id === updatedBooking._id ? updatedBooking : b
        );
        if (state.bookingDetails?._id === updatedBooking._id) {
          state.bookingDetails = updatedBooking;
        }
      }
      state.loading = false;
      state.success = true;
      state.message = payload.message || "Booking cancelled successfully";
      state.error = null;
    },

    // 8. Error handling
    getErrors(state, action) {
      state.error = action.payload || "An unexpected error occurred.";
      state.loading = false;
    },
    clearErrors(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = null;
      state.success = false;
    },
    resetBookingState(state) {
      state.bookingDetails = null;
      state.orderData = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
    },
  },
});

export const bookingAction = bookingSlice.actions;
export const {
  getRequest,
  setPaymentDetails,
  createOrderSuccess,
  confirmPaymentSuccess,
  getBookings,
  getBookingDetails,
  cancelBookingSuccess,
  getErrors,
  clearErrors,
  clearMessage,
  resetBookingState,
} = bookingSlice.actions;

export default bookingSlice;

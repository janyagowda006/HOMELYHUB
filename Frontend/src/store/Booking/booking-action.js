import { axiosInstance } from "../../utils/axios.js";
import { bookingAction } from "./booking-slice.js";

// ============================================================
// BOOKING ACTIONS (Redux Thunks)
// - Handles Order creation, Payment confirmation, User booking history,
// - Single booking details, and Booking cancellation
// ============================================================

// 1. SET PAYMENT DETAILS (Before checkout)
export const setPaymentDetails = (details) => (dispatch) => {
  dispatch(bookingAction.setPaymentDetails(details));
  try {
    sessionStorage.setItem("homelyhub_payment_details", JSON.stringify(details));
  } catch (err) {
    console.error("Failed to cache payment details:", err);
  }
};

// 2. CREATE BOOKING ORDER (Initiates checkout)
export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch(bookingAction.getRequest());

    const response = await axiosInstance.post(
      "/api/v1/bookings/createOrder",
      orderData
    );

    dispatch(bookingAction.createOrderSuccess(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create booking order.";
    dispatch(bookingAction.getErrors(errorMessage));
    throw error;
  }
};

// 3. CONFIRM PAYMENT (Finalize booking after payment)
export const confirmPayment = (paymentData) => async (dispatch) => {
  try {
    dispatch(bookingAction.getRequest());

    const response = await axiosInstance.post(
      "/api/v1/bookings/confirmPayment",
      paymentData
    );

    dispatch(bookingAction.confirmPaymentSuccess(response.data));
    try {
      sessionStorage.removeItem("homelyhub_payment_details");
    } catch (err) {
      // ignore
    }
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to confirm payment.";
    dispatch(bookingAction.getErrors(errorMessage));
    throw error;
  }
};

// 4. FETCH CURRENT USER'S BOOKINGS
export const fetchUserBookings = () => async (dispatch) => {
  try {
    dispatch(bookingAction.getRequest());

    const response = await axiosInstance.get("/api/v1/bookings/myBookings");

    dispatch(bookingAction.getBookings(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch your bookings.";
    dispatch(bookingAction.getErrors(errorMessage));
    throw error;
  }
};

// 5. FETCH SINGLE BOOKING DETAILS
export const fetchBookingDetails = (bookingId) => async (dispatch) => {
  try {
    dispatch(bookingAction.getRequest());

    const response = await axiosInstance.get(`/api/v1/bookings/${bookingId}`);

    dispatch(bookingAction.getBookingDetails(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch booking details.";
    dispatch(bookingAction.getErrors(errorMessage));
    throw error;
  }
};

// 6. CANCEL BOOKING
export const cancelBooking = (bookingId, cancellationReason = "") => async (dispatch) => {
  try {
    dispatch(bookingAction.getRequest());

    const response = await axiosInstance.patch(
      `/api/v1/bookings/${bookingId}/cancel`,
      { cancellationReason }
    );

    dispatch(bookingAction.cancelBookingSuccess(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to cancel booking.";
    dispatch(bookingAction.getErrors(errorMessage));
    throw error;
  }
};

// 7. CLEAR ERRORS & STATE
export const clearErrors = () => (dispatch) => {
  dispatch(bookingAction.clearErrors());
};

export const clearMessage = () => (dispatch) => {
  dispatch(bookingAction.clearMessage());
};

export const resetBookingState = () => (dispatch) => {
  dispatch(bookingAction.resetBookingState());
};

// Aliases for compatibility with various naming conventions across components
export const createBookingOrder = createOrder;
export const confirmBookingPayment = confirmPayment;
export const verifyPayment = confirmPayment;
export const fetchMyBookings = fetchUserBookings;
export const getMyBookings = fetchUserBookings;
export const getBookings = fetchUserBookings;
export const getBookingDetails = fetchBookingDetails;
export const cancelUserBooking = cancelBooking;

import { axiosInstance } from "../../utils/axios.js";
import { userAction } from "./user-slice.js";

// ============================================================
// USER AUTHENTICATION & PROFILE ACTIONS (Redux Thunks)
// - Handles Login, Sign-up, Load User session, and Logout
// - Handles Profile update, Password change, and Password reset
// ============================================================

// 1. LOGIN ACTION
export const getLogin = (credentials) => async (dispatch) => {
  try {
    dispatch(userAction.getLoginRequest());
    const response = await axiosInstance.post(
      "/api/v1/users/login",
      credentials
    );
    dispatch(userAction.getLoginSuccess(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to login. Please check your credentials.";
    dispatch(userAction.getErrors(errorMessage));
    throw error;
  }
};

// 2. SIGNUP ACTION
export const getSignUp = (userData) => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    const response = await axiosInstance.post(
      "/api/v1/users/signup",
      userData
    );
    dispatch(userAction.getSignupSuccess(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create account.";
    dispatch(userAction.getErrors(errorMessage));
    throw error;
  }
};

// 3. LOAD CURRENT AUTHENTICATED USER (Session restore)
export const loadUser = () => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    const response = await axiosInstance.get("/api/v1/users/me");
    dispatch(userAction.getCurrentUser(response.data));
    return response.data;
  } catch (error) {
    dispatch(userAction.loadUserFail());
  }
};

// 4. LOGOUT ACTION
export const getLogout = () => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    await axiosInstance.get("/api/v1/users/logout");
    dispatch(userAction.getLogoutSuccess());
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to logout.";
    dispatch(userAction.getErrors(errorMessage));
  }
};

// 5. UPDATE PROFILE
export const updateProfile = (userData) => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    const response = await axiosInstance.patch(
      "/api/v1/users/updateMe",
      userData
    );
    dispatch(userAction.getUpdateUser(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update profile.";
    dispatch(userAction.getErrors(errorMessage));
    throw error;
  }
};

// 6. UPDATE PASSWORD (When logged in)
export const updatePassword = (passwords) => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    const response = await axiosInstance.patch(
      "/api/v1/users/updateMyPassword",
      passwords
    );
    dispatch(userAction.getUpdateUser(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update password.";
    dispatch(userAction.getErrors(errorMessage));
    throw error;
  }
};

// 7. FORGOT PASSWORD (Request reset token email)
export const forgotPassword = (emailData) => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    const payload = typeof emailData === "string" ? { email: emailData } : emailData;
    const response = await axiosInstance.post(
      "/api/v1/users/forgotPassword",
      payload
    );
    dispatch(
      userAction.getForgotPassword(
        response.data?.message || "Password reset token sent to your email!"
      )
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to process forgot password request.";
    dispatch(userAction.getErrors(errorMessage));
    throw error;
  }
};

// 8. RESET PASSWORD (Using token from email)
export const resetPassword = (token, passwords) => async (dispatch) => {
  try {
    dispatch(userAction.getRequest());
    const response = await axiosInstance.patch(
      `/api/v1/users/resetPassword/${token}`,
      passwords
    );
    dispatch(userAction.getResetPassword(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to reset password.";
    dispatch(userAction.getErrors(errorMessage));
    throw error;
  }
};

// 9. CLEAR ERRORS
export const clearErrors = () => (dispatch) => {
  dispatch(userAction.clearErrors());
};

// Aliases for compatibility with different naming conventions
export const login = getLogin;
export const signup = getSignUp;
export const logout = getLogout;
export const currentUser = loadUser;

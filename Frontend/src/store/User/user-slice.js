import { createSlice } from "@reduxjs/toolkit";

const initialUserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  success: false,
  message: null,
};

// ============================================================
// USER AUTHENTICATION & PROFILE SLICE
// Manages authentication state, user session, profile, and password recovery
// ============================================================
const userSlice = createSlice({
  name: "user",
  initialState: initialUserState,
  reducers: {
    // 1. Generic / Login Request
    getRequest(state) {
      state.loading = true;
      state.error = null;
    },
    getLoginRequest(state) {
      state.loading = true;
      state.error = null;
    },

    // 2. Login / Signup / Session Success
    getLoginSuccess(state, action) {
      const payload = action.payload || {};
      state.user = payload.user ?? payload.data?.user ?? payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    getSignupSuccess(state, action) {
      const payload = action.payload || {};
      state.user = payload.user ?? payload.data?.user ?? payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },

    // 3. Load Current Authenticated User (Session restore)
    getCurrentUser(state, action) {
      const payload = action.payload || {};
      state.user = payload.user ?? payload.data?.user ?? payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    loadUserFail(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },

    // 4. Logout
    getLogoutSuccess(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.message = "Logged out successfully";
    },

    // 5. Update Profile / Password
    getUpdateUser(state, action) {
      const payload = action.payload || {};
      state.user = payload.user ?? payload.data?.user ?? payload ?? state.user;
      state.loading = false;
      state.success = true;
      state.error = null;
    },

    // 6. Password Recovery
    getForgotPassword(state, action) {
      state.loading = false;
      state.message = action.payload || "Password reset link sent to email";
      state.error = null;
    },
    getResetPassword(state, action) {
      const payload = action.payload || {};
      state.user = payload.user ?? payload.data?.user ?? payload ?? state.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.success = true;
      state.error = null;
    },

    // 7. Error Handling
    getErrors(state, action) {
      state.error = action.payload || "An unexpected error occurred";
      state.loading = false;
    },
    clearErrors(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = null;
      state.success = false;
    },
  },
});

export const userAction = userSlice.actions;
export const {
  getRequest,
  getLoginRequest,
  getLoginSuccess,
  getSignupSuccess,
  getCurrentUser,
  loadUserFail,
  getLogoutSuccess,
  getUpdateUser,
  getForgotPassword,
  getResetPassword,
  getErrors,
  clearErrors,
  clearMessage,
} = userSlice.actions;

export default userSlice;

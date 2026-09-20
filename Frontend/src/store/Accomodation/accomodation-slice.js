import { createSlice } from "@reduxjs/toolkit";

const initialAccomodationState = {
  accomodation: [],
  loading: false,
  error: null,
  success: false,
  message: null,
};

// ============================================================
// ACCOMODATION SLICE
// Manages host accommodation listings and new property submissions
// ============================================================
const accomodationSlice = createSlice({
  name: "accomodation",
  initialState: initialAccomodationState,
  reducers: {
    // 1. Generic request
    getRequest(state) {
      state.loading = true;
      state.error = null;
    },

    // 2. Received user's accommodations list
    getAccomodation(state, action) {
      const payload = action.payload || {};
      const list =
        payload.data?.properties ??
        payload.data?.accomodation ??
        payload.accomodation ??
        payload.properties ??
        payload;
      state.accomodation = Array.isArray(list) ? list : [];
      state.loading = false;
      state.error = null;
    },

    // 3. Created accommodation successfully
    createAccomodationSuccess(state, action) {
      const payload = action.payload || {};
      const newProperty = payload.data?.property || payload.property;
      if (newProperty) {
        state.accomodation.unshift(newProperty);
      }
      state.loading = false;
      state.success = true;
      state.error = null;
      state.message = payload.message || "Accommodation created successfully!";
    },

    // 4. Error handling
    getErrors(state, action) {
      state.error =
        action.payload || "Failed to process accommodation request.";
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

export const accomodationAction = accomodationSlice.actions;
export const {
  getRequest,
  getAccomodation,
  createAccomodationSuccess,
  getErrors,
  clearErrors,
  clearMessage,
} = accomodationSlice.actions;

export default accomodationSlice;

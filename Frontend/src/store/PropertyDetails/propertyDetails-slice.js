import { createSlice } from "@reduxjs/toolkit";

const initialPropertyDetailsState = {
  propertydetails: null,
  loading: false,
  error: null,
};

const propertyDetailsSlice = createSlice({
  name: "propertyDetails",
  initialState: initialPropertyDetailsState,
  reducers: {
    // 1. Tell Redux loading has started
    getRequest(state) {
      state.loading = true;
      state.error = null;
    },

    // 2. Successfully received property details
    getPropertyDetails(state, action) {
      const payload = action.payload || {};
      state.propertydetails =
        payload.data?.property ??
        payload.property ??
        payload.data ??
        payload;
      state.loading = false;
      state.error = null;
    },

    // 3. Error occurred
    getErrors(state, action) {
      state.error = action.payload || "Failed to fetch property details";
      state.loading = false;
    },

    // 4. Clear error
    clearErrors(state) {
      state.error = null;
    },
  },
});

export const propertyDetailsAction = propertyDetailsSlice.actions;
export const {
  getRequest,
  getPropertyDetails,
  getErrors,
  clearErrors,
} = propertyDetailsSlice.actions;

export default propertyDetailsSlice;

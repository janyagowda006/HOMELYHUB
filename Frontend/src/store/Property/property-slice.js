import { createSlice } from "@reduxjs/toolkit";

const initialPropertyState = {
  properties: [],
  totalProperties: 0,
  searchParams: {}, // Search and filter criteria
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: "property",
  initialState: initialPropertyState,
  reducers: {
    // 1. Initiate fetch request
    getRequest(state) {
      state.loading = true;
      state.error = null;
    },

    // 2. Successfully received properties
    getProperties(state, action) {
      const payload = action.payload || {};

      if (Array.isArray(payload)) {
        state.properties = payload;
        state.totalProperties = payload.length;
      } else if (payload.data && Array.isArray(payload.data.properties)) {
        state.properties = payload.data.properties;
        state.totalProperties =
          payload.pagination?.totalProperties ??
          payload.all_properties ??
          payload.totalProperties ??
          payload.total ??
          payload.count ??
          payload.data.properties.length;
      } else if (Array.isArray(payload.properties)) {
        state.properties = payload.properties;
        state.totalProperties =
          payload.all_properties ??
          payload.totalProperties ??
          payload.total ??
          payload.count ??
          payload.properties.length;
      } else if (Array.isArray(payload.data)) {
        state.properties = payload.data;
        state.totalProperties =
          payload.all_properties ??
          payload.totalProperties ??
          payload.total ??
          payload.count ??
          payload.data.length;
      } else {
        state.properties = [];
        state.totalProperties = 0;
      }

      state.loading = false;
      state.error = null;
    },

    // 3. Update search and filter parameters
    updateSearchParams(state, action) {
      if (!action.payload || Object.keys(action.payload).length === 0) {
        state.searchParams = {};
      } else {
        state.searchParams = {
          ...state.searchParams,
          ...action.payload,
        };
      }
    },

    // 4. Clear search and filter parameters
    clearSearchParams(state) {
      state.searchParams = {};
    },

    // 5. Handle errors
    getErrors(state, action) {
      state.error = action.payload || "Failed to fetch properties";
      state.loading = false;
    },

    // 6. Clear errors
    clearErrors(state) {
      state.error = null;
    },
  },
});

export const propertyAction = propertySlice.actions;
export const {
  getRequest,
  getProperties,
  updateSearchParams,
  clearSearchParams,
  getErrors,
  clearErrors,
} = propertySlice.actions;

export default propertySlice;

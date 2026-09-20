import { axiosInstance } from "../../utils/axios.js";
import { accomodationAction } from "./accomodation-slice.js";
import { getAllProperties } from "../Property/property-action.js";

// ============================================================
// ACCOMODATION ACTIONS (Redux Thunks)
// - Handles creating new accommodations and fetching user's listings
// ============================================================

// 1. CREATE ACCOMODATION / LIST PROPERTY
export const createAccomodation = (accomodationData) => async (dispatch) => {
  try {
    dispatch(accomodationAction.getRequest());

    const response = await axiosInstance.post(
      "/api/v1/properties",
      accomodationData
    );

    dispatch(accomodationAction.createAccomodationSuccess(response.data));
    // Refresh main public property list so new listing shows up immediately
    dispatch(getAllProperties());

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create accommodation.";
    dispatch(accomodationAction.getErrors(errorMessage));
    throw error;
  }
};

// 2. FETCH CURRENT USER'S ACCOMODATIONS
export const fetchUserAccomodation = () => async (dispatch) => {
  try {
    dispatch(accomodationAction.getRequest());

    const response = await axiosInstance.get(
      "/api/v1/properties/myAccomodation"
    );

    dispatch(accomodationAction.getAccomodation(response.data));
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch your accommodations.";
    dispatch(accomodationAction.getErrors(errorMessage));
    throw error;
  }
};

// 3. CLEAR ERRORS
export const clearErrors = () => (dispatch) => {
  dispatch(accomodationAction.clearErrors());
};

// Aliases for compatibility
export const createProperty = createAccomodation;
export const getAllAccomodation = fetchUserAccomodation;
export const getAccomodation = fetchUserAccomodation;
export const getMyAccomodation = fetchUserAccomodation;

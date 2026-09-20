import { axiosInstance } from "../../utils/axios.js";
import { propertyDetailsAction } from "./propertyDetails-slice.js";

// ============================================================
// GET PROPERTY DETAILS ACTION CREATOR (Redux Thunk)
// - Starts API request and signals loading
// - Calls backend API GET /api/v1/properties/:id
// - Dispatches property details to Redux store on success
// - Dispatches error message to Redux store on failure
// ============================================================
export const getPropertyDetails = (id) => async (dispatch) => {
  try {
    // 1. Tell Redux loading started
    dispatch(propertyDetailsAction.getRequest());

    // 2. Call backend API for property by ID or slug
    const response = await axiosInstance.get(`/api/v1/properties/${id}`);

    // 3. Send property data to Redux store
    dispatch(propertyDetailsAction.getPropertyDetails(response.data));
  } catch (error) {
    // 4. If error occurs, send error message to Redux store
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch property details";

    dispatch(propertyDetailsAction.getErrors(errorMessage));
  }
};

// Aliases for compatibility
export const getProperty = getPropertyDetails;
export default getPropertyDetails;

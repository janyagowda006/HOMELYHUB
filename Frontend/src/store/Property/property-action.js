import { axiosInstance } from "../../utils/axios.js";
import { propertyAction } from "./property-slice.js";

// ============================================================
// GET ALL PROPERTIES ACTION CREATOR (Redux Thunk)
// - Starts API request
// - Signals Redux that loading has started
// - Passes search and filter parameters
// - Calls backend API and awaits response
// - Dispatches property data to Redux store on success
// - Dispatches error message to Redux store on failure
// ============================================================
export const getAllProperties = (params = {}) => async (dispatch, getState) => {
  try {
    // 1. Tell Redux loading started
    dispatch(propertyAction.getRequest());

    // 2. Normalize parameters (handle page number, string, or object)
    let queryParams = {};
    if (typeof params === "number" || typeof params === "string") {
      queryParams = { page: Number(params) };
    } else if (typeof params === "object" && params !== null) {
      queryParams = { ...params };
    }

    // 3. Merge active search & filter parameters from Redux store
    const state = typeof getState === "function" ? getState() : {};
    const storedSearchParams = state?.properties?.searchParams || {};

    // 4. Build final query parameters
    // Default limit to 12 matching the grid pagination in PropertyList
    const rawParams = {
      limit: 12,
      ...storedSearchParams,
      ...queryParams,
    };

    // Clean up empty, null, undefined, or empty array parameters
    const finalParams = {};
    for (const [key, val] of Object.entries(rawParams)) {
      if (val !== "" && val !== null && val !== undefined) {
        if (Array.isArray(val) && val.length === 0) continue;
        finalParams[key] = val;
      }
    }

    // 5. Call backend API with merged parameters
    const response = await axiosInstance.get("/api/v1/properties", {
      params: finalParams,
    });

    // 6. Send property data to Redux store
    dispatch(propertyAction.getProperties(response.data));
  } catch (error) {
    // 7. If error occurs, send error message to Redux store
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch properties";

    dispatch(propertyAction.getErrors(errorMessage));
  }
};


// Aliases for compatibility with different import styles
export const getProperties = getAllProperties;
export default getAllProperties;

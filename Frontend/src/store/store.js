import { configureStore } from "@reduxjs/toolkit";
import propertySlice from "./Property/property-slice.js";
import propertyDetailsSlice from "./PropertyDetails/propertyDetails-slice.js";
import userSlice from "./User/user-slice.js";
import bookingSlice from "./Booking/booking-slice.js";
import accomodationSlice from "./Accomodation/accomodation-slice.js";

// ============================================================
// REDUX STORE CONFIGURATION
// Configures the central Redux store with slices for the application
// ============================================================
const store = configureStore({
  reducer: {
    // Matched to `state.properties` used across components
    properties: propertySlice.reducer,
    // Alias to support `state.property` access
    property: propertySlice.reducer,
    // Matched to `state.propertydetails` used in PropertyListing.jsx
    propertydetails: propertyDetailsSlice.reducer,
    // Alias to support camelCase `state.propertyDetails` access
    propertyDetails: propertyDetailsSlice.reducer,
    // Matched to `state.user` used across auth, header, and profile components
    user: userSlice.reducer,
    // Matched to `state.booking` and `state.bookings`
    booking: bookingSlice.reducer,
    bookings: bookingSlice.reducer,
    // Matched to `state.accomodation` and `state.accommodation`
    accomodation: accomodationSlice.reducer,
    accommodation: accomodationSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export { store };
export default store;

import React, { useEffect } from "react";
import "../../css/BookingDetails.css";
import PropertyImg from "../propertyListing/PropertyImg";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingDetails } from "../../store/Booking/booking-action";

const BookingDetails = () => {
  const { bookingId } = useParams();
  const dispatch = useDispatch();

  const { bookingDetails, loading } = useSelector(
    (state) => state.booking || state.bookings || {}
  );

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingDetails(bookingId));
    }
  }, [bookingId, dispatch]);

  if (loading || !bookingDetails || !bookingDetails.property) {
    return (
      <div className="row justify-content-around mt-5">
        <LoadingSpinner />
      </div>
    );
  }

  const property = bookingDetails.property;
  const address = property.address || {};

  return (
    <div className="details-container">
      <p className="details-header">{property.propertyName || "HomelyHub Property"}</p>
      <h6 className="details-location">
        <span className="material-symbols-outlined">location_on</span>
        <span className="location">
          {address.area ? `${address.area}, ` : ""}
          {address.city ? `${address.city}, ` : ""}
          {address.pincode ? `${address.pincode}, ` : ""}
          {address.state || ""}
        </span>
      </h6>
      <div className="details-information-container ">
        <div className="details-information ">
          <h5>Booking Information</h5>
          <section className="booking-stay-information">
            <span className="details">
              <span className="material-symbols-outlined stay-icon">
                bedtime
              </span>
              {bookingDetails.numberOfNights || bookingDetails.numberOfnights || 1} nights
            </span>
            <span className="details">
              <span className="material-symbols-outlined stay-icon">
                calendar_month
              </span>
              {new Date(bookingDetails.checkInDate || bookingDetails.fromDate).toLocaleDateString()}
            </span>
            <span className="material-symbols-outlined stay-icon">
              arrow_forward
            </span>
            <span className="details">
              <span className="material-symbols-outlined stay-icon">
                calendar_month
              </span>
              {new Date(bookingDetails.checkOutDate || bookingDetails.toDate).toLocaleDateString()}
            </span>
          </section>
        </div>
        <div className="details-total-price-container ">
          <div className="details-total-price">
            <p className="price-header">Total Price</p>
            <span className="price-in-number">
              {" "}
              &#8377; {bookingDetails.price || bookingDetails.totalPrice}
            </span>
          </div>
        </div>
      </div>
      <PropertyImg images={property.images || []} />
    </div>
  );
};

export default BookingDetails;

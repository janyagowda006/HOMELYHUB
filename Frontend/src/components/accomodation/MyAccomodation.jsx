import React from "react";

const MyAccomodation = ({ accomodation }) => {
  const accommodationList = Array.isArray(accomodation) ? accomodation : [];

  return (
    <div className="main-container">
      {accommodationList.map((item) => {
        const imageUrl =
          item.images?.[0]?.url ||
          (typeof item.images?.[0] === "string"
            ? item.images[0]
            : "/assets/image1.jpeg");
        const cityName = item.address?.city || item.city || "Not specified";
        const checkIn = item.chekInTime || item.checkInTime || "13:00";
        const checkOut = item.chekOutTime || item.checkOutTime || "11:00";

        return (
          <div className="myaccomodation-container row" key={item._id || item.id || Math.random()}>
            <div className="myaccomodation-image-container col-lg-3 col-md-3">
              <img
                className="myaccomodation-img"
                src={imageUrl}
                alt={item.propertyName || "Accommodation"}
                onError={(e) => {
                  e.target.src = "/assets/image1.jpeg";
                }}
              />
            </div>
            <div className="myaccomodation-information col-lg-9 col-md-9">
              <h6 className="myaccomodation-hotel-name">
                {item.propertyName || "Untitled Property"}
              </h6>
              <div className="stay-information">
                <span className="info">
                  <span className="material-symbols-outlined icon">
                    calendar_month
                  </span>
                  Check In Time: {checkIn}
                </span>
                <span className="material-symbols-outlined icon">
                  arrow_forward
                </span>
                <span className="info">
                  <span className="material-symbols-outlined icon">
                    calendar_month
                  </span>
                  Check Out Time: {checkOut}
                </span>
              </div>
              <p className="myaccomodation-city">
                City: {cityName}
              </p>
              <p className="myaccomodation-guest">
                Max no of guest: {item.maximumGuest || 1}
              </p>
              <h5 className="myaccomodation-price">
                <span className="material-symbols-outlined">payments</span> Total
                Price :&#8377; {item.price || 0}
              </h5>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyAccomodation;

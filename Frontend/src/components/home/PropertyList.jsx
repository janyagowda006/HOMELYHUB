import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import "../../css/Home.css";
import { useDispatch, useSelector } from "react-redux";
import { propertyAction } from "../../store/Property/property-slice";
import { getAllProperties } from "../../store/Property/property-action";

const Card = ({ id, image, name, address, price }) => {
  return (
    <figure className="property">
      <Link to={`/propertylist/${id}`}>
        <img src={image} alt="Propertyimg" />
      </Link>
      <h4>{name}</h4>
      <figcaption>
        <main className="propertydetails">
          <h5>{name}</h5>

          <h6>
            <span className="material-symbols-outlined houseicon">
              home_pin
            </span>
            {address}
          </h6>
          <p>
            <span className="price"> ₹{price}</span> per night
          </p>
        </main>
      </figcaption>
    </figure>
  );
};

const PropertyList = () => {
  const [currentPage, setCurrentPage] = useState({ page: 1 });
  const dispatch = useDispatch();

  // Get properties, total count, searchParams, and loading state from Redux store
  const {
    properties = [],
    totalProperties = 0,
    searchParams = {},
    loading,
  } = useSelector((state) => state.properties);

  const lastPage = Math.ceil(totalProperties / 12) || 1;
  const propertyListRef = useRef(null);

  // Reset to page 1 whenever search or filter parameters change
  useEffect(() => {
    setCurrentPage({ page: 1 });
  }, [searchParams]);

  useEffect(() => {
    // Fetch properties for currentPage from backend via Redux action
    dispatch(getAllProperties({ page: currentPage.page, limit: 12 }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    if (propertyListRef.current && properties.length > 0) {
      gsap.fromTo(
        propertyListRef.current.children,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, [properties]);

  const handleResetFilters = () => {
    dispatch(propertyAction.clearSearchParams());
    dispatch(getAllProperties({ page: 1, limit: 12 }));
  };

  return (
    <>
      {properties.length === 0 ? (
        <div className="not_found_container" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "#8ca89a", marginBottom: "0.5rem" }}>
            search_off
          </span>
          <p className="not_found" style={{ fontSize: "1.1rem", color: "#14432c", marginBottom: "1rem" }}>
            No properties found matching your filter criteria.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: "0.6rem 1.4rem",
              backgroundColor: "#0e8b53",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="propertylist" ref={propertyListRef}>
          {properties.map((property) => (
            <Card
              key={property._id}
              id={property._id}
              image={property.images?.[0]?.url || "/assets/image1.jpeg"}
              name={property.propertyName}
              address={`${property.address?.city || ""}, ${property.address?.state || ""} ${property.address?.pincode || ""}`}
              price={property.price}
              slug={property.slug}
            />
          ))}
        </div>
      )}

      {properties.length > 0 && (
        <div className="pagination">
          <button
            className="previous_btn"
            onClick={() => setCurrentPage((prev) => ({ page: prev.page - 1 }))}
            disabled={currentPage.page === 1}
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>

          <span style={{ fontSize: "0.85rem", color: "#5b6b62", fontWeight: "500", alignSelf: "center", margin: "0 0.5rem" }}>
            Page {currentPage.page} of {lastPage}
          </span>

          <button
            className="next_btn"
            onClick={() => setCurrentPage((prev) => ({ page: prev.page + 1 }))}
            disabled={properties.length < 12 || currentPage.page >= lastPage}
          >
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
        </div>
      )}
    </>
  );
};

export default PropertyList;

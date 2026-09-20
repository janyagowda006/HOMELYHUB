import React, { useState } from "react";
import FilterModal from "./FilterModal";
import { useDispatch, useSelector } from "react-redux";
import { propertyAction } from "../../store/Property/property-slice";
import { getAllProperties } from "../../store/Property/property-action";

const Filter = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();
  const searchParams = useSelector(
    (state) => state.properties?.searchParams || {}
  );

  const handleShowFilterModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFilterChange = (newFilters) => {
    dispatch(propertyAction.updateSearchParams(newFilters));
    dispatch(getAllProperties({ page: 1, limit: 12 }));
  };

  // Check if any non-default filters are active
  const hasActiveFilters =
    (searchParams.minPrice && Number(searchParams.minPrice) > 600) ||
    (searchParams.maxPrice && Number(searchParams.maxPrice) < 30000) ||
    Boolean(searchParams.propertyType) ||
    Boolean(searchParams.roomType) ||
    (Array.isArray(searchParams.amenities) && searchParams.amenities.length > 0);

  return (
    <>
      <div className="filter-button-wrapper" style={{ position: "relative", display: "inline-block" }}>
        <span
          className={`material-symbols-outlined filter ${hasActiveFilters ? "active-filter" : ""}`}
          onClick={handleShowFilterModal}
          title={hasActiveFilters ? "Filters active - click to edit" : "Filter properties"}
          style={{ cursor: "pointer" }}
        >
          tune
        </span>
        {hasActiveFilters && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "9px",
              height: "9px",
              backgroundColor: "#0e8b53",
              borderRadius: "50%",
              border: "1.5px solid #ffffff",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {isModalOpen && (
        <FilterModal
          selectedFilters={searchParams}
          onFilterChange={handleFilterChange}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default Filter;

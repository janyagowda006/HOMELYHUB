import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Slider } from "antd";
import "../../css/FilterModal.css";

const parseNum = (val, defaultVal) => {
  if (val === "" || val === null || val === undefined) return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : num;
};

const FilterModal = ({ selectedFilters = {}, onFilterChange, onClose }) => {
  const [priceRange, setPriceRange] = useState({
    min: parseNum(selectedFilters.minPrice ?? selectedFilters.priceRange?.min, 600),
    max: parseNum(selectedFilters.maxPrice ?? selectedFilters.priceRange?.max, 30000),
  });

  const [propertyType, setPropertyType] = useState(
    selectedFilters.propertyType || ""
  );

  const [roomType, setRoomType] = useState(selectedFilters.roomType || "");

  const [amenities, setAmenities] = useState(
    Array.isArray(selectedFilters.amenities) ? selectedFilters.amenities : []
  );

  useEffect(() => {
    setPriceRange({
      min: parseNum(selectedFilters.minPrice ?? selectedFilters.priceRange?.min, 600),
      max: parseNum(selectedFilters.maxPrice ?? selectedFilters.priceRange?.max, 30000),
    });
    setPropertyType(selectedFilters.propertyType || "");
    setRoomType(selectedFilters.roomType || "");
    setAmenities(
      Array.isArray(selectedFilters.amenities) ? selectedFilters.amenities : []
    );
  }, [
    selectedFilters.minPrice,
    selectedFilters.maxPrice,
    selectedFilters.priceRange,
    selectedFilters.propertyType,
    selectedFilters.roomType,
    selectedFilters.amenities,
  ]);

  const handlePriceRangeChange = (value) => {
    if (Array.isArray(value)) {
      setPriceRange({ min: value[0], max: value[1] });
    }
  };

  const handleMinInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setPriceRange((prev) => ({ ...prev, min: "" }));
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      setPriceRange((prev) => ({ ...prev, min: val }));
    }
  };

  const handleMaxInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setPriceRange((prev) => ({ ...prev, max: "" }));
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      setPriceRange((prev) => ({ ...prev, max: val }));
    }
  };

  const pricePresets = [
    { label: "Under ₹2,500", min: 600, max: 2500 },
    { label: "₹2,500 - ₹5,000", min: 2500, max: 5000 },
    { label: "Above ₹5,000", min: 5000, max: 30000 },
  ];

  const handleFilterChange = () => {
    const minVal = parseNum(priceRange.min, 600);
    const maxVal = parseNum(priceRange.max, 30000);
    const safeMin = Math.min(minVal, maxVal);
    const safeMax = Math.max(minVal, maxVal);

    const filters = {
      minPrice: safeMin,
      maxPrice: safeMax,
      propertyType: propertyType,
      roomType: roomType,
      amenities: amenities,
    };

    onFilterChange(filters);
    onClose();
  };

  const propertyTypeOptions = [
    { value: "House", label: "House", icon: "home" },
    { value: "Flat", label: "Flat", icon: "apartment" },
    { value: "Guest House", label: "Guest House", icon: "hotel" },
    { value: "Hotel", label: "Hotel", icon: "meeting_room" },
  ];

  const roomTypeOptions = [
    { value: "Entire Home", label: "Entire Home", icon: "hotel" },
    { value: "Room", label: "Room", icon: "meeting_room" },
    { value: "Anytype", label: "Any Type", icon: "apartment" },
  ];

  const amenitiesOptions = [
    { value: "Wifi", label: "Wi-Fi", icon: "wifi" },
    { value: "Kitchen", label: "Kitchen", icon: "kitchen" },
    { value: "Ac", label: "AC", icon: "ac_unit" },
    {
      value: "Washing Machine",
      label: "Washing Machine",
      icon: "local_laundry_service",
    },
    { value: "Tv", label: "TV", icon: "tv" },
    { value: "Pool", label: "Pool", icon: "pool" },
    { value: "Free Parking", label: "Free Parking", icon: "local_parking" },
  ];

  const handleClearFilters = () => {
    setPriceRange({ min: 600, max: 30000 });
    setPropertyType("");
    setRoomType("");
    setAmenities([]);
    onFilterChange({
      minPrice: "",
      maxPrice: "",
      propertyType: "",
      roomType: "",
      amenities: [],
    });
    onClose();
  };

  const handleAmenitiesChange = (selectedAmenity) => {
    setAmenities((prevAmenities) =>
      prevAmenities.includes(selectedAmenity)
        ? prevAmenities.filter((item) => item !== selectedAmenity)
        : [...prevAmenities, selectedAmenity]
    );
  };

  const handlePropertyTypeChange = (selectedType) => {
    setPropertyType((prevType) =>
      prevType === selectedType ? "" : selectedType
    );
  };

  const handleRoomTypeChange = (selectedType) => {
    setRoomType((prevType) => (prevType === selectedType ? "" : selectedType));
  };

  const currentMinDisplay = parseNum(priceRange.min, 600);
  const currentMaxDisplay = parseNum(priceRange.max, 30000);

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h4>
          Filters <hr />
        </h4>
        <button className="close-button" onClick={onClose}>
          <span>&times;</span>
        </button>

        <div className="modal-filters-container">
          <div className="filter-section">
            <div className="price-header-row">
              <label>Price Range per night:</label>
              <span className="price-display-badge">
                ₹{currentMinDisplay.toLocaleString("en-IN")} - ₹{currentMaxDisplay.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="price-presets">
              {pricePresets.map((preset) => {
                const isActive =
                  Number(priceRange.min) === preset.min &&
                  Number(priceRange.max) === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`preset-chip ${isActive ? "active" : ""}`}
                    onClick={() => setPriceRange({ min: preset.min, max: preset.max })}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="slider-wrapper">
              <Slider
                range
                min={600}
                max={30000}
                step={100}
                value={[
                  parseNum(priceRange.min, 600),
                  parseNum(priceRange.max, 30000),
                ]}
                onChange={handlePriceRangeChange}
                tooltip={{
                  formatter: (val) => `₹${val?.toLocaleString("en-IN")}`,
                }}
              />
            </div>

            <div className="range-inputs">
              <div className="price-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={handleMinInputChange}
                  placeholder="600"
                  min="0"
                />
              </div>
              <span className="range-separator">to</span>
              <div className="price-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={handleMaxInputChange}
                  placeholder="30000"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <label>Property Type:</label>
            <div className="icon-box">
              {propertyTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className={`selectable-box ${
                    propertyType === option.value ? "selected" : ""
                  }`}
                  onClick={() => handlePropertyTypeChange(option.value)}
                >
                  <span className="material-icons">{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Room Type:</label>
            <div className="icon-box">
              {roomTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className={`selectable-box ${
                    roomType === option.value ? "selected" : ""
                  }`}
                  onClick={() => handleRoomTypeChange(option.value)}
                >
                  <span className="material-icons">{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Amenities:</label>
            <div className="amenities-checkboxes">
              {amenitiesOptions.map((option) => (
                <div key={option.value} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={amenities.includes(option.value)}
                    onChange={() => handleAmenitiesChange(option.value)}
                  />

                  <span className="material-icons amenitieslabel">
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-buttons">
            <button className="clear-button" onClick={handleClearFilters}>
              Clear
            </button>
            <button onClick={handleFilterChange}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

FilterModal.propTypes = {
  selectedFilters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FilterModal;

import React, { useState } from "react";
import { DatePicker, Space } from "antd";
import "react-datepicker/dist/react-datepicker.css";
import "../../css/Home.css";

import { useDispatch } from "react-redux";
import { propertyAction } from "../../store/Property/property-slice";
import { getAllProperties } from "../../store/Property/property-action";

const Search = () => {
  const { RangePicker } = DatePicker;
  const [keyword, setKeyword] = useState({
    city: "",
    guests: "",
    dateIn: "",
    dateOut: "",
  });
  const [value, setValue] = useState([]);

  const dispatch = useDispatch();

  function searchHandler(e) {
    if (e) e.preventDefault();
    const activeParams = {};
    if (keyword.city && keyword.city.trim()) activeParams.city = keyword.city.trim();
    if (keyword.guests) activeParams.guests = keyword.guests;
    if (keyword.dateIn) activeParams.dateIn = keyword.dateIn;
    if (keyword.dateOut) activeParams.dateOut = keyword.dateOut;

    dispatch(propertyAction.updateSearchParams(activeParams));
    dispatch(getAllProperties());
  }

  function returnDates(date, dateString) {
    if (!date || !date[0] || !date[1]) {
      setValue([]);
      updateKeyword("dateIn", "");
      updateKeyword("dateOut", "");
      return;
    }
    setValue([date[0], date[1]]);
    updateKeyword("dateIn", dateString[0]);
    updateKeyword("dateOut", dateString[1]);
  }

  const updateKeyword = (field, val) => {
    setKeyword((prevKeyword) => ({
      ...prevKeyword,
      [field]: val,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchHandler(e);
    }
  };

  return (
    <>
      <div className="searchbar">
        <input
          className="search"
          id="search_destination"
          placeholder="Search destinations"
          type="text"
          value={keyword.city}
          onChange={(e) => updateKeyword("city", e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Space direction="vertical" size={12}>
          <RangePicker
            value={value}
            format="DD-MM-YYYY"
            picker="date"
            className="date_picker"
            disabledDate={(current) => {
              return current && current.isBefore(Date.now(), "day");
            }}
            onChange={returnDates}
          />
        </Space>
        <input
          className="search"
          id="addguest"
          placeholder="Add guests"
          type="number"
          min="1"
          value={keyword.guests}
          onChange={(e) =>
            updateKeyword("guests", e.target.value ? Number(e.target.value) : "")
          }
          onKeyDown={handleKeyDown}
        />
        <span
          className="material-symbols-outlined searchicon"
          onClick={searchHandler}
          role="button"
          tabIndex={0}
        >
          search
        </span>
      </div>
    </>
  );
};

export default Search;

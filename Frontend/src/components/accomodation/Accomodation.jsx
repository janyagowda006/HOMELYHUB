import React, { useEffect } from "react";
import "../../css/Accomodation.css";
import ProgressSteps from "../ProgressSteps";
import MyAccomodation from "./MyAccomodation";
import { Link } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserAccomodation } from "../../store/Accomodation/accomodation-action";

const Accomodation = () => {
  const dispatch = useDispatch();
  const { accomodation = [], loading = false } = useSelector(
    (state) => state.accomodation || state.accommodation || {}
  );
  const accommodationList = Array.isArray(accomodation) ? accomodation : [];

  useEffect(() => {
    dispatch(fetchUserAccomodation());
  }, [dispatch]);

  return (
    <>
      <ProgressSteps accomodation />
      <div className="accom-container">
        <Link to="/accomodationform">
          <button className="add-new-place">+ Add new place</button>
        </Link>
        {loading && <LoadingSpinner />}
        {!loading && accommodationList.length === 0 && (
          <p>Accomodation not available</p>
        )}
        {!loading && accommodationList.length > 0 && (
          <MyAccomodation accomodation={accommodationList} loading={loading} />
        )}
      </div>
    </>
  );
};

export default Accomodation;

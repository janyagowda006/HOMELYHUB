import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getTripPlan } from "../../ai/tripPlanner";
import "../../css/AiTripPlanner.css";

const INTEREST_OPTIONS = [
  { name: "Beach", icon: "beach_access" },
  { name: "Food", icon: "restaurant" },
  { name: "Nightlife", icon: "nightlife" },
  { name: "Nature", icon: "park" },
  { name: "Adventure", icon: "hiking" },
  { name: "Shopping", icon: "shopping_bag" },
  { name: "History", icon: "museum" },
  { name: "Relaxation", icon: "spa" },
];

const AiTripPlanner = () => {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [people, setPeople] = useState("");
  const [interests, setInterests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((item) => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!destination || !budget || !days || !people) {
      toast.error("Please fill in all the fields");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await getTripPlan({
        destination,
        budget,
        days,
        people,
        interests,
      });
      setResult(data);
      toast.success("Your trip plan is ready");
    } catch (error) {
      toast.error("Could not create a trip plan, please try again");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="trip-page">
      <header className="trip-hero">
        <h1>
          <span className="material-symbols-outlined trip-sparkle">
            auto_awesome
          </span>
          Trip Genie
        </h1>
        <p>
          Tell us where you’re going, and Trip Genie will create a personalized
          day-by-day plan with HomelyHub stays that fit your budget.
        </p>
      </header>

      <form className="trip-form" onSubmit={handleGenerate}>
        <div className="trip-fields">
          <div className="trip-field">
            <label>Destination</label>

            <div className="trip-input">
              <span className="material-symbols-outlined">location_on</span>
              <input
                type="text"
                placeholder="Goa"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <div className="trip-field">
            <label>Budget (Rs)</label>
            <div className="trip-input">
              <span className="material-symbols-outlined">currency_rupee</span>
              <input
                type="number"
                placeholder="15000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="trip-field">
            <label>Days</label>
            <div className="trip-input">
              <span className="material-symbols-outlined">calendar_month</span>
              <input
                type="number"
                placeholder="3"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          </div>

          <div className="trip-field">
            <label>People</label>
            <div className="trip-input">
              <span className="material-symbols-outlined">group</span>
              <input
                type="number"
                placeholder="2"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="trip-interests">
          <label>Interests</label>
          <div className="trip-chips">
            {INTEREST_OPTIONS.map((interest) => {
              const picked = interests.includes(interest.name);
              return (
                <button

                  type="button"
                  key={interest.name}
                  className={picked ? "trip-chip trip-chip-on" : "trip-chip"}
                  onClick={() => toggleInterest(interest.name)}
                >

                  {picked && (
                    <span className="material-symbols-outlined">
                      {interest.icon}
                    </span>
                  )}
                  {interest.name}
                </button>
              );
            })}
          </div>
        </div>

        <button className="trip-generate" type="submit" disabled={loading}>
          <span className="material-symbols-outlined">auto_awesome</span>
          {loading ? "Planning your trip..." : "Generate Trip Plan"}
        </button>
      </form>

      {loading && (
        <div className="trip-loading">
          <div className="trip-spinner"></div>
          <p>Our AI is putting your itinerary together</p>
        </div>
      )}

      {result && (
        <section className="trip-result">
          <div className="trip-summary">
            <h2>
              Your {days}-day trip to {destination}
            </h2>
            <p>{result.plan.summary}</p>
          </div>

          {result.plan.budgetWarning && (
            <div className="trip-budget-warning">
              <div className="trip-budget-warning-header">
                <span className="material-symbols-outlined">warning</span>
                <h4>Budget Reality Check</h4>
              </div>
              <p>{result.plan.budgetWarning}</p>
              {result.plan.estimatedMinimumBudget && (
                <div className="trip-budget-estimate">
                  <span className="material-symbols-outlined">payments</span>
                  <span>
                    Realistic minimum budget needed:{" "}
                    <strong>₹{result.plan.estimatedMinimumBudget}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="trip-days">
            {(result.plan.days || []).map((day, idx) => (
              <article className="trip-day" key={day.day ?? idx}>
                <div className="trip-day-number">Day {day.day ?? idx + 1}</div>
                <h3>{day.title}</h3>
                <ul>
                  {(day.activities || []).map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {result.plan.tips && result.plan.tips.length > 0 && (
            <div className="trip-tips">
              <h3>Good to know</h3>
              <ul>
                {result.plan.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="trip-stays">
            <h3>Stays for you in {destination}</h3>
            <p className="trip-stays-note">
              Within your nightly budget of Rs {Math.round(result.perNight || 0)}
            </p>

            {(!result.properties || result.properties.length === 0) && (
              <p className="trip-empty">
                We do not have a stay in {destination} inside this budget yet.
                Try a higher budget or fewer days.
              </p>
            )}

            <div className="trip-property-grid">
              {(result.properties || []).map((property, idx) => {
                const imgUrl =
                  property.images?.[0]?.url ||
                  (typeof property.images?.[0] === "string"
                    ? property.images[0]
                    : "/assets/image1.jpeg");
                const cityName = property.address?.city || "";
                const stateName = property.address?.state || "";
                const place =
                  cityName && stateName
                    ? `${cityName}, ${stateName}`
                    : cityName || stateName || "India";

                return (
                  <article
                    className="trip-property"
                    key={property._id || `prop-${idx}`}
                  >
                    <img
                      src={imgUrl}
                      alt={property.propertyName || "Stay"}
                      onError={(e) => {
                        e.target.src = "/assets/image1.jpeg";
                      }}
                    />
                    <div className="trip-property-body">
                      <h4>{property.propertyName || "Untitled Stay"}</h4>
                      <p className="trip-property-place">{place}</p>
                      <p className="trip-property-price">
                        <span>Rs {property.price || 0}</span> per night
                      </p>
                      <Link
                        className="trip-view"
                        to={`/propertylist/${property._id || ""}`}
                      >
                        View Property
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AiTripPlanner;

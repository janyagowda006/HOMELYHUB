import React, { useState } from "react";
import ImagesUploading from "./ImagesUploading";
import { getAiDescription } from "../../ai/aiDescription";
import { useForm } from "@tanstack/react-form";
import { AddressField } from "./AddressField";
import AmenitiesField from "./AmenitiesField";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Section = ({ icon, title, hint, children }) => (
  <section className="accf-card">
    <div className="accf-sec">
      <span className="material-symbols-outlined">{icon}</span>
      <h2>{title}</h2>
      {hint && <span className="accf-hint">{hint}</span>}
    </div>
    {children}
  </section>
);

import { useDispatch, useSelector } from "react-redux";
import { createAccomodation } from "../../store/Accomodation/accomodation-action";

const AccomodationForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading = false } = useSelector(
    (state) => state.accomodation || state.accommodation || {}
  );
  const [aiLoading, setAiLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      propertyType: undefined,
      roomType: undefined,
      extraInfo: "",
      images: [],
      amenities: [],
      address: {},
      checkIn: "13:00",
      checkOut: "11:00",
      maximumGuest: 1,
      price: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.name || !value.name.trim()) {
        toast.error("Please enter a title for your property");
        return;
      }
      if (!value.description || !value.description.trim()) {
        toast.error("Please provide a description");
        return;
      }
      if (!value.propertyType) {
        toast.error("Please select a property type");
        return;
      }
      if (!value.roomType) {
        toast.error("Please select a room type");
        return;
      }
      if (!value.address?.city || !value.address.city.trim()) {
        toast.error("Please enter the city in the address section");
        return;
      }
      if (!value.price || Number(value.price) <= 0) {
        toast.error("Please specify a valid price per night");
        return;
      }

      const formattedImages =
        Array.isArray(value.images) && value.images.length > 0
          ? value.images.map((img) =>
              typeof img === "string" ? { url: img, public_id: "" } : img
            )
          : [
              { url: "/assets/image1.jpeg", public_id: "" },
              { url: "/assets/image2.jpeg", public_id: "" },
              { url: "/assets/image3.jpeg", public_id: "" },
            ];

      const newAccomodation = {
        propertyName: value.name.trim(),
        description: value.description.trim(),
        propertyType: value.propertyType,
        roomType: value.roomType,
        extraInfo: value.extraInfo || "",
        images: formattedImages,
        address: {
          area: value.address?.area || "",
          city: value.address?.city.trim(),
          state: value.address?.state || "",
          pincode: value.address?.pincode || 0,
        },
        amenities: Array.isArray(value.amenities) ? value.amenities : [],
        checkInTime: value.checkIn || "13:00",
        checkOutTime: value.checkOut || "11:00",
        maximumGuest: Math.max(Number(value.maximumGuest) || 1, 1),
        price: Number(value.price),
      };

      try {
        await dispatch(createAccomodation(newAccomodation));
        toast.success("New Property Created Successfully!");
        navigate("/accomodation");
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to create property. Please try again."
        );
      }
    },
  });

  const handleAiDescription = async (field) => {
    const values = form.state.values;

    if (!values.name || !values.name.trim()) {
      toast.error("Please enter a property title first to write with AI");
      return;
    }

    setAiLoading(true);
    try {
      const description = await getAiDescription(values);
      if (description) {
        field.handleChange(description);
        toast.success("AI generated description added!");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Could not generate description. Please try again."
      );
      console.error(error);
    }
    setAiLoading(false);
  };

  return (
    <div className="accf-page">
      <header className="accf-hero">
        <h1>
          <span className="material-symbols-outlined">home_work</span>
          List your place
        </h1>
        <p>
          Fill in the details below
        </p>
      </header>

      <form
        className="accf-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Section icon="title" title="Title" hint="Short and catchy">
          <form.Field name="name">
            {(field) => (
              <input
                className="accf-input"
                type="text"
                placeholder="Sunny cottage near the beach"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>
        </Section>

        <Section icon="location_on" title="Address">
          <AddressField form={form} />
        </Section>

        <Section icon="photo_library" title="Photos" hint="At least 6">
          <form.Field name="images">
            {(field) => <ImagesUploading field={field} />}
          </form.Field>
        </Section>

        <Section icon="home" title="Property">
          <div className="accf-grid-2">
            <div className="accf-field">
              <label>Property type</label>
              <form.Field name="propertyType">
                {(field) => (
                  <select
                    className="accf-input"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="House">House</option>
                    <option value="Flat">Flat</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Hotel">Hotel</option>
                  </select>
                )}
              </form.Field>
            </div>

            <div className="accf-field">
              <label>Room type</label>
              <form.Field name="roomType">
                {(field) => (
                  <select
                    className="accf-input"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Anytype">Anytype</option>
                    <option value="Entire Home">Entire Home</option>
                    <option value="Room">Room</option>
                  </select>
                )}
              </form.Field>
            </div>
          </div>
        </Section>

        <Section icon="checklist" title="Amenities" hint="Pick what you offer">
          <AmenitiesField form={form} />
        </Section>

        <Section icon="gavel" title="House rules" hint="Optional">
          <form.Field name="extraInfo">
            {(field) => (
              <textarea
                className="accf-input accf-textarea"
                rows="3"
                placeholder="Check-in after 1pm, no smoking indoors..."
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>
        </Section>

        <Section icon="description" title="Description">
          <form.Field name="description">
            {(field) => (
              <>
                <div className="accf-desc-row">
                  <span className="accf-hint">
                    Tell guests what makes your place special
                  </span>

                  <button
                    type="button"
                    className="accf-ai"
                    disabled={aiLoading}
                    onClick={() => handleAiDescription(field)}
                  >
                    <span className="material-symbols-outlined">
                      auto_awesome
                    </span>
                    {aiLoading ? "Writing..." : "Write with AI"}
                  </button>
                </div>
                <textarea
                  className="accf-input accf-textarea"
                  rows="5"
                  placeholder="Write a few lines, or let AI do it for you"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </>
            )}
          </form.Field>
        </Section>

        <Section icon="event" title="Stay details" hint="24 hour format">
          <div className="accf-grid-4">
            <div className="accf-field">
              <label>Check-in</label>
              <form.Field name="checkIn">
                {(field) => (
                  <input
                    className="accf-input"
                    type="time"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>

            <div className="accf-field">
              <label>Check-out</label>
              <form.Field name="checkOut">
                {(field) => (
                  <input
                    className="accf-input"
                    type="time"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>

            <div className="accf-field">
              <label>Guests</label>
              <form.Field name="maximumGuest">
                {(field) => (
                  <input
                    className="accf-input"
                    type="number"
                    placeholder="2"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>

            <div className="accf-field">
              <label>Price / night</label>
              <form.Field name="price">
                {(field) => (
                  <input
                    className="accf-input"
                    type="number"
                    placeholder="2000"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </Section>

        <button className="accf-save" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Publish listing"}
        </button>
      </form>
    </div>
  );
};

export default AccomodationForm;

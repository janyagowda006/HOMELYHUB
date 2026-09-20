import { axiosInstance } from "../utils/axios";

export const getAiDescription = async (values) => {
  // Extract clean string names from amenity objects { name, icon }
  const formattedAmenities = Array.isArray(values.amenities)
    ? values.amenities
        .map((a) => (typeof a === "object" && a !== null ? a.name || a.value : a))
        .filter(Boolean)
    : [];

  const payload = {
    propertyName: values.name || "",
    extraInfo: values.extraInfo || "",
    propertyType: values.propertyType || "House",
    roomType: values.roomType || "Entire Home",
    maximumGuest: values.maximumGuest || 1,
    amenities: formattedAmenities,
    price: values.price || "",
    address: values.address || {},
    checkInTime: values.checkIn || "13:00",
    checkOutTime: values.checkOut || "11:00",
  };

  const { data } = await axiosInstance.post(
    "/api/v1/rent/user/generateDescription",
    payload
  );

  return data.data?.description || data.description;
};

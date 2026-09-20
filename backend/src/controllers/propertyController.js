import mongoose from "mongoose";
import Property from "../Models/propertyModel.js";
import APIFeatures from "../utils/APIFeatures.js";
import imagekit from "../utils/ImagekitIO.js";
import { generatePropertyDescriptionAI } from "../ai/aiClient.js";
import { generateTripPlan } from "./tripController.js";

// ============================================================
// ERROR RESPONSE HELPER
// Consistent formatting with authController for API errors
// ============================================================
const sendErrorResponse = (res, error, defaultStatusCode = 400) => {
  // Mongoose validation errors
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      status: "fail",
      message: messages.join(". "),
    });
  }

  // CastError (e.g. invalid MongoDB ObjectId)
  if (error.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }

  // Duplicate key (e.g. duplicate slug)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
    return res.status(409).json({
      status: "fail",
      message: `A property with this ${field} already exists.`,
    });
  }

  const statusCode =
    typeof error.statusCode === "number" ? error.statusCode : defaultStatusCode;

  return res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message: error.message || "An unexpected error occurred.",
  });
};

// ============================================================
// 1. GET ALL PROPERTIES
// Supports advanced search, filtering, sorting, field selection,
// and pagination via APIFeatures.
// ============================================================
export const getAllProperties = async (req, res) => {
  try {
    // 1) Build count query for accurate pagination metadata
    // We run filter & search on a clone query to know total matched documents
    const countFeatures = new APIFeatures(Property.find(), req.query)
      .filter()
      .search();
    const totalProperties = await countFeatures.query.countDocuments();

    // 2) Build final query with sort, select fields, and pagination
    const features = new APIFeatures(
      Property.find().populate({
        path: "userId",
        select: "name email avatar phoneNumber role",
      }),
      req.query
    )
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    // Execute query
    const properties = await features.query;

    // 3) Pagination metadata calculation
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 12, 1);
    const totalPages = Math.ceil(totalProperties / limit) || 1;

    res.status(200).json({
      status: "success",
      results: properties.length,
      pagination: {
        totalProperties,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: {
        properties,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 2. GET PROPERTY BY ID (OR SLUG)
// Allows querying by standard MongoDB ObjectId OR friendly slug
// ============================================================
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Property ID or slug is required.",
      });
    }

    let propertyQuery;

    // Check if parameter is a valid 24-char MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      propertyQuery = Property.findById(id);
    } else {
      // Otherwise query by unique slug (e.g. /properties/luxury-beach-villa)
      propertyQuery = Property.findOne({ slug: id.toLowerCase().trim() });
    }

    // Populate host information
    const property = await propertyQuery.populate({
      path: "userId",
      select: "name email avatar phoneNumber role createdAt",
    });

    if (!property) {
      return res.status(404).json({
        status: "fail",
        message: `No property found with ID or slug: "${id}"`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        property,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 3. CREATE PROPERTY (ADVANCED: WITH IMAGEKIT UPLOAD)
// Uploads 6 property images to ImageKit if base64/files are provided
// ============================================================
export const createProperty = async (req, res) => {
  try {
    const propertyData = { ...req.body };

    // Attach host user ID if authenticated via protect middleware
    if (req.user && req.user._id) {
      propertyData.userId = req.user._id;
    }

    if (!propertyData.userId) {
      return res.status(400).json({
        status: "fail",
        message: "A property must be associated with a valid userId (host).",
      });
    }

    // Handle ImageKit uploads if images are passed as base64 data URLs or file buffers
    if (Array.isArray(propertyData.images) && propertyData.images.length > 0) {
      const processedImages = [];

      for (let i = 0; i < propertyData.images.length; i++) {
        const item = propertyData.images[i];

        // If item is base64 string
        if (typeof item === "string" && item.startsWith("data:image")) {
          const uploadRes = await imagekit.upload({
            file: item,
            fileName: `prop_${Date.now()}_img${i + 1}`,
            folder: "/homelyhub/properties",
          });

          processedImages.push({
            url: uploadRes.url,
            public_id: uploadRes.fileId,
          });
        } else if (typeof item === "string") {
          // Plain URL
          processedImages.push({ url: item, public_id: "" });
        } else if (item && item.url) {
          // Already formatted object
          processedImages.push(item);
        }
      }

      propertyData.images = processedImages;
    }

    // Create property in MongoDB
    const newProperty = await Property.create(propertyData);

    res.status(201).json({
      status: "success",
      message: "Property listed successfully!",
      data: {
        property: newProperty,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 400);
  }
};

// ============================================================
// 4. UPDATE PROPERTY
// Allows updating listing details and handling ImageKit replacements
// ============================================================
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        status: "fail",
        message: `No property found with ID: ${id}`,
      });
    }

    // Authorization check: host can only update their own property (or admin)
    if (
      req.user &&
      req.user.role !== "admin" &&
      property.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to edit this property.",
      });
    }

    const updateData = { ...req.body };

    // If new images provided as base64, upload to ImageKit
    if (Array.isArray(updateData.images) && updateData.images.length > 0) {
      const processedImages = [];

      for (let i = 0; i < updateData.images.length; i++) {
        const item = updateData.images[i];

        if (typeof item === "string" && item.startsWith("data:image")) {
          const uploadRes = await imagekit.upload({
            file: item,
            fileName: `prop_${Date.now()}_img${i + 1}`,
            folder: "/homelyhub/properties",
          });

          processedImages.push({
            url: uploadRes.url,
            public_id: uploadRes.fileId,
          });
        } else if (typeof item === "string") {
          processedImages.push({ url: item, public_id: "" });
        } else if (item && item.url) {
          processedImages.push(item);
        }
      }

      updateData.images = processedImages;
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        property: updatedProperty,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 400);
  }
};

// ============================================================
// 5. DELETE PROPERTY (CLEANS UP IMAGEKIT ASSETS)
// Deletes listing from DB and removes its uploaded images from ImageKit
// ============================================================
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        status: "fail",
        message: `No property found with ID: ${id}`,
      });
    }

    // Authorization check
    if (
      req.user &&
      req.user.role !== "admin" &&
      property.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to delete this property.",
      });
    }

    // Clean up images from ImageKit in background
    if (Array.isArray(property.images)) {
      for (const img of property.images) {
        if (img.public_id) {
          try {
            await imagekit.deleteFile(img.public_id);
          } catch (err) {
            console.warn(`Failed to delete ImageKit file ${img.public_id}:`, err.message);
          }
        }
      }
    }

    await Property.findByIdAndDelete(id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 6. AI TRIP PLANNER (Delegated to dedicated tripController)
// ============================================================
export { generateTripPlan };

// ============================================================
// 7. AI PROPERTY DESCRIPTION GENERATOR
// Generates an appealing property listing description
// ============================================================
export const generatePropertyDescription = async (req, res) => {
  try {
    const {
      propertyName,
      extraInfo,
      propertyType = "House",
      roomType = "Entire Home",
      maximumGuest = 2,
      amenities = [],
      address = {},
      price,
      checkInTime,
      checkOutTime,
    } = req.body;

    let description = "";
    try {
      description = await generatePropertyDescriptionAI({
        propertyName,
        extraInfo,
        propertyType,
        roomType,
        maximumGuest,
        amenities,
        address,
        price,
        checkInTime,
        checkOutTime,
      });
    } catch (aiErr) {
      console.warn("AI generation failed, using fallback:", aiErr.message);
    }

    if (!description || !description.trim()) {
      const locParts = [];
      if (address?.area) locParts.push(address.area.trim());
      if (address?.city) locParts.push(address.city.trim());
      if (address?.state) locParts.push(address.state.trim());
      const locationStr = locParts.length > 0 ? locParts.join(", ") : "a prime location";

      const formattedAmenities = Array.isArray(amenities)
        ? amenities
            .map((a) => (typeof a === "object" && a !== null ? a.name || a.value : a))
            .filter(Boolean)
        : [];
      const amenitiesStr =
        formattedAmenities.length > 0
          ? ` Featuring modern amenities including ${formattedAmenities.join(", ")}, you will have everything needed for a relaxing stay.`
          : " Equipped with essential amenities for a hassle-free visit.";

      description = `Welcome to ${
        propertyName || "our stay"
      }! Situated in ${locationStr}, this charming ${propertyType.toLowerCase()} offers a ${roomType.toLowerCase()} experience accommodating up to ${maximumGuest} guests comfortably.${amenitiesStr} ${
        extraInfo ? extraInfo.trim() + " " : ""
      }${price ? `Offered at ₹${price} per night. ` : ""}Whether you're visiting for work or leisure, enjoy a serene atmosphere and unforgettable hospitality.`;
    }

    res.status(200).json({
      status: "success",
      data: {
        description,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// ============================================================
// 8. GET MY ACCOMODATIONS (Host's listed properties)
// ============================================================
export const getMyAccomodations = async (req, res) => {
  try {
    const userId = req.user._id;
    const properties = await Property.find({ userId }).sort("-createdAt");
    res.status(200).json({
      status: "success",
      results: properties.length,
      data: {
        properties,
        accomodation: properties,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

export default {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  generateTripPlan,
  generatePropertyDescription,
  getMyAccomodations,
};


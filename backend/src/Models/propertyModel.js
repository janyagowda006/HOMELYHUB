import mongoose from "mongoose";
import slugify from "slugify";

const propertySchema = new mongoose.Schema(
  {
    propertyName: {
      type: String,
      required: [true, "Please enter your property name"],
      trim: true,
      maxLength: [100, "Property name cannot exceed 100 characters"],
      minLength: [3, "Property name must be at least 3 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Please add information about your property"],
      trim: true,
    },
    extraInfo: {
      type: String,
      trim: true,
      default: "",
    },
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: {
        values: [
          "Flat",
          "Guest House",
          "Guesthouse",
          "House",
          "Hotel",
          "Villa",
          "Apartment",
          "Resort",
          "Cabin",
          "Cottage",
          "Homestay",
          "Farmhouse",
        ],
        message: "{VALUE} is not a supported property type",
      },
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      enum: {
        values: [
          "Room",
          "Anytype",
          "Entire Home",
          "Entire home",
          "Entire place",
          "Private room",
          "Shared room",
          "Hotel room",
        ],
        message: "{VALUE} is not a supported room type",
      },
      trim: true,
    },
    maximumNight: {
      type: Number,
      default: 14,
    },
    maximumGuest: {
      type: Number,
      required: [true, "Please specify maximum number of guests"],
      min: [1, "Property must accommodate at least 1 guest"],
      alias: "maximunGuest",
    },
    amenities: [
      {
        name: {
          type: String,
          required: [true, "Amenity name is required"],
          trim: true,
        },
        icon: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],
    images: {
      type: [
        {
          url: {
            type: String,
            required: [true, "Image URL is required"],
          },
          public_id: {
            type: String,
            default: "",
          },
        },
      ],
      required: [true, "Please upload property images"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
      alias: "pricePerNight",
    },
    address: {
      area: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      country: {
        type: String,
        trim: true,
        default: "India",
      },
      pincode: {
        type: mongoose.Schema.Types.Mixed,
        default: 0,
        alias: "zipCode",
      },
      street: {
        type: String,
        trim: true,
        default: "",
      },
      landmark: {
        type: String,
        trim: true,
        default: "",
      },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    chekInTime: {
      type: String,
      default: "13:00",
      alias: "checkInTime",
      trim: true,
    },
    chekOutTime: {
      type: String,
      default: "11:00",
      alias: "checkOutTime",
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentBookings: [
      {
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
        },
        fromDate: {
          type: Date,
          required: true,
        },
        toDate: {
          type: Date,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be above 0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to normalize input
propertySchema.pre("validate", function () {
  if (Array.isArray(this.amenities)) {
    this.amenities = this.amenities.map((item) =>
      typeof item === "string" ? { name: item, icon: "" } : item
    );
  }

  if (Array.isArray(this.images)) {
    this.images = this.images.map((item) =>
      typeof item === "string" ? { url: item, public_id: "" } : item
    );
  }
});

// Pre-save hook to generate unique slug
propertySchema.pre("save", async function () {
  if (this.isModified("propertyName") || !this.slug) {
    const baseSlug = slugify(this.propertyName, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let count = 1;

    while (
      await mongoose.models.Property?.findOne({
        slug: uniqueSlug,
        _id: { $ne: this._id },
      })
    ) {
      uniqueSlug = `${baseSlug}-${count}`;
      count++;
    }

    this.slug = uniqueSlug;
  }
});

// Text index for search functionality
propertySchema.index({
  propertyName: "text",
  description: "text",
  "address.city": "text",
  "address.area": "text",
  "address.state": "text",
});

propertySchema.index({ price: 1, propertyType: 1 });
propertySchema.index({ ratingsAverage: -1 });

const Property = mongoose.model("Property", propertySchema);

export default Property;
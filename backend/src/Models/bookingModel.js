import mongoose from "mongoose";
import "./userModel.js";
import "./propertyModel.js";

const bookingSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. PROPERTY & USER REFERENCES
    // ============================================================
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "A booking must belong to a property"],
      alias: "propertyId",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A booking must belong to a user"],
      alias: "userId",
      index: true,
    },
    orderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // ============================================================
    // 2. DATES (CHECK-IN & CHECK-OUT)
    // Supports checkInDate / checkOutDate and fromDate / toDate
    // ============================================================
    checkInDate: {
      type: Date,
      required: [true, "Check-in date is required"],
      alias: "fromDate",
      index: true,
    },
    checkOutDate: {
      type: Date,
      required: [true, "Check-out date is required"],
      alias: "toDate",
      validate: {
        validator: function (value) {
          return this.checkInDate ? value > this.checkInDate : true;
        },
        message: "Check-out date must be after check-in date",
      },
      index: true,
    },
    numberOfNights: {
      type: Number,
      default: 1,
      min: [1, "Booking must be for at least 1 night"],
    },

    // ============================================================
    // 3. GUESTS BREAKDOWN
    // Seamlessly handles either a number (guests: 2) or object breakdown
    // ============================================================
    guests: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Number of guests is required"],
      default: () => ({
        totalGuests: 1,
        adults: 1,
        children: 0,
        infants: 0,
      }),
      set: function (val) {
        if (typeof val === "number" || typeof val === "string") {
          const num = Math.max(Number(val) || 1, 1);
          return {
            totalGuests: num,
            adults: num,
            children: 0,
            infants: 0,
          };
        }
        if (val && typeof val === "object") {
          const adults = Number(val.adults) || 1;
          const children = Number(val.children) || 0;
          const infants = Number(val.infants) || 0;
          return {
            totalGuests: Number(val.totalGuests) || adults + children,
            adults,
            children,
            infants,
          };
        }
        return val;
      },
    },

    // ============================================================
    // 4. PRICING & BREAKDOWN
    // ============================================================
    price: {
      type: Number,
      required: [true, "A booking must have a price"],
      min: [0, "Price cannot be negative"],
      alias: "totalPrice",
    },
    priceBreakdown: {
      pricePerNight: {
        type: Number,
        default: 0,
      },
      cleaningFee: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
        uppercase: true,
      },
    },

    // ============================================================
    // 5. PAYMENT INFORMATION
    // ============================================================
    paid: {
      type: Boolean,
      default: false,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "refunded", "failed"],
        message: "{VALUE} is not a supported payment status",
      },
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: {
        values: [
          "card",
          "upi",
          "upi_qr",
          "qr",
          "netbanking",
          "wallet",
          "cash",
          "cash_on_arrival",
          "pay_at_hotel",
          "pay_at_property",
          "stripe",
          "razorpay",
        ],
        message: "{VALUE} is not a supported payment method",
      },
      default: "card",
    },
    paymentInfo: {
      transactionId: {
        type: String,
        default: "",
      },
      paidAt: {
        type: Date,
      },
    },

    // ============================================================
    // 6. BOOKING STATUS & AUDIT
    // ============================================================
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed"],
        message: "{VALUE} is not a supported booking status",
      },
      default: "confirmed",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledAt: {
      type: Date,
    },

    // ============================================================
    // 7. GUEST CONTACT & SPECIAL REQUESTS
    // ============================================================
    guestContact: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },
    specialRequests: {
      type: String,
      trim: true,
      maxLength: [500, "Special requests cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// PRE-VALIDATE HOOK
// Calculates nights and syncs payment date
// ============================================================
bookingSchema.pre("validate", function () {
  // Calculate number of nights
  if (this.checkInDate && this.checkOutDate) {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    if (diffTime > 0) {
      this.numberOfNights = Math.max(
        Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
        1
      );
    }
  }

  // Synchronize payment status with paid flag
  if (this.paid && this.paymentStatus === "pending") {
    this.paymentStatus = "paid";
    if (!this.paymentInfo?.paidAt) {
      this.paymentInfo = this.paymentInfo || {};
      this.paymentInfo.paidAt = new Date();
    }
  }
});

// ============================================================
// QUERY MIDDLEWARE
// Automatically populate property and user on find queries
// ============================================================
bookingSchema.pre(/^find/, function () {
  this.populate({
    path: "property",
    select: "propertyName images address price slug chekInTime chekOutTime",
  }).populate({
    path: "user",
    select: "name email avatar phoneNumber",
  });
});

// ============================================================
// INDEXES FOR SEARCH & FILTER PERFORMANCE
// ============================================================
bookingSchema.index({ property: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

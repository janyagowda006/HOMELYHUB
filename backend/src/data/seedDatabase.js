import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set in .env!");
  process.exit(1);
}

const dataFilePath = path.join(__dirname, "properties.json");

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Atlas connected successfully!");
  } catch (err) {
    console.error("DB Connection error:", err.message);
    process.exit(1);
  }
};

// Import data
const importData = async () => {
  try {
    await connectDB();

    const raw = fs.readFileSync(dataFilePath, "utf8");
    const propertiesData = JSON.parse(raw);
    console.log(`Read ${propertiesData.length} properties from properties.json`);

    // Convert string IDs & dates to proper BSON types
    const convertedDocs = propertiesData.map((prop) => {
      const doc = { ...prop };

      if (doc._id && typeof doc._id === "string") {
        doc._id = new mongoose.Types.ObjectId(doc._id);
      }

      if (Array.isArray(doc.currentBookings)) {
        doc.currentBookings = doc.currentBookings.map((b) => {
          const booking = { ...b };
          if (booking._id && typeof booking._id === "string") {
            booking._id = new mongoose.Types.ObjectId(booking._id);
          }
          if (booking.bookingId && typeof booking.bookingId === "string") {
            booking.bookingId = new mongoose.Types.ObjectId(booking.bookingId);
          }
          if (booking.userId && typeof booking.userId === "string") {
            booking.userId = new mongoose.Types.ObjectId(booking.userId);
          }
          if (booking.fromDate) {
            booking.fromDate = new Date(booking.fromDate);
          }
          if (booking.toDate) {
            booking.toDate = new Date(booking.toDate);
          }
          return booking;
        });
      }

      return doc;
    });

    const collection = mongoose.connection.collection("properties");

    console.log("Clearing existing properties...");
    await collection.deleteMany({});

    console.log("Inserting properties into MongoDB Atlas...");
    const result = await collection.insertMany(convertedDocs);

    console.log(`Successfully seeded ${result.insertedCount} properties into MongoDB Atlas!`);
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDB();
    const collection = mongoose.connection.collection("properties");
    await collection.deleteMany({});
    console.log("All properties successfully deleted from MongoDB Atlas!");
  } catch (error) {
    console.error("Deletion error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

if (process.argv[2] === "--delete") {
  deleteData();
} else {
  importData();
}

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";
import userRoutes from "./routes/userRoutes.js";

import propertyRouter from "./routes/propertyRouter.js";
import bookingRouter from "./routes/bookingRouter.js";
import tripRouter from "./routes/tripRouter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../Frontend/dist");

const app = express();

// Enable CORS for frontend requests with credentials (cookies)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/properties", propertyRouter);
app.use("/api/v1/rent", propertyRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/trip", tripRouter);
app.use("/api/v1/trips", tripRouter);

// Root health check endpoint for uptime monitors
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "success", message: "Homelyhub API is healthy & running" });
});

// Serve frontend static build if dist exists
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Express 5 compatible SPA fallback for all non-API GET requests (preserves client-side routing on page refresh)
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.originalUrl.startsWith("/api")) {
      return res.sendFile(path.join(frontendDistPath, "index.html"));
    }
    next();
  });
} else {
  // If dist doesn't exist, provide a friendly landing message on root
  app.get("/", (req, res) => {
    res.send("Homelyhub API server is running. Build frontend with 'npm run build' to serve UI here.");
  });
}

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8080;

connectDB();

app.listen(PORT, () => {
  console.log(`running on port no ${PORT}`);
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
});


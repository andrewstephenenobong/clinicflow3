import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import queueRoutes from "./routes/queue.routes";
import bedRoutes from "./routes/bed.routes";
import patientRoutes from "./routes/patient.routes";
import staffRoutes from "./routes/staff.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import clinicRoutes from "./routes/clinic.routes";
dotenv.config();

// Startup validation of configuration settings
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ Warning: DATABASE_URL environment variable is not defined!");
}
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET environment variable is not defined!");
}

// Fail-fast in production when critical configuration is missing.
if (process.env.NODE_ENV === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((k) => !process.env[k as keyof NodeJS.ProcessEnv]);
  if (missing.length) {
    console.error(`❌ Missing required environment variables in production: ${missing.join(", ")}`);
    console.error("Exiting to avoid running with an insecure or non-functional configuration.");
    process.exit(1);
  }
}

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5000",
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) || origin.startsWith("http://localhost:");
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development or if no FRONTEND_URL is specified, fallback to allowing the origin
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());
// Friendly handler for malformed JSON bodies from clients (returns 400)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (!err) return _next();
  const isJsonParseError = err.type === "entity.parse.failed" || (err instanceof SyntaxError) || err.status === 400;
  if (isJsonParseError) {
    console.error("❌ JSON Parse Error:", err.message);
    res.status(400).json({
      error: "Invalid JSON",
      message: "Request body contains malformed JSON. Please ensure your client sends valid JSON.",
    });
    return;
  }
  _next(err);
});
app.use(cookieParser());

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "clinicflow-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clinic", clinicRoutes);

// Global Unhandled Error Handler Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Unhandled Application Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ClinicFlow backend running on http://localhost:${PORT}`);
});

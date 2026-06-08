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
dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
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
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ClinicFlow backend running on http://localhost:${PORT}`);
});

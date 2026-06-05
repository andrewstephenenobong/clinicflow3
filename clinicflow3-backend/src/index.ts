import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();

// CORS — allow frontend dev server to send cookies
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true, // required for httpOnly cookies to work cross-origin
}));

app.use(express.json());
app.use(cookieParser()); // required to read req.cookies

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "clinicflow-backend" });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(` ClinicFlow backend running on http://localhost:${PORT}`);
});

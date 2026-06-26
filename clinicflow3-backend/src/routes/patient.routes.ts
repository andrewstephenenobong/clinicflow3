import { Router } from "express";
import {
  searchPatients,
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
} from "../controllers/patient.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getPatients);
router.get("/search", searchPatients); // MUST be before /:id
router.get("/:id", getPatient);
router.post("/", createPatient);
router.patch("/:id", updatePatient);

export default router;
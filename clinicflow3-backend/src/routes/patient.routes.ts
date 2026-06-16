import { Router } from "express";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
} from "../controllers/patient.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getPatients);
router.get("/:id", getPatient);
router.post("/", createPatient);
router.patch("/:id", updatePatient);

export default router;
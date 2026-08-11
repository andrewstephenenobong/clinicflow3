import { Router } from "express";
import {
  getBeds,
  assignablePatients,
  admittedPatients,
  createBed,
  assignBed,
  dischargeBed,
  patientAdmissions,
  updateBed,
  removeBed,
} from "../controllers/bed.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// Read
router.get("/", getBeds);
router.get("/assignable", assignablePatients);
router.get("/admitted", admittedPatients);
router.get("/admissions/:patientId", patientAdmissions);

// Create / edit / remove
router.post("/", createBed);
router.patch("/:id/assign", assignBed);
router.patch("/:id/discharge", dischargeBed);
router.patch("/:id", updateBed);
router.delete("/:id", removeBed);

export default router;

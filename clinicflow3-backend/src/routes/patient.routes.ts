import { Router } from "express";
import { getPatients, getPatient, createPatient } from "../controllers/patient.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getPatients);
router.get("/:id", getPatient);
router.post("/", createPatient);

export default router;

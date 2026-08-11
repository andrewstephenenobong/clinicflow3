import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { updateClinic } from "../controllers/clinic.controller";

const router = Router();

router.patch("/", requireAuth, updateClinic);

export default router;

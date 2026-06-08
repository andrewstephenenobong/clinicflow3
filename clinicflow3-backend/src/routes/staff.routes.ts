import { Router } from "express";
import { getStaff, createStaff, removeStaff } from "../controllers/staff.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getStaff);
router.post("/", createStaff);
router.delete("/:id", removeStaff);

export default router;
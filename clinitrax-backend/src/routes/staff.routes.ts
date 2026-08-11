import { Router } from "express";
import { getStaff, createStaff, removeStaff, updateStaff } from "../controllers/staff.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getStaff);
router.post("/", createStaff);
router.delete("/:id", removeStaff);
router.patch("/:id", updateStaff);

export default router;
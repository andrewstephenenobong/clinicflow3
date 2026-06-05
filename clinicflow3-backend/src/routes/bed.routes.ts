import { Router } from "express";
import { getBeds, updateBed } from "../controllers/bed.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // all bed routes require auth

router.get("/", getBeds);
router.patch("/:id", updateBed);

export default router;

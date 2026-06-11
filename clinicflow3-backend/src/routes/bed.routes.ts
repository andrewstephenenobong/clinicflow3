import { Router } from "express";
import { getBeds, createBed, updateBed, removeBed } from "../controllers/bed.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // all bed routes require auth

router.get("/", getBeds);
router.post("/", createBed);
router.patch("/:id", updateBed);
router.delete("/:id", removeBed);

export default router;
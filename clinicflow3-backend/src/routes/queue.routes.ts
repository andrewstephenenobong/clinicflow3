import { Router } from "express";
import { getTodayQueue, checkIn, callPatient, markSeen } from "../controllers/queue.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // all queue routes require auth

router.get("/today", getTodayQueue);
router.post("/checkin", checkIn);
router.patch("/:id/call", callPatient);
router.patch("/:id/seen", markSeen);

export default router;

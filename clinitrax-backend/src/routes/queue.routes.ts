import { Router } from "express";
import { getTodayQueue, checkIn, callPatient, markSeen, cancelVisit } from "../controllers/queue.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // all queue routes require auth

router.get("/today", getTodayQueue);
router.post("/checkin", checkIn);
router.patch("/:id/call", callPatient);
router.patch("/:id/seen", markSeen);
router.delete("/:id", cancelVisit);

export default router;

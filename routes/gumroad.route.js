import { Router } from "express";
import gumroadController from "../controllers/gumroad.controller.js";

const router = Router();

router.post("/ping/", gumroadController.ping);
router.post("/test-ping/", gumroadController.testPing);

export default router;

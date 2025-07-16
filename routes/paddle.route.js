import express from "express";
import paddleController from "../controllers/paddleController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/success", protect, paddleController.paddleSuccessHandler);

export default router;

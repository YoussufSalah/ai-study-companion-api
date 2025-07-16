import express from "express";
import paddleController from "../controllers/paddle.controller.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/success", protect, paddleController.paddleSuccessHandler);

export default router;

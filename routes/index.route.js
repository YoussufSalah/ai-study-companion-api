import { Router } from "express";

const router = Router();

import authRoutes from "./auth.route.js";
import usersRoutes from "./users.route.js";
import uploadsRoutes from "./uploads.route.js";
import summariesRoutes from "./summaries.route.js";
import flashcardsRoutes from "./flashcards.route.js";
import quizzesRoutes from "./quizzes.route.js";
import paymentsRoutes from "./payments.route.js";
import subscriptionsRoutes from "./subscriptions.route.js";
import adminRoutes from "./admin.route.js";
import paddleRoutes from "./paddle.route.js";

router.use("/auth/", authRoutes);
router.use("/user/", usersRoutes);
router.use("/upload/", uploadsRoutes);
router.use("/summarize/", summariesRoutes);
router.use("/flashcards/", flashcardsRoutes);
router.use("/quizzes/", quizzesRoutes);
router.use("/payment/", paymentsRoutes);
router.use("/subscription/", subscriptionsRoutes);
router.use("/admin/", adminRoutes);
router.use("/paddle/", paddleRoutes);

export default router;

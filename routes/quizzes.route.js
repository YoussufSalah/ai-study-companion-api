import { Router } from "express";

const router = Router();

import protect from "../middlewares/authMiddleware.js";
import verifyTokensAndParse from "../middlewares/verifyTokensAndParse.js";
import quizzesController from "../controllers/quizzes.controller.js";

router.get(
    "/pdf/",
    protect,
    verifyTokensAndParse("quiz"),
    quizzesController.generateQuizPDF
);

export default router;

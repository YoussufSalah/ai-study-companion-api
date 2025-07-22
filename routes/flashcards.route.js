import { Router } from "express";

const router = Router();

import protect from "../middlewares/authMiddleware.js";
import verifyTokensAndParse from "../middlewares/verifyTokensAndParse.js";
import flashcardsController from "../controllers/flashcards.controller.js";

router.get(
    "/pdf/",
    protect,
    verifyTokensAndParse("flashcards"),
    flashcardsController.generateFlashcardsPDF
);

export default router;

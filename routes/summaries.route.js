import { Router } from "express";

const router = Router();

import protect from "../middlewares/authMiddleware.js";
import verifyTokenAndParse from "../middlewares/verifyTokensAndParse.js";
import summariesController from "../controllers/summaries.controller.js";

router.get(
    "/pdf/",
    protect,
    verifyTokenAndParse("summary"),
    summariesController.summarizePDF
);

export default router;

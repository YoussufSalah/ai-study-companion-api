import { Router } from "express";

const router = Router();

import protect from "../middlewares/authMiddleware.js";
import uploadsController from "../controllers/uploads.controller.js";

router.post(
    "/pdf",
    protect,
    uploadsController.uploadUtil.single("pdf"),
    uploadsController.uploadPDF
);

export default router;

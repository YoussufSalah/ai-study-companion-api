import { Router } from "express";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

import tokensRoutes from "./tokens.route.js";
import usersController from "../controllers/users.controller.js";
router.use("/me/tokens/", tokensRoutes);
router
    .route("/me/")
    .get(protect, usersController.getUser)
    .patch(protect, usersController.updateUser)
    .delete(protect, usersController.deleteUser);
router.patch(
    "/me/increment-study-time",
    protect,
    usersController.incrementStudyTime
);
router.get("/me/stats", protect, usersController.getStats);

export default router;

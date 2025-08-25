import { Router } from "express";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import generateWebsiteRoutes from "./websiteGenerator.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/admins", adminRoutes);
router.use("/generateWebsite",generateWebsiteRoutes )

export default router;

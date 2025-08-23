import { Router } from "express";
import { getUser, createUser } from "../controllers/user.controller";

const router = Router();

router.get("/", getUser);
router.post("/", createUser);

export default router;

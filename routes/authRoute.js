import express from "express";
import { RegisterController,LoginController } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", RegisterController);
router.post("/login", LoginController);

export default router;

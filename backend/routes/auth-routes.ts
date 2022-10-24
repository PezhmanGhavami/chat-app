import express from "express";

import * as authController from "../controllers/auth-controller";

const authRouter = express.Router();

authRouter.get("/", authController.getUser);
authRouter.post("/", authController.handleRegister);
authRouter.post("/login", authController.handleLogin);
authRouter.get("/logout", authController.handleLogout);

export default authRouter;

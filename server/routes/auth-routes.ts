import express from "express";

import * as authController from "../controllers/auth-controller";

const authRouter = express.Router();

authRouter.get("/", authController.getUser);
authRouter.post("/", authController.handleRegister);
authRouter.post("/signin", authController.handleSignin);
authRouter.get("/signout", authController.handleSignout);

export default authRouter;

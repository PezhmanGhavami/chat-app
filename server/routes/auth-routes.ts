import express from "express";

import * as authController from "@/controllers/auth-controller";

const authRouter = express.Router();

authRouter.get("/", authController.getUser);
authRouter.put("/", authController.updateUser);
authRouter.post("/", authController.handleRegister);
authRouter.post("/sign-in", authController.handleSignIn);
authRouter.get("/sign-out", authController.handleSignOut);
authRouter.get("/sessions", authController.getSessions);
authRouter.delete("/sessions/:sessionId", authController.terminateSession);
authRouter.delete("/sign-out-all", authController.signOutAll);

export default authRouter;

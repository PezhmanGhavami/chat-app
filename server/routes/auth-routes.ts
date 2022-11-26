import express from "express";

import * as authController from "../controllers/auth-controller";

const authRouter = express.Router();

authRouter.get("/", authController.getUser);
authRouter.put("/", authController.updateUser);
authRouter.post("/", authController.handleRegister);
authRouter.post("/signin", authController.handleSignin);
authRouter.get("/signout", authController.handleSignout);
authRouter.get("/sessions", authController.getSessions);
authRouter.delete(
  "/sessions/:sessionId",
  authController.terminateSession
);
authRouter.delete(
  "/signout-all",
  authController.signoutAll
);

export default authRouter;

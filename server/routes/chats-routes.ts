import express from "express";

import * as chatsController from "../controllers/chats-controller";

const chatsRouter = express.Router();

chatsRouter.get("/", chatsController.getChats);

export default chatsRouter;

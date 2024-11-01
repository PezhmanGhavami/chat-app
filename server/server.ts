import dotenv from "dotenv";
dotenv.config();
import express from "express";

import cors from "cors";
import { createServer } from "http";

import authRouter from "@/routes/auth-routes";
import chatsRouter from "@/routes/chats-routes";

import errorHandler from "@/middlewares/error-middleware";

import startSocketServer from "@/socket.io-server";

const app = express();
const httpServer = createServer(app);

const HOST = process.env.HOST || "localhost";
const envPort = process.env.PORT;
const PORT = envPort ? parseInt(envPort) : 5000;

app.use(express.json());

app.use(cors({ origin: process.env.ORIGIN, optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRouter);
app.use("/api/chats", chatsRouter);

app.use("/api/*", (req, res) => {
  res.status(404).json({ status: "ERROR", message: "Not found." });
});
app.use("*", (req, res) => {
  res.status(404).send("Not found");
});

app.use(errorHandler);

httpServer
  .listen(PORT, HOST, () => {
    console.log(`Server started at http://${HOST}:${PORT}`);
    startSocketServer(httpServer, HOST, PORT);
  })
  .on("error", (err) => {
    return console.error(err + "\n\n" + err.message);
  });

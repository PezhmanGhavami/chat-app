import dotenv from "dotenv";
dotenv.config();
import express from "express";

import authRouter from "./routes/auth-routes";
import chatsRouter from "./routes/chats-routes";

import { session } from "./middlewares/session-middleware";
import errorHandler from "./middlewares/error-middleware";

const app = express();

const HOST = "127.0.0.1";
const envPort = process.env.PORT;
const PORT = envPort ? parseInt(envPort) : 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session);

// app.get("/", (req, res) => {
// TODO - for production return the react app
// });

app.use("/api/auth", authRouter);
app.use("/api/chats", chatsRouter);

app.use("/api/*", (req, res) => {
  res
    .status(404)
    .json({ status: "ERROR", message: "Not found." });
});
app.use("*", (req, res) => {
  res.status(404).send("Not found");
});

app.use(errorHandler);

app
  .listen(PORT, HOST, () => {
    console.log(`Server started at http://${HOST}:${PORT}`);
  })
  .on("error", (err) => {
    return console.error(err + "\n\n" + err.message);
  });

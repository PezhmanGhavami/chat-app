import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { Server as socketServer } from "socket.io";
import { createServer } from "http";

import authRouter from "./routes/auth-routes";

import { session } from "./middlewares/session-middleware";
import errorHandler from "./middlewares/error-middleware";

const app = express();
const server = createServer(app);
const io = new socketServer(server, {
  cors: {
    origin: "*",
  },
});
const HOST = "127.0.0.1";
const envPort = process.env.PORT;
const PORT = envPort ? parseInt(envPort) : 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session);

server
  .listen(PORT, HOST, () => {
    console.log(`Server started at http://${HOST}:${PORT}`);
  })
  .on("error", (err) => {
    return console.error(err + "\n\n" + err.message);
  });

io.on("connection", (socket) => {
  socket.on("hello!", () => {
    console.log(`hello from ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`disconnect: ${socket.id}`);
  });
});

// app.get("/", (req, res) => {
//   res.send("home");
// });

// app.use("/api/auth", authRouter);

// app.use("/api/*", (req, res) => {
//   res
//     .status(404)
//     .json({ status: "ERROR", message: "Not found." });
// });
// app.use("*", (req, res) => {
//   res.status(404).send("Not found");
// });

// app.use(errorHandler);

// app
//   .listen(PORT, HOST, () => {
//     console.log(`Server started at http://${HOST}:${PORT}`);
//   })
//   .on("error", (err) => {
//     return console.error(err + "\n\n" + err.message);
//   });

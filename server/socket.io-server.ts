import { Server } from "socket.io";

import { prisma } from "./utils/prisma-client";
import { IUserCard } from "./utils/types";

const io = new Server(5001, {
  cors: {
    origin: "*",
  },
});

console.log("Socket.IO server started at localhost:5001");

io.on("connection", (socket) => {
  const id = socket.handshake.query.id;
  socket.join(id as string);

  console.log(`${id} joined`);

  socket.on("search", async ({ query }) => {
    const res = await prisma.user.findMany({
      where: {
        OR: [
          {
            id: query,
          },
          {
            email: query,
          },
          {
            username: query,
          },
          {
            displayName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        NOT: {
          id: id as string,
        },
      },
      select: {
        id: true,
        displayName: true,
        profilePicure: true,
      },
    });

    socket.emit("search-result", res as IUserCard[]);
  });

  // socket.on("disconnect")
});

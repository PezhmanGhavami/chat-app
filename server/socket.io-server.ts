import { Server } from "socket.io";

import { prisma } from "./utils/prisma-client";
import { IUserCard, IChatCard } from "./utils/types";

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

  socket.on("create-chat", async ({ recipientId }) => {
    console.log(recipientId);
    const newChat = await prisma.chat.create({
      data: {
        users: {
          connect: [{ id: recipientId }, { id }],
        },
      },
      include: {
        users: true,
      },
    });

    let currentUser;
    let recipientUser;

    if (newChat.users[0].id === id) {
      currentUser = newChat.users[0];
      recipientUser = newChat.users[1];
    } else {
      recipientUser = newChat.users[0];
      currentUser = newChat.users[1];
    }

    const currentUserPayload: IChatCard = {
      id: newChat.id,
      displayName: recipientUser.displayName,
      profilePicure: recipientUser.profilePicure,
      lastMessage: "No messages yet",
      lastMessageDate: newChat.updatedAt,
      unreadCount: 0,
    };
    const recipientPayload: IChatCard = {
      ...currentUserPayload,
      displayName: currentUser.displayName,
      profilePicure: currentUser.profilePicure,
    };

    socket.emit("new-chat-created", currentUserPayload);
    socket
      .to(recipientId)
      .emit("new-chat", recipientPayload);
  });

  socket.on("disconnect", (reason) => {
    console.log(id + " disconnected\n" + reason);
  });
});

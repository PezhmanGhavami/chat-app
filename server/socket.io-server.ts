import { Server } from "socket.io";

import { prisma } from "./utils/prisma-client";
import { IUserCard, IChatCard } from "./utils/types";

const io = new Server(5001, {
  cors: {
    origin: "*",
  },
});

console.log("Socket.IO server started at localhost:5001");

const emitTimout = 1000 * 30;

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

    socket.volatile.emit(
      "search-result",
      res as IUserCard[]
    );
  });

  socket.on("create-chat", async ({ recipientId }) => {
    const chat = await prisma.chat.findFirst({
      where: {
        users: {
          every: {
            OR: [{ id: id as string }, { id: recipientId }],
          },
        },
      },
    });
    if (chat) {
      return socket
        .timeout(emitTimout)
        .emit("chat-exists", {
          chatId: chat.id,
        });
    }
    const newChat = await prisma.chat.create({
      data: {
        users: {
          connect: [{ id: recipientId }, { id }],
        },
        unreadCount: {
          create: [
            { user: { connect: { id: id as string } } },
            { user: { connect: { id: recipientId } } },
          ],
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
      lastMessage: newChat.lastMessage,
      lastMessageDate: newChat.updatedAt,
      unreadCount: 0,
    };
    const recipientPayload: IChatCard = {
      ...currentUserPayload,
      displayName: currentUser.displayName,
      profilePicure: currentUser.profilePicure,
    };

    socket
      .timeout(emitTimout)
      .emit("new-chat-created", currentUserPayload);
    socket
      .timeout(emitTimout)
      .to(recipientId)
      .emit("new-chat", recipientPayload);
  });

  socket.on("joined-chat", async ({ chatId }) => {
    socket.join(chatId);
    console.log(id + " joined chat " + chatId);

    const chatDetails = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      select: {
        id: true,
        users: true,
        unreadCount: {
          where: {
            userId: id as string,
          },
        },
      },
    });
    if (!chatDetails) {
      return socket.emit(`chat-${chatId}-error`, {
        status: 404,
        errorMessasge: "Chat not found",
      });
    }

    const recipient =
      chatDetails.users[0].id !== id
        ? chatDetails.users[0]
        : chatDetails.users[1];

    const recipientUser: IUserCard & {
      recipientId: string;
    } = {
      id: chatDetails.id,
      recipientId: recipient.id,
      displayName: recipient.displayName,
      profilePicure: recipient.profilePicure,
    };

    const chatLatestMessages = await prisma.chat.findUnique(
      {
        where: {
          id: chatId,
        },
        select: {
          messages: {
            take:
              chatDetails.unreadCount[0].unreadCount > 50
                ? chatDetails.unreadCount[0].unreadCount
                : 50,

            orderBy: {
              createdAt: "desc",
            },
            include: {
              recipients: {
                select: {
                  isRead: true,
                  recipientId: true,
                },
              },
            },
          },
        },
      }
    );

    if (!chatLatestMessages) {
      return socket.emit(`chat-${chatId}-error`, {
        status: 500,
        errorMessasge: "Internal error",
      });
    }

    socket.emit(`chat-${chatId}-init`, {
      recipientUser,
      messages: chatLatestMessages.messages,
    });
  });

  socket.on("left-chat", ({ chatId }) => {
    socket.leave(chatId);
    console.log(id + " left chat " + chatId);
  });

  socket.on(
    "send-message",
    async ({ chatId, recipientId, message }) => {
      const createNewMessage = await prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessage: message,
          messages: {
            create: [
              {
                body: message,
                sender: { connect: { id: id as string } },
                recipients: {
                  create: { isRead: false, recipientId },
                },
              },
            ],
          },
        },
        select: {
          unreadCount: {
            where: { userId: recipientId },
            select: { id: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!createNewMessage) {
        return socket.emit(`chat-${chatId}-error`, {
          status: 404,
          errorMessasge: "Chat doesn't exist.",
        });
      }
      const updatedStatus = await prisma.status.update({
        where: { id: createNewMessage.unreadCount[0].id },
        data: { unreadCount: { increment: 1 } },
      });
      if (!updatedStatus) {
        return socket.emit(`chat-${chatId}-error`, {
          status: 500,
          errorMessasge: "Internal server error.",
        });
      }

      socket.emit(`chat-${chatId}-new-message`, {
        message: createNewMessage.messages[0],
      });
      socket.to(chatId).emit(`chat-${chatId}-new-message`, {
        message: createNewMessage.messages[0],
      });
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(id + " disconnected\n" + reason);
  });
});

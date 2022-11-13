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

io.on("connection", async (socket) => {
  try {
    const id = socket.handshake.query.id;
    const sessionId = socket.handshake.query.sessionId;
    socket.join(id as string);

    if (
      !sessionId ||
      !id ||
      sessionId === "" ||
      id === ""
    ) {
      if (sessionId === "" || id === "") {
        socket.emit(`auth-error`, {
          status: 401,
          errorMessage:
            "Unauthorized connection.\nPlease try to login again.",
        });
      } else {
        socket.emit(`auth-error`, {
          status: 400,
          errorMessage: "Socket initialization failed.",
        });
      }
      return socket.disconnect(true);
    }

    const updatedSession = await prisma.session.update({
      where: {
        id: sessionId as string,
      },
      data: {
        isOnline: true,
        socketId: socket.id,
        user: {
          update: {
            isOnline: true,
          },
        },
      },
      include: {
        user: true,
      },
    });

    console.log(`${id} connected`);

    // Search
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

    // Create chat
    socket.on("create-chat", async ({ recipientId }) => {
      const chat = await prisma.chat.findFirst({
        where: {
          users: {
            every: {
              OR: [
                { id: id as string },
                { id: recipientId },
              ],
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

    // Joined chat
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
          errorMessage: "Chat not found",
        });
      }

      const recipient =
        chatDetails.users[0].id !== id
          ? chatDetails.users[0]
          : chatDetails.users[1];

      const recipientUser: IUserCard & {
        recipientId: string;
        isOnline: boolean;
        lastOnline: Date | null;
      } = {
        id: chatDetails.id,
        recipientId: recipient.id,
        isOnline: recipient.isOnline,
        lastOnline: recipient.lastOnline,
        displayName: recipient.displayName,
        profilePicure: recipient.profilePicure,
      };

      const chatLatestMessages =
        await prisma.chat.findUnique({
          where: {
            id: chatId,
          },
          select: {
            messages: {
              take:
                chatDetails.unreadCount[0].unreadCount > 50
                  ? chatDetails.unreadCount[0].unreadCount +
                    10
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
        });

      if (!chatLatestMessages) {
        return socket.emit(`chat-${chatId}-error`, {
          status: 500,
          errorMessage: "Internal error",
        });
      }

      socket.emit(`chat-${chatId}-init`, {
        recipientUser,
        messages: chatLatestMessages.messages,
      });
    });

    // Left chat
    socket.on("left-chat", ({ chatId }) => {
      socket.leave(chatId);
      console.log(id + " left chat " + chatId);
    });

    // Read messages
    socket.on("read-messages", async ({ chatId }) => {
      const chatStatus = await prisma.status.findFirst({
        where: {
          userId: id as string,
        },
      });

      if (!chatStatus) {
        return socket.emit(`chat-${chatId}-error`, {
          status: 404,
          errorMessage: "Chat status not found",
        });
      }

      const updateChat = prisma.chat.update({
        where: {
          id: chatId,
        },
        data: {
          unreadCount: {
            update: {
              where: {
                id: chatStatus.id,
              },
              data: {
                unreadCount: 0,
              },
            },
          },
        },
      });
      const updateMessages = prisma.recipient.updateMany({
        where: {
          isRead: false,
          recipientId: id as string,
          message: {
            chatId,
          },
        },
        data: {
          isRead: true,
        },
      });

      const [updateChatRes, updateMessagesRes] =
        await prisma.$transaction([
          updateChat,
          updateMessages,
        ]);

      if (!updateChatRes || !updateMessagesRes) {
        return socket.emit(`chat-${chatId}-error`, {
          status: 500,
          errorMessage: "Read status update failed.",
        });
      }
    });

    // Send message
    socket.on(
      "send-message",
      async ({ chatId, recipientId, message }) => {
        let recipientIsInChat = false;
        // HACK - this will NOT scale
        io.sockets.adapter.sids.forEach((item) => {
          if (item.has(recipientId) && item.has(chatId)) {
            recipientIsInChat = true;
          }
        });

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
                    create: {
                      isRead: recipientIsInChat,
                      recipientId,
                    },
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
              include: {
                recipients: {
                  select: {
                    isRead: true,
                    recipientId: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });
        if (!createNewMessage) {
          return socket.emit(`chat-${chatId}-error`, {
            status: 404,
            errorMessage: "Chat doesn't exist.",
          });
        }
        if (!recipientIsInChat) {
          const updatedStatus = await prisma.status.update({
            where: {
              id: createNewMessage.unreadCount[0].id,
            },
            data: { unreadCount: { increment: 1 } },
          });
          if (!updatedStatus) {
            return socket.emit(`chat-${chatId}-error`, {
              status: 500,
              errorMessage: "Internal server error.",
            });
          }
        }

        socket.emit(`chat-${chatId}-new-message`, {
          message: createNewMessage.messages[0],
        });
        socket
          .to(chatId)
          .emit(`chat-${chatId}-new-message`, {
            message: createNewMessage.messages[0],
          });
      }
    );

    socket.on("disconnect", async (reason) => {
      if (updatedSession) {
        await prisma.session.update({
          where: {
            id: updatedSession.id,
          },
          data: {
            isOnline: false,
            socketId: "",
            user: {
              update: {
                lastOnline: new Date(Date.now()),
                isOnline: false,
              },
            },
          },
        });
      }

      console.log(id + " disconnected\n" + reason);
    });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      socket.emit(`auth-error`, {
        status: 500,
        errorMessage: `${error.name} - Please try refreshing the page, if the problem persists, contact support`,
      });
    }
    socket.disconnect(true);
  }
});

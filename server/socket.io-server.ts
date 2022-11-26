import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Server } from "socket.io";

import { prisma } from "./utils/prisma-client";
import { IUserCard, IChatCard } from "./utils/types";

const io = new Server(5001, {
  cors: {
    origin: "*",
  },
});

console.log("Socket.IO server started at localhost:5001");

io.on("connection", async (socket) => {
  const id = socket.handshake.query.id;
  const sessionId = socket.handshake.query.sessionId;
  socket.join(id as string);
  const socketWithTimeout = socket.timeout(1000 * 30);

  try {
    if (
      !sessionId ||
      !id ||
      sessionId === "" ||
      id === ""
    ) {
      if (sessionId === "" || id === "") {
        socketWithTimeout.emit(`auth-error`, {
          status: 401,
          errorMessage:
            "Unauthorized connection.\nPlease try to login again.",
        });
      } else {
        socketWithTimeout.emit(`auth-error`, {
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
        user: {
          include: {
            chats: true,
          },
        },
      },
    });

    for (const chat of updatedSession.user.chats) {
      const room = io.sockets.adapter.rooms.get(chat.id);
      if (room) {
        socketWithTimeout
          .to(chat.id)
          .emit(`chat-${chat.id}-recipient-status-change`, {
            isOnline: true,
          });
      }
    }

    console.log(`${id} connected`);

    // Search
    socket.on("search", async ({ query }) => {
      if (query.startsWith("@")) {
        const res = await prisma.user.findUnique({
          where: {
            username: query.slice(1),
          },
        });
        // TODO - add other suggestions to this mode
        if (!res)
          return socket.volatile.emit("search-result", []);

        return socket.volatile.emit("search-result", [
          res,
        ] as IUserCard[]);
      }
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
          bgColor: true,
          username: true,
          displayName: true,
          profilePicture: true,
        },
      });

      socket.volatile.emit(
        "search-result",
        res as IUserCard[]
      );
    });

    // Create chat
    socket.on(
      "create-chat",
      async ({ recipientName, recipientId }) => {
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
          return socketWithTimeout.emit("chat-exists", {
            chatId: chat.id,
          });
        }
        const newChat = await prisma.chat.create({
          data: {
            users: {
              connect: [{ id: recipientId }, { id }],
            },
            membersStatus: {
              create: [
                {
                  user: { connect: { id: id as string } },
                  chatName: recipientName,
                },
                {
                  user: { connect: { id: recipientId } },
                  chatName: updatedSession.user.displayName,
                },
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
          bgColor: recipientUser.bgColor,
          displayName: recipientUser.displayName,
          profilePicture: recipientUser.profilePicture,
          lastMessage: newChat.lastMessage,
          lastMessageDate: newChat.updatedAt,
          unreadCount: 0,
          isArchived: false,
        };

        socketWithTimeout.emit(
          "new-chat-created",
          currentUserPayload
        );
        if (recipientUser.isOnline) {
          const recipientPayload: IChatCard = {
            ...currentUserPayload,
            displayName: currentUser.displayName,
            profilePicture: currentUser.profilePicture,
          };

          socketWithTimeout
            .to(recipientId)
            .emit("new-chat", recipientPayload);
        }
      }
    );

    // Delete chat
    socket.on("delete-chat", async ({ chatId }) => {
      const deleteRecipients = prisma.recipient.deleteMany({
        where: {
          message: {
            chatId,
          },
        },
      });
      const deleteMessages = prisma.message.deleteMany({
        where: {
          chatId,
        },
      });
      const deleteStatuses = prisma.status.deleteMany({
        where: {
          chatId,
        },
      });
      const deleteChat = prisma.chat.delete({
        where: {
          id: chatId,
        },
        select: {
          users: {
            where: {
              NOT: { id: id as string },
            },
            select: {
              id: true,
              isOnline: true,
            },
          },
        },
      });

      try {
        const res = await prisma.$transaction([
          deleteRecipients,
          deleteMessages,
          deleteStatuses,
          deleteChat,
        ]);
        socketWithTimeout.emit("chat-deleted", {
          chatId,
        });

        if (res[3].users[0].isOnline) {
          socketWithTimeout
            .to(res[3].users[0].id)
            .emit("chat-deleted", {
              chatId,
            });
        }
      } catch (error) {
        console.log("chat deletion error");
        console.log(error);
        socketWithTimeout.emit(`chat-${chatId}-error`, {
          status: 500,
          errorMessage:
            "Internal server error.\nFailed to delete chat.",
        });
      }
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
          createdAt: true,
          membersStatus: {
            where: {
              userId: id as string,
            },
          },
        },
      });
      if (!chatDetails) {
        return socketWithTimeout.emit(
          `chat-${chatId}-error`,
          {
            status: 404,
            errorMessage: "Chat not found",
          }
        );
      }

      const recipient =
        chatDetails.users[0].id !== id
          ? chatDetails.users[0]
          : chatDetails.users[1];

      const recipientUser: IUserCard & {
        chatId: string;
        isArchived: boolean;
        chatCreated: Date;
        isOnline: boolean;
        lastOnline: Date | null;
      } = {
        id: recipient.id,
        chatId: chatDetails.id,
        username: recipient.username,
        isArchived:
          chatDetails.membersStatus[0].chatIsArchived,
        chatCreated: chatDetails.createdAt,
        bgColor: recipient.bgColor,
        isOnline: recipient.isOnline,
        lastOnline: recipient.lastOnline,
        displayName: chatDetails.membersStatus[0].chatName,
        profilePicture: recipient.profilePicture,
      };

      const chatLatestMessages =
        await prisma.chat.findUnique({
          where: {
            id: chatId,
          },
          select: {
            messages: {
              take:
                chatDetails.membersStatus[0].unreadCount >
                50
                  ? chatDetails.membersStatus[0]
                      .unreadCount + 10
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
        return socketWithTimeout.emit(
          `chat-${chatId}-error`,
          {
            status: 500,
            errorMessage: "Internal error",
          }
        );
      }

      socketWithTimeout.emit(`chat-${chatId}-init`, {
        recipientUser,
        messages: chatLatestMessages.messages,
      });
    });

    // Handle archiving chat
    socket.on("archive-chat", async ({ chatId }) => {
      const chat = await prisma.chat.findUnique({
        where: {
          id: chatId,
        },
        select: {
          membersStatus: {
            where: {
              userId: id as string,
            },
          },
        },
      });
      if (!chat) {
        return socketWithTimeout.emit(
          `chat-${chatId}-error`,
          {
            status: 404,
            errorMessage: "Chat not found",
          }
        );
      }

      try {
        const updatedStatus = await prisma.status.update({
          where: {
            id: chat.membersStatus[0].id,
          },
          data: {
            chatIsArchived:
              !chat.membersStatus[0].chatIsArchived,
          },
        });

        socket.emit("archive-change", {
          chatId,
          archive: updatedStatus.chatIsArchived,
        });
      } catch (error) {
        console.log("chat archive error");
        console.log(error);
        socketWithTimeout.emit(`chat-${chatId}-error`, {
          status: 500,
          errorMessage:
            "Internal server error.\nFailed to change archive status of chat.",
        });
      }
    });

    // Left chat
    socket.on("left-chat", ({ chatId }) => {
      socket.leave(chatId);
      console.log(id + " left chat " + chatId);
    });

    // Load more messages from chat
    socket.on(
      "load-more",
      async ({ chatId, lastMessageId }) => {
        const chatLatestMessages =
          await prisma.chat.findUnique({
            where: {
              id: chatId,
            },
            select: {
              messages: {
                take: 50,
                skip: 1,
                cursor: {
                  id: lastMessageId,
                },

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
          return socketWithTimeout.emit(
            `chat-${chatId}-error`,
            {
              status: 404,
              errorMessage: "Chat not found",
            }
          );
        }

        const endOfMessages =
          chatLatestMessages.messages.length < 50;

        socketWithTimeout.emit(
          `chat-${chatId}-messages-loader`,
          {
            messages: chatLatestMessages.messages,
            endOfMessages,
            lastMessageId,
          }
        );
      }
    );
    // Read messages
    socket.on("read-messages", async ({ chatId }) => {
      // TODO - optimize this
      const chatStatus = await prisma.status.findFirst({
        where: {
          userId: id as string,
          chatId: chatId,
        },
      });

      if (!chatStatus) {
        return socketWithTimeout.emit(
          `chat-${chatId}-error`,
          {
            status: 404,
            errorMessage: "Chat status not found",
          }
        );
      }

      const updateChat = prisma.chat.update({
        where: {
          id: chatId,
        },
        data: {
          membersStatus: {
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

      try {
        await prisma.$transaction([
          updateChat,
          updateMessages,
        ]);

        socketWithTimeout
          .to(chatId)
          .emit(`chat-${chatId}-read-all`);
        socketWithTimeout.emit("chats-list-update", {
          chatId,
          readAll: true,
        });
      } catch (error) {
        socketWithTimeout.emit(`chat-${chatId}-error`, {
          status: 500,
          errorMessage: "Read status update failed.",
        });
      }
    });

    // Send message
    socket.on(
      "send-message",
      async ({ chatId, recipientId, message, tempId }) => {
        let recipientIsInChat = false;
        const recipientSessions =
          await prisma.session.findMany({
            where: {
              userId: recipientId,
              socketId: {
                not: undefined,
              },
            },
          });

        for (const recipientSession of recipientSessions) {
          const room = io.sockets.adapter.rooms.get(chatId);
          if (room && room.has(recipientSession.socketId)) {
            recipientIsInChat = true;
            break;
          }
        }

        try {
          const createNewMessage = await prisma.chat.update(
            {
              where: { id: chatId },
              data: {
                lastMessage: message,
                messages: {
                  create: [
                    {
                      body: message,
                      sender: {
                        connect: { id: id as string },
                      },
                      recipients: {
                        create: {
                          isRead: false,
                          recipientId,
                        },
                      },
                    },
                  ],
                },
              },
              select: {
                membersStatus: {
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
            }
          );
          if (!recipientIsInChat) {
            await prisma.status.update({
              where: {
                id: createNewMessage.membersStatus[0].id,
              },
              data: { unreadCount: { increment: 1 } },
            });
          }

          socketWithTimeout.emit(
            `chat-${chatId}-delivered`,
            {
              tempId,
              actualId: createNewMessage.messages[0].id,
            }
          );
          socketWithTimeout
            .to(chatId)
            .emit(`chat-${chatId}-new-message`, {
              message: createNewMessage.messages[0],
            });

          // TODO - improve this
          const currentChatStatus =
            await prisma.chat.findUnique({
              where: {
                id: chatId,
              },
              include: {
                membersStatus: {
                  where: {
                    userId: recipientId,
                  },
                },
              },
            });
          if (currentChatStatus) {
            const currentUserPayload = {
              chatId,
              lastMessage: currentChatStatus.lastMessage,
              lastMessageDate: currentChatStatus.updatedAt,
            };

            socketWithTimeout.emit(
              "chats-list-update",
              currentUserPayload
            );
            socketWithTimeout
              .to(id as string)
              .emit(
                "chats-list-update",
                currentUserPayload
              );
            socketWithTimeout
              .to(recipientId)
              .emit("chats-list-update", {
                ...currentUserPayload,
                unreadCount:
                  currentChatStatus.membersStatus[0]
                    .unreadCount,
              });
          }
        } catch (error) {
          return socketWithTimeout.emit(
            `chat-${chatId}-error`,
            {
              status: 400,
              errorMessage: "Update failed",
            }
          );
        }
      }
    );

    // Socket termintation
    socket.on(
      "session-terminated",
      async ({ all, socketId }) => {
        if (all) {
          return io.sockets.adapter.rooms
            .get(id as string)
            ?.forEach(async (activeSocketId) => {
              if (activeSocketId !== socket.id) {
                const foundSockets = await io
                  .in(activeSocketId)
                  .fetchSockets();

                for (const foundSocket of foundSockets) {
                  foundSocket.emit("auth-error", {
                    status: 401,
                    errorMessage: "Session termintated.",
                  });
                  foundSocket.disconnect(true);
                }
              }
            });
        }

        const foundSockets = await io
          .in(socketId)
          .fetchSockets();

        for (const foundSocket of foundSockets) {
          foundSocket.emit("auth-error", {
            status: 401,
            errorMessage: "Session termintated.",
          });
          foundSocket.disconnect(true);
        }
      }
    );

    socket.on("disconnect", async (reason) => {
      for (const chat of updatedSession.user.chats) {
        const room = io.sockets.adapter.rooms.get(chat.id);
        if (room) {
          socketWithTimeout
            .to(chat.id)
            .emit(
              `chat-${chat.id}-recipient-status-change`,
              {
                isOnline: false,
              }
            );
        }
      }
      try {
        const lastOnline = new Date(Date.now());
        await prisma.session.update({
          where: {
            id: updatedSession.id,
          },
          data: {
            isOnline: false,
            socketId: "",
            lastOnline,
            user: {
              update: {
                lastOnline,
                isOnline: false,
              },
            },
          },
        });
      } catch (error) {
        console.log("Disconnect update failed.");
        console.log(error);
      }

      console.log(id + " disconnected\n" + reason);
    });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return socketWithTimeout.emit(`auth-error`, {
          status: 401,
          errorMessage: `${error.name} - Session expired, please try to re-login`,
        });
      }
      socketWithTimeout.emit(`auth-error`, {
        status: 500,
        errorMessage: `${error.name} - Please try refreshing the page, if the problem persists, contact support`,
      });
    }
    socket.disconnect(true);
  }
});

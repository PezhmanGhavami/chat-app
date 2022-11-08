import { prisma } from "../utils/prisma-client";
import {
  IExpressEndpointHandler,
  IChatCard,
} from "../utils/types";

/**
 * @desc   Gets all of the chats of a user
 * @route  GET /api/chats/
 * @access Private
 * */
const getChats: IExpressEndpointHandler = async (
  req,
  res,
  next
) => {
  try {
    const user = req.session.user;
    if (user) {
      const userChats = await prisma.user.findUnique({
        where: {
          id: user.userID,
        },
        select: {
          chats: {
            include: {
              users: {
                where: {
                  NOT: { id: user.userID },
                },
              },
              messages: {
                include: {
                  recipients: {
                    where: {
                      recipientId: user.userID,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      });
      if (userChats) {
        const formattedChats: IChatCard[] =
          userChats.chats.map((chat) => {
            let lastMessage: {
              body: string;
              createdAt: Date;
            };
            const unreadCount = chat.messages.filter(
              (message) => !message.recipients[0].isRead
            ).length;
            if (chat.messages.length === 0) {
              lastMessage = {
                body: "No messages yet",
                createdAt: chat.updatedAt,
              };
            } else {
              lastMessage = chat.messages[0];
            }
            return {
              id: chat.id,
              displayName: chat.users[0].displayName,
              profilePicure: chat.users[0].profilePicure,
              lastMessage: lastMessage.body,
              lastMessageDate: lastMessage.createdAt,
              unreadCount,
            };
          });
        return res.json(formattedChats);
      }
    }
    res.status(401);
    throw new Error("Unauthorized.");
  } catch (error) {
    next(error);
  }
};

export { getChats };

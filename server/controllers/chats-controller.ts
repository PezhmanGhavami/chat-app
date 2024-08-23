import { getIronSession } from "iron-session";
import { prisma } from "@/utils/prisma-client";
import { SessionData, sessionOptions } from "@/utils/session";
import type { IExpressEndpointHandler, IChatCard } from "@/utils/types";

/**
 * @desc   Gets all of the chats of a user
 * @route  GET /api/chats/
 * @access Private
 * */
const getChats: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const { user } = await getIronSession<SessionData>(
      req,
      res,
      sessionOptions,
    );

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
              membersStatus: {
                where: {
                  userId: user.userID,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      });
      if (userChats) {
        const formattedChats: IChatCard[] = userChats.chats.map((chat) => ({
          id: chat.id,
          displayName: chat.membersStatus[0].chatName,
          profilePicture: chat.users[0].profilePicture,
          lastMessage: chat.lastMessage,
          lastMessageDate: chat.updatedAt,
          unreadCount: chat.membersStatus[0].unreadCount,
          isArchived: chat.membersStatus[0].chatIsArchived,
          bgColor: chat.users[0].bgColor,
        }));
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

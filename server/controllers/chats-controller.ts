import { prisma } from "../utils/prisma-client";
import { IExpressEndpointHandler } from "../utils/types";

// TODO - make a response type and apply it in res

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
          chats: true,
        },
      });
      if (userChats) {
        return res.json(userChats.chats);
      }
    }
    res.status(401);
    throw new Error("Unauthorized.");
  } catch (error) {
    next(error);
  }
};

export { getChats };

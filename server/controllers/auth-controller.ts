import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";

import { prisma } from "@/utils/prisma-client";
import getRandomColor from "@/utils/getRandomColor";
import { SessionData, sessionOptions } from "@/utils/session";
import {
  IUser,
  ISession,
  IApiMessage,
  IExpressEndpointHandler,
} from "@/utils/types";

/**
 * @desc   Register a new user
 * @route  POST /api/auth
 * @access Public
 * */
const handleRegister: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const { email, password, displayName, confirmPassword } = await req.body;
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!email || !password || !displayName || !confirmPassword) {
      res.status(400);
      throw new Error("All fields are required.");
    }

    const controlledEmail = (email as string).toLowerCase();

    if (password !== confirmPassword) {
      res.status(400);
      throw new Error("Passwords should match.");
    }

    const userExists = await prisma.user.findUnique({
      where: {
        email: controlledEmail,
      },
    });
    if (userExists) {
      res.status(401);
      throw new Error("User already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email: controlledEmail,
        password: hashedPassword,
        displayName,
        bgColor: getRandomColor(),
        activeSessions: {
          create: {
            isOnline: false,
          },
        },
      },
      include: {
        activeSessions: true,
      },
    });

    const user = {
      userID: newUser.id,
      email: newUser.email,
      dateCreated: Date.now(),
      displayName: newUser.displayName,
      sessionId: newUser.activeSessions[0].id,
      profilePicture: null,
      username: null,
      bgColor: newUser.bgColor,
    };
    session.user = user;
    await session.save();

    const payload: IUser = {
      isLoggedIn: true,
      userID: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      profilePicture: null,
      username: null,
      bgColor: newUser.bgColor,
      sessionId: newUser.activeSessions[0].id,
    };

    return res.json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Signs in a user
 * @route  POST /api/auth/sign-in
 * @access Public
 * */
const handleSignIn: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = await req.body;
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!usernameOrEmail || !password) {
      res.status(400);
      throw new Error("All fields are required.");
    }

    const userExists = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: usernameOrEmail,
              mode: "insensitive",
            },
          },
          {
            username: usernameOrEmail,
          },
        ],
      },
    });

    if (!userExists) {
      res.status(401);
      throw new Error("Wrong email/username or password");
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      userExists.password,
    );
    if (!passwordIsCorrect) {
      res.status(401);
      throw new Error("Wrong email/username or password");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userExists.id,
      },
      data: {
        activeSessions: {
          create: {
            isOnline: false,
          },
        },
      },
      select: {
        activeSessions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!updatedUser) {
      res.status(500);
      throw new Error("Something went wrong with session creation.");
    }

    const user = {
      userID: userExists.id,
      email: userExists.email,
      dateCreated: Date.now(),
      displayName: userExists.displayName,
      profilePicture: userExists.profilePicture,
      username: userExists.username,
      sessionId: updatedUser.activeSessions[0].id,
      bgColor: userExists.bgColor,
    };
    session.user = user;
    await session.save();

    const payload: IUser = {
      isLoggedIn: true,
      userID: userExists.id,
      email: userExists.email,
      displayName: userExists.displayName,
      profilePicture: userExists.profilePicture,
      username: userExists.username,
      bgColor: userExists.bgColor,
      sessionId: updatedUser.activeSessions[0].id,
    };

    return res.json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Signs out a user
 * @route  GET /api/auth/sign-out
 * @access Public
 * */
const handleSignOut: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const user = session.user;

    if (user) {
      prisma.user
        .update({
          where: {
            id: user.userID,
          },
          data: {
            activeSessions: {
              delete: {
                id: user.sessionId,
              },
            },
          },
        })
        .catch((error) => console.log(error));
    }

    const payload: IApiMessage = {
      status: "SUCCESS",
      message: "User Signed out.",
    };

    session.destroy();
    return res.json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Gets a user
 * @route  GET /api/auth/
 * @access Private
 * */
const getUser: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const user = session.user;

    const loggedOutUser: IUser = {
      isLoggedIn: false,
      userID: "",
      email: "",
      displayName: "",
      sessionId: "",
      bgColor: "",
      profilePicture: null,
      username: null,
    };

    if (user) {
      if (Date.now() - user.dateCreated > 1000 * 60 * 5) {
        const userSessionExists = await prisma.session.findFirst({
          where: {
            id: user.sessionId,
            userId: user.userID,
          },
        });
        if (!userSessionExists) {
          session.destroy();
          return res.json(loggedOutUser);
        }
        const newUser = {
          ...user,
          dateCreated: Date.now(),
        };
        session.user = newUser;
        await session.save();
      }
      const payload: IUser = {
        isLoggedIn: true,
        userID: user.userID,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        sessionId: user.sessionId,
        username: user.username,
        bgColor: user.bgColor,
      };
      return res.json(payload);
    }
    return res.json(loggedOutUser);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Updates a user
 * @route  PUT /api/auth/
 * @access Private
 * */
const updateUser: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const user = session.user;
    if (!user) {
      res.status(401);
      throw new Error("Unauthorized.");
    }

    const {
      password,
      email,
      newPassword,
      newPasswordConfirmation,
      username,
      displayName,
      bgColor,
    } = await req.body;

    const userDbData = await prisma.user.findFirst({
      where: {
        id: user.userID,
        activeSessions: {
          some: {
            id: user.sessionId,
          },
        },
      },
    });

    if (!userDbData) {
      res.status(409);
      throw new Error("User doesn't exists.");
    }

    if (password) {
      if (
        (!email && !newPassword && !newPasswordConfirmation) ||
        (newPassword && !newPasswordConfirmation) ||
        (newPasswordConfirmation && !newPassword)
      ) {
        res.status(400);
        throw new Error("Bad request.");
      }

      const passwordIsCorrect = await bcrypt.compare(
        password,
        userDbData.password,
      );
      if (!passwordIsCorrect) {
        res.status(401);
        throw new Error("Wrong password.");
      }

      const updatePayload: {
        email?: string;
        password?: string;
      } = {};

      if (email) {
        if (email === userDbData.email) {
          res.status(400);
          throw new Error("New email can't be the old one.");
        }
        updatePayload.email = email;
      }

      if (newPassword && newPasswordConfirmation) {
        if (newPassword !== newPasswordConfirmation) {
          res.status(400);
          throw new Error("Passwords should match.");
        }

        const newPasswordIsOldPassword = await bcrypt.compare(
          newPassword,
          userDbData.password,
        );

        if (newPasswordIsOldPassword) {
          res.status(400);
          throw new Error("New password can't be your old one.");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        updatePayload.password = hashedPassword;
      }

      await prisma.user.update({
        where: {
          id: user.userID,
        },
        data: {
          ...updatePayload,
        },
      });

      if (updatePayload.password) {
        delete updatePayload.password;
      }
      const newUser = {
        ...user,
        ...updatePayload,
        dateCreated: Date.now(),
      };
      session.user = newUser;
      await session.save();
    } else {
      if (!username && !displayName && !bgColor) {
        res.status(400);
        throw new Error("Bad request.");
      }

      const updatePayload: {
        username?: string;
        displayName?: string;
        bgColor?: string;
      } = {};

      if (username) {
        if (username === userDbData.username) {
          res.status(400);
          throw new Error("New username can't be the old one.");
        }
        updatePayload.username = username;
      }

      if (displayName) {
        if (displayName === userDbData.displayName) {
          res.status(400);
          throw new Error("New name can't be the old one.");
        }
        updatePayload.displayName = displayName;
      }

      if (bgColor) {
        if (bgColor === userDbData.bgColor) {
          res.status(400);
          throw new Error("New background color can't be the old one.");
        }
        updatePayload.bgColor = bgColor;
      }

      await prisma.user.update({
        where: {
          id: user.userID,
        },
        data: {
          ...updatePayload,
        },
      });

      const newUser = {
        ...user,
        ...updatePayload,
        dateCreated: Date.now(),
      };
      session.user = newUser;
      await session.save();
    }

    const result: IUser = {
      isLoggedIn: true,
      userID: user.userID,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      sessionId: user.sessionId,
      username: user.username,
      bgColor: user.bgColor,
    };
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Gets a all active sessions
 * @route  GET /api/auth/sessions
 * @access Private
 * */
const getSessions: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const user = session.user;

    if (!user) {
      res.status(401);
      throw new Error("Unauthorized.");
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: user.userID,
      },
    });
    const payload: ISession[] = sessions.map((session) => ({
      id: session.id,
      isOnline: session.isOnline,
      socketId: session.socketId,
      createdAt: session.createdAt,
      lastOnline: session.lastOnline,
    }));

    return res.json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Deletes an active session
 * @route  DELETE /api/auth/sessions/:sessionId
 * @access Private
 * */
const terminateSession: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const user = session.user;

    if (!user) {
      res.status(401);
      throw new Error("Unauthorized.");
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400);
      throw new Error("All fields are required.");
    }

    await prisma.session.delete({
      where: {
        id: sessionId,
      },
    });

    const payload: IApiMessage = {
      status: "SUCCESS",
      message: "Session terminated.",
    };

    return res.json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Deletes all sessions except the current one
 * @route  DELETE /api/auth/sign-out-all
 * @access Private
 * */
const signOutAll: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const user = session.user;

    if (!user) {
      res.status(401);
      throw new Error("Unauthorized.");
    }

    await prisma.session.deleteMany({
      where: {
        userId: user.userID,
        NOT: {
          id: user.sessionId,
        },
      },
    });

    const payload: IApiMessage = {
      status: "SUCCESS",
      message: "Sessions terminated.",
    };

    return res.json(payload);
  } catch (error) {
    next(error);
  }
};

export {
  getUser,
  updateUser,
  getSessions,
  terminateSession,
  signOutAll,
  handleSignIn,
  handleSignOut,
  handleRegister,
};

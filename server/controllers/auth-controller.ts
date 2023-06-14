import bcrypt from "bcryptjs";

import { prisma } from "../utils/prisma-client";
import getRandomColor from "../utils/getRandomColor";
import {
  IUser,
  ISession,
  IApiMessage,
  IExpressEndpointHandler,
} from "../utils/types";

/**
 * @desc   Register a new user
 * @route  POST /api/auth
 * @access Public
 * */
const handleRegister: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const { email, password, displayName, confirmPassword } = await req.body;

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
    req.session.user = user;
    await req.session.save();

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
 * @route  POST /api/auth/signin
 * @access Public
 * */
const handleSignin: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = await req.body;

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
    req.session.user = user;
    await req.session.save();

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
 * @route  GET /api/auth/signout
 * @access Public
 * */
const handleSignout: IExpressEndpointHandler = (req, res) => {
  const user = req.session.user;
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

  req.session.destroy();
  return res.json(payload);
};

/**
 * @desc   Gets a user
 * @route  GET /api/auth/
 * @access Private
 * */
const getUser: IExpressEndpointHandler = async (req, res) => {
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
  const user = req.session.user;
  if (user) {
    if (Date.now() - user.dateCreated > 1000 * 60 * 5) {
      const userSessionExists = await prisma.session.findFirst({
        where: {
          id: user.sessionId,
          userId: user.userID,
        },
      });
      if (!userSessionExists) {
        req.session.destroy();
        return res.json(loggedOutUser);
      }
      const newUser = {
        ...user,
        dateCreated: Date.now(),
      };
      req.session.user = newUser;
      await req.session.save();
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
};

/**
 * @desc   Updates a user
 * @route  PUT /api/auth/
 * @access Private
 * */
const updateUser: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const user = req.session.user;
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

        const newPasswrodIsOldPassword = await bcrypt.compare(
          newPassword,
          userDbData.password,
        );

        if (newPasswrodIsOldPassword) {
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
      req.session.user = newUser;
      await req.session.save();
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
      req.session.user = newUser;
      await req.session.save();
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
    const user = req.session.user;
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
    const user = req.session.user;
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
 * @desc   Deltes all sessions except the current one
 * @route  DELETE /api/auth/signout-all
 * @access Private
 * */
const signoutAll: IExpressEndpointHandler = async (req, res, next) => {
  try {
    const user = req.session.user;
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
  signoutAll,
  handleSignin,
  handleSignout,
  handleRegister,
};

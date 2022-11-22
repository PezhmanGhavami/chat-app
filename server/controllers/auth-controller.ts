import bcrypt from "bcryptjs";

import { prisma } from "../utils/prisma-client";
import getRandomColor from "../utils/getRandomColor";
import {
  IUser,
  IExpressEndpointHandler,
} from "../utils/types";

/**
 * @desc   Register a new user
 * @route  POST /api/auth
 * @access Public
 * */
const handleRegister: IExpressEndpointHandler = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      password,
      displayName,
      confirmPassword,
    } = await req.body;

    if (
      !email ||
      !password ||
      !displayName ||
      !confirmPassword
    ) {
      res.status(400);
      throw new Error("All fields are required.");
    }

    if (password !== confirmPassword) {
      res.status(400);
      throw new Error("Passwords should match.");
    }

    const userExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (userExists) {
      res.status(401);
      throw new Error("User already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const newUser = await prisma.user.create({
      data: {
        email,
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
const handleSignin: IExpressEndpointHandler = async (
  req,
  res,
  next
) => {
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
            email: usernameOrEmail,
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
      userExists.password
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
      throw new Error(
        "Something went wrong with session creation."
      );
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
const handleSignout: IExpressEndpointHandler = (
  req,
  res
) => {
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

  req.session.destroy();
  return res.redirect("/");
};

/**
 * @desc   Gets a user
 * @route  GET /api/auth/
 * @access Private
 * */
const getUser: IExpressEndpointHandler = async (
  req,
  res
) => {
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
    if (
      Date.now() - user.dateCreated >
      1000 * 60 * 60 * 24
    ) {
      const userSessionExists =
        await prisma.session.findFirst({
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

export {
  getUser,
  handleSignin,
  handleSignout,
  handleRegister,
};

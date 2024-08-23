import { SessionOptions } from "iron-session";

export type SessionData = {
  user?: {
    userID: string;
    displayName: string;
    email: string;
    sessionId: string;
    profilePicture: string | null;
    username: string | null;
    dateCreated: number;
    bgColor: string;
  };
};

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "chatAppSeal",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

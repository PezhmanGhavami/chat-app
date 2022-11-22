import { ironSession } from "iron-session/express";

export const session = ironSession({
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "seal",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
});

declare module "iron-session" {
  interface IronSessionData {
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
  }
}

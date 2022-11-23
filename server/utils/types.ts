import { Request, Response, NextFunction } from "express";

export interface IExpressEndpointHandler {
  (req: Request, res: Response, next: NextFunction): void;
}

export interface IApiMessage {
  status: "ERROR" | "SUCCESS";
  message: string;
}
export interface IUser {
  isLoggedIn: boolean;
  userID: string;
  email: string;
  displayName: string;
  sessionId: string;
  profilePicture: string | null;
  username: string | null;
  bgColor: string;
}

export interface IUserCard {
  id: string;
  displayName: string;
  profilePicture: string | null;
  bgColor: string;
}

export interface IChatCard {
  id: string;
  profilePicture: string | null;
  displayName: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: Date;
  isArchived: boolean;
  bgColor: string;
}

export interface ISession {
  id: string;
  socketId: string;
  isOnline: boolean;
  lastOnline: Date | null;
  createdAt: Date;
}

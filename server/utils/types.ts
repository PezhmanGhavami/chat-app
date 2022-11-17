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
  profilePicure: string | null;
  username: string | null;
}

export interface IUserCard {
  id: string;
  displayName: string;
  profilePicure: string | null;
}

export interface IChatCard {
  id: string;
  profilePicure: string | null;
  displayName: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: Date;
  isArchived: boolean;
}

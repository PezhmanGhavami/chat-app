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
  displayName: string;
  profilePicure: string | null;
  username: string | null;
}

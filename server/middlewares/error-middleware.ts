import { Request, Response, NextFunction } from "express";
import { IApiMessage } from "../utils/types";
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = res.statusCode || 500;
  res.status(statusCode);
  res.json({
    status: "ERROR",
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  } as IApiMessage);
};

export default errorHandler;

import { NextFunction, Request, Response } from "express";

export interface apiRouter {
    main: (req: Request, res: Response, next?: NextFunction) => any;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    auth: "guess" | "user" | "admin" | "nowpayments" | "cronjob" | "cookie";
}

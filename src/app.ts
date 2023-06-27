import { Application, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import router from "./api";
import "./database";
import { responseHandler } from "./middlewares/responseHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authSignSureWin } from "./middlewares/auth";
import morgan from "morgan";

const getApp = (app: Application) => {
    const allowOrigin = process.env.ORIGIN_CORS.split(",");
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(
        cors({
            origin: allowOrigin,
            credentials: true,
        }),
    );
    // app.use((req: Request, res: Response, next: NextFunction) => {
    //     console.log(`${req.headers["x-forwarded-for"]}`);
    //     next();
    // });
    app.use(morgan("tiny"));
    app.use(authSignSureWin);
    app.use(cookieParser());
    app.use(router);
    app.use(responseHandler);
    app.use("*", (req: Request, res: Response) => {
        res.status(404);
        res.send({
            time: new Date(),
            message: "Cannot find path " + req.originalUrl,
            method: req.method,
        });
    });
};

export default getApp;

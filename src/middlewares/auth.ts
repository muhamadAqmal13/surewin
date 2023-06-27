import { NextFunction, Request, Response } from "express";
import { ErrorType, RoleID } from "../enum";
import { BusinessError } from "../helper/handleError";
import crypto from "crypto";
import { Config } from "../config";
import { ExternalJWTService } from "../services/external/externalJwtService";

export const authUser = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers?.authorization;
    if (auth) {
        const token = auth.split(" ")[1];
        const externalJWTService = new ExternalJWTService();
        const check: any = externalJWTService.verifyAccessToken(token);
        if (!check) {
            throw new BusinessError("Invalid Authorization", ErrorType.Authentication);
        }
        if (check?.rid !== RoleID.User && check?.rid !== RoleID.Admin) {
            return res.sendStatus(401);
        }

        next();
    } else {
        throw new BusinessError("Authorization not found", ErrorType.NotFound);
    }
};

export const authAdmin = (req: Request, res: Response, next: NextFunction) => {
    const config = new Config();
    const auth = req.headers?.authorization;
    if (auth) {
        const token = auth.split(" ")[1];
        const externalJWTService = new ExternalJWTService();
        const check: any = externalJWTService.verifyAccessToken(token);
        if (!check) {
            throw new BusinessError("Invalid Authorization Token", ErrorType.Authentication);
        }
        if (check?.rid !== RoleID.Admin) {
            return res.sendStatus(401);
        }
    } else {
        throw new BusinessError("Authorization not found", ErrorType.NotFound);
    }
};

export const authNowPayments = (req: Request, res: Response, next: NextFunction) => {
    const auth: any = req.headers["x-nowpayments-sig"];
    if (auth) {
        const config = new Config();
        const hmac = crypto.createHmac("sha512", config.nowPaymentsSecretKey);
        hmac.update(JSON.stringify(req.body, Object.keys(req.body).sort()));
        const sign = hmac.digest("hex");
        if (sign !== auth) {
            throw new BusinessError("Invalid Signature", ErrorType.Validation);
        }
    } else {
        throw new BusinessError("Signature not found", ErrorType.NotFound);
    }
    next();
};

export const authCookie = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies["token"];
    if (token) {
        const externalJWTService = new ExternalJWTService();
        const check: any = externalJWTService.verifyRefreshToken(token);
        if (!check) {
            throw new BusinessError("Invalid Cookie", ErrorType.Authentication);
        }

        next();
    } else {
        throw new BusinessError("Cookies Not Found", ErrorType.NotFound);
    }
};

export const authSignSureWin = (req: Request, res: Response, next: NextFunction) => {
    const auth: any = req.headers["x-sign-app"];
    const authBackUrl = req.headers["x-nowpayments-sig"];
    if (authBackUrl) {
        next();
    } else {
        if (auth) {
            const config = new Config();
            const hmac = crypto.createHmac("sha512", config.signAppKey);
            if (req.method.toLowerCase() === "get" || req.method.toLowerCase() === "delete") {
                hmac.update(req.originalUrl);
            } else {
                hmac.update(JSON.stringify(req.body, Object.keys(req.body).sort()));
            }

            const sign = hmac.digest("hex");
            if (sign !== auth) {
                throw new BusinessError("Invalid Signature APP", ErrorType.Validation);
            }
            next();
        } else {
            throw new BusinessError("Signature APP notfound", ErrorType.NotFound);
        }
    }
};

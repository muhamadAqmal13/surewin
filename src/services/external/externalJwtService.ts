import { Config } from "../../config";
import jwt from "jsonwebtoken";

export class ExternalJWTService {
    private accessToken: string;
    private refreshToken: string;

    constructor() {
        const config = new Config();
        (this.accessToken = config.jwtAccessToken), (this.refreshToken = config.jwtRefreshToken);
    }

    public createAccessToken(data: any) {
        return jwt.sign(data, this.accessToken, {
            expiresIn: "7d",
        });
    }

    public createRefreshToken(data: any) {
        return jwt.sign(data, this.refreshToken, {
            expiresIn: "30d",
        });
    }

    public verifyAccessToken(data: any) {
        return jwt.verify(data, this.accessToken);
    }

    public verifyRefreshToken(data: any) {
        return jwt.verify(data, this.refreshToken);
    }
}

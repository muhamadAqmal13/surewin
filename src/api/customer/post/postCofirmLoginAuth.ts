import { Request, Response } from "express";
import { CustomerDto } from "../../../dto/customerDto";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { ExternalJWTService } from "../../../services/external/externalJwtService";
import { CustomerService } from "../../../services/internal/customerService";
import RedisService from "../../../services/external/externalRedisService";
import speakeasy from "speakeasy";

const path = "/v1/customer/login/confirm-auth";
const method = "POST";
const auth = "guess";
const bodyValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "loginId",
        type: "string",
        required: true,
    },
    {
        name: "code",
        type: "string",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        id: string;
        loginId: string;
        code: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const customerService = new CustomerService();
    const externalJWTService = new ExternalJWTService();
    const redisService = new RedisService();

    const existCustomer: CustomerDto = await customerService.findById(requestBody.id, false, true);
    if (!existCustomer) {
        throw new BusinessError("Email or Password is incorrect", ErrorType.NotFound);
    }
    const cacheLoginId = await redisService.get(`login/${existCustomer.id}`);
    if (cacheLoginId !== requestBody.loginId) {
        throw new BusinessError("Login ID is not valid", ErrorType.Validation);
    }

    const verify = speakeasy.totp.verify({
        secret: existCustomer.authKey,
        encoding: "base32",
        token: requestBody.code,
    });

    if (!verify) {
        throw new BusinessError("Authenticator code is not valid", ErrorType.Validation);
    }

    const accessToken = externalJWTService.createAccessToken({ id: existCustomer.id, rid: existCustomer.roleId });
    const refreshToken = externalJWTService.createRefreshToken({ id: existCustomer.id, rid: existCustomer.roleId });

    res.cookie("token", refreshToken, {
        httpOnly: true,
    });
    return res.status(200).send({
        id: existCustomer.id,
        accessToken,
        refreshToken,
        authentication: existCustomer.authentication,
    });
};

const postConfirmLogin: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postConfirmLogin;

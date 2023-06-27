import { Request, Response } from "express";
import { CustomerDto } from "../../../dto/customerDto";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { ExternalJWTService } from "../../../services/external/externalJwtService";
import { CustomerService } from "../../../services/internal/customerService";
import RedisService from "../../../services/external/externalRedisService";
import { v4 as uuid } from "uuid";
import { CustomerOtpService } from "../../../services/internal/customerOtpService";

const path = "/v1/otp";
const method = "POST";
const auth = "guess";
const bodyValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "code",
        type: "string",
        required: true,
    },
    {
        name: "type",
        type: "string",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const body: {
        id: string;
        code: string;
        type: "register" | "login";
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!body) {
        return;
    }

    if (body.type !== "register" && body.type !== "login") {
        throw new BusinessError(`Type with ${body.type} is not supported`, ErrorType.Validation);
    }

    const otpService = new CustomerOtpService();
    const customerService = new CustomerService();
    const externalJWTService = new ExternalJWTService();
    const redisService = new RedisService();

    const redisKey = `authOtp/${body.id}`;
    const cached = await redisService.get(redisKey);
    if (!cached) {
        throw new BusinessError("Please try again in a few moments", ErrorType.Authentication);
    }

    const customer = await customerService.findById(cached);
    let otp = await otpService.findOtpByCifIdAndType(cached, body.type);

    if (otp.code !== body.code) {
        throw new BusinessError("OTP is incorrect", ErrorType.Validation);
    }

    if (otp.expiredAt.getTime() < Date.now()) {
        throw new BusinessError("OTP has expired, please request a new one", ErrorType.Validation);
    }

    const accessToken = externalJWTService.createAccessToken({ id: customer.id, rid: customer.roleId });
    const refreshToken = externalJWTService.createRefreshToken({ id: customer.id, rid: customer.roleId });
    const loginId = uuid();

    let bodyResponse;
    if (customer.authentication) {
        bodyResponse = {
            authentication: true,
            loginId,
            id: customer.id,
        };

        const redisService = new RedisService();
        await redisService.set(`login/${customer.id}`, loginId);
    } else {
        bodyResponse = {
            id: customer.id,
            accessToken,
            refreshToken,
            authentication: false,
        };
    }

    if (body.type === "register") {
        await customerService.update({
            id: customer.id,
            username: customer.username,
            email: customer.email,
            address: customer.address,
            isActive: true,
        });
    }

    await redisService.del(redisKey);
    return res.status(200).send(bodyResponse);
};

const postOtpLoginorRegister: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postOtpLoginorRegister;

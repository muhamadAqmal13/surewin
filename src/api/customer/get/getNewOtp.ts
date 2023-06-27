import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { ExternalJWTService } from "../../../services/external/externalJwtService";
import { CustomerService } from "../../../services/internal/customerService";
import RedisService from "../../../services/external/externalRedisService";
import { CustomerOtpService } from "../../../services/internal/customerOtpService";
import { EmailService } from "../../../services/external/externalEmailService";

const path = "/v1/otp/:id";
const method = "GET";
const auth = "guess";

const paramsValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
];

const queryValidation: Validation[] = [
    {
        name: "type",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const params: {
        id: string;
    } = validate.process(paramsValidation, "params");

    const query: {
        type: "register" | "login" | "reset_password";
    } = validate.process(queryValidation, "query");

    if (query.type !== "register" && query.type !== "login") {
        throw new BusinessError("Type is not supported", ErrorType.Validation);
    }

    const redisService = new RedisService();
    const redisKey = `authOtp/${params.id}`;
    const cached = await redisService.get(redisKey);
    if (!cached) {
        throw new BusinessError("Please try again", ErrorType.Internal);
    }

    const customerService = new CustomerService();
    const otpService = new CustomerOtpService();

    const customer = await customerService.findById(cached);
    const existOtp = await otpService.findOtpByCifIdAndType(customer.id, query.type);

    const now = new Date();
    const createdDate = new Date(existOtp.createdAt);
    const distance = now.getTime() - createdDate.getTime();

    if (distance < 60000) {
        throw new BusinessError("Minimum time to request a new OTP is 1 minute", ErrorType.Validation);
    }

    const newOtp = await otpService.updateOtp(customer.id, query.type);

    const emailService = new EmailService();
    const typeEmail = query.type === "register" ? "registration" : query.type === "login" ? "login" : "resetPassword";
    await emailService.sendEmailOtp(
        typeEmail,
        {
            name: customer.username,
            email: customer.email,
        },
        newOtp.code,
        newOtp.expiredAt,
    );

    return res.status(200).send({
        success: true,
        message: "Please verify your email address first",
        data: {
            id: params.id,
            email: customer.email.replace(/(.{3})[^@]+/, "$1***"),
            createdAt: newOtp.createdAt,
        },
    });
};

const getNewOtp: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getNewOtp;

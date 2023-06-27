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
import { EmailService } from "../../../services/external/externalEmailService";
import { CustomerOtpService } from "../../../services/internal/customerOtpService";
import { IOtp } from "../../../models/customerOtpModels";

const path = "/v1/customer/login";
const method = "POST";
const auth = "guess";
const bodyValidation: Validation[] = [
    {
        name: "email",
        type: "string",
        required: true,
    },
    {
        name: "password",
        type: "string",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        email: string;
        password: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const customerService = new CustomerService();
    const externalJWTService = new ExternalJWTService();

    const existCustomer: CustomerDto = await customerService.findByEmailAndPassword(
        requestBody.email,
        requestBody.password,
    );

    if (!existCustomer) {
        throw new BusinessError("Email or Password is incorrect", ErrorType.NotFound);
    }

    const otpService = new CustomerOtpService();
    const emailService = new EmailService();

    const otp = await otpService.findOtpByCifIdAndType(existCustomer.id, "login");
    let newOtp: IOtp;
    if (otp) {
        newOtp = await otpService.updateOtp(existCustomer.id, "login");
    } else {
        newOtp = await otpService.createOtp(existCustomer.id, "login");
    }

    const id = uuid();
    const redisService = new RedisService();
    const redisKey = `authOtp/${id}`;
    await redisService.set(redisKey, existCustomer.id, 60 * 60 * 24);

    await emailService.sendEmailOtp(
        "login",
        {
            name: existCustomer.username,
            email: existCustomer.email,
        },
        newOtp.code,
        newOtp.expiredAt,
    );

    return res.status(200).send({
        success: true,
        message: "Please verify your email address first",
        data: {
            id,
            email: existCustomer.email.replace(/(.{3})[^@]+/, "$1***"),
            createdAt: newOtp.createdAt,
        },
    });
};

const postCustomerLogin: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postCustomerLogin;

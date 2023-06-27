import { Request, Response } from "express";
import { ErrorType, OrderStatuses, OrderType, RoleID } from "../../../enum";
import { Validation, Validator } from "../../../helper/validator";
import { CustomerService } from "../../../services/internal/customerService";
import { CustomerRoleService } from "../../../services/internal/customerRoleService";
import { apiRouter } from "../../../interfaces";
import { BusinessError } from "../../../helper/handleError";
import { FundService } from "../../../services/internal/fundsService";
import { OrderSerivce } from "../../../services/internal/orderService";
import { Config } from "../../../config";
import { UniqueGenerator } from "../../../helper/uniqueGenerator";
import { FundsDto } from "../../../dto/fundsDto";
import { v4 as uuid } from "uuid";
import { ExternalJWTService } from "../../../services/external/externalJwtService";
import { CustomerOtpService } from "../../../services/internal/customerOtpService";
import { EmailService } from "../../../services/external/externalEmailService";
import RedisService from "../../../services/external/externalRedisService";

const path = "/v1/customer/registration";
const method = "POST";
const auth = "guess";
const bodyValidation: Validation[] = [
    {
        name: "username",
        type: "string",
        required: true,
    },
    {
        name: "email",
        type: "string",
        isEmail: true,
        required: true,
    },
    {
        name: "address",
        type: "string",
        required: true,
    },
    {
        name: "password",
        type: "string",
        required: true,
    },
    {
        name: "confirmPassword",
        type: "string",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        username: string;
        email: string;
        address: string;
        password: string;
        confirmPassword: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }

    if (requestBody.password !== requestBody.confirmPassword) {
        throw new BusinessError("Password and confirm password not match", ErrorType.Validation);
    }

    const customerService = new CustomerService();
    const roleService = new CustomerRoleService();
    const otpService = new CustomerOtpService();
    const emailService = new EmailService();
    const redisService = new RedisService();

    const existCustomer = await customerService.findByEmailOrUsername(requestBody.email, requestBody.username);

    let newCustomer;
    if (existCustomer && existCustomer.isActive) {
        throw new BusinessError("Username or email has registered", ErrorType.Duplicate);
    } else if (existCustomer && !existCustomer.isActive) {
        newCustomer = await customerService.update({
            id: existCustomer.id,
            email: requestBody.email,
            username: requestBody.username,
            accountNo: existCustomer.accountNo,
            password: requestBody.password,
            isActive: false,
            authentication: false,
            address: requestBody.address,
            roleId: existCustomer.roleId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const id = uuid();
        const redisKey = `authOtp/${id}`;
        await redisService.set(redisKey, newCustomer.id, 60 * 60);

        const existOtp = await otpService.findOtpByCifIdAndType(newCustomer.id, "register");

        const now = new Date();
        const createdDate = new Date(existOtp.createdAt);
        const distance = now.getTime() - createdDate.getTime();

        let otp;
        if (distance > 60000) {
            otp = await otpService.updateOtp(newCustomer.id, "register");
        } else {
            otp = existOtp;
        }

        await emailService.sendEmailOtp(
            "registration",
            {
                name: newCustomer.username,
                email: newCustomer.email,
            },
            otp.code,
            otp.expiredAt,
        );

        return res.status(200).send({
            success: true,
            message: "Please verify your email address first",
            data: {
                id,
                email: newCustomer.email.replace(/(.{3})[^@]+/, "$1***"),
                createdAt: otp.createdAt,
            },
        });
    } else {
        const generateAccountNo = UniqueGenerator.accountNo(requestBody.username);
        const userRole = await roleService.findByName("user");
        newCustomer = await customerService.create({
            email: requestBody.email,
            username: requestBody.username,
            accountNo: generateAccountNo,
            password: requestBody.password,
            isActive: false,
            authentication: false,
            address: requestBody.address,
            roleId: userRole?.id || RoleID.User,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const fundService = new FundService();
        const newFund: FundsDto = {
            cifId: newCustomer.id,
            currency: "TRX",
            balance: "0",
            countOpenBox: 0,
            updatedAt: new Date(),
        };
        const totalUser = await customerService.countUser();
        if (totalUser < parseInt(new Config().maxBonusUser.toString())) {
            const trxRefNo = await UniqueGenerator.invoice(newCustomer, OrderType.BONUS);
            const config = new Config();
            const bonus = config.bonusNewRegistration.toString();
            newFund.bonus = bonus;

            const orderService = new OrderSerivce();
            const newBonus = await orderService.create({
                cifId: newCustomer.id,
                description: "Bonus for new customer",
                trxRefNo,
                priceAmount: bonus,
                priceCurrency: "TRX",
                status: OrderStatuses.FINISHED,
                type: OrderType.BONUS,
                payAmount: bonus,
                payCurrency: "TRX",
                createdAt: new Date(),
                updatedAt: new Date(),
                amount: bonus,
            });
        }
        const createFund = await fundService.create(newFund);

        const id = uuid();
        const redisKey = `authOtp/${id}`;
        await redisService.set(redisKey, newCustomer.id, 60 * 60);

        const otp = await otpService.createOtp(newCustomer.id, "register");
        await emailService.sendEmailOtp(
            "registration",
            {
                name: newCustomer.username,
                email: newCustomer.email,
            },
            otp.code,
            otp.expiredAt,
        );

        return res.status(200).send({
            success: true,
            message: "Please verify your email address first",
            data: {
                id,
                email: newCustomer.email.replace(/(.{3})[^@]+/, "$1***"),
                createdAt: otp.createdAt,
            },
        });
    }
};

const postCustomerRegister: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postCustomerRegister;

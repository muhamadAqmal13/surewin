import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import speakeasy from "speakeasy";
import RedisService from "../../../services/external/externalRedisService";

const path = "/v1/customer/authenticator";
const method = "PUT";
const auth = "user";

const bodyValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
    {
        name: "code",
        required: true,
        type: "string",
    },
    {
        name: "password",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const requestBody: {
        id: string;
        code: string;
        password: string;
    } = validate.process(bodyValidation, "body");

    const customerService = new CustomerService();
    const customer = await customerService.findById(requestBody.id, false, true);

    if (!customer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    const checkPassword = await customerService.findByEmailAndPassword(customer.email, requestBody.password);
    if (!checkPassword) {
        throw new BusinessError("Invalid Password", ErrorType.Validation);
    }

    const verify = speakeasy.totp.verify({
        secret: customer.authKey,
        encoding: "base32",
        token: requestBody.code,
    });

    if (!verify) {
        throw new BusinessError("Authenticator code is not valid", ErrorType.Validation);
    }

    const update = await customerService.update({
        id: customer.id,
        email: customer.email,
        username: customer.username,
        address: customer.address,
        authentication: false,
        updatedAt: new Date(),
    });
    res.status(200).send(update);
};

const putRemoveAuthenticator: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default putRemoveAuthenticator;

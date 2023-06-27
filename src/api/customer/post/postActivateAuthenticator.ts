import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import speakeasy from "speakeasy";
import RedisService from "../../../services/external/externalRedisService";

const path = "/v1/customer/authenticator";
const method = "POST";
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
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const requestBody: {
        id: string;
        code: string;
    } = validate.process(bodyValidation, "body");

    const customerService = new CustomerService();
    let customer = await customerService.findById(requestBody.id, false, true);

    if (!customer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }
    const redisService = new RedisService();
    const redisKey = `qrcodeauth/${customer.id}`;

    const verify = speakeasy.totp.verify({
        secret: customer.authKey,
        encoding: "base32",
        token: requestBody.code,
    });

    if (!verify) {
        throw new BusinessError("Authenticator code is not valid", ErrorType.Validation);
    }

    await redisService.del(redisKey);
    const update = await customerService.update({
        id: customer.id,
        email: customer.email,
        username: customer.username,
        address: customer.address,
        authentication: true,
        updatedAt: new Date(),
    });
    res.status(200).send(update);
};

const postActivateAuthenticator: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postActivateAuthenticator;

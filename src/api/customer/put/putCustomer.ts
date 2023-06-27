import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { Validation, Validator } from "../../../helper/validator";
import { CustomerService } from "../../../services/internal/customerService";
import { apiRouter } from "../../../interfaces";
import { BusinessError } from "../../../helper/handleError";

const path = "/v1/customer";
const method = "PUT";
const auth = "user";
const bodyValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
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
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        id: string;
        username: string;
        email: string;
        address: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const customerService = new CustomerService();

    const existCustomer = await customerService.findById(requestBody.id);
    if (!existCustomer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    const updateCustomer = await customerService.update({
        id: existCustomer.id,
        email: requestBody.email,
        username: existCustomer.username,
        address: requestBody.address,
        updatedAt: new Date(),
    });

    return res.status(200).send(updateCustomer);
};

const putCustomer: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default putCustomer;

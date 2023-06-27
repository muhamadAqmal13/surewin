import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { Validation, Validator } from "../../../helper/validator";
import { CustomerService } from "../../../services/internal/customerService";
import { apiRouter } from "../../../interfaces";
import { BusinessError } from "../../../helper/handleError";
import bcrypt from "bcrypt";

const path = "/v1/customer-password";
const method = "PUT";
const auth = "user";
const bodyValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
    {
        name: "oldPassword",
        type: "string",
        required: true,
    },
    {
        name: "newPassword",
        type: "string",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        id: string;
        oldPassword: string;
        newPassword: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    if (requestBody.oldPassword === requestBody.newPassword) {
        throw new BusinessError("Old and new passwords cannot be the same", ErrorType.Authentication);
    }

    const customerService = new CustomerService();
    const existCustomer = await customerService.findById(requestBody.id, true);

    if (!existCustomer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    const syncPassword = bcrypt.compareSync(requestBody.oldPassword, existCustomer.password);
    if (!syncPassword) {
        throw new BusinessError("Old password is invalid", ErrorType.Authentication);
    }

    const updateCustomer = await customerService.updatePassword(existCustomer.id, requestBody.newPassword);
    return res.status(200).send(updateCustomer);
};

const putCustomerPassword: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default putCustomerPassword;

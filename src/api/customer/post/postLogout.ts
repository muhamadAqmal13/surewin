import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { ExternalJWTService } from "../../../services/external/externalJwtService";
import { CustomerService } from "../../../services/internal/customerService";

const path = "/v1/customer/logout";
const method = "POST";
const auth = "user";
const bodyValidation: Validation[] = [
    {
        name: "id",
        type: "string",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        id: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const customerService = new CustomerService();
    const externalJWTService = new ExternalJWTService();

    const customer = await customerService.findById(requestBody.id);
    if (!customer) {
        throw new BusinessError("Customer not found", ErrorType.NotFound);
    }

    res.clearCookie("token");
    res.status(200).send({
        success: true,
        message: "Logout successfully",
    });
};

const postCustomerLogout: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postCustomerLogout;

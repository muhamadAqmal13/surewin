import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";

const path = "/v1/customer/:id";
const method = "GET";
const auth = "user";

const paramsValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const params: {
        id: string;
    } = validate.process(paramsValidation, "params");

    const customerService = new CustomerService();
    let customer = await customerService.findById(params.id);

    if (!customer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    return res.status(200).send(customer);
};

const getCustomerById: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getCustomerById;

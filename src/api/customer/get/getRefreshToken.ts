import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { ExternalJWTService } from "../../../services/external/externalJwtService";
import { CustomerService } from "../../../services/internal/customerService";

const path = "/v1/customer/token/:id";
const method = "GET";
const auth = "cookie";

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

    const externalJWTService = new ExternalJWTService();
    const accessToken = externalJWTService.createAccessToken({ id: customer.id, rid: customer.roleId });
    return res.status(200).send({
        accessToken,
    });
};

const getRefreshToken: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getRefreshToken;

import Big from "big.js";
import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import { InvoiceService } from "../../../services/internal/invoiceService";
import { OrderSerivce } from "../../../services/internal/orderService";

const path = "/v1/order/invoice/:id";
const method = "GET";
const auth = "user";

const paramsValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
];

const queryValidation: Validation[] = [
    {
        name: "invoiceNo",
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
        invoiceNo: string;
    } = validate.process(queryValidation, "query");

    const customerService = new CustomerService();
    let customer = await customerService.findById(params.id);
    if (!customer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    const invoiceService = new InvoiceService();
    const invoice = await invoiceService.findByExternalInvoiceId(query.invoiceNo);
    if (!invoice) {
        throw new BusinessError("Invoice id is not valid", ErrorType.Validation);
    }

    res.status(200).send(invoice);
};

const getInvoiceByExternalInvoiceId: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getInvoiceByExternalInvoiceId;

import Big from "big.js";
import { Request, Response } from "express";
import { ErrorType, OrderType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import { InvoiceService } from "../../../services/internal/invoiceService";
import { OrderSerivce } from "../../../services/internal/orderService";

const path = "/v1/order/transaction-history/:id/detail";
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
        name: "referenceNo",
        required: false,
        type: "string",
        default: "1",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const params: {
        id: string;
    } = validate.process(paramsValidation, "params");
    const query: {
        referenceNo: string;
    } = validate.process(queryValidation, "query");

    const customerService = new CustomerService();
    let customer = await customerService.findById(params.id);
    if (!customer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    const orderService = new OrderSerivce();
    const transaction = await orderService.findByTrxRefNo(query.referenceNo);
    if (!transaction) {
        throw new BusinessError(`Transaction with ${query.referenceNo} not found`, ErrorType.NotFound);
    }

    if (transaction.type === OrderType.BUY) {
        const invoiceService = new InvoiceService();
        const invoice = await invoiceService.findByTrxRefNo(query.referenceNo);
        if (!invoice) {
            throw new BusinessError("Something wrong with transaction", ErrorType.Internal);
        }

        res.status(200).send({
            ...transaction.toObject(),
            invoice,
        });
        return;
    }

    res.status(200).send(transaction);
};

const getTransactionDetail: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getTransactionDetail;

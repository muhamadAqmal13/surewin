import Big from "big.js";
import { Request, Response } from "express";
import { ErrorType, OrderType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import { FundService } from "../../../services/internal/fundsService";
import { OrderSerivce } from "../../../services/internal/orderService";

const path = "/v1/fund/:id";
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

    const fundService = new FundService();
    const fund = await fundService.findFundByCifId(customer.id);

    const orderService = new OrderSerivce();
    const orders = await orderService.findOrdersPendingByCifIdAndType(customer.id, OrderType.SELL);

    let actualBalance = new Big(fund.balance);
    let totalPending = new Big("0");
    for (const order of orders) {
        actualBalance = actualBalance.minus(order.amount);
        totalPending = totalPending.add(order.amount);
    }

    const copyFund = JSON.parse(JSON.stringify(fund));
    return res.status(200).send({
        ...copyFund,
        balance: actualBalance,
        pendingSell: totalPending,
        totalBalance: new Big(actualBalance).add(copyFund.bonus),
    });
};

const getBalanceByCifId: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getBalanceByCifId;

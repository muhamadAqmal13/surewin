import Big from "big.js";
import { Request, Response } from "express";
import { ErrorType, OrderStatuses, OrderType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import { FundService } from "../../../services/internal/fundsService";
import { OrderSerivce } from "../../../services/internal/orderService";
import { UniqueGenerator } from "../../../helper/uniqueGenerator";

const path = "/v1/fund-open-box/:id";
const method = "GET";
const auth = "user";

const paramsValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
];

const getRandomNumber = () => {
    const randomNum = Math.floor(Math.random() * 10) + 1;
    if (randomNum > 5) {
        const probability = Math.pow(0.5, randomNum - 5);
        if (Math.random() < probability) {
            return randomNum;
        } else {
            return getRandomNumber();
        }
    } else {
        return randomNum;
    }
};

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

    let reward = getRandomNumber();

    const fundService = new FundService();
    const fund = await fundService.findFundByCifId(customer.id);
    if (!fund.countOpenBox || fund.countOpenBox < 1) {
        throw new BusinessError("You don't have opportunity for open the box", ErrorType.Validation);
    }

    const orderService = new OrderSerivce();
    const trxRefNo = await UniqueGenerator.invoice(customer, OrderType.BONUS);
    const newBonus = await orderService.create({
        cifId: customer.id,
        description: "Bonus gift box",
        trxRefNo,
        priceAmount: reward.toString(),
        priceCurrency: "TRX",
        status: OrderStatuses.FINISHED,
        type: OrderType.BONUS,
        payAmount: reward.toString(),
        payCurrency: "TRX",
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: reward.toString(),
    });

    const updatedFund = await fundService.update({
        cifId: customer.id,
        bonus: new Big(fund.bonus).add(new Big(reward.toString())).toString(),
        countOpenBox: fund.countOpenBox - 1,
        updatedAt: new Date(),
    });

    res.status(200).send({
        reward,
    });
};

const getRewardBoxBonus: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getRewardBoxBonus;

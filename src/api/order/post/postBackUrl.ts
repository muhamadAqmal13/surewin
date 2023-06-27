import { Request, Response } from "express";
import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType } from "../../../enum";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { OrderSerivce } from "../../../services/internal/orderService";
import { InvoiceService } from "../../../services/internal/invoiceService";
import { Config } from "../../../config";
import { FundService } from "../../../services/internal/fundsService";
import Big from "big.js";
import { BusinessError } from "../../../helper/handleError";

const path = "/v1/order/back-url";
const method = "POST";
const auth = "nowpayments";

const bodyValidation: Validation[] = [
    {
        name: "payment_id",
        type: "number",
        required: true,
    },
    {
        name: "invoice_id",
        type: "number",
        required: true,
    },
    {
        name: "payment_status",
        type: "string",
        required: true,
    },
    {
        name: "pay_address",
        type: "string",
    },
    {
        name: "price_amount",
        type: "number",
    },
    {
        name: "price_currency",
        type: "string",
    },
    {
        name: "pay_amount",
        type: "number",
    },
    {
        name: "actually_paid",
        type: "number",
    },
    {
        name: "actually_paid_at_fiat",
        type: "number",
    },
    {
        name: "pay_currency",
        type: "string",
    },
    {
        name: "order_id",
        type: "string",
    },
    {
        name: "order_description",
        type: "string",
    },
    {
        name: "purchase_id",
        type: "string",
    },
    {
        name: "created_at",
        type: "string",
    },
    {
        name: "updated_at",
        type: "string",
    },
    {
        name: "outcome_amount",
        type: "number",
    },
    {
        name: "outcome_currency",
        type: "string",
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        payment_id: number;
        invoice_id: number;
        payment_status: string;
        pay_address: string;
        price_amount: number;
        price_currency: string;
        pay_amount: number;
        actually_paid: number;
        actually_paid_at_fiat: number;
        pay_currency: string;
        order_id: string;
        order_description: string;
        purchase_id: string;
        created_at: string;
        updated_at: string;
        outcome_amount: number;
        outcome_currency: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }

    const config = new Config();
    const invoiceService = new InvoiceService();
    const invoice = await invoiceService.findByTrxRefNo(requestBody.order_id);
    if (!invoice) {
        throw new Error("Something went wrong with order_id - invoice");
    }

    if (invoice.status === InvoiceStatuses.FINISHED) {
        throw new BusinessError("This Invoice has received back url", ErrorType.Validation);
    }

    const newInvoiceStatus = InvoiceStatuses[requestBody.payment_status.toUpperCase()];
    if (!newInvoiceStatus) {
        throw new Error("Invalid invoice status");
    }

    const orderService = new OrderSerivce();
    const order = await orderService.findByTrxRefNo(requestBody.order_id);
    if (!order) {
        throw new Error("Something went wrong with order_id - order");
    }

    let remark;
    let orderStatus: OrderStatuses;
    if (newInvoiceStatus === InvoiceStatuses.WAITING) {
        orderStatus = OrderStatuses.WAITING;
    } else if (newInvoiceStatus === InvoiceStatuses.FINISHED) {
        orderStatus = OrderStatuses.FINISHED;
    } else if (newInvoiceStatus === InvoiceStatuses.REFUNDED) {
        orderStatus = OrderStatuses.REJECTED;
    } else if (newInvoiceStatus === InvoiceStatuses.FAILED || newInvoiceStatus === InvoiceStatuses.EXPIRED) {
        orderStatus = OrderStatuses.FAILED;
    } else if (newInvoiceStatus === InvoiceStatuses.PARTIALLY_PAID) {
        orderStatus = OrderStatuses.PARTIALLY_PAID;
        remark = "Please contact admin for refund";
    } else {
        orderStatus = OrderStatuses.PROCESSING;
    }

    await invoiceService.updateByExternalInvoiceId({
        extInvoiceId: requestBody.invoice_id.toString(),
        trxRefNo: invoice.trxRefNo,
        status: newInvoiceStatus,
        description: invoice.description,
        priceAmount: invoice.priceAmount,
        priceCurrency: requestBody.price_currency,
        payCurrency: invoice.payCurrency,
        paidAmount: new Big(invoice.paidAmount).add(requestBody.actually_paid.toString()).toString(),
    });

    const updatedOrder = await orderService.update({
        cifId: order.cifId,
        trxRefNo: order.trxRefNo,
        description: order.description,
        priceAmount: order.priceAmount,
        priceCurrency: order.priceCurrency,
        status: orderStatus,
        type: OrderType[order.type.toUpperCase()],
        amount: requestBody.actually_paid.toString(),
        payAddress: order.payAddress,
        payAmount: order.payAmount.toString(),
        payCurrency: order.payCurrency,
        purchaseId: order.purchaseId,
        paymentId: order.paymentId.toString(),
        updatedAt: new Date(),
        remark,
    });

    if (updatedOrder.status === OrderStatuses.FINISHED) {
        const fundService = new FundService();
        const fund = await fundService.findFundByCifId(updatedOrder.cifId);
        const newBalance = new Big(fund.balance).add(updatedOrder.payAmount);
        let plusOpenBox;
        if (parseInt(updatedOrder.payAmount) > 100) {
            plusOpenBox = Math.floor(parseInt(updatedOrder.payAmount) / 100);
        } else {
            plusOpenBox = 1;
        }
        await fundService.update({
            cifId: fund.cifId,
            currency: fund.currency,
            balance: newBalance.toString(),
            updatedAt: new Date(),
            countOpenBox: fund.countOpenBox + plusOpenBox,
        });
    }

    res.sendStatus(200);
};

const postBackUrl: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postBackUrl;

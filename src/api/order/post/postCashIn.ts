import { Request, Response } from "express";
import { ErrorType, InvoiceStatuses, OrderStatuses, OrderType } from "../../../enum";
import { Validation, Validator } from "../../../helper/validator";
import { CustomerService } from "../../../services/internal/customerService";
import { apiRouter } from "../../../interfaces";
import { OrderSerivce } from "../../../services/internal/orderService";
import { InvoiceService } from "../../../services/internal/invoiceService";
import { BusinessError } from "../../../helper/handleError";
import { ExternalNowPaymentsService } from "../../../services/external/externalNowPayments";
import { Config } from "../../../config";
import { UniqueGenerator } from "../../../helper/uniqueGenerator";

const path = "/v1/order/cash-in";
const method = "POST";
const auth = "user";

const bodyValidation: Validation[] = [
    {
        name: "cifId",
        type: "string",
        required: true,
    },
    {
        name: "amount",
        type: "string",
        required: true,
    },
    {
        name: "currency",
        type: "string",
        default: "TRX",
    },
    {
        name: "case",
        type: "string",
        required: false,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        cifId: string;
        amount: string;
        currency: string;
        case: string;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const config = new Config();
    if (parseFloat(requestBody.amount) < parseFloat(config.minDeposit)) {
        throw new BusinessError(`Minimum for cash in ${config.minDeposit} TRX`, ErrorType.Validation);
    }

    const customerService = new CustomerService();
    const customer = await customerService.findById(requestBody.cifId);
    if (!customer) {
        throw new BusinessError("Customer not found", ErrorType.NotFound);
    }

    const orderService = new OrderSerivce();
    const trxRefNo = await UniqueGenerator.invoice(customer, OrderType.BUY);
    const createOrder = await orderService.create({
        cifId: customer.id,
        trxRefNo: trxRefNo,
        description: `Top up for ${customer.username}`,
        priceAmount: "",
        priceCurrency: "usd",
        status: OrderStatuses.WAITING,
        type: OrderType.BUY,
        amount: "0",
        payAddress: "",
        payAmount: requestBody.amount,
        payCurrency: "trx",
        purchaseId: "",
        paymentId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const nowPaymentsService = new ExternalNowPaymentsService();
    const estPrice = await nowPaymentsService.getEstimatedPrice({
        amount: requestBody.amount,
        from: "trx",
        to: "usd",
    });

    console.log("ESTIMATION PRICE : " + estPrice.estimated_amount);

    if (!estPrice) {
        await orderService.update({
            cifId: createOrder.cifId,
            trxRefNo: createOrder.trxRefNo,
            description: createOrder.description,
            priceAmount: estPrice.estimated_amount,
            priceCurrency: createOrder.priceCurrency,
            status: OrderStatuses.FAILED,
            type: OrderType.BUY,
            amount: createOrder.amount,
            updatedAt: new Date(),
            remark: "Something wrong when create invoice",
        });

        throw new BusinessError(
            estPrice.message || "Something wrong when check estimated price",
            estPrice.code || ErrorType.Internal,
        );
    }

    const invoiceExt = await nowPaymentsService.createInvoice({
        price_amount: parseFloat(estPrice.estimated_amount),
        price_currency: "usd",
        order_id: trxRefNo,
        order_description: `Top up for ${customer.username}`,
        ipn_callback_url: config.callbackUrl,
        success_url: config.backUrl,
        cancel_url: config.backUrl,
        partially_paid_url: config.backUrl,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
    });

    if (!invoiceExt) {
        await orderService.update({
            cifId: createOrder.cifId,
            trxRefNo: createOrder.trxRefNo,
            description: createOrder.description,
            priceAmount: estPrice.estimated_amount,
            priceCurrency: createOrder.priceCurrency,
            status: OrderStatuses.FAILED,
            type: OrderType.BUY,
            amount: createOrder.amount,
            updatedAt: new Date(),
            remark: "Something wrong when create invoice",
        });
        throw new BusinessError(
            invoiceExt.message || "Something wrong when create invoice",
            invoiceExt.code || ErrorType.Internal,
        );
    }

    const requestBodyPayment: any = {
        iid: parseInt(invoiceExt.id),
        customer_email: customer.email,
        pay_currency: "TRX",
        order_description: createOrder.description,
    };

    if (config.nodeEnv === "DEVELOPMENT") {
        requestBodyPayment.case = requestBody.case;
    }

    const payment = await nowPaymentsService.createPayment(requestBodyPayment);

    if (!payment) {
        await orderService.update({
            cifId: createOrder.cifId,
            trxRefNo: createOrder.trxRefNo,
            description: createOrder.description,
            priceAmount: estPrice.estimated_amount,
            priceCurrency: createOrder.priceCurrency,
            status: OrderStatuses.FAILED,
            type: OrderType.BUY,
            amount: createOrder.amount,
            updatedAt: new Date(),
            remark: "Something wrong when create invoice",
        });
        throw new BusinessError(
            payment.message || "Something wrong when create payment",
            payment.code || ErrorType.Internal,
        );
    }

    await orderService.update({
        cifId: customer.id,
        trxRefNo: trxRefNo,
        description: `Top up for ${customer.username}`,
        priceAmount: estPrice.estimated_amount,
        priceCurrency: "usd",
        status: OrderStatuses.WAITING,
        type: OrderType.BUY,
        amount: payment.amount_received.toString(),
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount.toString(),
        payCurrency: "trx",
        purchaseId: payment.purchase_id,
        paymentId: invoiceExt.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const invoiceService = new InvoiceService();
    const invoice = await invoiceService.create({
        extInvoiceId: invoiceExt.id,
        trxRefNo: trxRefNo,
        status: InvoiceStatuses.WAITING,
        description: invoiceExt.order_description,
        priceAmount: invoiceExt.price_amount,
        priceCurrency: invoiceExt.price_currency,
        payCurrency: "trx",
        invoiceUrl: `${invoiceExt.invoice_url}&paymentId=${payment.payment_id}`,
        callbackUrl: invoiceExt.ipn_callback_url,
        actualAmount: payment.pay_amount.toString(),
        paidAmount: "0",
        successUrl: invoiceExt.success_url,
        cancelUrl: invoiceExt.cancel_url,
        partiallyPaidUrl: invoiceExt.partially_paid_url,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFixedRate: invoiceExt.is_fixed_rate,
        isFeePaidByUser: invoiceExt.is_fee_paid_by_user,
    });

    const orderClone = JSON.parse(JSON.stringify(createOrder));
    orderClone.invoiceStatus = invoice.status;
    orderClone.invoiceId = invoice.extInvoiceId;
    orderClone.invoiceUrl = invoice.invoiceUrl;
    return res.status(200).send(orderClone);
};

const postCashIn: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postCashIn;

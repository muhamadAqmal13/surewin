import { Document, model, Schema } from "mongoose";
import { v4 as uuid } from "uuid";
export interface IInvoice extends Document {
    id: string;
    extInvoiceId: string;
    trxRefNo: string;
    status: string;
    description: string;
    priceAmount: string;
    priceCurrency: string;
    payCurrency: string;
    paidAmount: string;
    actualAmount: string;
    invoiceUrl: string;
    callbackUrl: string;
    successUrl: string;
    cancelUrl: string;
    partiallyPaidUrl: string;
    createdAt: Date;
    updatedAt: Date;
    isFixedRate: boolean;
    isFeePaidByUser: boolean;
}

const invoiceSchema = new Schema<IInvoice>(
    {
        _id: {
            type: String,
        },
        extInvoiceId: { type: String, required: true, unique: true },
        trxRefNo: { type: String, unique: true, required: true },
        status: { type: String, required: true },
        description: { type: String, required: true },
        priceAmount: { type: String, required: true },
        priceCurrency: { type: String, required: true },
        payCurrency: { type: String },
        paidAmount: { type: String },
        actualAmount: { type: String },
        invoiceUrl: { type: String, required: true },
        callbackUrl: { type: String, required: true },
        successUrl: String,
        cancelUrl: String,
        partiallyPaidUrl: String,
        createdAt: Date,
        updatedAt: Date,
        isFixedRate: { type: Boolean, required: true },
        isFeePaidByUser: { type: Boolean, required: true },
    },
    {
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
        versionKey: false,
    },
);

export default model<IInvoice>("invoice", invoiceSchema);

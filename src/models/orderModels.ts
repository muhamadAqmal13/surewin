import { Document, model, Schema } from "mongoose";
import { v4 as uuid } from "uuid";

export interface IOrder extends Document {
    id: string;
    cifId: string;
    trxRefNo: string;
    description: string;
    priceAmount: string;
    priceCurrency: string;
    status: string;
    type: string;
    productId: string;
    gameId: string;
    amount: string;
    payAddress: string;
    payAmount: string;
    payCurrency: string;
    purchaseId: string;
    paymentId: string;
    createdAt: Date;
    updatedAt: Date;
    remark: string;
    hash: string;
}

const orderSchema = new Schema<IOrder>(
    {
        _id: { type: String },
        cifId: { type: String, required: true },
        trxRefNo: { type: String },
        description: { type: String, required: true },
        priceAmount: { type: String },
        priceCurrency: { type: String, required: true },
        status: { type: String, required: true },
        type: { type: String, required: true },
        productId: String,
        gameId: String,
        amount: { type: String, required: true },
        payAddress: String,
        payAmount: String,
        payCurrency: String,
        purchaseId: String,
        paymentId: String,
        createdAt: Date,
        updatedAt: Date,
        remark: String,
        hash: String,
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

export default model<IOrder>("order", orderSchema);

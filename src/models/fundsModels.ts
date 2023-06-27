import { Document, model, Schema } from "mongoose";
import { v4 as uuid } from "uuid";

export interface IFunds extends Document {
    id: string;
    cifId: string;
    currency: string;
    balance: string;
    bonus: string;
    updatedAt: Date;
    countOpenBox: number;
}

const fundSchema = new Schema<IFunds>(
    {
        _id: {
            type: String,
        },
        cifId: { type: String, required: true },
        currency: String,
        balance: String,
        bonus: String,
        updatedAt: Date,
        countOpenBox: Number,
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

export default model<IFunds>("fund", fundSchema);

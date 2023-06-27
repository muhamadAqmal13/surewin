import { Document, model, Schema } from "mongoose";
import { v4 as uuid } from "uuid";

export interface IUserGame extends Document {
    id: string;
    cifId: string;
    gameId: string;
    productId: string;
    gameTypeId: string;
    spent: string;
    result: string;
    createdAt: Date;
    updatedAt: Date;
}

const useGameSchema = new Schema<IUserGame>(
    {
        _id: {
            type: String,
        },
        cifId: {
            type: String,
            required: true,
        },
        gameId: {
            type: String,
            required: true,
        },
        productId: {
            type: String,
            required: true,
        },
        gameTypeId: {
            type: String,
            required: true,
        },
        spent: {
            type: String,
            required: true,
        },
        result: {
            type: String,
            required: true,
            enum: ["PENDING", "WIN", "LOSS"],
        },
        createdAt: Date,
        updatedAt: Date,
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

export default model<IUserGame>("userGame", useGameSchema);

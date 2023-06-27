import { Document, model, Schema } from "mongoose";

export interface IGame extends Document {
    id: string;
    periode: string;
    gameTypeId: string;
    result: {
        color: string;
        number: string;
        shape: string;
    };
    winner: number;
    looser: number;
    startAt: Date;
    finishAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const gameSchema = new Schema<IGame>(
    {
        _id: {
            type: String,
        },
        periode: String,
        gameTypeId: {
            type: String,
            required: true,
        },
        result: {
            color: String,
            number: String,
            shape: String,
        },
        winner: Number,
        looser: Number,
        startAt: {
            type: Date,
            required: true,
        },
        finishAt: {
            type: Date,
            required: true,
        },
        createdAt: {
            type: Date,
        },
        updatedAt: {
            type: Date,
        },
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

export default model<IGame>("game", gameSchema);

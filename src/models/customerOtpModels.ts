import { Schema, model, Document } from "mongoose";

export interface IOtp extends Document {
    id: string;
    cifId: string;
    type: "login" | "register" | "reset_password";
    code: string;
    createdAt: Date;
    expiredAt: Date;
}

const otpSchema = new Schema(
    {
        id: String,
        cifId: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["login", "register", "reset_password"],
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            required: true,
        },
        expiredAt: {
            type: Date,
            required: true,
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

export default model<IOtp>("customerOtp", otpSchema);

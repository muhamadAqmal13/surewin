import { Document, model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

export interface ICustomer extends Document {
    id: string;
    username: string;
    email: string;
    accountNo: string;
    password: string;
    authentication: boolean;
    authKey: string;
    isActive: boolean;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    deleteFlag: boolean;
    roleId: string;
}

const customerSchema = new Schema<ICustomer>(
    {
        _id: { type: String },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        accountNo: { type: String, required: true, unique: true },
        address: { type: String, required: true },
        password: { type: String, required: true, select: false },
        authKey: { type: String, required: false, select: false },
        isActive: { type: Boolean, required: false },
        authentication: { type: Boolean, default: false },
        deleteFlag: { type: Boolean, default: false },
        roleId: { type: String, required: true },
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

customerSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

customerSchema.pre("findOneAndUpdate", async function () {
    const update: any = this.getUpdate();
    if (update && update.password) {
        update.password = await bcrypt.hash(update.password, 10);
    }
});

export default model<ICustomer>("customer", customerSchema);

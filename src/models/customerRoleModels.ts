import { Document, model, Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface ICustomerRole extends Document {
    id: string;
    name: string;
}

const customerRoleSchema = new Schema<ICustomerRole>({
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true,
        enum: ["admin", "user"]
    },
},{
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    versionKey: false
})

export default model<ICustomerRole>('role', customerRoleSchema)
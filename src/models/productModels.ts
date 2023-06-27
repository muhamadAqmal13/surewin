import { Document, model, Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface IProduct extends Document {
    id: string;
    name: string;
    gameTypeId: string;
    cd: string;
    currency: string;
    description: string;
    category: string;
    isActive: boolean;
    deleteFlag: boolean;
}

const productSchema = new Schema<IProduct>({
    _id: { type: String },
    name: { type: String, required: true },
    gameTypeId: { type: String, required: true },
    cd: { type: String, required: true},
    currency: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deleteFlag: {type: Boolean, default: false}
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

export default model<IProduct>('product', productSchema)
import { Document, model, Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface IGameType extends Document {
    id: string;
    name: string;
    loop: number;
    cd: number;
}

const gameTypeSchema = new Schema<IGameType>({
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true,
    },
    loop: {
        type: Number,
        required: true
    },
    cd: {
        type: Number,
        required: true
    }
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

export default model<IGameType>('gameType', gameTypeSchema)
import { Model } from "mongoose";
import { OrderDto } from "../../dto/orderDto";
import orderModels, { IOrder } from "../../models/orderModels";
import { v4 as uuid } from "uuid";
import { OrderType } from "../../enum";

export class OrderSerivce {
    private order: Model<IOrder>;

    constructor() {
        this.order = orderModels;
    }

    async create(data: OrderDto): Promise<IOrder> {
        const clone = JSON.parse(JSON.stringify(data));
        clone._id = uuid();

        return await this.order.create(clone);
    }

    async createBulk(datas: OrderDto[]): Promise<IOrder[]> {
        return await this.order.insertMany(datas);
    }

    async update(data: OrderDto): Promise<IOrder> {
        return await this.order.findOneAndUpdate({ trxRefNo: data.trxRefNo }, data, { new: true });
    }

    async updateByPaymentId(data: OrderDto): Promise<IOrder> {
        return await this.order.findOneAndUpdate({ paymentId: data.paymentId }, data, { new: true });
    }

    async findById(id: string): Promise<IOrder> {
        return await this.order.findById(id);
    }

    async findAllByCifId(
        cifId: string,
        page?: number,
        limit?: number,
        type?: string,
    ): Promise<{ transactions: IOrder[]; count: number }> {
        const typeSearch = type.charAt(0).toUpperCase() + type.slice(1);
        const skipIndex = (page - 1) * limit;

        const transactions = await this.order
            .find({
                cifId,
                ...(typeSearch === "All"
                    ? { type: { $nin: ["Play"] } }
                    : typeSearch === "Game"
                    ? { $or: [{ type: "Loss" }, { type: "Win" }] }
                    : { type: typeSearch }),
            })
            .skip(skipIndex)
            .limit(limit)
            .sort({ updatedAt: "desc" })
            .exec();

        const count = await this.order.countDocuments({
            cifId: cifId,
            ...(typeSearch === "All"
                ? { type: { $nin: ["Play"] } }
                : typeSearch === "Game"
                ? { $or: [{ type: "Loss" }, { type: "Win" }] }
                : { type: typeSearch }),
        });
        return { transactions, count: count === 0 ? 1 : count };
    }

    async findByPaymentId(paymentId: string, type: OrderType): Promise<IOrder> {
        return await this.order.findOne({
            paymentId,
            type,
        });
    }

    async findByTrxRefNo(trxRefNo: string): Promise<IOrder> {
        return await this.order.findOne({
            trxRefNo,
        });
    }

    async findOrdersPendingByCifIdAndType(cifId: string, type: OrderType): Promise<IOrder[]> {
        return await this.order.find({
            cifId,
            type,
            status: { $in: ["1", "2", "6"] },
        });
    }

    async findLatestTrxRefNoByCifIdAndType(cifId: string, type: string): Promise<IOrder> {
        return await this.order
            .findOne({
                cifId,
                type,
            })
            .sort({ trxRefNo: -1 });
    }
}

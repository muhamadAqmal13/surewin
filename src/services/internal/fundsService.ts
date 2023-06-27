import { Model } from "mongoose";
import { FundsDto } from "../../dto/fundsDto";
import fundsModels, { IFunds } from "../../models/fundsModels";
import { v4 as uuid } from "uuid";
import { UserGameDto } from "../../dto/userGameDto";
import Big from "big.js";

export class FundService {
    private fund: Model<IFunds>;

    constructor() {
        this.fund = fundsModels;
    }

    async create(data: FundsDto): Promise<IFunds> {
        const clone = JSON.parse(JSON.stringify(data));
        clone._id = uuid();

        return await this.fund.create(clone);
    }

    async update(data: FundsDto): Promise<IFunds> {
        return await this.fund.findOneAndUpdate({ cifId: data.cifId }, data, { new: true });
    }

    async updateBulk(datas: FundsDto[]): Promise<any> {
        return await this.fund.bulkWrite(
            datas.map((fund) => ({
                updateOne: {
                    filter: { _id: fund.id },
                    update: fund,
                    upsert: true,
                },
            })),
        );
    }

    async updateWinner(datas: FundsDto[], userGames: UserGameDto[]): Promise<any> {
        const requests = datas.map((fund) => {
            const userGame = userGames.filter((userGame) => userGame.cifId === fund.cifId && userGame.result === "WIN");
            let balance = new Big(fund.balance);
            for (const updated of userGame) {
                balance = balance.add(new Big(updated.spent).times(new Big("2")));
            }

            return {
                updateOne: {
                    filter: { _id: fund.id },
                    update: { balance, updatedAt: new Date() },
                },
            };
        });

        return await this.fund.bulkWrite(requests);
    }

    async updateWinnerTop10(datas: FundsDto[], data2: any): Promise<any> {
        const requests = datas.map((fund) => {
            const winner = data2.find((winner) => winner.cifId === fund.cifId);
            let balance = new Big(fund.balance).add(new Big(winner.amount));

            return {
                updateOne: {
                    filter: { _id: fund.id },
                    update: { balance, updatedAt: new Date() },
                },
            };
        });

        return await this.fund.bulkWrite(requests);
    }

    async findFundById(id: string): Promise<IFunds> {
        return this.fund.findById(id);
    }

    async findFundByCifId(cifId: string): Promise<IFunds> {
        return this.fund.findOne({
            cifId,
        });
    }

    async findFundByCifIds(cifIds: string[]): Promise<IFunds[]> {
        return this.fund.find({
            cifId: { $in: cifIds },
        });
    }
}

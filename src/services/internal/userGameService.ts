import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import userGameModels, { IUserGame } from "../../models/userGameModels";
import { UserGameDto } from "../../dto/userGameDto";

export class UserGameService {
    private userGame: Model<IUserGame>;

    constructor() {
        this.userGame = userGameModels;
    }

    async create(data: UserGameDto): Promise<IUserGame> {
        const clone = JSON.parse(JSON.stringify(data));
        clone._id = uuid();

        return await this.userGame.create(clone);
    }

    async updateBulk(datas: UserGameDto[]): Promise<any> {
        return await this.userGame.bulkWrite(
            datas.map((userGame) => ({
                updateOne: {
                    filter: { _id: userGame.id },
                    update: userGame,
                    upsert: true,
                },
            })),
        );
    }

    async updateWinner(winnerProductIdCollection: string[], gameId: string): Promise<any[]> {
        const updateWinner = await this.userGame.updateMany(
            {
                gameId,
                productId: { $in: winnerProductIdCollection },
            },
            {
                $set: { result: "WIN", updatedAt: new Date() },
            },
            { new: true },
        );
        const updateLooser = await this.userGame.updateMany(
            {
                gameId,
                productId: { $nin: winnerProductIdCollection },
            },
            {
                $set: { result: "LOSS", updatedAt: new Date() },
            },
            { new: true },
        );

        const usersGame = await this.userGame.find({ gameId });
        return usersGame;
    }

    async findUsersByGameId(gameId: string): Promise<IUserGame[]> {
        return await this.userGame.find({
            gameId,
        });
    }

    async findUsersByGameIdAndProductId(data: { gameId: string; productId: string }): Promise<IUserGame[]> {
        return await this.userGame.find({
            gameId: data.gameId,
            productId: data.productId,
        });
    }

    async findAllUserGameByCifId(
        cifId: string,
        page: number,
        limit: number,
        type: string,
        gameTypeId: string,
    ): Promise<{ data: IUserGame[]; count: number }> {
        const typeSearch = type.toUpperCase();
        const skipIndex = (page - 1) * limit;

        const userGame = await this.userGame
            .find({
                cifId,
                gameTypeId,
                ...(typeSearch === "ALL" ? { result: { $in: ["WIN", "LOSS", "PENDING"] } } : { result: typeSearch }),
            })
            .skip(skipIndex)
            .limit(limit)
            .sort({ updatedAt: "desc" })
            .exec();

        const count = await this.userGame.countDocuments({
            cifId,
            gameTypeId,
            ...(typeSearch === "ALL" ? { result: { $in: ["WIN", "LOSS", "PENDING"] } } : { result: typeSearch }),
        });
        return { data: userGame, count: count === 0 ? 1 : count };
    }

    async findUserGameByGameIds(ids: string[]): Promise<IUserGame[]> {
        return await this.userGame.find({
            gameId: { $in: ids },
        });
    }

    async findUsersGameByPeriode(startFrom: Date, finishedAt: Date, result: "WIN" | "LOSS"): Promise<IUserGame[]> {
        return await this.userGame.find({
            createdAt: { $gt: startFrom, $lt: finishedAt },
            result,
        });
    }
}

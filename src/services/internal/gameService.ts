import { Model } from "mongoose";
import { GameDto } from "../../dto/gameDto";
import gameModels, { IGame } from "../../models/gameModels";
import { v4 as uuid } from "uuid";

export class GameService {
    private game: Model<IGame>;

    constructor() {
        this.game = gameModels;
    }

    async create(data: GameDto): Promise<IGame> {
        const clone = JSON.parse(JSON.stringify(data));
        clone._id = uuid();

        return await this.game.create(clone);
    }

    async createBulk(datas: GameDto[]): Promise<IGame[]> {
        const clone = JSON.parse(JSON.stringify(datas));
        for (const data of clone) {
            data._id = uuid();
        }

        return await this.game.insertMany(clone);
    }

    async updateBulk(datas: GameDto[]): Promise<void> {
        const bulkWriteOperations = [];
        datas.forEach((data) => {
            bulkWriteOperations.push({
                updateOne: {
                    filter: { id: data.id },
                    update: data,
                },
            });
        });

        await this.game.bulkWrite(bulkWriteOperations);
    }

    async updateOne(data: GameDto): Promise<GameDto> {
        return await this.game.findByIdAndUpdate(
            {
                _id: data.id,
            },
            data,

            { new: true },
        );
    }

    async findGameById(id: string): Promise<IGame> {
        return await this.game.findById(id);
    }

    async findLatestGameByTypeId(gameTypeId: string): Promise<IGame> {
        return await this.game
            .findOne({
                gameTypeId,
            })
            .sort({ finishAt: -1 });
    }

    async findLatestPeriodeByGameTypeIds(gameTypeIds: string[]): Promise<IGame[]> {
        return await this.game.aggregate([
            { $sort: { gameTypeId: 1, finishAt: -1 } },
            { $group: { _id: "$gameTypeId", latestPeriode: { $first: "$periode" } } },
        ]);
    }

    async findGamesById(gameIds: string[]): Promise<IGame[]> {
        return await this.game.find({
            _id: { $in: gameIds },
        });
    }

    async findAll(page?: number, limit?: number, gameTypeId?: string): Promise<{ games: IGame[]; count: number }> {
        const skipIndex = (page - 1) * limit;
        const games = await this.game
            .find({
                gameTypeId,
                "result.color": { $ne: "" },
                "result.shape": { $ne: "" },
                "result.number": { $ne: "" },
            })
            .skip(skipIndex)
            .limit(limit)
            .sort({ updatedAt: "desc" })
            .exec();

        const count = await this.game.countDocuments({
            gameTypeId,
            "result.color": { $ne: "" },
            "result.shape": { $ne: "" },
            "result.number": { $ne: "" },
        });
        return { games, count: count === 0 ? 1 : count };
    }
}

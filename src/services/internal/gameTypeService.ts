import { Model } from "mongoose";
import gameTypeModels, { IGameType } from "../../models/gameTypeModels";
import { v4 as uuid } from 'uuid';
import { GameTypeDto } from "../../dto/gameTypeDto";

export class GameTypeService {
    private gameType: Model<IGameType>

    constructor() {
        this.gameType = gameTypeModels
    }

    async create(data: GameTypeDto): Promise<IGameType> {
        const clone = JSON.parse(JSON.stringify(data))
        clone._id = uuid()

        return await this.gameType.create(clone)
    }

    async findAll(): Promise<IGameType[]> {
        return await this.gameType.find()
    }

    async findGameTypeById(id: string): Promise<IGameType> {
        return this.gameType.findById(id)
    }

    async findGameTypeByCd(cd: number): Promise<IGameType> {
        return this.gameType.findOne({
            cd
        })
    }

}
import { Request, Response } from "express";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { GameTypeService } from "../../../services/internal/gameTypeService";

const path = "/v1/game/type";
const method = "GET";
const auth = "guess";

const main = async (req: Request, res: Response) => {
    const redisService = new RedisService();
    const keyRedis = "gameTypes";
    const cached = await redisService.getJson(keyRedis);
    if (cached) {
        return res.status(200).send(cached);
    }

    const gameTypeService = new GameTypeService();
    const gameTypes = await gameTypeService.findAll();

    await redisService.setJson(keyRedis, gameTypes);
    return res.status(200).send(gameTypes);
};

const getGameType: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getGameType;

import { Request, Response } from "express";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { GameService } from "../../../services/internal/gameService";
import { GameTypeService } from "../../../services/internal/gameTypeService";

const path = "/v1/latest-game";
const method = "GET";
const auth = "guess";

const queryValidation: Validation[] = [
    {
        name: "gameTypeId",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const query: {
        gameTypeId: string;
    } = validate.process(queryValidation, "query");

    const redisService = new RedisService();
    const keyRedis = `game/${query.gameTypeId}`;
    const cached = await redisService.getJson(keyRedis);
    if (cached) {
        return res.status(200).send(cached);
    }

    const gameService = new GameService();
    const gameTypes = await gameService.findLatestGameByTypeId(query.gameTypeId);

    return res.status(200).send(gameTypes);
};

const getLatestGame: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getLatestGame;

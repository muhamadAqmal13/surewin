import { Request, Response } from "express";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { GameService } from "../../../services/internal/gameService";
import { GameTypeService } from "../../../services/internal/gameTypeService";

const path = "/v1/game";
const method = "GET";
const auth = "guess";

const queryValidation: Validation[] = [
    {
        name: "page",
        required: false,
        type: "string",
        default: "1",
    },
    {
        name: "size",
        required: false,
        type: "string",
        default: "10",
    },
    {
        name: "gameTypeId",
        required: false,
        type: "string",
        default: "all",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const query: {
        page: string;
        size: string;
        gameTypeId: string;
    } = validate.process(queryValidation, "query");

    const gameService = new GameService();
    const gameTypes = await gameService.findAll(parseInt(query.page), parseInt(query.size), query.gameTypeId);

    const cloneGame = gameTypes.games.map((game) => {
        const newObj = { ...game.toObject() };
        delete newObj.winner;
        delete newObj.looser;

        return newObj;
    });
    res.status(200).send({
        page: query.page,
        totalPage: Math.ceil(gameTypes.count / parseInt(query.size)),
        size: query.size,
        gameTypeId: query.gameTypeId,
        data: cloneGame,
        totalData: gameTypes.count,
    });
};

const getAllGames: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getAllGames;

import { Request, Response } from "express";
import { GameDto } from "../../../dto/gameDto";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { CustomerService } from "../../../services/internal/customerService";
import { GameService } from "../../../services/internal/gameService";
import { GameTypeService } from "../../../services/internal/gameTypeService";
import { UserGameService } from "../../../services/internal/userGameService";

const path = "/v1/result-game-user/:id";
const method = "GET";
const auth = "user";

const paramsValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
];

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
        name: "type",
        required: false,
        type: "string",
        default: "all",
    },
    {
        name: "gameTypeId",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const params: {
        id: string;
    } = validate.process(paramsValidation, "params");
    const query: {
        page: string;
        size: string;
        type: string;
        gameTypeId: string;
    } = validate.process(queryValidation, "query");

    const customerService = new CustomerService();
    const customer = await customerService.findById(params.id);
    if (!customer) {
        throw new BusinessError("Customer not found", ErrorType.NotFound);
    }

    const userGameService = new UserGameService();
    const userGames = await userGameService.findAllUserGameByCifId(
        params.id,
        parseInt(query.page),
        parseInt(query.size),
        query.type,
        query.gameTypeId,
    );

    const collectGameId = userGames.data.map((data) => data.gameId);
    const gameService = new GameService();
    const games = await gameService.findGamesById(collectGameId);

    // const filterByGameTypeId = games.filter((game) => game.gameTypeId === query.gameTypeId);
    // const collectGameIdFiltered = filterByGameTypeId.map((game) => game.id);
    // const filterDataUser = userGames.data.filter((userGame) => collectGameIdFiltered.includes(userGame.gameId));

    const newData = userGames.data.map((data) => {
        const game = games.find((gm) => gm.id === data.gameId);

        return {
            ...data.toObject(),
            periode: game.periode,
        };
    });

    res.status(200).send({
        page: query.page,
        totalPage: Math.ceil(userGames.count / parseInt(query.size)),
        size: query.size,
        type: query.type,
        data: newData,
        totalData: userGames.count,
    });
    return;
};

const getUserGameHistory: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getUserGameHistory;

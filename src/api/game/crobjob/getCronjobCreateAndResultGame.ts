import Big from "big.js";
import { Request, Response } from "express";
import { FundsDto } from "../../../dto/fundsDto";
import { GameDto } from "../../../dto/gameDto";
import { GameTypeDto } from "../../../dto/gameTypeDto";
import { ProductDto } from "../../../dto/productDto";
import { OrderStatuses } from "../../../enum";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { FundService } from "../../../services/internal/fundsService";
import { GameService } from "../../../services/internal/gameService";
import { OrderSerivce } from "../../../services/internal/orderService";
import { UserGameService } from "../../../services/internal/userGameService";
import { v4 as uuid } from "uuid";
import { UserGameDto } from "../../../dto/userGameDto";

const path = "/v1/cronjob/game";
const method = "GET";
const auth = "cronjob";

const queryValidation: Validation[] = [
    {
        name: "cd",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const query: {
        cd: string;
    } = validate.process(queryValidation, "query");

    const gameService = new GameService();
    const redisService = new RedisService();
    const userGameService = new UserGameService();
    const orderService = new OrderSerivce();
    const fundService = new FundService();

    const gameTypes = await redisService.getJson<GameTypeDto[]>("gameTypes");
    const gameType = gameTypes.find((type) => type.cd === parseInt(query.cd));

    const redisGameKey = `game/${gameType.id}`;
    const cached: any = await redisService.getJson(redisGameKey);
    let lastGame: any;
    if (cached) {
        lastGame = cached;
    } else {
        lastGame = await gameService.findLatestGameByTypeId(gameType.id);
    }
    const now = new Date();
    const currentDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        0,
        0,
    );

    if (!lastGame) {
        const newGame: GameDto = {
            periode: "1",
            gameTypeId: gameType.id,
            result: {
                color: "",
                shape: "",
                number: "",
            },
            winner: 0,
            looser: 0,
            startAt: new Date(),
            finishAt: new Date(currentDate.setMinutes(currentDate.getMinutes() + gameType.loop)),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const saveNewGame = await gameService.create(newGame);
        await redisService.setJson(redisGameKey, { ...saveNewGame.toObject(), gameType });

        return res.status(200).send({ ...saveNewGame.toObject(), gameType });
    }

    if (!cached) {
        lastGame = { ...lastGame, gameType };
    }

    const finishGame = new Date(lastGame.finishAt);
    const dateNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);
    const periode = parseInt(lastGame.periode) + 1;
    const newGame = {
        periode: periode.toString(),
        gameTypeId: lastGame.gameTypeId,
        result: {
            color: "",
            shape: "",
            number: "",
        },
        winner: 0,
        looser: 0,
        startAt: new Date(),
        finishAt: new Date(dateNow.setMinutes(dateNow.getMinutes() + lastGame.gameType.loop)),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const saveNewGame = await gameService.create(newGame);
    await redisService.setJson(redisGameKey, { ...saveNewGame.toObject(), gameType });

    const keyRedisProducts = `products/${gameType.id}`;
    const products: ProductDto[] = await redisService.getJson(keyRedisProducts);

    let groupedByCategory = {};
    const userGames: any = await userGameService.findUsersByGameId(lastGame.id);
    for (const product of products) {
        if (!groupedByCategory[product.category]) {
            groupedByCategory[product.category] = {};
        }

        if (!groupedByCategory[product.category][product.id]) {
            groupedByCategory[product.category][product.id] = {
                users: 0,
                totalSpents: new Big("0"),
            };
        }

        if (!groupedByCategory["totalUsers"]) {
            groupedByCategory["totalUsers"] = 0;
        }
    }

    for (const user of userGames) {
        const product = products.find((prod) => prod.id === user.productId);
        groupedByCategory["totalUsers"]++;
        groupedByCategory[product.category][product.id].users++;
        groupedByCategory[product.category][product.id].totalSpents = groupedByCategory[product.category][
            product.id
        ].totalSpents.add(new Big(user.spent));
    }

    let filteredWinner = {
        result: {
            totalWinner: 0,
            totalLooser: 0,
            totalUsers: 0,
        },
    };
    let winnerProductId = [];
    let totalWinner = 0;
    let collectProductIdNumberNotChoosed = products.filter((prod) => prod.category === "number").map((prod) => prod.id);
    for (const category in groupedByCategory) {
        if (category !== "totalUsers") {
            if (category === "number") {
                let totalUser;
                for (const productId in groupedByCategory[category]) {
                    const { totalSpents, users } = groupedByCategory[category][productId];
                    if (users > 0) {
                        collectProductIdNumberNotChoosed = collectProductIdNumberNotChoosed.filter(
                            (prodId) => prodId !== productId,
                        );
                    }
                }

                if (collectProductIdNumberNotChoosed.length > 0) {
                    const randomIndex = Math.floor(Math.random() * collectProductIdNumberNotChoosed.length);

                    if (!filteredWinner[category]) {
                        filteredWinner[category] = {
                            productId: collectProductIdNumberNotChoosed[randomIndex],
                            totalSpents: new Big("0"),
                            totalWinnerByCategory: 0,
                        };
                    } else {
                        filteredWinner[category] = {
                            productId: collectProductIdNumberNotChoosed[randomIndex],
                            totalSpents: new Big("0"),
                            totalWinnerByCategory: 0,
                        };
                    }
                } else {
                    for (const productId in groupedByCategory[category]) {
                        const { totalSpents, users } = groupedByCategory[category][productId];
                        if (!filteredWinner[category]) {
                            filteredWinner[category] = {
                                productId: productId,
                                totalSpents: totalSpents,
                                totalWinnerByCategory: users,
                            };

                            continue;
                        }

                        if (totalSpents.lt(filteredWinner[category].totalSpents)) {
                            filteredWinner[category].totalSpents = totalSpents;
                            filteredWinner[category].productId = productId;
                        }
                    }
                }
            } else {
                let totalUser = 0;
                for (const productId in groupedByCategory[category]) {
                    const { totalSpents, users } = groupedByCategory[category][productId];
                    totalUser = totalUser + users;
                    if (!filteredWinner[category]) {
                        filteredWinner[category] = {
                            productId: productId,
                            totalSpents: totalSpents,
                            totalWinnerByCategory: users,
                        };

                        continue;
                    }

                    if (totalUser > 0) {
                        if (totalSpents.lt(filteredWinner[category].totalSpents)) {
                            filteredWinner[category].totalSpents = totalSpents;
                            filteredWinner[category].productId = productId;
                        }
                    } else {
                        const getProducts = products.filter((product) => {
                            return product.category === category;
                        });

                        const randomIndex = Math.floor(Math.random() * getProducts.length);

                        filteredWinner[category] = {
                            productId: getProducts[randomIndex].id,
                            totalSpents: new Big("0"),
                            totalWinnerByCategory: 0,
                        };
                    }
                }

                totalWinner += filteredWinner[category].totalWinnerByCategory;
                winnerProductId.push(filteredWinner[category].productId);
            }
        }
    }

    filteredWinner.result.totalWinner = totalWinner;
    filteredWinner.result.totalUsers = groupedByCategory["totalUsers"];
    filteredWinner.result.totalLooser = groupedByCategory["totalUsers"] - totalWinner;

    const colorWinner = products.find((prod) => prod.id === filteredWinner["color"].productId).cd;
    const numberWinner = products.find((prod) => prod.id === filteredWinner["number"].productId).cd;
    const shapeWinner = products.find((prod) => prod.id === filteredWinner["shape"].productId).cd;
    const update = await gameService.updateOne({
        id: lastGame.id,
        periode: lastGame.periode,
        gameTypeId: lastGame.gameTypeId,
        result: {
            color: colorWinner,
            number: numberWinner,
            shape: shapeWinner,
        },
        winner: filteredWinner.result.totalWinner,
        looser: filteredWinner.result.totalLooser,
        updatedAt: new Date(),
        startAt: new Date(lastGame.startAt),
        finishAt: new Date(lastGame.finishAt),
    });

    const createOrderBulk: any[] = [];
    const winnerUserIdCollection = [];
    userGames.map((userGame) => {
        if (winnerProductId.includes(userGame.productId) && !winnerUserIdCollection.includes(userGame.cifId)) {
            winnerUserIdCollection.push(userGame.cifId);
        }

        const createOrder: any = {
            _id: uuid(),
            cifId: userGame.cifId,
            description: winnerProductId.includes(userGame.productId)
                ? `Win Periode ${lastGame.periode}`
                : `Loss Periode ${lastGame.periode}`,
            priceAmount: userGame.spent,
            priceCurrency: "trx",
            status: OrderStatuses.FINISHED,
            type: winnerProductId.includes(userGame.productId) ? "Win" : "Loss",
            productId: userGame.productId,
            gameId: lastGame.id,
            amount: userGame.spent,
            payAmount: userGame.spent,
            payCurrency: "trx",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        createOrderBulk.push(createOrder);

        return userGame;
    });

    const updateUserGame = await userGameService.updateWinner(winnerProductId, lastGame.id);
    const createBulkOrder = await orderService.createBulk(createOrderBulk);

    const collectCifId = userGames.map((userGame) => userGame.cifId);
    const userFunds = await fundService.findFundByCifIds(collectCifId);
    const updatedUserFund: FundsDto[] = await fundService.updateWinner(userFunds, updateUserGame);
    res.sendStatus(200);
};

const getCronjobCreateAndResultGame: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getCronjobCreateAndResultGame;

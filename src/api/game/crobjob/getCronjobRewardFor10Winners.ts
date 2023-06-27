import { apiRouter } from "../../../interfaces";
import { Request, Response } from "express";
import RedisService from "../../../services/external/externalRedisService";
import { FundService } from "../../../services/internal/fundsService";
import { OrderSerivce } from "../../../services/internal/orderService";
import { OrderDto } from "../../../dto/orderDto";
import { OrderStatuses, OrderType } from "../../../enum";

const path = "/v1/cronjob/reward-10winners";
const method = "GET";
const auth = "guess";

const main = async (req: Request, res: Response) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startAt = new Date(now);
    const finishAt = new Date(now).setDate(now.getDate() + 7);

    const redisKey = `top-winner`;
    const redisService = new RedisService();
    const cached: Array<{
        no: number;
        cifId: string;
        username: string;
        totalWinner: number;
        totalAmount: string;
    }> = await redisService.getJson(redisKey);
    if (cached && cached.length > 0) {
        const sortWinner = cached.sort((a, b) => a.no - b.no);
        let orderBulk = [];
        for (const winner of sortWinner) {
            let prize;
            switch (winner.no) {
                case 1:
                    prize = 100;
                    break;
                case 2:
                    prize = 50;
                    break;
                case 3:
                    prize = 30;
                    break;
                case 4:
                    prize = 20;
                    break;
                case 5:
                    prize = 15;
                    break;

                default:
                    prize = 10;
                    break;
            }

            let createOrder = {
                cifId: winner.cifId,
                description: `Winner top 10 (Position ${winner.no})`,
                priceAmount: prize.toString(),
                priceCurrency: "TRX",
                status: OrderStatuses.FINISHED,
                type: OrderType.BONUS,
                payAmount: prize.toString(),
                payCurrency: "TRX",
                createdAt: new Date(),
                updatedAt: new Date(),
                amount: prize.toString(),
            };

            orderBulk.push(createOrder);
        }
        const collectionCifId = cached.map((user) => user.cifId);
        const orderService = new OrderSerivce();
        const createOrders = await orderService.createBulk(orderBulk);
        const fundService = new FundService();
        const funds = await fundService.findFundByCifIds(collectionCifId);
        const updateFund = await fundService.updateWinnerTop10(funds, createOrders);
    }

    res.sendStatus(200);
};

const getCronjobRewardFor10Winners: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getCronjobRewardFor10Winners;

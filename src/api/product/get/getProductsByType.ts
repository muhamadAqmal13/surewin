import { Request, Response } from "express";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { ProductService } from "../../../services/internal/productService";

const path = "/v1/product/:gameTypeId";
const method = "GET";
const auth = "guess";

const paramsValidation: Validation[] = [
    {
        name: "gameTypeId",
        required: true,
        type: "string",
    },
];
const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const params: {
        gameTypeId: string;
    } = validate.process(paramsValidation, "params");

    const redisService = new RedisService();
    const keyRedis = `products/${params.gameTypeId}`;
    const cached = await redisService.getJson(keyRedis);
    if (cached) {
        return res.status(200).send(cached);
    }

    const productService = new ProductService();
    const products = await productService.findProductsByGameTypeId(params.gameTypeId);

    await redisService.setJson(keyRedis, products);
    return res.status(200).send(products);
};

const getProductsByType: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getProductsByType;

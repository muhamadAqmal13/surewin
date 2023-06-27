import { Request, Response } from "express";
import { apiRouter } from "../../../interfaces";
import RedisService from "../../../services/external/externalRedisService";
import { ProductService } from "../../../services/internal/productService";

const path = "/v1/product";
const method = "GET";
const auth = "guess";

const main = async (req: Request, res: Response) => {
    const redisService = new RedisService();
    const keyRedis = "products";
    const cached = await redisService.getJson(keyRedis);
    if (cached) {
        return res.status(200).send(cached);
    }

    const productService = new ProductService();
    const products = await productService.findAllProducts();

    await redisService.setJson(keyRedis, products);
    res.status(200).send(products);

    const groupedByType = {};
    for (const product of products) {
        if (!groupedByType[product.gameTypeId]) {
            groupedByType[product.gameTypeId] = [];
        }

        groupedByType[product.gameTypeId].push(product);
    }

    for (const gameTypeId in groupedByType) {
        const redisKey = `products/${gameTypeId}`;
        await redisService.setJson(redisKey, groupedByType[gameTypeId]);
    }
};

const getAllProducts: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getAllProducts;

import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { GameTypeService } from "../../../services/internal/gameTypeService";
import { ProductService } from "../../../services/internal/productService";

const path = "/v1/product";
const method = "POST";
const auth = "guess";
const bodyValidation: Validation[] = [
    {
        name: "gameTypeId",
        required: true,
        type: "string",
    },
    {
        name: "name",
        required: true,
        type: "string",
    },
    {
        name: "currency",
        required: true,
        type: "string",
    },
    {
        name: "description",
        required: true,
        type: "string",
    },
    {
        name: "category",
        required: true,
        type: "string",
    },
    {
        name: "isActive",
        required: true,
        type: "boolean",
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        gameTypeId: string;
        name: string;
        currency: string;
        description: string;
        category: string;
        isActive: boolean;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const gameTypeService = new GameTypeService();
    const gameType = await gameTypeService.findGameTypeById(requestBody.gameTypeId);
    if (!gameType) {
        throw new BusinessError("Game type id not found", ErrorType.NotFound);
    }

    const productService = new ProductService();
    const newProduct = await productService.create({
        name: requestBody.name,
        gameTypeId: gameType.id,
        cd: requestBody.name.toLowerCase(),
        currency: requestBody.currency,
        description: requestBody.description,
        category: requestBody.category,
    });

    res.status(200).send(newProduct);
};

const postProduct: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postProduct;

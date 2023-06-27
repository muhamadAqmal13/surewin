import { request, Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { GameTypeService } from "../../../services/internal/gameTypeService";

const path = "/v1/game/type";
const method = "POST";
const auth = "admin";

const bodyValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "loop",
        type: "number",
        required: true,
    },
];
const main = async (req: Request, res: Response) => {
    const requestBody: {
        name: string;
        loop: number;
    } = new Validator(req, res).process(bodyValidation, "body");
    if (!requestBody) {
        return;
    }
    const gameTypeService = new GameTypeService();
    const checkLoop = await gameTypeService.findGameTypeByCd(requestBody.loop);
    if (checkLoop) {
        throw new BusinessError(`Game type with loop ${requestBody.loop} already exist`, ErrorType.Validation);
    }
    const newGametype = await gameTypeService.create({
        name: requestBody.name,
        loop: requestBody.loop,
        cd: requestBody.loop,
    });

    return res.status(200).send(newGametype);
};

const postGameType: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default postGameType;

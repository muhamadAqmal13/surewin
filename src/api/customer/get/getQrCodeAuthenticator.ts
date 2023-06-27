import { Request, Response } from "express";
import { ErrorType } from "../../../enum";
import { BusinessError } from "../../../helper/handleError";
import { Validation, Validator } from "../../../helper/validator";
import { apiRouter } from "../../../interfaces";
import { CustomerService } from "../../../services/internal/customerService";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";
import { Config } from "../../../config";
import fs from "fs";
import util from "util";
import RedisService from "../../../services/external/externalRedisService";

const path = "/v1/customer/authenticator/:id";
const method = "GET";
const auth = "user";

const paramsValidation: Validation[] = [
    {
        name: "id",
        required: true,
        type: "string",
    },
];

const main = async (req: Request, res: Response) => {
    const validate = new Validator(req, res);
    const params: {
        id: string;
    } = validate.process(paramsValidation, "params");

    const customerService = new CustomerService();
    let customer = await customerService.findById(params.id);

    if (!customer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }
    const redisService = new RedisService();
    const redisKey = `qrcodeauth/${customer.id}`;
    const cached = await redisService.get(redisKey);
    const config = new Config();
    if (cached) {
        res.status(200).send({
            link: `https://${config.bucketName}.${config.bucketEndpoint}/${cached}`,
        });
        return;
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    await customerService.update({
        id: customer.id,
        email: customer.email,
        username: customer.username,
        address: customer.address,
        updatedAt: new Date(),
        authKey: secret.base32,
    });
    const data = `otpauth://totp/SUREWIN:${customer.email}?secret=${secret.base32}&issuer=SUREWIN`;
    const s3 = new AWS.S3({
        endpoint: "sgp1.digitaloceanspaces.com",
        accessKeyId: config.bucketAccessKey,
        secretAccessKey: config.bucketSecretKey,
        region: config.bucketRegion,
    });

    const filename = `${uuid()}.png`;
    await QRCode.toFile(filename, data);

    const fileData = fs.readFileSync(filename);

    const upS3 = util.promisify(s3.upload).bind(s3);
    const s3Uploaded = await upS3({
        Bucket: config.bucketName,
        Key: `QR_Code/${filename}`,
        Body: fileData,
        ACL: "public-read",
    });

    await redisService.set(redisKey, s3Uploaded.Key);
    fs.unlinkSync(filename);

    res.status(200).send({
        link: s3Uploaded.Location,
    });
};

const getQrCodeAuthenticator: apiRouter = {
    path,
    method,
    main,
    auth,
};

export default getQrCodeAuthenticator;

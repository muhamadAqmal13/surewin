import { Config } from "../../config";
import {
    CreateInvoiceExternal,
    CreatePaymentExternalDto,
    PostWithdrawalExternal,
    ResponseCreateInvoiceExternal,
    ResponseCreatePaymentDto,
    ResponseEstimatedPrice,
    ResponsePostWithdrawalExternal,
} from "../../dto/externalNowPaymentsDto";
import { ErrorType } from "../../enum";
import { BusinessError } from "../../helper/handleError";
import RedisService from "./externalRedisService";
import speakeasy from "speakeasy";

export class ExternalNowPaymentsService {
    private email: string;
    private password: string;
    private baseUrl: string;
    private apiKey: string;
    private secretKeySpeakEasy: string;

    constructor() {
        const config = new Config();
        this.email = config.nowPaymentsEmail;
        this.password = config.nowPaymentsPassword;
        this.baseUrl = config.nowPaymentsBaseUrl;
        this.apiKey = config.nowPaymentsApiKey;
        this.secretKeySpeakEasy = config.secretKeySpeakEasy;
    }

    public async createInvoice(data: CreateInvoiceExternal): Promise<ResponseCreateInvoiceExternal> {
        return await this.request("POST", "v1/invoice", data);
    }

    public async createPayment(data: CreatePaymentExternalDto): Promise<ResponseCreatePaymentDto> {
        return await this.request("POST", "v1/invoice-payment", data);
    }

    public async getEstimatedPrice(data: {
        amount: string;
        from: string;
        to: string;
    }): Promise<ResponseEstimatedPrice> {
        return await this.request(
            "GET",
            `v1/estimate?amount=${data.amount}&currency_from=${data.from}&currency_to=${data.to}`,
        );
    }

    public async verifyWithdrawal(withdrawalId: string): Promise<string> {
        const token = speakeasy.totp({
            secret: this.secretKeySpeakEasy,
            encoding: "base32",
        });

        return await this.request(
            "POST",
            `v1/payout/${withdrawalId}/verify`,
            {
                verification_code: `${token}`,
            },
            true,
        );
    }

    public async postWithdrawal(data: PostWithdrawalExternal): Promise<ResponsePostWithdrawalExternal> {
        return await this.request("POST", `v1/payout`, data);
    }

    private async login(email: string, password: string): Promise<any> {
        console.log("TRYING TO LOGIN");
        const response = await fetch(`${this.baseUrl}/v1/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });
        try {
            const token = await response.json();
            await new RedisService().setJson("nowPaymentsToken", token, 5 * 60);
            console.log("SUCCESSED LOGIN TO NOYPAYMENTS");
            return token;
        } catch (error) {
            throw new BusinessError(
                error.message || "Something went wrong when login to Nowpayments",
                error.code || ErrorType.Internal,
            );
        }
    }

    private async request(
        method: "POST" | "GET" | "PATCH" | "DELETE",
        path: string,
        data?: any,
        isVerifyWithdrawal?: boolean,
    ): Promise<any> {
        const getToken = await new RedisService().getJson("nowPaymentsToken");
        let token: any;
        if (getToken) {
            token = getToken;
        } else {
            token = await this.login(this.email, this.password);
        }

        const config: RequestInit = {
            method,
            headers: {
                Authorization: `Bearer ${token.token}`,
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
            },
        };

        if (!config["body"] && data) {
            console.log("Request Body to Now Payments : " + JSON.stringify(data));
            config["body"] = JSON.stringify(data);
        }

        try {
            const response: any = await fetch(`${this.baseUrl}/${path}`, config);
            if (!response.ok) {
                const res = await response.json();
                throw new BusinessError(
                    res.message || "Something wrong when request to nowPayments API " + path,
                    response.code || ErrorType.Internal,
                );
            }
            let res;
            if (isVerifyWithdrawal) {
                res = await response.text();
                console.log("Response Body from Now Payments : " + res);
            } else {
                res = await response.json();
                console.log("Response Body from Now Payments : " + JSON.stringify(res));
            }
            return res;
        } catch (error) {
            console.error(error);
            console.error(`An error occurred: ${error.message}`);
        }
    }
}

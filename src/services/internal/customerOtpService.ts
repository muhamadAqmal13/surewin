import { Model } from "mongoose";
import customerOtpModels, { IOtp } from "../../models/customerOtpModels";
import randomatic from "randomatic";
import { v4 as uuid } from "uuid";

export class CustomerOtpService {
    private otp: Model<IOtp>;

    constructor() {
        this.otp = customerOtpModels;
    }

    async createOtp(cifId: string, type: "login" | "register" | "reset_password"): Promise<IOtp> {
        const code = randomatic("0", 6);
        const expiredAt = new Date(Date.now() + 60000 * 5);
        return await this.otp.create({
            id: uuid(),
            cifId,
            type,
            code,
            createdAt: new Date(),
            expiredAt,
        });
    }

    async updateOtp(cifId: string, type: "login" | "register" | "reset_password"): Promise<IOtp> {
        const code = randomatic("0", 6);
        const expiredAt = new Date(Date.now() + 60000 * 5);

        return await this.otp.findOneAndUpdate(
            {
                cifId,
                type,
            },
            {
                code,
                createdAt: new Date(),
                expiredAt,
            },
            { new: true },
        );
    }

    async findOtpByCodeAndType(code: string, type: "login" | "register" | "reset_password"): Promise<IOtp | null> {
        return await this.otp.findOne({ code, type });
    }
    async findOtpByCifIdAndType(cifId: string, type: "login" | "register" | "reset_password"): Promise<IOtp | null> {
        return await this.otp.findOne({ cifId, type });
    }
}

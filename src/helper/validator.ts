import { Request, Response } from "express";
import validator from "validator";
import { ErrorType } from "../enum";
import { BusinessError } from "./handleError";

export interface Validation {
    name: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    type: "string" | "number" | "boolean" | "array" | "object" | "any";
    isMobileNo?: boolean;
    isEmail?: boolean;
    default?: any;
    minNumber?: number;
    maxNumber?: number;
    items?: Validation;
    properties?: Array<Validation>;
}

export class Validator {
    protected request: Request;
    protected response: Response;
    constructor(req: Request, res: Response) {
        this.request = req;
        this.response = res;
    }

    public process(schema: Validation[], type: "query" | "body" | "params"): any {
        const result = this.checking(schema, type);
        if (!result.success) {
            throw new BusinessError(result.message, ErrorType.Validation);
        } else {
            return {
                ...this.request[type],
            };
        }
    }

    protected checking(schemas: Validation[], type: "query" | "body" | "params") {
        const req: any = this.request[type];
        const result: {
            success: boolean;
            message: string;
        } = { success: false, message: "" };

        for (const field in req) {
            if (!schemas.find((schema) => schema.name === field)) {
                result.message = `Field ${field} is not supported`;
                return result;
            }
        }

        for (const schema of schemas) {
            let value = req[schema.name];

            if (schema.required && !value) {
                result.message = `Field ${schema.name} is required`;
                return result;
            } else if (!schema.required && !value) {
                if (schema.default) {
                    req[schema.name] = schema.default;
                }
                continue;
            } else {
                switch (schema.type) {
                    case "string":
                        value = value.trim();
                        if (typeof value !== "string") {
                            result.message = `Field ${schema.name} must be a string`;
                            return result;
                        } else if (schema.isEmail) {
                            const email = validator.isEmail(value);
                            if (!email) {
                                result.message = `Field ${schema.name} must be a valid email`;
                                return result;
                            }
                        } else if (schema.minLength && value.length < schema.minLength) {
                            result.message = `Field ${schema.name} must be at least ${schema.minLength} characters`;
                            return result;
                        } else if (schema.maxLength && value.length > schema.maxLength) {
                            result.message = `Field ${schema.name} must be at most ${schema.maxLength} characters`;
                            return result;
                        }
                        break;

                    case "number":
                        if (typeof value !== "number") {
                            result.message = `Field ${schema.name} must be number`;
                            return result;
                        }

                        if (schema.isMobileNo) {
                            let mobileNo = value.toString();
                            if (!mobileNo.startsWith("0")) {
                                mobileNo = "0" + mobileNo;
                            }
                            const check = validator.isMobilePhone(mobileNo, "id-ID");
                            if (!check) {
                                result.message = `Mobile number not valid ${value}`;
                                return result;
                            }
                        }

                        if (!schema.minNumber && value < schema.minNumber) {
                            result.message = `Field ${schema.name} must be with minimum ${schema.minNumber}`;
                            return result;
                        }

                        if (!schema.minNumber && value > schema.maxNumber) {
                            result.message = `Field ${schema.name} must be with maximum ${schema.maxNumber}`;
                            return result;
                        }
                        break;

                    case "boolean":
                        if (typeof value !== "boolean") {
                            result.message = `Field ${schema.name} must be boolean`;
                            return result;
                        }
                        break;

                    case "array":
                        if (!Array.isArray(value)) {
                            result.message = `Field ${schema.name} should be an array`;
                            return result;
                        }
                        break;

                    case "object":
                        if (typeof value !== "object") {
                            result.message = `Field ${schema.name} should be an object`;
                            return result;
                        }
                        break;

                    default:
                        break;
                }
            }
        }

        result.success = true;
        result.message = "No have any error validation";
        return result;
    }
}

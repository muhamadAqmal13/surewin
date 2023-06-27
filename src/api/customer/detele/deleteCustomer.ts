import { Request, Response } from 'express';
import {  ErrorType } from '../../../enum';
import { Validation, Validator } from '../../../helper/validator';
import { apiRouter } from '../../../interfaces';
import { CustomerService } from '../../../services/internal/customerService';
import { BusinessError } from '../../../helper/handleError';

const path = "/v1/customer/:id"
const method = "DELETE"
const auth = "user"
const paramsValidation: Validation[]= [
    {
        name: "id",
        type: "string",
        required: true
    }
]
const main = async(req: Request, res: Response) => {
    const params: {
        id: string;
    } = new Validator(req, res).process(paramsValidation, "params")
    if(!params) {
        return;
    }
    const customerService = new CustomerService()

    const existCustomer = await customerService.findById(params.id)
    if(!existCustomer) {
        throw new BusinessError("Invalid User", ErrorType.NotFound);
    }

    const deleteCustomer = await customerService.delete(params.id)

    return res.status(200).send(deleteCustomer)
}

const deleteCustomer: apiRouter = {
    path,
    method,
    main,
    auth
}

export default deleteCustomer
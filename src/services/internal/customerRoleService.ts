import { Model } from "mongoose";
import customerModels, { ICustomerRole } from "../../models/customerRoleModels";
import { CustomerRoleDto } from "../../dto/customerRoleDto";
import { v4 as uuid } from 'uuid';

export class CustomerRoleService{
    private role: Model<ICustomerRole>;

    constructor() {
        this.role = customerModels
    }

    async create(data: CustomerRoleDto): Promise<ICustomerRole> {
        const clone = JSON.parse(JSON.stringify(data))
        clone._id = uuid()

        return await this.role.create(clone)
    }

    async createBulk(datas: CustomerRoleDto[]): Promise<ICustomerRole[]> {
        const clone = JSON.parse(JSON.stringify(datas))
        for(const data of clone) {
            data._id = data.id
            delete data.id
        }
        return await this.role.insertMany(clone)
    }

    async update(data: CustomerRoleDto): Promise<ICustomerRole> {
        return await this.role.findByIdAndUpdate(data.id, data)
    }

    async findById(id: string): Promise<ICustomerRole> {
        return await this.role.findOne({
            id
        })
    }

    async findByName(name: string): Promise<ICustomerRole> {
        return await this.role.findOne({
            name,
        })
    }

    async findAll(): Promise<ICustomerRole[]> {
        return await this.role.find({
        })
    }
}
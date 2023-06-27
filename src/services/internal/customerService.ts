import { Model } from "mongoose";
import customerModels, { ICustomer } from "../../models/customerModels";
import bcrypt from "bcrypt";
import { CustomerDto } from "../../dto/customerDto";
import { v4 as uuid } from "uuid";

export class CustomerService {
    private customer: Model<ICustomer>;

    constructor() {
        this.customer = customerModels;
    }

    async create(data: CustomerDto): Promise<ICustomer> {
        const clone = JSON.parse(JSON.stringify(data));
        clone._id = uuid();

        return await this.customer.create(clone);
    }

    async update(data: CustomerDto): Promise<ICustomer> {
        return await this.customer.findOneAndUpdate(
            {
                _id: data.id,
                deleteFlag: false,
            },
            data,
            { new: true },
        );
    }

    async updatePassword(id: string, password: string): Promise<ICustomer> {
        return await this.customer.findOneAndUpdate(
            {
                _id: id,
                deleteFlag: false,
            },
            { password },
            { new: true },
        );
    }

    async delete(id: string): Promise<ICustomer> {
        return await this.customer.findByIdAndUpdate(
            id,
            {
                deleteFlag: true,
                updatedDate: new Date(),
            },
            { new: true },
        );
    }

    async findById(id: string, withPassword?: boolean, withAuthKey?: boolean): Promise<ICustomer> {
        return await this.customer
            .findOne({
                _id: id,
                deleteFlag: false,
            })
            .select(`${withPassword ? "+" : "-"}password ${withAuthKey ? "+" : "-"}authKey`);
    }

    async findByEmail(email: string): Promise<ICustomer> {
        return await this.customer.findOne({
            email,
            deleteFlag: false,
        });
    }

    async findByEmailOrUsername(email: string, username: string): Promise<ICustomer> {
        return await this.customer.findOne({
            $or: [{ email }, { username }],
        });
    }

    async findByEmailAndPassword(email: string, pass: string): Promise<ICustomer | any> {
        const customer = await this.customer
            .findOne({
                email,
                deleteFlag: false,
            })
            .select("+password");
        if (!customer) {
            return customer;
        }

        const validPassword = bcrypt.compareSync(pass, customer.password);
        if (!validPassword) {
            return undefined;
        }

        const withoutPassword = JSON.parse(JSON.stringify(customer));
        delete withoutPassword.password;
        return withoutPassword;
    }

    async countUser(): Promise<any> {
        return await this.customer.countDocuments();
    }
}

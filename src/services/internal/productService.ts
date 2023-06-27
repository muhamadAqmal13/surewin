import { Model } from "mongoose";
import { ProductDto } from "../../dto/productDto";
import productModels, { IProduct } from "../../models/productModels";
import { v4 as uuid } from 'uuid';

export class ProductService {
    private product: Model<IProduct>

    constructor() {
        this.product = productModels
    }

    async create(data: ProductDto): Promise<ProductDto> {
        const clone = JSON.parse(JSON.stringify(data))
        clone._id = uuid()

        return await this.product.create(clone)
    }

    async findProductById(id: string): Promise<IProduct> {
        return this.product.findById(id)
    }

    async findProductsByGameTypeId(gameTypeId: string): Promise<IProduct[]> {
        return this.product.find({
            gameTypeId
        })
    }

    async findProductsByGameTypeIds(gameTypeIds: string[]): Promise<IProduct[]> {
        return this.product.find({
            gameTypeId: { $in: gameTypeIds }
        })
    }

    async findAllProducts(): Promise<IProduct[]> {
        return this.product.find()
    }
}
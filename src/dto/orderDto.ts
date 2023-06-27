import { InvoiceStatuses, OrderStatuses, OrderType } from "../enum";

export class OrderDto {
    public id?: string;
    public cifId: string;
    public trxRefNo?: string;
    public description: string;
    public priceAmount: string;
    public priceCurrency: string;
    public status: OrderStatuses | InvoiceStatuses;
    public type: OrderType;
    public productId?: string;
    public gameId?: string;
    public amount: string;
    public payAddress?: string;
    public payAmount?: string;
    public payCurrency?: string;
    public purchaseId?: string;
    public paymentId?: string;
    public createdAt?: Date;
    public updatedAt?: Date;
    public remark?: string;
    public hash?: string;
}

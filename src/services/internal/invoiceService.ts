import { Model } from "mongoose";
import { InvoiceDto } from "../../dto/invoiceDto";
import invoiceModels, { IInvoice } from "../../models/invoiceModels";
import { v4 as uuid } from "uuid";
import { InvoiceStatuses } from "../../enum";

export class InvoiceService {
    private invoice: Model<IInvoice>;

    constructor() {
        this.invoice = invoiceModels;
    }

    async create(data: InvoiceDto): Promise<IInvoice> {
        const clone = JSON.parse(JSON.stringify(data));
        clone._id = uuid();

        return await this.invoice.create(clone);
    }

    async updateByExternalInvoiceId(data: InvoiceDto): Promise<IInvoice> {
        return await this.invoice.findOneAndUpdate({ extInvoiceId: data.extInvoiceId }, data);
    }

    async updateByTrxRefNo(data: InvoiceDto): Promise<IInvoice> {
        return await this.invoice.findOneAndUpdate({ trxRefNo: data.trxRefNo }, data);
    }

    async findById(id: string): Promise<IInvoice> {
        return await this.invoice.findById(id);
    }

    async findByTrxRefNo(trxRefNo: string): Promise<IInvoice> {
        return await this.invoice.findOne({
            trxRefNo,
        });
    }

    async findInvoicesByTrxRefNo(trxRefNo: string[]): Promise<IInvoice[]> {
        return await this.invoice.find({
            trxRefNo: { $in: trxRefNo },
        });
    }

    async updateStatus(data: InvoiceDto, status: InvoiceStatuses): Promise<IInvoice> {
        return await this.invoice.findOneAndUpdate(
            {
                trxRefNo: data.trxRefNo,
            },
            { status, updatedAt: new Date() },
            { new: true },
        );
    }

    async findByExternalInvoiceId(extInvoiceId: string): Promise<IInvoice> {
        return await this.invoice.findOne({
            extInvoiceId,
        });
    }
}

export class InvoiceDto {
    public id?: string;
    public extInvoiceId: string;
    public trxRefNo: string;
    public status: string;
    public description: string;
    public priceAmount: string;
    public priceCurrency: string;
    public payCurrency: string;
    public paidAmount?: string;
    public actualAmount?: string;
    public invoiceUrl?: string;
    public callbackUrl?: string;
    public successUrl?: string;
    public cancelUrl?: string;
    public partiallyPaidUrl?: string;
    public createdAt?: Date;
    public updatedAt?: Date;
    public isFixedRate?: boolean;
    public isFeePaidByUser?: boolean;
}

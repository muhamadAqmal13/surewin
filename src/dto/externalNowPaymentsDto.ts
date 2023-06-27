export class CreateInvoiceExternal {
    public price_amount: number;
    public price_currency: string;
    public order_id: string;
    public order_description: string;
    public ipn_callback_url: string;
    public success_url: string;
    public cancel_url: string;
    public partially_paid_url: string;
    public is_fixed_rate: boolean;
    public is_fee_paid_by_user: boolean;

    public code?: string;
    public message?: string;
}

export class ResponseCreateInvoiceExternal {
    public id: string;
    public token_id: string;
    public order_id: string;
    public order_description: string;
    public price_amount: string;
    public price_currency: string;
    public pay_currency?: any;
    public ipn_callback_url: string;
    public invoice_url: string;
    public success_url: string;
    public cancel_url: string;
    public partially_paid_url: string;
    public created_at: Date;
    public updated_at: Date;
    public is_fixed_rate: boolean;
    public is_fee_paid_by_user: boolean;

    public code?: string;
    public message?: string;
}

export class ResponseEstimatedPrice {
    public currency_from: string;
    public amount_from: number;
    public currency_to: string;
    public estimated_amount: string;

    public code?: string;
    public message?: string;
}

export class PostWithdrawalExternal {
    ipn_callback_url?: string;
    withdrawals: Array<{
        address: string;
        currency: "TRX" | string;
        amount: number;
        extra_id?: string;
        payout_description?: string;
        unique_external_id?: string;
        ipn_callback_url?: string;
    }>;
}

export class ResponsePostWithdrawalExternal {
    id: string;
    withdrawals: Array<{
        id: string;
        address: string;
        amount: string;
        batch_withdrawal_id: string;
        ipn_callback_url: string;
        status: string;
        extra_id?: string;
        hash?: string;
        error?: any;
        payout_description: string;
        unique_external_id: string;
        created_at: string;
        requested_at?: string;
        updated_at?: string;
    }>;
}

export class CreatePaymentExternalDto {
    iid: number;
    customer_email: string;
    pay_currency: string;
    order_description: string;
    case: string;

    code?: string;
    message?: string;
}

export class ResponseCreatePaymentDto {
    payment_id: string;
    payment_status: string;
    pay_address: string;
    price_amount: number;
    price_currency: string;
    pay_amount: number;
    amount_received: number;
    pay_currency: string;
    order_id: string;
    order_description: string;
    ipn_callback_url: string;
    created_at: Date;
    updated_at: Date;
    purchase_id: string;
    smart_contract: any;
    network: string;
    network_precision: any;
    time_limit: Date;
    burning_percent: any;
    expiration_estimate_date: Date;
    is_fixed_rate: boolean;
    is_fee_paid_by_user: boolean;
    valid_until: Date;
    success: string;

    code?: string;
    message?: string;
}

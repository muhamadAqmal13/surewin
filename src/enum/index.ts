export enum ErrorType {
    Authentication = "AuthenticationError",
    Authorization = "AuthorizationError",
    Validation = "ValidationError",
    NotFound = "NotFoundError",
    Internal = "InternalServerError",
    Duplicate = "DuplicateError",
}

export enum ErrorStatusCode {
    Authentication = 401,
    Authorization = 403,
    Validation = 422,
    NotFound = 404,
    Internal = 500,
    Duplicate = 409,
}

export enum RoleID {
    Admin = "71af2f12-eaa3-4e36-850f-174b52167eb0",
    User = "949cbaf5-7d0c-4d9d-99f4-9c2f03dd0fd0",
}

export enum OrderStatuses {
    WAITING = "1",
    PROCESSING = "2",
    FINISHED = "3",
    FAILED = "4",
    REJECTED = "5",
    SENDING = "6",
    PARTIALLY_PAID = "7",
}

export enum OrderType {
    BUY = "Deposit",
    SELL = "Withdrawal",
    WIN = "Win",
    LOSS = "Loss",
    PLAY = "Play",
    BONUS = "Bonus",
}
// "Buy" | "Sell" | "Win" | "Loss" | "Play" | "Bonus"
export enum InvoiceStatuses {
    WAITING = "1",
    CONFIRMING = "2",
    CONFIRMED = "3",
    SENDING = "4",
    PARTIALLY_PAID = "5",
    FINISHED = "6",
    FAILED = "7",
    REFUNDED = "8",
    EXPIRED = "9",
}

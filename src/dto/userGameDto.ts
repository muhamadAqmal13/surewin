export class UserGameDto {
    id?: string;
    cifId: string;
    gameId: string;
    productId: string;
    spent: string;
    result: "PENDING" | "WIN" | "LOSS";
    gameTypeId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

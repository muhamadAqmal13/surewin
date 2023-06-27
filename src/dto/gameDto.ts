export class GameDto {
    public id?: string;
    public periode? : string;
    public gameTypeId: string;
    public result?: {
        color: string;
        shape: string;
        number: string;
    };
    public winner?: number;
    public looser?: number;
    public startAt: Date;
    public finishAt: Date;
    public createdAt?: Date;
    public updatedAt?: Date;
}
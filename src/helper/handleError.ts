export class BusinessError extends Error {
    public readonly type: string;

    constructor(message: string, type: string) {
      super(message);
      this.name = type;
    }
}
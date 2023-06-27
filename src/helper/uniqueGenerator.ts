import { CustomerDto } from "../dto/customerDto";
import { OrderType } from "../enum";
import { CustomerService } from "../services/internal/customerService";
import { OrderSerivce } from "../services/internal/orderService";

export class UniqueGenerator {
    private static generateDate() {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        const second = date.getSeconds().toString().padStart(2, "0");

        return { year, month, day, hour, minute, second };
    }

    static getInitials(username: string) {
        let words = username.split(/[\W_]+/);
        words = words.filter((word) => word.length > 0);

        let initials = words.map((word) => word[0].toUpperCase()).join("");

        if (initials.length === 1) {
            const word = words[0].split("");
            initials += word[word.length - 1].toUpperCase();
        }
        return initials;
    }

    static accountNo(username: string) {
        const initials = this.getInitials(username);
        const { year, month, day, hour, minute, second } = this.generateDate();

        return `${initials}-${year}${month}${day}${hour}${minute}${second}`;
    }

    static async invoice(data: CustomerDto, type: OrderType): Promise<any> {
        let prefix;
        if (type === OrderType.BONUS) {
            prefix = "BNS";
        } else if (type === OrderType.BUY) {
            prefix = "BY";
        } else if (type === OrderType.LOSS) {
            prefix = "LS";
        } else if (type === OrderType.PLAY) {
            prefix = "PLY";
        } else if (type === OrderType.SELL) {
            prefix = "SL";
        } else if (type === OrderType.WIN) {
            prefix = "WN";
        } else {
            prefix = "RM";
        }

        const orderService = new OrderSerivce();
        const latestOrder = await orderService.findLatestTrxRefNoByCifIdAndType(data.id, type);
        let lastNum = 1;
        if (latestOrder) {
            const splitter = latestOrder.trxRefNo.split("/");
            const getNum = splitter[splitter.length - 1];
            const currentMonth = new Date().getMonth() + 1;
            const lastMonth = +splitter[splitter.length - 2];
            if (currentMonth === lastMonth) {
                lastNum = +splitter[splitter.length - 1] + 1;
            }
        }

        const { year, month } = this.generateDate();
        const result = `INV/${data.accountNo}-${prefix}/${year}/${month}/${lastNum.toString().padStart(4, "0")}`;
        return result;
    }
}

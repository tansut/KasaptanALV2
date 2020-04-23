import { App } from "./app";
import { Backend } from "./backend";

export default class ButcherApp {

    
    static async sendPayment(data) {
        await Backend.post('butcher/sendpayment', data);
    }
}
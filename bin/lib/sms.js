"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sms = void 0;
const Nexmo = require("nexmo");
const axios_1 = require("axios");
const email_1 = require("./email");
class Sms {
    static sendMultiple(to, text, throwexc = true, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < to.length; i++) {
                yield Sms.send(to[i], text, throwexc, logger);
            }
        });
    }
    static send(to, text, throwexc = true, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `https://api.netgsm.com.tr/sms/send/get?usercode=${8503054216}&password=BOV0MN1M&gsmno=${to.trim()}&message=${encodeURI(text)}&msgheader=${('KasaptanAl')}`;
            let resp;
            try {
                resp = yield axios_1.default.get(url);
                if (["20", "30", "40", "70"].indexOf(resp.data.toString()) > 0)
                    throw new Error("SMS iletilemedi");
                if (logger) {
                    yield logger.log({
                        logData: text,
                        logtype: "SMS",
                        email: to
                    });
                }
            }
            catch (err) {
                email_1.default.send('tansut@gmail.com', 'hata/SMS: kasaptanAl.com', "error.ejs", {
                    text: err + "/" + to + "/" + text + "/" + err.message,
                    stack: err.stack
                });
                if (throwexc)
                    throw err;
            }
        });
    }
}
exports.Sms = Sms;

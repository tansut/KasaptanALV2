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
const config_1 = require("../config");
const axios_1 = require("axios");
const libphonenumber_js_1 = require("libphonenumber-js");
const helper_1 = require("./helper");
const http_1 = require("./http");
class Sms {
    static sendMultiple(to, text, throwexc = true, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < to.length; i++) {
                yield Sms.send(to[i], text, throwexc, logger);
            }
        });
    }
    static canSend(to) {
        let phone = libphonenumber_js_1.default(to, 'TR');
        return phone ? phone.countryCallingCode == '90' : false;
    }
    static send(to, text, throwexc = true, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            let phone = libphonenumber_js_1.default(to, 'TR');
            to = phone && phone.number ? phone.number.toString() : to;
            if (Sms.canSend(to)) {
                let requestIsFraud = yield logger.isFraud({ email: to });
                if (requestIsFraud) {
                    if (throwexc)
                        throw new http_1.ValidationError('Lütfen 5 dk sonra tekrar deneyiniz.');
                    return false;
                }
                let url = `https://api.netgsm.com.tr/sms/send/get?usercode=${8503054216}&password=BOV0MN1M&gsmno=${encodeURI(to.trim())}&message=${encodeURI(text)}&msgheader=${('KasaptanAl')}`;
                let resp;
                try {
                    if (config_1.default.nodeenv == 'production') {
                        resp = yield axios_1.default.get(url);
                        if (["20", "30", "40", "70"].indexOf(resp.data.toString()) > 0)
                            throw new Error("SMS iletilemedi");
                    }
                    if (logger) {
                        yield logger.log({
                            logData: text,
                            logtype: "SMS",
                            email: to
                        });
                    }
                }
                catch (err) {
                    helper_1.default.logError(err, {
                        method: 'Sms.send',
                        to: to,
                        text: text
                    });
                    if (throwexc)
                        throw err;
                    return false;
                }
            }
            else
                return false;
        });
    }
}
exports.Sms = Sms;

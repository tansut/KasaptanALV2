"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shipment = exports.ShipmentHowToDesc = exports.ShipmentTypeDesc = exports.ShipmentDays = exports.ShipmentHours = void 0;
const helper_1 = require("../lib/helper");
exports.ShipmentHours = {
    //0: 'Herhangi bir saat olabilir',
    812: 'Sabah 8-10 arası',
    1012: 'Sabah 10-12 arası',
    1214: 'Öğlen 12-2 arası',
    1416: 'Öğleden sonra 2-4 arası',
    1618: 'Akşama doğru 4-6 arası',
    1819: 'Akşam 6-7 arası',
    1920: 'Akşam 7-8 arası',
    2021: 'Akşam 8-9 arası',
};
exports.ShipmentDays = {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    6: 'Cumartesi',
    0: 'Pazar'
};
exports.ShipmentTypeDesc = {
    "callme": "Telefon ile sizi arayacağız ve teslimat zamanını belirleyeceğiz",
    "sameday": "Sipariş ile aynı gün içerisinde.",
    "plan": "Planlanan saat aralığında."
};
exports.ShipmentHowToDesc = {
    "unset": "Henüz belirlenmedi",
    "take": "Gel Al",
    "ship": "Adrese Gönderim",
};
class Shipment {
    constructor() {
        this.howTo = 'unset';
        this.type = "callme";
        this.days = [];
        this.securityCode = '';
        this.hours = [];
        this.informMe = false;
        this.daysText = [];
        this.hoursText = [];
        this.dispatcher = null;
        this.nointeraction = false;
    }
    get howToDesc() {
        return exports.ShipmentHowToDesc[this.howTo];
    }
    get desc() {
        return exports.ShipmentTypeDesc[this.type];
    }
    static availableTimes(date = helper_1.default.Now()) {
        var isToday = (helper_1.default.Now().toDateString() === date.toDateString());
        let currentHour = helper_1.default.Now().getHours();
        if (isToday) {
            let res = {};
            Object.keys(exports.ShipmentHours).forEach(k => {
                if (currentHour < 19) {
                    if (parseInt(k) > (currentHour * 100 + 100))
                        res[k] = exports.ShipmentHours[k];
                }
            });
            return res;
        }
        else
            return exports.ShipmentHours;
    }
    static availableDays(date = helper_1.default.Now()) {
        //let tomorrow = new Date(Helper.Now().getTime() + 24 * 60 * 60 * 1000)  
        let res = {};
        let nextDay = helper_1.default.Now();
        for (let i = 0; i < 14; i++) {
            nextDay = helper_1.default.NextDay(nextDay);
            let text = i == 0 ? 'Yarın' : helper_1.default.formatDate(nextDay);
            res[nextDay.toDateString()] = text;
        }
        return res;
    }
}
exports.Shipment = Shipment;

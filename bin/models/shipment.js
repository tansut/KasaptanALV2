"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shipment = exports.ShipmentHowToDesc = exports.ShipmentTypeDesc = exports.ShipmentDays = exports.ShipmentHours = void 0;
const helper_1 = require("../lib/helper");
exports.ShipmentHours = {
    //0: 'Herhangi bir saat olabilir',
    911: 'Sabah 9-11 arası',
    1112: 'Sabah 11-12 arası',
    1214: 'Öğlen 12-2 arası',
    1416: 'Öğleden sonra 2-4 arası',
    1618: 'Akşama doğru 4-6 arası',
    1819: 'Akşam 6-7 arası',
    1920: 'Akşam 7-8 arası',
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
    "callme": "Hemen gönderebilirsiniz",
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
    static getShipmentDays() {
        let res = [];
        let nextDay = helper_1.default.Now();
        for (let i = 0; i < 14; i++) {
            let times = Shipment.availableTimes(nextDay);
            if (Object.keys(times).length > 0) {
                res.push({
                    title: helper_1.default.isToday(nextDay) ? 'Bugün' : (helper_1.default.isTomorrow(nextDay) ? 'Yarın' : helper_1.default.formatDate(nextDay, false, false)),
                    date: nextDay.toDateString(),
                    hours: Shipment.availableTimes(nextDay)
                });
            }
            nextDay = helper_1.default.NextDay(nextDay);
        }
        return res;
    }
    static availableTimes(date = helper_1.default.Now()) {
        var isToday = (helper_1.default.Now().toDateString() === date.toDateString());
        let currentHour = helper_1.default.Now().getHours();
        if (isToday) {
            let res = {};
            Object.keys(exports.ShipmentHours).forEach(k => {
                if (currentHour < 21) {
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
        let res = {};
        let nextDay = helper_1.default.Now();
        for (let i = 0; i < 14; i++) {
            nextDay = helper_1.default.NextDay(nextDay);
            let text = helper_1.default.isToday(nextDay) ? 'Bugün' :
                (helper_1.default.isTomorrow(nextDay) ? 'Yarın' : helper_1.default.formatDate(nextDay));
            res[nextDay.toDateString()] = text;
        }
        return res;
    }
}
exports.Shipment = Shipment;

import Helper from "../lib/helper";
import moment = require("moment");
import Dispatcher, { DispatcherType } from "../db/models/dispatcher";
import { GeoLocation } from "./geo";
import { LogisticProvider } from "../lib/logistic/core";

export let ShipmentHours = {
    //0: 'Herhangi bir saat olabilir',
    911: 'Sabah 9-11 arası',
    1112: 'Sabah 11-12 arası',
    1214: 'Öğlen 12-2 arası',
    1416: 'Öğleden sonra 2-4 arası',
    1618: 'Akşama doğru 4-6 arası',
    1819: 'Akşam 6-7 arası',
    1920: 'Akşam 7-8 arası'
    //2021: 'Akşam 8-9 arası',
}

export let ShipmentDays = {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    6: 'Cumartesi',
    0: 'Pazar'
}


export interface ShipmentInfo {
    excludeDays: number[];
}

export type ShipmentType = "callme" | "sameday" | "tomorrow" | "weekend" | "plan";

export let ShipmentTypeDesc = {
    "callme": "Hemen gönderebilirsiniz",
    "sameday": "Sipariş ile aynı gün içerisinde.",
    "plan": "Planlanan saat aralığında."
}

export let ShipmentHowToDesc = {
    "unset": "Henüz belirlenmedi",
    "take": "Gel Al",
    "ship": "Adrese Gönderim",
}

export type HowToShipType = 'unset' | 'take' | 'ship';

export interface DispatcherView {
    id: number,
    type: DispatcherType,
    name: string,
    fee: number,
    feeOffer: number,
    totalForFree: number
    min: number;
    minCalculated: number;
    takeOnly: boolean;
    toAreaLevel: number;
    longDesc: string;
    //location: GeoLocation;
    km: number;
}


export interface ShipmentDayInfo {
    hour: number;
    text: string;
    enabled: boolean;
}

export interface ShipmentDayHours {
    title: string;
    date: string,
    hours: {[key: number]: string};
}


export class Shipment {
    howTo: HowToShipType = 'unset';

    get howToDesc() {
        return ShipmentHowToDesc[this.howTo]
    }

    get desc() {
        return ShipmentTypeDesc[this.type]
    }

    type: ShipmentType = "callme";
    days: string[] = [];
    securityCode: string = '';
    hours: number[] = []
    informMe: boolean = false;
    daysText: string[] = [];
    hoursText: string[] = []
    dispatcher: DispatcherView = null;
    nointeraction: boolean = false;


    static getShipmentDays(): ShipmentDayHours[] {
        let res: ShipmentDayHours[] = [];
        let nextDay = Helper.Now()
        for (let i = 0; i < 14; i++) {
            let times = Shipment.availableTimes(nextDay);
            if (Object.keys(times).length > 0) {
                res.push({
                    title:  Helper.isToday(nextDay) ? 'Bugün' : (Helper.isTomorrow(nextDay) ? 'Yarın' : Helper.formatDate(nextDay, false, false)),
                    date: nextDay.toDateString(),
                    hours: Shipment.availableTimes(nextDay)
                })
            }

            nextDay = Helper.NextDay(nextDay);
        }

        return res;
    }



    static availableTimes(date: Date = Helper.Now()): {[key: number]: string} {
        var isToday = (Helper.Now().toDateString() === date.toDateString());
        let currentHour = Helper.Now().getHours();
        if (isToday) {
            let res = {}
            Object.keys(ShipmentHours).forEach(k => {
                if (currentHour < 21) {
                    if (parseInt(k) > (currentHour * 100 + 100)) res[k] = ShipmentHours[k]
                }
            })
            return res;
        } else return ShipmentHours;
    }

    static availableDays(date: Date = Helper.Now()): Object {

        let res = {};
        let nextDay = Helper.Now()
        for (let i = 0; i < 14; i++) {
            nextDay = Helper.NextDay(nextDay);
            let text = Helper.isToday(nextDay) ? 'Bugün' :
                (Helper.isTomorrow(nextDay) ? 'Yarın' : Helper.formatDate(nextDay))
            res[nextDay.toDateString()] = text;
        }
        return res;
    }
}
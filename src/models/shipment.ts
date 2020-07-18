import Helper from "../lib/helper";
import moment = require("moment");
import Dispatcher, { DispatcherType } from "../db/models/dispatcher";
import { GeoLocation } from "./geo";
import { LogisticProvider } from "../lib/logistic/core";

export let ShipmentHours = {
    //0: 'Herhangi bir saat olabilir',
    812: 'Sabah 8-10 arası',
    1012: 'Sabah 10-12 arası',
    1214: 'Öğlen 12-2 arası',
    1416: 'Öğleden sonra 2-4 arası',
    1618: 'Akşama doğru 4-6 arası',
    1819: 'Akşam 6-7 arası',
    1920: 'Akşam 7-8 arası',
    2021: 'Akşam 8-9 arası',
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

export type ShipmentType = "callme" | "sameday" | "tomorrow" | "weekend" | "plan";

export let ShipmentTypeDesc = {
    "callme": "Telefon ile sizi arayacağız ve teslimat zamanını belirleyeceğiz",
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
    takeOnly: boolean;
    //location: GeoLocation;
    km: number;
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
    securityCode: string='';
    hours: number [] = []
    informMe: boolean = false;
    daysText: string[] = [];
    hoursText: string [] = []    
    dispatcher: DispatcherView = null;
    nointeraction: boolean = false;

    static  availableTimes(date: Date = Helper.Now()): Object {        
        var isToday = (Helper.Now().toDateString() === date.toDateString());
        let currentHour = Helper.Now().getHours();        
        if (isToday) {
            let res = {}
            Object.keys(ShipmentHours).forEach(k=>{
                if (currentHour < 19) {
                    if (parseInt(k) > (currentHour * 100 + 100)) res[k] = ShipmentHours[k]
                }
            })
            return res;
        } else return ShipmentHours;
    }

    static  availableDays(date: Date = Helper.Now()): Object {        
        //let tomorrow = new Date(Helper.Now().getTime() + 24 * 60 * 60 * 1000)  
        let res = {};
        let nextDay = Helper.Now()
        for(let i = 0; i < 14; i++) {
            nextDay = Helper.NextDay(nextDay);
            let text = i == 0 ? 'Yarın': Helper.formatDate(nextDay)
            res[nextDay.toDateString()] = text;
        }
        return res;
    }    
}
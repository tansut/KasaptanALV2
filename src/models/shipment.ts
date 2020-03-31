import Helper from "../lib/helper";
import moment = require("moment");
import Dispatcher from "../db/models/dispatcher";
import { GeoLocation } from "./geo";

export let ShipmentHours = {
    //0: 'Herhangi bir saat olabilir',
    812: 'Sabah 8-10 arası',
    1012: 'Sabah 10-12 arası',
    1214: 'Öğlen 12-2 arası',
    1416: 'Öğlen 2-4 arası',
    1618: 'Akşama doğru 4-6 arası',
    1820: 'Akşam 6-8 arası',
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
    type: string,
    name: string,
    fee: number,
    totalForFree: number
    min: number;
    takeOnly: boolean;
    location: GeoLocation;
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
    hours: number [] = []
    informMe: boolean = true;
    daysText: string[] = [];
    hoursText: string [] = []    
    dispatcher: DispatcherView = null;

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
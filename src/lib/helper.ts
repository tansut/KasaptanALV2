import * as Jimp2 from 'jimp'
const Jimp = <Jimp2.default>require('jimp');
import * as path from "path"
import * as numeral from 'numeral';
import moment = require('moment');
import { AppRequest } from './http';
import config from '../config';

export default class Helper {



    static asCurrency(n: number) {
        return Number(n.toFixed(2));
    }

    static isToday(date): boolean {
        return (Helper.Now().toDateString() === date.toDateString());
    }

    static Tomorrow(): Date {
        return new Date(Helper.Now().getTime() + 24 * 60 * 60 * 1000)
    }

    static NextDay(date) {
        return new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }

    static isTomorrow(date): boolean {
        return (this.NextDay(Helper.Now()).toDateString() === date.toDateString());
    }

    static Now() {
        let date = new Date().toUTCString();
        let res = moment(date).utc().add('hour', 0)

        return res.toDate();


    }

    static shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }


    static boolStr(val: boolean) {
        return val ? 'Evet' : 'Hayır'
    }

    static formatDate(date: Date, useTime: boolean = false) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('tr-TR', options);
    }

    static UtcNow() {
        return moment.utc().toDate();
    }

    static splitCurrency(n: number) {
        let absn = Math.abs(n)
        return {
            val: Math.trunc(n),
            krs: (Number(absn.toFixed(2)) - Math.trunc(absn)) * 100
        }
    }

    static formatCurrency(n: number) {
        let split = Helper.splitCurrency(n)
        return {
            val: numeral(split.val).format('0,0'),
            krs: numeral(split.krs).format('00')
        }
    }

    static getPhoneNumber(phone: string) {
        //05326274151
        let f = phone.replace(' ', '');
        if (f.length == 11 && f[0] == '0')
            f = f.slice(1);
        return f;
    }

    static ResourcePaths = {
        "butcher-google-photos": "kasap-resimleri",
        "product-photos": "urun-resimleri",
        "category-photos": "kategori-resimleri"
    }

    static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    static toLower(s: string) {
        var letters = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
        s = s.replace(/(([İIŞĞÜÇÖ]))/g, function (letter) { return letters[letter]; })
        return s.toLowerCase();
        //return s.toLocaleLowerCase().replace(new RegExp("i", 'g'), "ı").replace(new RegExp("i̇", 'g'), "i");
    }

    static capitlize(text: string) {
        return this.toLower(text)
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    }

    static normalizePhoto(url: string, thumbnail?: string) {
        return Jimp.read(path.resolve(url))
            .then(image => {
                let _img = image.resize(900, Jimp.AUTO)
                return new Promise((resolve, reject) => {
                    _img.write(path.resolve(url), (err) => {
                        if (thumbnail) {
                            _img = _img.cover(300, 300);

                            _img.write(path.resolve(thumbnail), (err) => {
                                err ? reject(err) : resolve();
                            })
                        }
                        else err ? reject(err) : resolve();
                    })
                })

                // return _img.getBufferAsync("image/jpeg").then(buff => {
                //     this.res.set("jpeg")
                //     this.res.send(new Buffer(buff))
                // })
            })
    }

    static slugify(string) {
        const a = 'ıàáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
        const b = 'iaaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnooooooooprrsssssttuuuuuuuuuwxyyzzz------'
        const p = new RegExp(a.split('').join('|'), 'g')

        return string.toString().toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
            .replace(/&/g, '-') // Replace & with 'and'
            .replace(/[^\w\-]+/g, '') // Remove all non-word characters
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, '') // Trim - from end of text
    }
}
import axios, { AxiosInstance } from "axios"

import { HostConfiguration, IHostConfiguration, IAppconfig } from './config'
import { Backend } from './backend'
import { Auth } from "./auth";
import { ShopCard } from "./shopcard";
import AppBase from "./appbase";
import numeral from "numeral";
import ButcherApp from "./butcherapp"

declare global {
    interface Window { App: App; }
}

export interface IComponent {
    class?: React.ComponentClass;
    func?: Function;
}

interface ComponentMap {
    [key: string]: IComponent;
}

export class App extends AppBase {

    public static Config: IAppconfig;
    public static Ready: Promise<any>;
    public static Backend: Backend;
    public static Auth = Auth;
    public static ShopCard = ShopCard;
    public static User = null;    
    public static ButcherApp = ButcherApp;


    public static ComponentMap: ComponentMap = {};


    static GetGeoLocation() {
        if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(function(position) {
                    resolve(position)
                }, function(err) {
                    reject(err)
                }, {maximumAge:60000, timeout:10000, enableHighAccuracy: false});
            })
        } else Promise.reject('not supported')
    }

    static scrollToAnchor(aid, handler){
        var aTag = $(aid); 
        $('html,body').animate({scrollTop: aTag.offset().top}, 'slow', "swing", handler);
    }

    static async sendResetLink(phone: string) {
        return await Backend.post('user/sendResetLink', {
            phone: phone
        })
    }

    static jump(h){
        var url = location.href;               //Save down the URL without hash.
        location.href = ""+h;                 //Go to the target element.
        //history.replaceState(null,null,url);   //Don't like hashes. Changing it back.
    }

    static openDefaultSlider() {
        window.location.hash = "lg=1&slide=" + 0;
        window['lgData'].lg0.init()
    }

    static openSlider(i) {
        var node = $('a[data-resid=' + i + ']')[0];
        window['lgData'].lg0.items.forEach(function (item, i) {
       if (item == node || ((item.id && node.id) && (item.id == node.id))) {
         window.location.hash = "lg=1&slide=" + i;
         window['lgData'].lg0.init()
        }
       })
      }

    static gTag(category, action, label, value?) {
        window['dataLayer'] = window['dataLayer'] || [];
        window['dataLayer'].push({
            event: 'custom',
            category: category,
            action: action,
            label: label,
            value: value
        })
    }

    static HandleError(err) {
        if (err.response && err.response.data) {
            let msg = err.response.data.msg || err.response.data;
            let type = err.response.data.type || 'danger';
            if (msg == 'Unauthorized')
              msg = "<p>Kullanıcı adı/şifre doğru gözükmüyor.</p><p>Şifrenizi mi unuttunuz? <br/> <a class='btn btn-sm btn-primary' onclick='resetPassword()'>Şifremi Unuttum</a></p>"
            App.alert(msg, type);
        }
        else App.alert(err.message || err, 'danger')
    }

    static setCookie(name, value, days?) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }

        
        document.cookie = name + "=" + (value || "") + expires + ";domain=" + window.location.hostname + "; path=/";
    }

    static getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    static eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    }

    static splitCurrency(n: number) {
        let absn = Math.abs(n)
        return {
            val: Math.trunc(n),
            krs: (Number(absn.toFixed(2)) - Math.trunc(absn)) * 100
        }
    }

    static formatCurrency(n: number) {
        let split = App.splitCurrency(n)
        return {
            val: numeral(split.val).format('0,0'),
            krs: numeral(split.krs).format('00')
        }
    }


    static run(config: IAppconfig) {
        this.Config = config;
        Backend.configure(this.Config.remote);
        this.Backend = Backend;
        window.App = App;
        (<any>window).initComponents();
        this.Ready = new Promise((resolve) => {
            $(document).ready(function () {
                resolve()
            });
        })
    }
}
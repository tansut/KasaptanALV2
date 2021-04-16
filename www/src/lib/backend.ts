import { HostConfiguration, IHostConfiguration } from './config'
import axios, { AxiosInstance } from "axios"

export class Backend {
    static axios: AxiosInstance;
    static hostConfig: HostConfiguration;
    static catpchaToken: string;

    static configure(hostConfig: IHostConfiguration) {
        this.hostConfig = new HostConfiguration(hostConfig);
        axios.defaults.headers.common['ka-platform'] = window['kaPlatform']
        this.axios = axios.create({

        })

        this.axios.interceptors.response.use(function (response) {
            return response;
        }, function (error) {
            //alert(error);
            return Promise.reject(error);
        });
    }

    static Backend() {
        console.log("static backend");
    }

    static getBaseUrl(): string {
        return this.hostConfig.Protocol + "//" + this.hostConfig.Host + (this.hostConfig.Port ? (":" + this.hostConfig.Port) : "");
    }


    static url(postfix: string, args: Object = {}) {
        var url = this.getBaseUrl() + this.hostConfig.App + (this.hostConfig.App ? "/" : "") + postfix;
        var argsAdded = false;
        for (var key in args) {
            if (!argsAdded)
                url = url + '?';
            url = url.concat(key + '=' + encodeURI(args[key]) + '&');
            argsAdded = true;
        }
        if (argsAdded)
            url = url.substring(0, url.length - 1);
        return url;
    }

    static get(method: string, params: Object = {}) {
        return this.axios.get(this.url(method, params));
    }

    static post(method: string, postData: Object = null, params: Object = {}) {
        postData = postData || {};
        Backend.catpchaToken && (postData['__token'] = Backend.catpchaToken);
        return this.axios.post(this.url(method, params), postData).then((result) => result.data);
    }


    // static put<T>(method: string, putData: Object = null, params: Object = {}) {
    //     return $http.put<T>(this.url(method, params), putData).then((result) => result.data);
    // }

    // static delete<T>(method: string, postData: Object = null, params: Object = {}, ) {
    //     return $http.delete<T>(this.url(method, params), postData).then((result) => result.data);
    // }    
}
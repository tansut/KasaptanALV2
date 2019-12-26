export interface IHostConfiguration {
    Protocol: string;
    Host: string;
    Port: string;
    App: string;
}


export class HostConfiguration implements IHostConfiguration {
    Protocol: string;
    Host: string;
    Port: string;
    App: string;


    constructor(source: IHostConfiguration) {
        this.Protocol = source ? source.Protocol : window.location.protocol;
        this.Host = source ? source.Host : window.location.hostname;
        this.Port = source ? source.Port : window.location.port;
        this.App = source ? source.App : "/api/v1";
    }
}


export interface IAppconfig {
    remote?: IHostConfiguration;
}
import axios, { AxiosInstance } from "axios"
import RegisterComponents from "../react/register"
import ReactDOM from "react-dom"
import React from "react"
import { HostConfiguration, IHostConfiguration, IAppconfig } from './config'
import { Backend } from './backend'
import AppBase from "./appbase"


declare global {
    interface Window { App: App; }
}

export interface IComponent {
    class: React.ComponentClass;
}

interface ComponentMap {
    [key: string]: IComponent;
}

export class App extends AppBase {

    public static Config: IAppconfig;
    public static Ready: Promise<any>;
    public static Backend: Backend;

    public static ComponentMap: ComponentMap = {};

    public static Render(classKey, props, dom) {
        return ReactDOM.render(
            React.createElement(this.ComponentMap[classKey].class, props),
            dom
        );
    }

    static run(config: IAppconfig) {
        this.Config = config;
        Backend.configure(this.Config.remote);
        this.Backend = Backend;
        window.App = App;
        RegisterComponents();
        this.Ready = new Promise((resolve) => {
            $(document).ready(function () {
                resolve()
            });
        })

    }
}
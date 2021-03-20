import { DispatcherTypeDesc } from "../../db/models/dispatcher";
import BanabikuryeProvider, { BanabikuryeConfig } from "./banabikurye";
import { LogisticFactory, LogisticProviderOptions, VehicleType } from "./core";


export default class BanabikuryeCarProvider extends BanabikuryeProvider {
    static register() {
        LogisticFactory.register("banabikuryecar", BanabikuryeCarProvider)
    }

    constructor(config: BanabikuryeConfig, options: LogisticProviderOptions) {
        super(config, options);
        this.name = DispatcherTypeDesc["banabikurye/car"];
        this.vehicle = VehicleType.Car
        options.dispatcher.name = DispatcherTypeDesc[options.dispatcher.type];
    }
}
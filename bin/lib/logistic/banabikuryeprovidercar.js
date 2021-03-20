"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dispatcher_1 = require("../../db/models/dispatcher");
const banabikurye_1 = require("./banabikurye");
const core_1 = require("./core");
class BanabikuryeCarProvider extends banabikurye_1.default {
    static register() {
        core_1.LogisticFactory.register("banabikuryecar", BanabikuryeCarProvider);
    }
    constructor(config, options) {
        super(config, options);
        this.name = dispatcher_1.DispatcherTypeDesc["banabikurye/car"];
        this.vehicle = core_1.VehicleType.Car;
        options.dispatcher.name = dispatcher_1.DispatcherTypeDesc[options.dispatcher.type];
    }
}
exports.default = BanabikuryeCarProvider;

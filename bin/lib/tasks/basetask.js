"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTask = void 0;
const cron = require("node-cron");
class BaseTask {
    constructor(config = {}) {
        this.config = config;
        this.url = 'https://www.kasaptanal.com';
    }
    get interval() {
        return '* * * * *';
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    _internalRun() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.run();
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Running@' + this.interval);
            this._internalRun().finally(() => {
                this._task = cron.schedule(this.interval, () => __awaiter(this, void 0, void 0, function* () {
                    this._internalRun();
                }));
            });
        });
    }
    stop() {
        if (this._task) {
            console.log('task destroyed');
            this._task.destroy();
        }
    }
}
exports.BaseTask = BaseTask;

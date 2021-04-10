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
const helper_1 = require("../helper");
const cron = require("node-cron");
class BaseTask {
    constructor(name) {
        this.name = name;
        this._runningJob = null;
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
                console.log(`Running task ${this.name}`);
                this._runningJob = this.run();
                yield this._runningJob;
            }
            catch (err) {
                helper_1.default.logError(err, {
                    method: `RunJob`,
                    task: this.name
                });
            }
            finally {
                this._runningJob = null;
                console.log(`Completed task ${this.name}`);
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting@' + this.name + this.interval);
            yield this._internalRun().finally(() => {
                this._task = cron.schedule(this.interval, () => __awaiter(this, void 0, void 0, function* () {
                    yield this._internalRun();
                }));
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._runningJob) {
                console.log('waiting for task to finish..' + this.name);
                yield Promise.all([this._runningJob]);
                console.log('task finished.' + this.name);
            }
            if (this._task) {
                console.log('crontask destroying..' + this.name);
                this._task.destroy();
            }
        });
    }
}
exports.BaseTask = BaseTask;

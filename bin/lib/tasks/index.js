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
const helper_1 = require("../helper");
let appRoutes = [
    './butcherstats',
    './productstats',
    './reviewstask',
    './rutins',
    './areatask',
    './orderbutcherremainers',
    './ordercustomerremainers'
];
class TaskLoader {
    static stop() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Stopping tasks ...");
            for (let i = 0; i < TaskLoader.tasks.length; i++) {
                try {
                    console.log(`waiting for task to stop: ${i}`);
                    yield TaskLoader.tasks[i].stop();
                    console.log(`task stopped: ${TaskLoader.tasks[i].name}`);
                }
                catch (err) {
                    helper_1.default.logError(err, {
                        method: 'TaskLoader.stop',
                        task: TaskLoader.tasks[i].name
                    });
                }
            }
            console.log("Stoppoed all tasks ...");
        });
    }
    static start() {
        return __awaiter(this, void 0, void 0, function* () {
            // process.on('exit', (code) => {
            //     console.log(`About to exit with code: ${code}`);
            // });  
            var routings = [];
            appRoutes.forEach((file) => {
                var type = require(file).default;
                let instance = new type(file);
                TaskLoader.tasks.push(instance);
            });
            TaskLoader.tasks.forEach(t => {
                t.init();
            });
            return routings;
        });
    }
}
exports.default = TaskLoader;
TaskLoader.tasks = [];

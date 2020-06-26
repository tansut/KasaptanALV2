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
let appRoutes = [
    './butcherstats',
    './productstats',
    './reviewstask',
    './rutins',
    './areatask'
];
class TaskLoader {
    static start() {
        return __awaiter(this, void 0, void 0, function* () {
            process.on('exit', (code) => {
                console.log(`About to exit with code: ${code}`);
                TaskLoader.tasks.forEach(t => {
                    t.stop();
                });
            });
            var routings = [];
            appRoutes.forEach((file) => {
                var type = require(file).default;
                let instance = new type();
                TaskLoader.tasks.push(instance);
            });
            TaskLoader.tasks.forEach((t) => __awaiter(this, void 0, void 0, function* () {
                t.init();
            }));
            return routings;
        });
    }
}
exports.default = TaskLoader;
TaskLoader.tasks = [];

//# sourceMappingURL=index.js.map

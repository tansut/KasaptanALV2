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
exports.App = void 0;
const compression = require('compression');
const context_1 = require("./db/context");
const session = require("express-session");
const flash = require('connect-flash');
const index_1 = require("./lib/tasks/index");
const SessionStore = require('express-session-sequelize')(session.Store);
const fileUpload = require('express-fileupload');
const bluebird = require("bluebird");
bluebird.config({
    warnings: false
});
class KasaptanAlTasksApp {
    shutDown() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('Received kill signal taks, shutting down gracefully');
            // Tasks.stop().finally(() => {
            //     db.getContext().close().finally(()=> {
            //         process.exit(0);
            //       })
            //   })
        });
    }
    constructor() {
    }
    bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            let dbinstance = yield context_1.default.init(true);
            // process.on('SIGTERM', this.shutDown.bind(this));
            // process.on('SIGINT', this.shutDown.bind(this));
            yield index_1.default.start();
        });
    }
}
exports.default = () => (exports.App = new KasaptanAlTasksApp());

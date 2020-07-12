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
const router_1 = require("../../lib/router");
const google_1 = require("../../lib/google");
class Route extends router_1.ApiRouter {
    geocode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req.body.address)
                return this.next();
            let coded = yield google_1.Google.getLocation(this.req.body.address);
            this.res.send(coded);
        });
    }
    static SetRoutes(router) {
        router.post("/geocode", Route.BindRequest(this.prototype.geocode));
    }
}
exports.default = Route;

//# sourceMappingURL=userapi.js.map

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
const basetask_1 = require("./basetask");
const sq = require("sequelize");
const sequelize_1 = require("sequelize");
const area_1 = require("../../db/models/area");
class AreaTask extends basetask_1.BaseTask {
    get interval() {
        return "0 0 */1 * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running AreaTask job', Date.now());
            let items = yield area_1.default.sequelize.query(`
        
        select id from Areas where level=1 and status='active'
        union
        select id from Areas ap where ap.level=2 and ( ap.id in 
        (
        SELECT distinct a.parentid FROM  Areas a where 
        (a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=3))
        ) or 
        (ap.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=2))
        )
        union SELECT a.id FROM  Areas a where 
        (a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=3))
        union select id from Areas ap where ap.level=3 and ( ap.id in 
            (
            SELECT distinct a.id FROM  Areas a where 
            (a.parentid in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=2))
            )) 
            `, {
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            });
            let arr = items.map(i => i['id']);
            yield area_1.default.update({
                status: 'active'
            }, {
                where: {
                    id: {
                        [sequelize_1.Op.in]: arr
                    }
                }
            });
            yield area_1.default.update({
                status: 'generic'
            }, {
                where: {
                    id: {
                        [sequelize_1.Op.notIn]: arr
                    }
                }
            });
            console.log('done AreaTask job', Date.now());
        });
    }
}
exports.default = AreaTask;

//# sourceMappingURL=areatask.js.map

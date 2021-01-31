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
const context_1 = require("../../db/context");
class AreaTask extends basetask_1.BaseTask {
    get interval() {
        return "0 0 */1 * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running AreaTask job', Date.now());
            let items = yield area_1.default.sequelize.query(`
        select distinct areaLevel2Id as id from Orders
        union
        select distinct areaLevel3Id as id from Orders
        union
        select id from Areas where level=1 and status='active'
        

            `, 
            //     union
            // select id from Areas ap where ap.level=2 and ( ap.id in 
            // (
            // SELECT distinct a.parentid FROM  Areas a where 
            // (a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.enabled=1 and d.toarealevel=3))
            // ) or 
            // (ap.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.enabled=1 and d.toarealevel=2))
            // )
            // union SELECT a.id FROM  Areas a where 
            // (a.id in (SELECT distinct d.toareaid FROM Dispatchers d where d.enabled=1 and d.toarealevel=3))
            // union select id from Areas ap where ap.level=3 and ( ap.id in 
            //     (
            //     SELECT distinct a.id FROM  Areas a where 
            //     (a.parentid in (SELECT distinct d.toareaid FROM Dispatchers d where d.toarealevel=2))
            //     )) 
            {
                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            });
            let arr = items.map(i => i['id']);
            let res = context_1.default.getContext().transaction((t) => {
                let result = [];
                result.push(area_1.default.update({
                    status: 'generic'
                }, {
                    transaction: t,
                    where: {
                        level: {
                            [sequelize_1.Op.notIn]: [1]
                        }
                    }
                }));
                result.push(area_1.default.update({
                    status: 'active'
                }, {
                    transaction: t,
                    where: {
                        id: {
                            [sequelize_1.Op.in]: arr
                        }
                    }
                }));
                return Promise.all(result);
            });
            yield res;
            let emptyLoc = yield area_1.default.findAll({
                where: {
                    locationData: {
                        [sequelize_1.Op.eq]: null
                    },
                    level: [1, 2, 3, 4]
                },
                limit: 1000
            });
            yield emptyLoc.forEach((l) => __awaiter(this, void 0, void 0, function* () { return yield l.ensureLocation(); }));
            let sql = `update Areas t1
inner join Areas t2 on t1.parentid = t2.id
set t1.dispatchTag = t2.dispatchTag,  t1.status = t2.status
where t1.level=4`;
            yield area_1.default.sequelize.query(sql, {
                type: sq.QueryTypes.BULKUPDATE,
            });
            console.log('done AreaTask job', Date.now());
        });
    }
}
exports.default = AreaTask;

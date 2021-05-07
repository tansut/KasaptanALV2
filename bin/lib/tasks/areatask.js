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
        return "0 0 * * *";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('running AreaTask job', Date.now());
            // let items = await Area.sequelize.query(`
            // select distinct areaLevel2Id as id from Orders
            // union
            // select distinct areaLevel3Id as id from Orders
            // union
            // select id from Areas where level=1 and status='active'
            //     `,
            //     {
            //         type: sq.QueryTypes.SELECT,
            //         mapToModel: false,
            //         raw: true
            //     })
            // let arr = items.map(i => i['id']);
            // await Area.update({
            //     status: 'generic'
            // },
            //     {
            //         where: {
            //             level: {
            //                 [Op.notIn]: [1]
            //             }
            //         }
            //     }
            // )
            // await Area.update({
            //     status: 'active'
            // },
            //     {
            //         where: {
            //             id: {
            //                 [Op.in]: arr
            //             }
            //         }
            //     }
            // )
            let emptyLoc = yield area_1.default.findAll({
                where: {
                    locationData: {
                        [sequelize_1.Op.eq]: null
                    },
                    level: [1, 2, 3, 4]
                },
                limit: 1000
            });
            yield emptyLoc.forEach((l) => __awaiter(this, void 0, void 0, function* () {
                yield l.ensureLocation();
                yield new Promise(r => setTimeout(r, 5));
            }));
            let sql = `update Areas t1
inner join Areas t2 on t1.parentid = t2.id
set t1.dispatchTag = t2.dispatchTag,  t1.status = t2.status
where t1.level=4`;
            yield area_1.default.sequelize.query(sql, {
                type: sq.QueryTypes.BULKUPDATE,
            });
            let emptyDisplay = yield area_1.default.findAll({
                where: {
                    display: {
                        [sequelize_1.Op.eq]: null
                    }
                }
            });
            yield emptyDisplay.forEach((p) => __awaiter(this, void 0, void 0, function* () {
                yield p.loadRelatedAreas();
                p.display = p.getDisplay();
                yield p.save();
                yield new Promise(r => setTimeout(r, 5));
            }));
            console.log('done AreaTask job', Date.now());
        });
    }
}
exports.default = AreaTask;

import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";
import Review from "../../db/models/review";
import { Op, Sequelize, Transaction } from "sequelize";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import db from "../../db/context";



export default class AreaTask extends BaseTask {

    get interval() {
        return "0 0 */1 * * *"
    }



    async run() {
        console.log('running AreaTask job', Date.now())

        let items = await Area.sequelize.query(`
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
            })

        let arr = items.map(i => i['id']);

        let res = db.getContext().transaction((t: Transaction) => {
            let result = []
            result.push(
                Area.update({
                    status: 'generic'
                },
                    {
                        transaction: t,
                        where: {
                            level: {
                                [Op.notIn]: [1]
                            }
                        }
                    }
                )
            )
            result.push(Area.update({
                status: 'active'
            },
                {
                    transaction: t,
                    where: {
                        id: {
                            [Op.in]: arr
                        }
                    }
                }
            ))


            
            
            return Promise.all(result)
        })

        await res;

        let emptyLoc = await Area.findAll({
            where: {
                locationData: {
                    [Op.eq]: null
                },
                level: [1,2,3,4]
            },
            limit: 1000
        })

        let sql = `update areas t1
inner join areas t2 on t1.parentid = t2.id
set t1.dispatchTag = t2.dispatchTag,  t1.status = t2.status
where t1.level=4`;

        await Area.sequelize.query(sql, {
            type: sq.QueryTypes.BULKUPDATE,
        });


        await emptyLoc.forEach(async l=>await l.ensureLocation());

        console.log('done AreaTask job', Date.now())

    }
}
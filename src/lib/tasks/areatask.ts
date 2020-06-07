import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";
import Review from "../../db/models/review";
import { Op, Sequelize } from "sequelize";
import Product from "../../db/models/product";
import Area from "../../db/models/area";



export default class AreaTask extends BaseTask {

    get interval() {
        return "0 0 */1 * * *"
    }



    async run() {
        console.log('running AreaTask job', Date.now())

        let items = await Area.sequelize.query(`
        
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
            `,
            {

                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            })

        let arr = items.map(i => i['id']);


        await Area.update({
            status: 'active'
        },
            {
                where: {
                    id: {
                        [Op.in]: arr
                    }
                }
            }
        )

        await Area.update({
            status: 'generic'
        },
            {
                where: {
                    id: {
                        [Op.notIn]: arr
                    }
                }
            }
        )

        console.log('done AreaTask job', Date.now())

    }
}
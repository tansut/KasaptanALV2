import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import { Op, Sequelize } from "sequelize";
import Product from "../../db/models/product";
import Area from "../../db/models/area";
import db from "../../db/context";
import Helper from "../helper";



export default class AreaTask extends BaseTask {

    get interval() {
        return "0 0 * * *"
    }



    async run() {
        console.log('running AreaTask job', Helper.formatDate(Helper.Now(), true))

        let items = await Area.sequelize.query(`
        select distinct areaLevel2Id as id from Orders
        union
        select distinct areaLevel3Id as id from Orders
        union
        select distinct id from Areas where level=1 and status='active'
        

             `,
            {

                type: sq.QueryTypes.SELECT,
                mapToModel: false,
                raw: true
            })

        let arr = items.map(i => i['id']);

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
    
        await Area.update({
            status: 'active'
        },
            {
                
                where: {
                    id: {
                        [Op.in]: arr
                    },
                    status: {
                        [Op.ne]: 'active'
                    }
                }
            }
        )

        let emptyLoc = await Area.findAll({
            where: {
                locationData: {
                    [Op.eq]: null
                },
                level: [1,2,3,4]
            },
            limit: 100
        })


        await emptyLoc.forEach(async l=> {
            await l.ensureLocation();
            await new Promise(r => setTimeout(r, 5));
        });
        
        let sql = `update Areas t1
inner join Areas t2 on t1.parentid = t2.id
set t1.dispatchTag = t2.dispatchTag,  t1.status = t2.status
where t1.level=4`;

        await Area.sequelize.query(sql, {
            type: sq.QueryTypes.BULKUPDATE,
        });


        let emptyDisplay = await Area.findAll({
            where: {
                display: {
                    [Op.eq]: null
                }
            }            
        })        

        await emptyDisplay.forEach(async p=> {
            await p.loadRelatedAreas();
            p.display = p.getDisplay();
            await p.save();
            await new Promise(r => setTimeout(r, 5));
        })

        console.log('done AreaTask job', Helper.formatDate(Helper.Now(), true))

    }
}
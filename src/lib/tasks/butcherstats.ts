import { BaseTask } from "./basetask";
import { Order } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";


export default class ButcherStats extends BaseTask {

    get interval() {
        return "0 0 */9 * * *"
    }

    async updateButcher(butcherid: number, success: number, fail: number) {
        
        await Butcher.update({
            shipTotalCount: fail + success,
            shipFailureCount: fail
        }, {
            where: {
                id: butcherid
            }
        });
    }

    async run() {
        console.log('running butchers job', Date.now())
        let prods = await Order.sequelize.query<any>("SELECT butcherid, status, count(*) as total FROM Orders  group by butcherid, status order by butcherid",
        {            
            type: sq.QueryTypes.SELECT,
            mapToModel: false,
            raw: true
        })

        let rates = await Order.sequelize.query<any>("SELECT ref2, avg(userRating1) as avg, count(*) as total FROM Reviews group by ref2;",
        {            
            type: sq.QueryTypes.SELECT,
            mapToModel: false,
            raw: true
        })

        for(let i=0; i < rates.length;i++) {
            let r = rates[i]; 
            await Butcher.update({
                userRating: r.avg,
                userRatingCount: r.total
            }, {
                where: {
                    id: r.ref2
                }
            })
        }
        

        let lastButcher = null, lastSuccess = 0, lastFail = 0;

        for(var i = 0; i < prods.length;i++) {
            let b = prods[i];
            if (!lastButcher) lastButcher = b.butcherid;
            if (lastButcher != b.butcherid) {
                await this.updateButcher(lastButcher, lastSuccess, lastFail);
                lastButcher = b.butcherid;
                lastSuccess = 0;
                lastFail = 0;
            } 
                if (b.status == OrderItemStatus.success) {
                    lastSuccess+=b.total;
                } else if ((b.status == OrderItemStatus.butcherCannotProvide) || (b.status == OrderItemStatus.butcherCannotShip)) {
                    lastFail+=b.total;
                } else {
                }
            
        };

        if (lastButcher) {
            await this.updateButcher(lastButcher, lastSuccess, lastFail)
        } 

        console.log('done butchers job', Date.now())

        // console.log('stats start');
        // return new Promise((resolve, reject) => {
        //     setTimeout(() => {
        //         console.log('completed');
        //         resolve()
        //     }, 250);
        // })
    }
}
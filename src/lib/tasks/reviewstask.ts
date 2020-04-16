import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";
import Review from "../../db/models/review";
import { Op, Sequelize } from "sequelize";
import Product from "../../db/models/product";



export default class ButcherStats extends BaseTask {

    get interval() {
        return "0 0 */1 * * *"
    }



    async run() {
        console.log('running reviews job', Date.now())
        let reviews = await Review.findAll({
            where: {
                settingsjson: {
                    [Op.is]: null
                },
                type: 'order'
            }
        })


        reviews.forEach(async r => {
            let products = await OrderItem.findAll(
                {
                    where: {
                        orderid: r.ref1,
                        status: OrderItemStatus.success
                    },
                    include: [{
                        model: Product
                    }]
                }
            ).map(async oi => oi.product)
            if (products.length) {
                r.settings = {
                    products: products.map(p => {
                        return {
                            name: p.name,
                            slug: p.slug,
                            id: p.id
                        }
                    })
                }
                await r.save();
            }
        })

        console.log('done reviews job', Date.now())

    }
}
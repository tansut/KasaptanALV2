import { BaseTask } from "./basetask";
import { Order, OrderItem } from "../../db/models/order";
import * as sq from 'sequelize';
import { OrderItemStatus } from "../../models/order";
import Butcher from "../../db/models/butcher";
import Review from "../../db/models/review";
import { Op, Sequelize } from "sequelize";
import Product from "../../db/models/product";
import Category from "../../db/models/category";
import ProductCategory from "../../db/models/productcategory";



export default class ButcherStats extends BaseTask {

    get interval() {
        return "0 0 */6 * * *"
    }



    async run() {
        console.log('running popular products job', Date.now());

        let popular = await Category.findOne({where: {slug: "populer-etler"}});
        if (!popular) return;
        await ProductCategory.destroy({
            where: {
                categoryid: popular.id
            } 
        });
        await Order.sequelize.query(`
        
        insert into ProductCategories (displayOrder,                      creationDate,   updatedOn,           productid,        categoryid)
        SELECT count(*) as total, now(), now(), p.id, :popular  FROM OrderItems oi, Products p where p.id =oi.productid  group by p.id order by total desc limit 30;
        

        `,
            {
                replacements: { popular: popular.id},
                type: sq.QueryTypes.BULKUPDATE,
            });



        console.log('done popular job', Date.now())

    }
}
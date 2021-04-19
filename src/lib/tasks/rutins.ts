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
import Helper from "../helper";



export default class ButcherStats extends BaseTask {

    get interval() {
        return "30 0 * * *"
    }



    async run() {
        console.log('running popular products job', Date.now());

        let popular = await Category.findOne({where: {slug: "populer-etler"}});
        let popularWeek = await Category.findOne({where: {slug: "bu-hafta"}});
        
        if (!popular || !popularWeek) return;
        await ProductCategory.destroy({
            where: {
                categoryid: popular.id
            } 
        });

        // await ProductCategory.destroy({
        //     where: {
        //         categoryid: popularWeek.id
        //     } 
        // });

        let numWeeks = -4;
        let startWeek = Helper.Now();
        startWeek.setDate(startWeek.getDate() + numWeeks * 7);

        await Order.sequelize.query(`
        
        insert into ProductCategories (displayOrder,                      creationDate,   updatedOn,           productid,        categoryid)
        SELECT count(*) as total, now(), now(), p.id, :popular  FROM OrderItems oi, Products p where oi.creationDate > :start && p.id =oi.productid  group by p.id order by total desc limit 30;
        

        `,
            {
                replacements: {start: startWeek, popular: popular.id},
                type: sq.QueryTypes.BULKUPDATE,
            });



            // await Order.sequelize.query(`
        
            // insert into ProductCategories (displayOrder,                      creationDate,   updatedOn,           productid,        categoryid)
            // SELECT count(*) as total, now(), now(), p.id, :popular  FROM OrderItems oi, Products p where oi.creationDate > :start and p.id =oi.productid  group by p.id order by total desc limit 10;
            
    
            // `,
            //     {

            //         replacements: { start: startWeek, popular: popularWeek.id},
            //         type: sq.QueryTypes.BULKUPDATE,
            //     });

        console.log('done popular job', Date.now())

    }
}
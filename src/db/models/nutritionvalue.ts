import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import { Json } from 'sequelize/types/lib/utils';
import { NutitionValueItemView, NutritionValueTitles, NutritionValueOrders, NutritionValueView, NutritionView } from '../../models/common';
import NutritionValueItem from './nutritionvalueitem';


@Table({
    tableName: "NutritionValues",
    indexes: []
})
class NutritionValue extends BaseModel<NutritionValue> {

    @Column({
        allowNull: false
    })
    type: string;

    @Column({
        allowNull: false
    })
    ref: number;

    @Column({
        allowNull: false
    })
    name: string;

    @Column({
        allowNull: false
    })
    unit: string;

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(7,2)
    })
    amount: number;

    @Column({
        allowNull: true,
    })
    description: string;

    @Column({
        allowNull: false
    })
    calories: number;

    @Column({
        allowNull: true
    })
    displayOrder: number;

    @Column({
        allowNull: true
    })
    source: string;

    @Column({
        allowNull: true
    })
    sourceUrl: string;

    @HasMany(() => NutritionValueItem, {
        sourceKey: "id",
        foreignKey: "nutritionid",
        
    })
    items: NutritionValueItem[];


    get NutritionValues(): NutitionValueItemView [] {
        let result: NutitionValueItemView[] = [];
        this.items.forEach(i=> {
            result.push({
                title: NutritionValueTitles[i.type] || i.type,
                amount: i.amount,
                unit:i.unit,
                type: <any>i.type
            })
        })
        return result.sort((a, b) => {
            let ap = NutritionValueOrders[a.type];
            let bp = NutritionValueOrders[b.type];
            return ap - bp
        });
    }

    generateView(based: NutritionValue) {
        let ratio = this.amount / based.amount;
        this.calories = Math.round(ratio * based.calories);
        this.source = based.source;
        this.sourceUrl = based.sourceUrl;
        this.description = this.description || based.description;
        this.items = [];
        based.items.forEach(i=> {
            let newItem = new NutritionValueItem(i.toJSON());
            newItem.amount = Number((newItem.amount * ratio).toFixed(1)); 
            this.items.push(newItem);
        })
    }

    static async loadView(type: string, ref: number): Promise<NutritionView> {
        let items = await NutritionValue.findAll({
            where: {
                type: type,
                ref: ref
            },
            include: [
                {
                    model: NutritionValueItem
                }
            ],
            order: [['displayOrder', 'desc']]
        });
        let result: NutritionView = {
            dailyValues: {
                'calories': 2000,
                'fat': { 'gr': 78},
                'fat:saturated': { 'gr': 20},
                'cholesterol': { 'mg': 300},
                'sodium': { 'mg': 2300},
                'carb': { 'gr': 275},
                'carb:fiber': { 'gr': 28},
                'protein': { 'gr': 50},
                'vitamin:a': {'IU': 5000},
                'vitamin:c': {'mg': 90},
                'vitamin:d': {'IU': 400},
                'vitamin:e': {'mg': 30},
                'vitamin:b6': {'mg': 2},
                'vitamin:iron': {'mg': 18},
                'vitamin:magnesium': {'mg': 400},
                'vitamin:cobalamin': {'µg': 6},
                'vitamin:calcium': {'mg': 1000},

                
        
                
            },
            values: []
        };
        for(let i=0; i < items.length;i++) {
            if (!items[i].calories) {
                let best = items.find(p=>(p.calories > 0 && p.unit == items[i].unit));
                if (best) items[i].generateView(best)
            }
            let newItem = {
                amount: items[i].amount,
                name: items[i].name,
                calories: items[i].calories,
                unit: items[i].unit,
                values: items[i].NutritionValues,
                source: items[i].source,
                sourceUrl: items[i].sourceUrl,
                description: items[i].description
            };

            result.values.push(newItem)
        }
        return result;
    }

} 

export default NutritionValue;
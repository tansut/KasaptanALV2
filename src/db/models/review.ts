import { Table, Column, DataType, Model, HasMany, CreatedAt, UpdatedAt, DeletedAt, Unique, Default, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import BaseModel from "./basemodel"
import Helper from '../../lib/helper';
import ProductCategory from './productcategory';
import ButcherProduct from './butcherproduct';

@Table({
    tableName: "Reviews",
    indexes: [{
        name: "review_idx1",
        fields: ["type", "ref1"]
    },

    {
        name: "review_idx2",
        fields: ["type", "ref2"]
    }]
})

class Review extends BaseModel<Review> {

    @Column({
        allowNull: false,
    })
    userId: number;

    @Column({
        allowNull: false,
    })
    displayUser: string;
    
    @Column({
        allowNull: false,
    })
    type: string;

    @Column({
        allowNull: false,
    })
    ref1: number;

    @Column({
        allowNull: true,
    })
    ref1Text: string;    


    @Column({
        allowNull: true,
    })
    itemDate: Date;   

    @Column({
        allowNull: true,
    })
    ref2: number;

    @Column({
        allowNull: true,
    })
    ref2Text: string;        

    @Column({
        allowNull: true        
    })
    ref1slug: string;        
    
    @Column({
        allowNull: true        
    })
    ref2slug: string;     

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    content: string;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(5, 2)
    })    
    userRating1: number;  

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(5, 2)
    })    
    userRating2: number;  

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(5, 2)
    })    
    userRating3: number;     

    @Column({
        allowNull: true        
    })
    level1Id: number;  
    
    @Column({
        allowNull: true        
    })
    level2Id: number;     
    
    @Column({
        allowNull: true        
    })
    level3Id: number;          
    
    @Column({
        allowNull: true        
    })
    level1Text: string;  
    
    @Column({
        allowNull: true        
    })
    level2Text: string;     
    
    @Column({
        allowNull: true        
    })
    level3Text: string;    
    
    @Column({
        allowNull: true        
    })
    areaSlug: string;       
         


    @Column({
        type: DataType.TEXT
    })
    settingsjson: string

    get settings(): any {
        return this.settingsjson ? JSON.parse(this.getDataValue('settingsjson')) : null
    }

    set settings(value: any) {
        this.setDataValue('settingsjson', JSON.stringify(value));
    }

}

export default Review;
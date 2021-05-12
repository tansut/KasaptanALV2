import { App } from "./app";
import { Backend } from "./backend";


export class ShopCard {

    static async removeItem(id: string) {
    
            return await Backend.post('shopcard/remove', {
                id: id
            });
    }



    static async remove(i) {
        try {
            let result = await Backend.post('shopcard/remove', {
                order: parseInt(i)
            });
            location.reload();
        } catch (err) {
            App.HandleError(err);
        }
    }

    static async add() {
        event.preventDefault();
        if ((<HTMLFormElement>$("#product-form")[0]).checkValidity()) {
            var id = parseInt(<string>$('#product-id').val());
            var quantity = 12;
            try {
                let result = await Backend.post('shopcard/add', {
                    id: id,
                    quantity: quantity
                });
                (<any>window).shopcard.card.data = result; // = result.total;
                App.alert("Eklendi.", "info")
            } catch (err) {
                App.HandleError(err);
            }
        }
    }





}
window.initComponents = function initComponents() {

    function weighToText(kgw) {
        var kg = Math.floor(kgw);
        var gr = Math.round((kgw - kg) * 1000)

        let grt = "";
        if (gr == 500) grt = kg > 0 ? "buçuk kg" : "yarım kg";
        else if (gr == 0) grt = ""
        else grt = `${gr}gr`;

        if (gr == 500)
            return (kg > 0 ? `${kg} ` : ``) + grt || "";
        else return (kg > 0 ? `${kg} kg ` : ``) + grt || "";
    }

    Vue.component('weight-view', {
        template: `<span>{{text}}</span>`,
        props: {
            kg: { type: Number, default: 0 }
        },

        data: function () {
            return {

            }
        },

        methods: {
            grtext(kg, gr) {

            }
        },

        computed: {
            text: function () {
                return weighToText(this.kg)
            }
        }
    })




Vue.component('amount-input', {
    template: `
            <div class="d-flex align-items-center justify-content-center">
                <button type="button" @click="decrement()" class="btn btn-lg btn-outline mr-4"><i class="czi-arrow-left-circle"></i></button>
                <div class="d-inline text-center" style="min-width:5rem">
                    <div class="font-size-lg text-accent " v-if="unit!='kg'">
                        <span class="mb-1 font-weight-medium">{{value}}</span>
                        <small>{{unit}}</small>
                    </div>
                    <div class="text-accent font-size-lg font-weight-medium">
                        <weight-view v-if="unit=='kg'" :kg="value"></weight-view>
                    </div>
                </div>
                <button type="button" @click="increment()" class="btn btn-lg btn-outline ml-4"><i class="czi-arrow-right-circle"></i></button>
            </div>    
              `,
    props: {
        unit: { type: String, default: "" },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        def: { type: Number },
        value: { type: Number }
    },

    mounted: function () {
        this.$nextTick(function () {
            this.updateView();
        })
    },

    data: function () {
        return {
            value: 1
        }
    },


    methods: {

        increment() {
            let newVal = this.value + this.step;
            if (newVal <= this.max) {
                this.value = newVal;
            }
            //this.$emit('input', this.value)            
        },

        decrement() {
            let newVal = this.value - this.step;
            if (newVal >= this.min) {
                this.value = newVal;
            }
            //this.$emit('input', this.value)     
        },

        updateView: function () {
            // if (this.adets.length == 0) {
            //     for (var i = this.min; i < this.max + 1; i += this.step) {
            //         this.adets.push({
            //             val: i,
            //             text: `${i}`
            //         })
            //         this.adet = this.def
            //     }
            //     this.$emit('input', this.adet)
            // }

        }
    },

    watch: {
        value: function (newVal, oldVal) {
            this.$emit('input', this.value)
        },

        def: function (newVal, oldVal) {
            this.value = newVal
        }
    }
})



    Vue.component('adet-input', {
        template: `<div class="row">
                        <div class="col-6">
                            <select v-model="adet" class="custom-select" required>
                            <option v-for="option in adets" v-bind:value="option.val" >{{ option.text }}</option>               </select>                            
                        </div>
                   </div>`,
        props: {
            unit: { type: String, default: "" },
            min: { type: Number },
            max: { type: Number },
            step: { type: Number },
            def: { type: Number }
        },

        mounted: function () {
            this.$nextTick(function () {
                this.updateView();
            })
        },

        data: function () {
            return {
                adet: 1,

                adets: [

                ]
            }
        },


        methods: {
            updateView: function () {
                if (this.adets.length == 0) {
                    for (var i = this.min; i < this.max + 1; i += this.step) {
                        this.adets.push({
                            val: i,
                            text: `${i}`
                        })
                        this.adet = this.def
                    }
                    this.$emit('input', this.adet)
                }

            }
        },

        watch: {
            adet: function (newVal, oldVal) {
                this.$emit('input', this.adet)
            },

            def: function (newVal, oldVal) {
                this.adet = newVal
            }
        }
    })

    Vue.component('weight-input', {
        template: `<div class="row">
                        <div class="col-6">
                            <select required v-model="kgSelected" class="custom-select" required>
                            <option  v-for="option in kgs" v-bind:value="option.val" >{{ option.text }}</option>               </select>                            
                        </div>
                       <div class="col-6">
                            <select required v-if="Math.trunc(kgSelected) == kgSelected" v-model="grSelected" class="custom-select" required>
                            <option  v-for="option in grs" v-bind:value="option.val" >{{ option.text }}</option></select>
                        </div>
                   </div>`,
        props: {
            value: { type: Number, default: 0 },
            min: { type: Number },
            max: { type: Number },
            step: { type: Number },
            def: { type: Number }

        },

        mounted: function () {
            this.$nextTick(function () {
                this.updateView();
            })
        },

        data: function () {
            return {
                kgSelected: 0,
                grSelected: 0,

                kgs: [

                ],
                grs: [
                    // {val: 0, text: "-",},
                    // {val: 250, text: "250gr"},
                    // {val: 500, text: "500gr"},
                    // {val: 750, text: "750gr"}                                    
                ]
            }
        },


        methods: {

            calculateQuantity() {
                var n = this.kgSelected + (this.grSelected || 0) / 1000
                return Number(n.toFixed(2));
            },

            syncUi(value) {
                var kgt = value;
                if (value != 0.50 && value != 1.5) {
                    kgt = Number(Math.floor(value).toFixed(2));
                }
                var grt = Number(Math.round((value - kgt) * 1000).toFixed(2));
                var grneares = Math.ceil(grt / (this.step * 1000)) * (this.step * 1000);
                let foundkg = this.kgs.find(p => p.val == kgt);
                if (foundkg) {
                    this.kgSelected = kgt;
                    this.grSelected = grneares;

                } else {
                    this.kgSelected = kgt;
                    this.grSelected = grneares;
                }
            },

            updateView: function () {
                if (this.kgs.length == 0) {
                    if (this.min < 1) {
                        this.kgs.push({ val: 0, text: '-' });
                    }
                    for (var i = this.min; i <= this.max; i += this.step) {
                        i = Number(i.toFixed(2));
                        if (i.toFixed(2) == '0.50') {
                            this.kgs.push({ val: i, text: weighToText(i) });
                        } 
                        if (i.toFixed(2) == '1.50') {
                            this.kgs.push({ val: i, text: weighToText(i) });
                        } else if (Math.floor(i).toFixed(2) == i.toFixed(2)) {
                            this.kgs.push({ val: i, text: weighToText(i) });
                        }
                    }
                    this.grs.push({ val: 0, text: "-", });

                    for (var i = this.step; i < 1; i += this.step) {
                        i = Number(i.toFixed(2));
                        this.grs.push({ val: i * 1000, text: i * 1000 + 'gr' });
                    }
                }
                this.syncUi(this.value)
            }
        },

        watch: {
            kgSelected: function (newVal, oldVal) {
                this.$emit('input', this.calculateQuantity())
            },

            grSelected: function (newVal, oldVal) {
                this.$emit('input', this.calculateQuantity())
            },

            value: function (newVal, oldVal) {
                this.syncUi(newVal)
            }
        }
    })

    window.App.WeightCalculatorApp = new Vue({
        el: '#size-chart',
        data: function () {
            return {
                product: null,
                personcount: 0,
                meal: 2,
                note: null,
                options: {}
            }

        },

        methods: {
            onChange(event) {
                //console.log(this.selected)
            },

            show(options) {
                this.options = options || {};
                this.personcount = 0;
                $('#size-chart').modal("show");       
                return new Promise((resolve, reject) => {
                    $(window).on('wc.setunit', function (e, option) {
                        resolve(option);
                    })
                })
            },

            setUnit(option) {
                $(window).trigger('wc.setunit', [option]);
            }
        },
        computed: {

            result: function () {
                let res = []; 
                if (this.product) {
                    for (var i = 0; i < this.product.purchaseOptions.length; i++) {
                        if (this.options.unit && this.options.unit != this.product.purchaseOptions[i].unit)
                            continue;
                        var q = this.meal * this.personcount * this.product.purchaseOptions[i].perPerson;
                        if (q < this.product.purchaseOptions[i].min) q = this.product.purchaseOptions[i].min;
                        else if (q > this.product.purchaseOptions[i].max) q = this.product.purchaseOptions[i].max
                        q = Math.ceil(q / this.product.purchaseOptions[i].step) * this.product.purchaseOptions[i].step;
                        res.push({
                            quantity: q,
                            unit: this.product.purchaseOptions[i].unit,
                            po: this.product.purchaseOptions[i]
                        })
                    }
                }
                return res;
            }
        }
    })

    window.App.ProductApp = new Vue({
        el: '#productapp',

        data: function () {
            return {
                product: null,
                quantity: 0,
                selectedUnit: null,
                note: '',
            }
        },
        mounted: function () {
            var self = this;
            $(window).on('wc.setunit', function (e, option) {
                self.selectedUnit = option.po;
                this.setTimeout(function () {
                    self.quantity = option.quantity;
                })
            })
        },
        methods: {
            onChange(event) {

            },

            selectArea() {
                window.kb.selectArea(function (sender, ul) {
                    window.location.href = "/adres-belirle/" + ul.selectedDistrict.slug + '?r=' + window.location.href;
                    //window.location.reload(true) // = "/" + window.App.ProductApp.product.slug + "?semt=" + ul.selectedDistrict.slug
              });                
            },

            showCalculator(unit) {
                window.App.WeightCalculatorApp.show({unit: unit.unit})
            },

            addToNote(note, unit, title, ratio) {
                this.ensureUnitSelected();
                
                var oldNote = this.note = "";
                if (oldNote.indexOf(note)<0) {                    
                    window.App.ProductApp.note = oldNote ? (oldNote + "\n" + note): note;
                }

                window.lgData.lg0.destroy();

                window.App.scrollToAnchor("#noteanchor");


                window.App.WeightCalculatorApp.show({
                    unit: unit,
                    ratio: ratio,
                    title: title
                }).then(function(result) {
                    $('#note').css({'background-color':'#fde9e8'});
                    setTimeout(() => {
                      $('#note').css({'background-color':'initial'});
                      
                    }, 1000); 
                })

                //$('#size-chart').modal("show");                
              },            

            ensureUnitSelected() {
                if (!this.selectedUnit) {
                    this.selectedUnit = this.product.purchaseOptions[0]                
                }
                
            },


            addToShopcard(event) {
                if (event.target.checkValidity()) {
                    return App.Backend.post('shopcard/add', {
                        id: this.product.id,
                        butcher: this.product.butcher,
                        quantity: this.quantity,
                        purchaseoption: this.selectedUnit,
                        note: this.note
                    }).then(result => {
                        //App.alert("Eklendi.", "info")
                        debugger;
                        $('#shopcard-added-toast').toast('show')
                        
                        return window.shopcard.card.data = result
                    }
                    ).catch(err => App.HandleError(err));
                }
            }
        },

        watch: {
            product: function (newVal, oldVal) {
                if (newVal) {
                    this.selectedUnit = (this.product.purchaseOptions.length > 1) ? null: this.product.purchaseOptions[0]
                    this.quantity = this.product.viewUnitAmount;
                    //this.note = product.note;
                }
            },
            selectedUnit: function (newVal, oldVal) {
                if (newVal) {
                    this.quantity = newVal.default;
                }
            },
        },
        computed: {

        }
    })

    window.App.ShopcardShipmentApp = new Vue({
        el: '#shopcardshipment',

        data: function () {
            return {
                card: null
            }
        },
        mounted: function () {

        },
        methods: {
        },

        watch: {
            selectedUnit: function (newVal, oldVal) {
                if (newVal) {
                    this.quantity = newVal.default;
                }
            },
        },
        computed: {

        }
    })
}
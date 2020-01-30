window.initComponents = function initComponents() {

    function weighToText(kgw) {
        var kg = Math.floor(kgw);
        var gr = Math.round((kgw - kg) * 1000)

        let grt = "";
        if (gr == 500) grt = kg > 0 ? ".5 kg" : "yarım kg";
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
             <div>
                <slot />
                    <div class="d-flex align-items-center justify-content-center">
                        <button type="button" @click="decrement()" class="no-zoom btn btn-lg btn-outline mr-4"><i class="czi-arrow-left-circle"></i></button>
                        <div class="d-inline text-nowrap text-center" style="min-width:5rem">
                            <div class="font-size-lg text-accent " v-if="unit!='kg'">
                                <span class="mb-1 font-weight-medium">{{value || '?'}}</span>
                                <small>{{unit}}</small>
                            </div>
                            <div class="text-accent font-size-lg font-weight-medium">
                                <weight-view v-if="unit=='kg'" :kg="value"></weight-view>
                            </div>
                        </div>
                        <button type="button" @click="increment()" class="no-zoom btn btn-lg btn-outline ml-4"><i class="czi-arrow-right-circle"></i></button>
                    </div>    
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

            normalized(val) {
                if (this.unit == 'kg') {
                    val = Number(val.toFixed(3))
                }
                return val;
            },

            increment() {
                let newVal = this.normalized(this.value + this.step);
                if (newVal <= this.max) {
                    this.value = newVal;
                }
                //this.$emit('input', this.value)            
            },

            decrement() {
                let newVal = this.normalized(this.value - this.step);
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
                this.value = this.value || newVal;
            }
        }
    })



    // Vue.component('adet-input', {
    //     template: `<div class="row">
    //                     <div class="col-6">
    //                         <select v-model="adet" class="custom-select" required>
    //                         <option v-for="option in adets" v-bind:value="option.val" >{{ option.text }}</option>               </select>                            
    //                     </div>
    //                </div>`,
    //     props: {
    //         unit: { type: String, default: "" },
    //         min: { type: Number },
    //         max: { type: Number },
    //         step: { type: Number },
    //         def: { type: Number }
    //     },

    //     mounted: function () {
    //         this.$nextTick(function () {
    //             this.updateView();
    //         })
    //     },

    //     data: function () {
    //         return {
    //             adet: 1,

    //             adets: [

    //             ]
    //         }
    //     },


    //     methods: {
    //         updateView: function () {
    //             if (this.adets.length == 0) {
    //                 for (var i = this.min; i < this.max + 1; i += this.step) {
    //                     this.adets.push({
    //                         val: i,
    //                         text: `${i}`
    //                     })
    //                     this.adet = this.def
    //                 }
    //                 this.$emit('input', this.adet)
    //             }

    //         }
    //     },

    //     watch: {
    //         adet: function (newVal, oldVal) {
    //             this.$emit('input', this.adet)
    //         },

    //         def: function (newVal, oldVal) {
    //             this.adet = newVal
    //         }
    //     }
    // })



    window.App.WeightCalculatorApp = new Vue({
        el: '#size-chart',
        data: function () {
            return {
                product: null,
                productView: null,
                personcount: 4,
                meal: 1,
                note: null,
                perperson: null,
                unit: null,
                cardnote: "",
                cardnoteph: "",
                food: {},
                title: '',
                resources: null,
                noteHeader: '',
                selectedResource: null
            }

        },

        methods: {
            onChange(event) {
                //console.log(this.selected)
            },

            foodResources() {
                var list = this.resources || [];
                return list.filter(function (item) {
                    return item.tag1 && (
                        (item.tag1.includes('yemek') || item.tag1.includes('tarif')) && item.settings && item.settings.po_perperson
                    )
                })
            },

            setResource(r) {
                r.settings = r.settings || {};
                this.personcount = this.personcount || (r.settings.po_personcount && Number(r.settings.po_personcount)) || this.defaultOptions.personcount || 4;
                this.cardnote = r.settings.defaultNote || this.defaultOptions.cardnote;
                this.perperson = (r.settings.po_perperson && Number(r.settings.po_perperson)) || this.defaultOptions.perperson;
                this.note = r.settings.po_quantityNote || this.defaultOptions.note;
                this.unit = r.settings.po_unit || this.defaultOptions.unit;
                //this.title = r.title || this.defaultOptions.title;
                this.noteHeader = r.title;
                // this.productView = r.thumbnailUrl;
                // if (this.productView) {
                //     this.food = {
                //         title: r.title,
                //         url: r.thumbnailUrl
                //     }
                // } else {
                //     this.food = null;
                // }
                this.selectedResource = r;
            },

            show(options) {
                options.personcount = options.personcount || 0;
                options.note = options.note || "";
                options.cardnote = options.cardnote || "";
                options.cardnoteph = options.cardnoteph || "";
                options.perperson = options.perperson || null;
                this.defaultOptions = options;
                this.unit = options.unit,
                    this.title = options.title,
                    this.personcount = options.personcount;
                this.perperson = options.perperson || null;
                this.note = options.note;
                this.cardnote = options.cardnote || "";
                this.cardnoteph = options.cardnoteph || "";
                this.food = options.food || {};
                this.productView = options.productView;
                this.resources = options.resources;

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
                        if (this.unit && this.unit != this.product.purchaseOptions[i].unit)
                            continue;
                        var q = this.meal * this.personcount * (this.perperson || this.product.purchaseOptions[i].perPerson);
                        q = Number(q.toFixed(3));
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

    window.App.FoodAlternativesApp = new Vue({
        el: '#food-alternative-meats',

        data: function () {
            return {
                list: [],
                title: ''
            }
        },

        methods: {
            show(list, title) {
                this.list = list;
                this.title = title
                $('#food-alternative-meats').modal("show");
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
                note: ''
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

            loadFromUrl() {

                var urlParams = new URLSearchParams(window.location.search);
                if (this.product && urlParams.has('selectedUnit')) {
                    this.selectedUnit = this.product.purchaseOptions.find(function (po) { return po.unit == urlParams.get('selectedUnit') })
                }


                if (this.product && urlParams.has('quantity')) {
                    this.quantity = parseFloat(urlParams.get('quantity'))
                }

                if (this.product && urlParams.has('note')) {
                    this.note = urlParams.get('note')
                }

            },

            selectArea(returnUrl) {
                var self = this;
                window.kb.selectArea(function (sender, ul) {
                    if (!returnUrl) {
                        returnUrl = '/' + self.product.slug + '?action=add2sc';
                        self.selectedUnit && (returnUrl += '&selectedUnit=' + encodeURIComponent(self.selectedUnit.unit))
                        self.quantity && (returnUrl += '&quantity=' + encodeURIComponent(self.quantity))
                        self.note && (returnUrl += '&note=' + encodeURIComponent(self.note))
                    }
                    window.location.href = "/adres-belirle/" + ul.selectedDistrict.slug + '?r=' + (encodeURIComponent(returnUrl));
                    //window.location.reload(true) // = "/" + window.App.ProductApp.product.slug + "?semt=" + ul.selectedDistrict.slug
                });
            },

            showCalculator(unit) {

                this.addToNote({
                    title: this.product.name,
                    note: this.note,
                    unit: unit.unit,
                    noteph: unit.notePlaceholder,
                    ponote: unit.weigthNote,
                    resources: this.product.resources
                })
            },

            addToNote(options) {
                this.ensureUnitSelected();







                window.App.WeightCalculatorApp.show({
                    unit: options.unit,
                    title: options.title,
                    // title: window.App.ProductApp.product.name,
                    food: options.food,
                    productView: options.productView,
                    personcount: options.personCount,
                    perperson: options.perperson,
                    note: options.ponote,
                    cardnote: options.note,
                    cardnoteph: options.noteph,
                    resources: options.resources
                }).then(function (result) {
                    window.App.ProductApp.note = window.App.WeightCalculatorApp.cardnote;
                    if (window.App.ProductApp.note) {
                        $('#note').css({ 'background-color': '#fde9e8' });
                        setTimeout(() => {
                            $('#note').css({ 'background-color': 'initial' });

                        }, 1000);
                    }
                    window.lgData.lg0.destroy();
                    window.App.scrollToAnchor("#noteanchor");
                }).catch(err => console.log(err))

                //$('#size-chart').modal("show");                
            },

            ensureUnitSelected() {
                if (!this.selectedUnit) {
                    this.selectedUnit = this.product.purchaseOptions[0]
                }

            },


            addToShopcard(event) {
                if ((!event) || event.target.checkValidity()) {
                    $('#addtoscbtn').attr("disabled", true)

                    return App.Backend.post('shopcard/add', {
                        id: this.product.id,
                        butcher: this.product.butcher,
                        quantity: this.quantity,
                        purchaseoption: this.selectedUnit,
                        note: this.note
                    }).then(result => {
                        $('#shopcard-added-toast').toast('show')
                        return window.shopcard.card.data = result
                    }
                    ).finally(() => {
                        $('#addtoscbtn').attr("disabled", false)
                    })

                        .catch(err => App.HandleError(err));
                }
            }
        },

        watch: {
            product: function (newVal, oldVal) {
                if (newVal) {
                    this.quantity = null;
                    this.$nextTick(function () {
                        this.loadFromUrl();
                        this.selectedUnit = this.selectedUnit || ((this.product.purchaseOptions.length > 1) ? null : this.product.purchaseOptions[0]);

                    })


                }
            },
            selectedUnit: function (newVal, oldVal) {
                if (newVal && oldVal) {
                    this.quantity = newVal.default;
                } else if (newVal) {
                    this.quantity = this.quantity || newVal.default
                }
                if (this.selectedUnit && this.quantity && window.App.ProductApp.add2ScOnce) {
                    window.App.ProductApp.add2ScOnce = false;


                    this.addToShopcard()

                }
            },
        },
        computed: {

        }
    })

    window.App.LocationSelectorApp = new Vue(
        {
            el: '#locationselect'

        }
    )

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
(function (window) {
    window.kb = window.kb || {}
    window.kb.userlocation = function () {
        var self =
        {
            loadIlces: function (city) {
                var options = this.options;
                $.ajax({
                    url: "/api/v1/area/children/" + city.id + "?level=2", success: function (list) {
                        $(options.ilceDomSelector).find('option').remove()
                        for (var i = 0; i < list.length; i++) {
                            $(options.ilceDomSelector).append('<option value="' + list[i].id + '">' + list[i].name + '</option>');
                        }



                        var defaultIlce = list.find(function (element) {
                            if (options && options.defaultIlce)
                                return element.id == options.defaultIlce 
                            else return false;
                        });
                        defaultIlce = defaultIlce || list[0];
                        $(options.ilceDomSelector).selectpicker("refresh");

                        self.selectedIlce = defaultIlce;
                        setTimeout(function () {
                            self.ilcesloaded = list;
                            $(options.ilceDomSelector).selectpicker('val', defaultIlce.id.toString());
                            self.loadDistricts(self.selectedIlce);
                        });

                    }
                });
            },

            loadDistricts: function (ilce) {
                var options = this.options;
                $.ajax({
                    url: "/api/v1/area/children/" + ilce.id + "?level=3", success: function (list) {
                        $(options.districtDomSelector).find('option').remove()
                        for (var i = 0; i < list.length; i++) {
                            $(options.districtDomSelector).append('<option value="' + list[i].id + '">' + list[i].name + '</option>');
                        }



debugger;
                        var defaultDistrict = list.find(function (element) {
                            if (options && options.defaultDistrict)
                                return element.id == options.defaultDistrict 
                            else return false;
                        });
                        defaultDistrict = defaultDistrict || list[0];
                        self.selectedDistrict = defaultDistrict;
                        self.districtsloaded = list;
                        $(options.districtDomSelector).selectpicker("refresh");

                        setTimeout(function () {
                            //self.districtsloaded || (self.options && self.options.openDistricts) ? $(options.districtDomSelector).selectpicker('toggle') : null;
                            //$(options.districtDomSelector).selectpicker('toggle');
                            
                            $(options.districtDomSelector).selectpicker('val', defaultDistrict.id.toString());
                            self.selectedDistrict = defaultDistrict;
                        });

                    }
                });
            },


            init: function (options, done) {
                this.options = options || {};
                this.options.cityDomSelector = options.cityDomSelector || "#cityselectpicker";
                this.options.ilceDomSelector = options.ilceDomSelector || "#ilceselectpicker";
                this.options.districtDomSelector = options.districtDomSelector || "#districtselectpicker";
                var defaultProps = {
                    style: "",
                    styleBase: "form-control",
                    width: "100%"
                }
                $(this.options.cityDomSelector).selectpicker(defaultProps);
                $(this.options.ilceDomSelector).selectpicker(defaultProps);
                $(options.districtDomSelector).selectpicker(defaultProps);

                $(options.districtDomSelector).on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                    debugger
                    let district = self.districtsloaded[clickedIndex];
                    self.selectedDistrict = district;
                    $(window).trigger('kb.userloction.districtselected', [self]);
                })

                $(this.options.cityDomSelector).on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

                    var city = self.citiesloaded[clickedIndex];
                    if (city) {
                        self.selectedCity = city;
                        self.loadIlces(city);
                        //self.loadDistricts(city);
                    }

                });

                $(this.options.ilceDomSelector).on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                    var ilce = self.ilcesloaded[clickedIndex];
                    if (ilce) {
                        self.selectedIlce = ilce;
                        self.loadDistricts(ilce);
                        //self.loadDistricts(city);
                    }

                });                

                if (!self.citiesloaded) {
                    $.ajax({
                        url: "/api/v1/area/children", success: function (list) {
                            self.citiesloaded = list;
                            for (var i = 0; i < list.length; i++) {
                                $(options.cityDomSelector).append('<option value="' + list[i].id + '">' + list[i].name + '</option>');
                            }

                            var defaultCity = list.find(function (element) {
                                if (options && options.defaultCity)
                                    return element.id == options.defaultCity 
                                else return false;
                            });
                            defaultCity = defaultCity || list[0];
                            $(options.cityDomSelector).selectpicker("refresh");
                            $(options.cityDomSelector).selectpicker('val', defaultCity.id.toString());
                            self.selectedCity = defaultCity;
                            self.loadIlces(defaultCity)
                        }
                    });
                }



                done && done();
            }
        }

        return self;
    }

    window.kb.selectArea = function (done, options) {
        var self = this;
        options = options || {}
        debugger
        options.defaultCity = window.__useraddr ? window.__useraddr.level1Id: undefined;
        options.defaultIlce = window.__useraddr ? window.__useraddr.level2Id: undefined;
        options.defaultDistrict = window.__useraddr ? window.__useraddr.level3Id: undefined;
        
        
        //{"level3Id":12510,"level1Id":40,"level2Id":2638,"level1Text":"Istanbul","level2Text":"Arnavutköy","level3Text":"Baklalı","level1Slug":"istanbul","level2Slug":"istanbul-arnavutkoy","level3Slug":"istanbul-arnavutkoy-baklali","display":"Baklalı, Arnavutköy/Istanbul"}
  
        if (!self.areainited) {
            var ul = window.kb.userlocation();
            self.areainited = true;
            ul.init(options, function () {
                $('#exploreAreaMsg').html(options.msg || '')
                $('#areaModal').modal();
                $("#exploreAreaButton").click(function () {
                    window.App.gTag('location', 'location/set', ul.selectedCity.name + '/' + ul.selectedIlce.name + '/' + ul.selectedDistrict.name)
                    $(window).trigger('kb.selectArea.selected', [self, ul]);
                    done && done(self, ul)
                })

                $('#areaModal').on('shown.bs.modal', function () {

                })
            });
        } else $('#areaModal').modal("show")
    }

})(window);





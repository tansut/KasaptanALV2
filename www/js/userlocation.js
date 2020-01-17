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

                        $(options.ilceDomSelector).selectpicker("refresh");
                        self.selectedIlce = list[0];
                        setTimeout(function () {
                            self.ilcesloaded = list;
                             $(options.ilceDomSelector).selectpicker('toggle');
                            //self.loadDistricts(self.selectedIlce);
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

                        $(options.districtDomSelector).selectpicker("refresh");
                        self.selectedDistrict = list[0];
                        setTimeout(function () {
                            //self.districtsloaded || (self.options && self.options.openDistricts) ? $(options.districtDomSelector).selectpicker('toggle') : null;
                            $(options.districtDomSelector).selectpicker('toggle');
                            self.districtsloaded = list;
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
                                return element.id == (options && options.defaultCity) ? element.id == options.defaultCity : element.name == "Ankara";
                            });
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

    window.kb.selectArea = function (done) {
        var self = this;
        if (!self.areainited) {
            var ul = window.kb.userlocation();
            self.areainited = true;
            ul.init({}, function () {
                $('#areaModal').modal();
                $("#exploreAreaButton").click(function () {
                    $(window).trigger('kb.selectArea.selected', [self, ul]);
                    done && done(self, ul)
                })

                $('#areaModal').on('shown.bs.modal', function () {

                })
            });
        } else $('#areaModal').modal("show")
    }

})(window);





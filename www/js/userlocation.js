(function (window) {
    window.kb = window.kb || {}    
    window.kb.userlocation = function () {
        var self =
        {
            loadDistricts: function (city) {
                var options = this.options;
                $.ajax({
                    url: "/api/v1/area/children/" + city.id + "?level=3&parentLevel=1", success: function (list) {
                        $(options.districtDomSelector).find('option').remove()
                        for (var i = 0; i < list.length; i++) {
                            $(options.districtDomSelector).append('<option value="' + list[i].id + '">' + list[i].name + '</option>');
                        }

                        $(options.districtDomSelector).selectpicker("refresh");
                        self.selectedCity = city;
                        self.selectedDistrict = list[0];
                        setTimeout(function () {
                            self.districtsloaded || (self.options && self.options.openDistricts) ? $(options.districtDomSelector).selectpicker('toggle') : null;
                            self.districtsloaded = list;
                        });

                    }
                });
            },


            init: function (options, done) {
                this.options = options || {};
                options.cityDomSelector = options.cityDomSelector || "#cityselectpicker";
                options.districtDomSelector = options.districtDomSelector || "#districtselectpicker";
                var defaultProps = {
                    style: "",
                    styleBase: "form-control",
                    width: "100%"
                }
                $(this.options.cityDomSelector).selectpicker(defaultProps);
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
                        self.loadDistricts(city);
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
                                return element.id == (options && options.defaultCity) ? element.id == options.defaultCity : element.name == "Istanbul";
                            });
                            $(options.cityDomSelector).selectpicker("refresh");
                            $(options.cityDomSelector).selectpicker('val', defaultCity.id.toString());
                            self.selectedCity = defaultCity;
                            self.loadDistricts(defaultCity)
                        }
                    });
                }



                done && done();
            }
        }

        return self;
    }

    window.kb.selectArea = function(done) {   
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





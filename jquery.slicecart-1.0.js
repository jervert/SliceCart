(function ($) {
  $.fn.dataSum = function (options, extendedFn) {
    var defaults = {
      sel_area: '[data-sum-area]',
      sel_subarea: '[data-sum-section]',
      sel_area_products_total: '[data-sum-products-total-overall]',
      sel_subarea_products_total: '[data-sum-products-total-section]',
      sel_num: '[data-sum-product]',
      sel_product_charge: '[data-sum-product-charge]',
      sel_subarea_charge_total: '[data-sum-charge-total-section]',
      sel_additional_costs: '[data-sum-charge-total-overall-additional-cost]',
      sel_taxes: '[data-sum-charge-total-overall-tax]',
      attr_taxes: 'data-sum-charge-total-overall-tax',
      sel_area_charge_total: '[data-sum-charge-total-overall]'
    },
      op = $.extend(true, defaults, options),
      fnBase = {
        el: {},
        sumElements: function (el, elTotal) {
          var self = this,
            total = 0,
            numElementValue;

          el.find(op.sel_num).each(function (index, numElement) {
            numElementValue = ($(numElement).is('input')) ? $(numElement).val() :  $(numElement).text();
            total += parseInt(numElementValue, 10);
          });

          self.setTotalProducts(el.find(elTotal), total);

          return total;
        },
        setTotalProducts: function (el, num) {
          el.text(num);
        },
        setTotalCharge: function (area, charge) {
          var self = this,
            taxedCharge,
            costsAddedCharge = self.addAdditionalCosts(area, charge);
          taxedCharge = self.addTaxes(area, costsAddedCharge);

          area.find(op.sel_area_charge_total).text(taxedCharge);
        },
        addTaxes: function (area, charge) {
          var taxedCharge = charge;
          area.find(op.sel_taxes).each(function (index, tax) {
            var taxPercent = parseFloat($(tax).attr(op.attr_taxes)),
              taxCost = charge / 100 * taxPercent;
            taxedCharge += taxCost;
            $(tax).text(taxCost);
          });
          return taxedCharge;
        },
        addAdditionalCosts: function (area, charge) {
          area.find(op.sel_additional_costs).each(function (index, cost) {
            charge += parseFloat($(cost).text());
          });
          return charge;
        },
        init: function (area, index) {
          var self = this,
            subareas = area.find(op.sel_subarea);
          area.find(op.sel_num).on('keyup.sum', function (ev) {
            var total_areas_products = 0,
              total_areas_charges = 0;

            subareas.each(function (index, subarea) {
              var total_subarea_products = self.sumElements($(subarea), op.sel_subarea_products_total),
                charge = parseFloat($(subarea).find(op.sel_product_charge).text()),
                total_product_charge = charge * total_subarea_products;
              $(subarea).find(op.sel_subarea_charge_total).text(total_product_charge);
              total_areas_products += total_subarea_products;
              total_areas_charges += total_product_charge;
            });
            self.setTotalCharge(area, total_areas_charges);
            self.setTotalProducts(area.find(op.sel_area_products_total), total_areas_products);
          });
        }
      };

    function initialize() {
      $(op.sel_area).each(function (index, area) {
        var fn = $.extend(true, {}, fnBase);
        fn.el = $.extend({}, {
          sel_area: $(area)
        });
        fn.init($(area), index);
      });
    }

    initialize();
  };
}(jQuery));
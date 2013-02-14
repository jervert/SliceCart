(function ($) {
  $.fn.dataSum = function (options, extendedFn) {
    var defaults = {
      decimal: '.',
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
      sel_area_charge_total: '[data-sum-charge-total-overall]',
      sel_tax_base: '[data-sum-charge-total-overall-tax-base]'
    },
      op = $.extend(true, defaults, options),
      fnBase = {
        el: {},
        localice: function (num) {
          num = num.toFixed(2);
          if (op.decimal === ',') {
            num = num.toString(10).replace('.', ',');
          }
          return num;
        },
        unlocalice: function (num) {
          if (op.decimal === ',') {
            num = num.replace(',', '.');
          }
          return parseFloat(num);
        },
        sumElements: function (el, elTotal) {
          var self = this,
            total = 0,
            numElementValue;

          el.find(op.sel_num).each(function (index, numElement) {
            numElementValue = ($(numElement).is('input')) ? $(numElement).val() :  self.unlocalice($(numElement).text());
            total += parseInt(numElementValue, 10);
          });

          self.setTotalProducts(el.find(elTotal), total);

          return total;
        },
        setTotalProducts: function (el, num) {
          var self = this;
          el.text(num);
        },
        setTotalCharge: function (area, charge) {
          var self = this,
            costsAddedCharge = self.addAdditionalCosts(area, charge),
            taxedCharge = self.addTaxes(area, costsAddedCharge);

          area.find(op.sel_tax_base).text(self.localice(costsAddedCharge));
          area.find(op.sel_area_charge_total).text(self.localice(taxedCharge));
        },
        addTaxes: function (area, charge) { // Tax value must be float number of the percentage
          var self = this,
            taxedCharge = charge;
          area.find(op.sel_taxes).each(function (index, tax) {
            var taxPercent = parseFloat($(tax).attr(op.attr_taxes)),
              taxCost = parseFloat((charge / 100 * taxPercent).toFixed(2));
            taxedCharge += taxCost;
            $(tax).text(self.localice(taxCost));
          });
          return taxedCharge;
        },
        addAdditionalCosts: function (area, charge) {
          var self = this;
          area.find(op.sel_additional_costs).each(function (index, cost) {
            charge += self.unlocalice($(cost).text());
          });
          return charge;
        },
        init: function (area, index) {
          var self = this,
            subareas = area.find(op.sel_subarea);
          area.find(op.sel_num).on('change.sum, keyup.sum', function (ev) {
            var total_areas_products = 0,
              total_areas_charges = 0;

            subareas.each(function (index, subarea) {
              var total_subarea_products = self.sumElements($(subarea), op.sel_subarea_products_total),
                charge = self.unlocalice($(subarea).find(op.sel_product_charge).text()),
                total_product_charge = charge * total_subarea_products;
              $(subarea).find(op.sel_subarea_charge_total).text(self.localice(total_product_charge));
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
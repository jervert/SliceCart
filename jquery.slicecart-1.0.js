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
      sel_tax_base: '[data-sum-charge-total-overall-tax-base]',
      sel_discount_by_unit: '[data-sum-discount-by-unit]',
      attr_discount_by_unit: 'data-sum-discount-by-unit',
      attr_original_product_charge: 'data-sum-original-product-charge',
      sel_discount_by_unit_increments: '[data-sum-discount-by-unit-increments]',
      attr_discount_by_unit_increments: 'data-sum-discount-by-unit-increments',
      sel_shipping: '[data-sum-shipping]',
      attr_shipping: 'data-sum-shipping'
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

          self.setTotalProducts(el.find(elTotal), total, false);

          return total;
        },
        setTotalProducts: function (el, num, shippingCharge, $area) {
          var self = this;
          el.text(num);
          if (shippingCharge) {
            self.applyShippingChanges($area);
          }
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
        applyInitialPriceChanges: function (subarea) {
          var self = this,
            originalPrice,
            discount,
            priceWithDiscount,
            $priceWithDiscountEl = subarea.find(op.sel_discount_by_unit);
          if ($priceWithDiscountEl.length) {
            originalPrice = parseFloat($priceWithDiscountEl.attr(op.attr_original_product_charge));
            discount = parseFloat($priceWithDiscountEl.attr(op.attr_discount_by_unit));
            priceWithDiscount = originalPrice - (originalPrice / 100 * discount);
            $priceWithDiscountEl.text(self.localice(priceWithDiscount));
          }
        },
        applyShippingChanges: function ($area) {
          var self = this,
            $shippingChargeEl = $area.find(op.sel_shipping),
            shippingChargeRules,
            shippingChargeRulesObject,
            numOveralProducts,
            newShippingCharge;
          if ($shippingChargeEl.length) {
            shippingChargeRules = $shippingChargeEl.attr(op.attr_shipping);
            shippingChargeRulesObject = JSON.parse(shippingChargeRules);
            if (_.isNumber(shippingChargeRules)) {
              $shippingChargeEl.text(self.localice(shippingChargeRules));
            } else if (_.isObject(shippingChargeRulesObject)) {
              numOveralProducts = parseInt($area.find(op.sel_area_products_total).text(), 10);
              $.each(shippingChargeRulesObject.shippingCharges, function (index, step) {
                if (numOveralProducts >= step.quantityMin) {
                  newShippingCharge = step.shipping;
                }
              });
              $shippingChargeEl.text(self.localice(newShippingCharge));
            }
          }
        },
        getProductCharge: function (subarea, total_subarea_products) {
          var self = this,
            currentCharge = self.unlocalice(subarea.find(op.sel_product_charge).text()),
            newCharge = currentCharge,
            increments,
            $priceWithDiscountEl = subarea.find(op.sel_discount_by_unit_increments),
            originalPrice = parseFloat($priceWithDiscountEl.attr(op.attr_original_product_charge));
          if ($priceWithDiscountEl.length) {
            increments = JSON.parse($priceWithDiscountEl.attr(op.attr_discount_by_unit_increments));
            $.each(increments.discounts, function (index, step) {
              if (total_subarea_products >= step.quantityMin) {
                newCharge = originalPrice - (originalPrice / 100 * step.discount);
              }
            });
          }
          if (newCharge !== currentCharge) {
            subarea.find(op.sel_product_charge).text(self.localice(newCharge));
          }
          return newCharge.toFixed(2);
        },
        init: function (area, index) {
          var self = this,
            subareas = area.find(op.sel_subarea),
            shippingCost = area.find();
          self.applyShippingChanges(area);
          subareas.each(function (index, subarea) {
            self.applyInitialPriceChanges($(subarea));
          });

          area.find(op.sel_num).on('change.sum, keyup.sum', function (ev) {
            var total_areas_products = 0,
              total_areas_charges = 0;

            subareas.each(function (index, subarea) {
              var total_subarea_products = self.sumElements($(subarea), op.sel_subarea_products_total),
                charge = self.getProductCharge($(subarea), total_subarea_products),
                total_product_charge = charge * total_subarea_products;
              $(subarea).find(op.sel_subarea_charge_total).text(self.localice(total_product_charge));
              total_areas_products += total_subarea_products;
              total_areas_charges += total_product_charge;
            });
            self.setTotalProducts(area.find(op.sel_area_products_total), total_areas_products, true, area);
            self.setTotalCharge(area, total_areas_charges);
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
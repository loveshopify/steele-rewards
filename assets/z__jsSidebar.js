"use strict";

Shopify.theme.jsSidebar = {
  init: function init() {
    $('[data-has-toggle-option]').on('click', '[data-sidebar-block__toggle="closed"]', function (e) {
      e.preventDefault();
      Shopify.theme.jsSidebar.openSidebarBlock($(this));
    });
    $('[data-has-toggle-option]').on('click', '[data-sidebar-block__toggle="open"]', function (e) {
      e.preventDefault();
      Shopify.theme.jsSidebar.closeSidebarBlock($(this));
    });

    if ($('[data-product-sidebar]').length) {
      $('.section--has-sidebar-option').addClass('has-sidebar-enabled');
      $('.section--has-sidebar-option').removeClass('has-sidebar-disabled');
    } else {
      $('.section--has-sidebar-option').removeClass('has-sidebar-enabled');
      $('.section--has-sidebar-option').addClass('has-sidebar-disabled');
    }
  },
  openSidebarBlock: function openSidebarBlock($toggleBtn) {
    var $parentBlock = $toggleBtn.closest('.sidebar__block');
    var $toggleIcon = $toggleBtn.find('.icon');
    $toggleBtn.attr('data-sidebar-block__toggle', 'open');
    $parentBlock.addClass('is-active');
    $parentBlock.attr('aria-expanded', true);
    $parentBlock.find('[data-sidebar-block__content--collapsible]').slideDown();
  },
  closeSidebarBlock: function closeSidebarBlock($toggleBtn) {
    var $parentBlock = $toggleBtn.closest('.sidebar__block');
    var $toggleIcon = $toggleBtn.find('.icon');
    $toggleBtn.attr('data-sidebar-block__toggle', 'closed');
    $parentBlock.removeClass('is-active');
    $parentBlock.attr('aria-expanded', false);
    $parentBlock.find('[data-sidebar-block__content--collapsible]').slideUp();
  },
  unload: function unload() {
    var $toggleBtn = $('[data-sidebar-block__toggle]');
    $toggleBtn.off();
  }
};
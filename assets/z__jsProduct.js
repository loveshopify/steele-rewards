"use strict";

Shopify.theme.jsProduct = {
  init: function init($section) {
    // Add settings from schema to current object
    Shopify.theme.jsProduct = $.extend(this, Shopify.theme.getSectionData($section)); //Ensure product media libraries are present

    window.Shopify.loadFeatures([{
      name: 'model-viewer',
      version: '0.8'
    }, {
      name: 'shopify-xr',
      version: '1.0'
    }, {
      name: 'model-viewer-ui',
      version: '1.0'
    }], Shopify.theme.productMedia.setupMedia);
    var $productGallery = $section.find('.product-gallery__main');
    var $stickyElement = $section.find('.sticky-product-scroll');

    if ($productGallery) {
      Shopify.theme.jsProduct.enableSlideshow($productGallery);

      if (Shopify.theme.jsProduct.enable_zoom) {
        Shopify.theme.jsProduct.enableZoom($productGallery);
      }

      if (Shopify.theme.jsProduct.enable_product_lightbox) {
        Shopify.theme.jsProduct.enableLightbox($productGallery);
      }
    }

    if ($stickyElement && isScreenSizeLarge() && Shopify.theme.jsProduct.template == 'image-scroll') {
      Shopify.theme.jsProduct.enableStickyScroll($stickyElement);
    }

    $(".product_form_options", $section).each(function () {
      new Shopify.OptionSelectors($(this).data("select-id"), {
        product: $(this).data("product"),
        onVariantSelected: selectCallback,
        enableHistoryState: $(this).data("enable-state")
      });
    });

    if (window.location.search === '?contact_posted=true') {
      $('.notify_form .contact-form').hide();
      $('.notify_form .contact-form').prev('.message').html(Shopify.translation.notify_form_success);
    }

    var $notify_form = $('.notify_form .contact-form');
    $notify_form.each(function () {
      var $nf = $(this);
      $nf.on("submit", function (e) {
        if ($('input[name="challenge"]', $nf).val() !== "true") {
          $.ajax({
            type: $nf.attr('method'),
            url: $nf.attr('action'),
            data: $nf.serialize(),
            success: function success(data) {
              $nf.fadeOut("slow", function () {
                $nf.prev('.message').html(Shopify.translation.notify_form_success);
              });
            },
            error: function error(data) {
              $('input[name="challenge"]', $nf).val('true');
              $nf.submit();
            }
          });
          e.preventDefault();
        }
      });
    });

    if (Shopify.theme_settings.product_form_style === "swatches") {
      this.enableProductSwatches();
    } else if (Shopify.theme_settings.product_form_style === "dropdown") {
      $('.selector-wrapper select', $section).wrap('<span class="select" data-dropdown-form-style></span>');
      this.findSelectedVariantImage();
    }

    if ($('.masonry--true').length > 0) {
      Shopify.theme.applyMasonry('.thumbnail');
    }
  },
  enableStickyScroll: function enableStickyScroll($productGallery) {
    var announcementHeight = 0;
    var headerHeight = 0;

    if (typeof Shopify.theme.jsAnnouncementBar !== 'undefined' && Shopify.theme.jsAnnouncementBar.enable_sticky) {
      announcementHeight = $('#announcement-bar').outerHeight();
    }

    if (Shopify.theme_settings.header_layout != 'vertical') {
      if (Shopify.theme.jsHeader.enable_sticky) {
        headerHeight = $('#header').outerHeight();
      }
    }

    $productGallery.stick_in_parent({
      offset_top: announcementHeight + headerHeight + 20
    });
  },
  enableLightbox: function enableLightbox($productGallery) {
    $productGallery.find('.product-gallery__link').fancybox({
      beforeClose: function beforeClose(instance, slide) {
        var $instanceGallery = instance.$trigger.first().parents('.product-gallery__main');
        $instanceGallery.hide();
        setTimeout(function () {
          $instanceGallery.fadeIn(100);
        }, 500);
      },
      afterClose: function afterClose() {
        setTimeout(function () {
          $productGallery.find('.is-selected a').focus();
        }, 500);
      }
    });
  },
  enableZoom: function enableZoom($productGallery) {
    $productGallery.find('img').wrap('<span class="zoom-container"></span>').css('display', 'block').parent().zoom({
      touch: false,
      magnify: 1
    });
  },
  disableSlideshow: function disableSlideshow($section, selector) {
    var $slider;

    if ($section) {
      $slider = $section.find('.flickity-enabled');
    } else {
      $slider = $(selector);
    }

    $slider.flickity('destroy');
  },
  enableSlideshow: function enableSlideshow(selector, settings) {
    // Define variables
    var $productGallery = selector;
    var $thumbnailProductGallery = $productGallery.closest('.product-gallery').find('.product-gallery__thumbnails'); // Adds 'product-gallery__image' class if not present

    $productGallery.find('.gallery-cell:not(.product-gallery__image)').addClass('product-gallery__image'); // Adds 'product-gallery__thumbnail' class if not present

    $thumbnailProductGallery.find('.gallery-cell:not(.product-gallery__thumbnail)').addClass('product-gallery__thumbnail');
    var $slides = $productGallery.find('.product-gallery__image');
    var $thumbnails = $thumbnailProductGallery.find('.product-gallery__thumbnail');
    var thumbnailsEnabled;
    var thumbnailsSliderEnabled;
    var thumbnailsPosition;
    var arrowsEnabled;
    var slideshowSpeed;
    var slideshowTransition;

    if (settings) {
      // If custom settings available, use them otherwise take settings from product templates
      thumbnailsEnabled = settings.thumbnailsEnabled;
      thumbnailsSliderEnabled = settings.thumbnailsSliderEnabled;
      thumbnailsPosition = settings.thumbnailsPosition;
      arrowsEnabled = settings.arrowsEnabled;
      slideshowSpeed = settings.slideshowSpeed;
      slideshowTransition = settings.slideshowTransition;
    } else {
      thumbnailsEnabled = Shopify.theme.jsProduct.thumbnails_enabled;
      thumbnailsSliderEnabled = Shopify.theme.jsProduct.enable_thumbnail_slider;
      thumbnailsPosition = Shopify.theme.jsProduct.thumbnail_position;
      arrowsEnabled = Shopify.theme.jsProduct.thumbnail_arrows;
      slideshowSpeed = Shopify.theme.jsProduct.slideshow_speed;
      slideshowTransition = Shopify.theme.jsProduct.slideshow_transition;
    }

    $productGallery.on('ready.flickity', function () {
      $slides.each(function (index, slide) {
        //Determine media type
        var mediaType = $(slide).data('media-type') || $(slide).find('[data-media-type]').data('media-type');
        var videoID;
        var videoLooping = $('[data-video-loop]').data('video-loop');

        switch (mediaType) {
          case 'external_video':
            videoID = $(slide).find('[data-plyr-video-id]').data('plyr-video-id');

            if (videoPlayers) {
              for (var i = 0; i < videoPlayers.length; i++) {
                if (videoPlayers[i].id == videoID || videoPlayers[i].media.id == videoID) {
                  videoPlayers[i].loop = videoLooping;

                  if (!$(slide).hasClass('is-selected')) {
                    videoPlayers[i].keyboard = {
                      focused: false,
                      global: false
                    };
                  }
                }
              }
            }

            break;

          case 'video':
            videoID = $(slide).find('[data-plyr-video-id]').data('plyr-video-id');

            if (videoPlayers) {
              for (var _i = 0; _i < videoPlayers.length; _i++) {
                if (videoPlayers[_i].id == videoID || videoPlayers[_i].media.id == videoID) {
                  videoPlayers[_i].loop = videoLooping;

                  if (!$(slide).hasClass('is-selected')) {
                    videoPlayers[_i].keyboard = {
                      focused: true,
                      global: false
                    };
                  }
                }
              }
            }

            break;

          case 'model':
            if ($(slide).hasClass('is-selected')) {
              //When active slide
              if (mediaType == 'model' && isScreenSizeLarge()) {
                $(slide).on('mouseenter', function () {
                  $productGallery.flickity('unbindDrag');
                });
                $(slide).on('mouseleave', function () {
                  $productGallery.flickity('bindDrag');
                });
              }
            }

        } // Detect keyboard 'ENTER' key on slides


        $(slide).keypress(function (event) {
          if (event.which == 13) {
            // Bring focus to media inside selected slide
            $(slide).find('model-viewer, .product-gallery__link, .plyr').focus(); // Run video autoplay logic if featured media is a video

            if (mediaType == 'video' || mediaType == 'external_video') {
              checkForVideos();
            } // Autoplay model if featured media is a model


            if (mediaType == 'model') {
              // If model container has class is-selected then play the model
              autoplayModel();
            }
          }
        });
      });
    });
    $productGallery.flickity({
      wrapAround: true,
      adaptiveHeight: true,
      dragThreshold: 10,
      imagesLoaded: true,
      pageDots: false,
      prevNextButtons: $productGallery.data('media-count') > 1 || $slides.length > 1 ? true : false,
      autoPlay: slideshowSpeed * 1000,
      fade: slideshowTransition === 'fade' ? true : false,
      watchCSS: this.template === 'image-scroll' ? true : false,
      arrowShape: arrowShape
    });
    $productGallery.on('change.flickity', function () {
      $slides.each(function (index, slide) {
        //Determine media type of current slide
        var mediaType = $(slide).data('media-type') || $(slide).find('[data-media-type]').data('media-type');

        if ($(slide).hasClass('is-selected')) {
          //When active slide
          switch (mediaType) {
            case 'model':
              /* On slide change, if active slide contains 3d model
              * If on desktop, on hover, unbind flickity, after hover bind flickity
              * On model play event, unbind flickity to ensure model can be interacted with
              * On model pause event, bind flickity so that slide can be swiped
              * Pause all model slides when hidden
              */
              if (isScreenSizeLarge()) {
                // On mouseenter event, unbind flickity
                $(slide).on('mouseenter', function () {
                  $productGallery.flickity('unbindDrag');
                }); // On mouseleave event, bind flickity

                $(slide).on('mouseleave', function () {
                  $productGallery.flickity('bindDrag');
                });
              } // Listen for model pause/play events


              $(slide).find('model-viewer').on('shopify_model_viewer_ui_toggle_play', function () {
                $productGallery.flickity('unbindDrag');
              });
              $(slide).find('model-viewer').on('shopify_model_viewer_ui_toggle_pause', function () {
                $productGallery.flickity('bindDrag');
              });
              break;

            default:
              $productGallery.flickity('bindDrag');
          }
        } else {
          //When inactive slide
          switch (mediaType) {
            case 'external_video':
              //Youtube video pausing
              $.each(videoPlayers, function (index, player) {
                player.pause();
              });
              break;

            case 'video':
              //HTML5 video pausing
              $.each(videoPlayers, function (index, player) {
                player.pause();
              });
              break;

            case 'model':
              $.each(Shopify.theme.productMedia.models, function (index, model) {
                model.pause();
              });
          }
        }
      }); //Restore 3d model icons

      Shopify.theme.productMedia.showModelIcon($productGallery);
    }); // Checks for videos and plays them if they are the featured media
    // Autoplay logic only happens on desktop, autoplay set to off for mobile

    var $sliderArrows = $productGallery.find('.flickity-prev-next-button');

    if (($sliderArrows || $thumbnails) && isScreenSizeLarge()) {
      $sliderArrows.on('click', function () {
        $productGallery.on('settle.flickity', function (event, index) {
          // Find out media type of featured media slide
          var $selectedSlide = $productGallery.find('.product-gallery__image.is-selected');
          var mediaType = $selectedSlide.data('media-type') || $selectedSlide.find('[data-media-type]').data('media-type');
          var pId = $productGallery.data('product-id'); // Run video autoplay logic if featured media is a video

          if (mediaType == 'video' || mediaType == 'external_video') {
            checkForVideos();
          } // Autoplay model if featured media is a model


          if (mediaType == 'model') {
            // Sort models to get those in selected slide
            var sortedModels = [];
            $.each(Shopify.theme.productMedia.models, function (index, model) {
              if ($(model.container).closest('.product-gallery__image').data('product-id') == pId) {
                sortedModels.push(model);
              }
            }); // If model container has class is-selected then play the model

            $.each(sortedModels, function (index, model) {
              var $slide = $(model.container).parents('.product-gallery__image');

              if ($slide.hasClass('is-selected')) {
                model.play();
              }
            });
          }

          $productGallery.off('settle.flickity');
        });
        return false;
      });
      $thumbnails.on('click', function (event) {
        var index = $(event.currentTarget).index();
        $productGallery.flickity('select', index);
        $productGallery.on('settle.flickity', function (event, index) {
          // Find out media type of featured media slide
          var $selectedSlide = $productGallery.find('.product-gallery__image.is-selected');
          var mediaType = $selectedSlide.data('media-type') || $selectedSlide.find('[data-media-type]').data('media-type');
          var pId = $productGallery.data('product-id'); // Run video autoplay logic if featured media is a video

          if (mediaType == 'video' || mediaType == 'external_video') {
            checkForVideos();
          } // Autoplay model if featured media is a model


          if (mediaType == 'model') {
            // Sort models to get those in selected slide
            var sortedModels = [];
            $.each(Shopify.theme.productMedia.models, function (index, model) {
              if ($(model.container).closest('.product-gallery__image').data('product-id') == pId) {
                sortedModels.push(model);
              }
            }); // If model container has class is-selected then play the model

            $.each(sortedModels, function (index, model) {
              var $slide = $(model.container).parents('.product-gallery__image');

              if ($slide.hasClass('is-selected')) {
                model.play();
              }
            });
          }

          $productGallery.off('settle.flickity');
        });
        return false;
      });
      $thumbnails.keypress(function (event) {
        var index = $(event.currentTarget).index();

        if (event.which == 13) {
          $productGallery.flickity('select', index);
          var $selectedSlide = $productGallery.find('.product-gallery__image.is-selected');
          var pId = $productGallery.data('product-id');
          $productGallery.on('settle.flickity', function (event, index) {
            $selectedSlide.find('model-viewer, .plyr, a').focus();
            $selectedSlide.find('[data-youtube-video]').attr('tabindex', '0');
            $productGallery.off('settle.flickity');
          }); // Find out media type of featured media slide

          var mediaType = $selectedSlide.data('media-type') || $selected.find('[data-media-type]').data('media-type'); // Run video autoplay logic if featured media is a video

          if (mediaType == 'video' || mediaType == 'external_video') {
            checkForVideos();
          } // Autoplay model if featured media is a model


          if (mediaType == 'model') {
            // Sort models to get those in selected slide
            var sortedModels = [];
            $.each(Shopify.theme.productMedia.models, function (index, model) {
              if ($(model.container).closest('.product-gallery__image').data('product-id') == pId) {
                sortedModels.push(model);
              }
            }); // If model container has class is-selected then play the model

            $.each(sortedModels, function (index, model) {
              var $slide = $(model.container).parents('.product-gallery__image');

              if ($slide.hasClass('is-selected')) {
                model.play();
              }
            });
          }

          return false;
        }
      });
    }

    function checkForVideos() {
      $slides.each(function (index, slide) {
        // Variables
        var $slide = $(slide);
        var mediaType = $slide.data('media-type') || $slide.find('[data-media-type]').data('media-type');
        var videoID = $slide.find('video').data('plyr-video-id');
        var $iframeVideo = $slide.find('iframe');
        var iframeID = $iframeVideo.attr('id');

        if ($slide.hasClass('is-selected')) {
          if (mediaType == 'video') {
            videoID = $slide.find('video').data('plyr-video-id');

            if (videoID) {
              autoplayVideo(videoID, $slide);
            }
          } else if (mediaType == 'external_video' && iframeID) {
            autoplayYoutubeVideo(iframeID, $slide);
          }
        }
      });
    }

    function autoplayVideo(videoID, $slide) {
      // Compare id to player object and only play that video
      $.each(videoPlayers, function (index, player) {
        if (player.id == videoID) {
          player.play(); // On fullscreen toggle, focus back on the slide itself

          player.on('exitfullscreen', function () {
            $slide.closest('.product-gallery').find('.product-gallery__thumbnails').focus();
          });
        }
      });
    }

    function autoplayYoutubeVideo(iframeID, $slide) {
      // compare id to player object and only play that video
      $.each(videoPlayers, function (index, player) {
        if (player.playing) {
          player.pause();
        }

        if (player.media.id == iframeID) {
          player.play(); // On fullscreen toggle, focus back on the slide itself

          player.on('exitfullscreen', function () {
            $slide.closest('.product-gallery').find('.product-gallery__thumbnails').focus();
          });
        }
      });
    }

    setTimeout(function () {
      $productGallery.flickity('resize');
    }, 500);
    $(window).on('load', function () {
      $productGallery.flickity('resize');
    });

    if (thumbnailsEnabled == true && thumbnailsSliderEnabled == true && $slides.length > 1) {
      //If desktop determine which slider we build
      if (isScreenSizeLarge()) {
        if (thumbnailsPosition == 'right-thumbnails' || thumbnailsPosition == 'left-thumbnails') {
          $thumbnailProductGallery.addClass('vertical-slider-enabled');
          var navCellHeight = $thumbnails.height();
          var navHeight = $thumbnailProductGallery.height();
          $productGallery.on('select.flickity', function () {
            // set selected nav cell
            var flkty = $productGallery.data('flickity');

            if (flkty) {
              $thumbnailProductGallery.find('.is-nav-selected').removeClass('is-nav-selected');

              var _$selected = $thumbnails.eq(flkty.selectedIndex).addClass('is-nav-selected'); // scroll nav


              var scrollY = _$selected.position().top + $thumbnailProductGallery.scrollTop() - (navHeight + navCellHeight) / 2;
              $thumbnailProductGallery.animate({
                scrollTop: scrollY
              });
            }
          });
        } else {
          $thumbnailProductGallery.flickity({
            cellAlign: 'center',
            contain: true,
            groupCells: '80%',
            imagesLoaded: true,
            pageDots: false,
            prevNextButtons: $thumbnails.length > 5 ? arrowsEnabled : false,
            asNavFor: this.template === 'image-scroll' && isScreenSizeLarge() ? '' : $productGallery[0],
            arrowShape: arrowShape
          }); // Ensures Flickity is not collapsed when loaded

          setTimeout(function () {
            $thumbnailProductGallery.flickity('resize');
          }, 500);
          $(window).on('load', function () {
            $thumbnailProductGallery.flickity('resize');
          });
        }
      } else {
        //Otherwise create standard thumbnail slider
        $thumbnailProductGallery.flickity({
          cellAlign: 'center',
          contain: true,
          groupCells: '80%',
          imagesLoaded: true,
          pageDots: false,
          prevNextButtons: $thumbnails.length > 5 ? arrowsEnabled : false,
          asNavFor: this.template === 'image-scroll' && isScreenSizeLarge() ? '' : $productGallery[0],
          arrowShape: arrowShape
        });
      }
    }
  },
  enableProductSwatches: function enableProductSwatches() {
    $('body').on('change', '.swatch :radio', function () {
      var optionIndex = $(this).closest('.swatch').attr('data-option-index');
      var optionValue = $(this).val();
      var parentForm = $(this).closest('.product_form form');

      if (parentForm.siblings('.notify_form').length) {
        var notifyForm = parentForm.siblings('.notify_form');
      } else {
        var notifyForm = $('.js-notify-form');
      }

      var option1 = parentForm.find('.swatch_options input:checked').eq(0).val();
      var option2 = parentForm.find('.swatch_options input:checked').eq(1).val() || '';
      var option3 = parentForm.find('.swatch_options input:checked').eq(2).val() || '';

      if (option1 && option2 && option3) {
        var notifyMessage = option1 + ' / ' + option2 + ' / ' + option3;
      } else if (option1 && option2) {
        var notifyMessage = option1 + ' / ' + option2;
      } else {
        var notifyMessage = option1;
      }

      notifyForm.find(".notify_form_message").attr("value", notifyForm.find(".notify_form_message").data('body') + " - " + notifyMessage);
      $(this).closest('form').find('.single-option-selector').eq(optionIndex).val(optionValue).trigger('change');
    }); //Swatches linked with selected options

    if ($('.js-product_section').length) {
      var $productForms = $('.js-product_section').find('.product_form');
      $productForms.addClass('is-visible'); //Loop through each product and set the initial option value state

      $productForms.each(function () {
        var JSONData = $(this).data('product');
        var productID = $(this).data('product-id');
        var productSection = '.product-' + productID + ' .js-product_section';
        var swatchOptions = $(this).find('.swatch_options .swatch');

        if (swatchOptions.length > 1) {
          Shopify.linkOptionSelectors(JSONData, productSection);
        }
      });
    } //Add click event when there is more than one product on the page (eg. Collection in Detail)


    if ($('.js-product_section').length > 1) {
      $('body').on('click', '.swatch-element', function () {
        var swatchValue = $(this).data('value').toString();
        $(this).siblings('input[value="' + swatchValue.replace(/\"/g, '\\"') + '"]').prop("checked", true).trigger("change");
        var JSONData = $(this).parents('.product_form').data('product');
        var productID = $(this).parents('.product_form').data('product-id');
        var productSection = '.product-' + productID + ' .js-product_section';
        var swatchOptions = $(this).parents('.product_form').find('.swatch_options .swatch');

        if (swatchOptions.length > 1) {
          Shopify.linkOptionSelectors(JSONData, productSection);
        }
      });
    }

    this.findSelectedVariantImage();
  },
  findSelectedVariantImage: function findSelectedVariantImage() {
    $('[data-variant-selector]').on('selectedVariantChanged', function () {
      if ($(this).attr('disabled')) {
        return;
      } else {
        getIndex($(this), $(this).val());
      }
    });

    function getIndex($selector, variantID) {
      var $parentForm = $selector.parents('.product_form');
      var $option = $parentForm.find("select option[value=".concat(variantID, "]"));
      var imageID = $option.attr('data-image-id');

      if (!imageID) {
        // If there is no image, no scrolling occurs
        return false;
      }

      var index = $("[data-image-id=".concat(imageID, "]")).data('index');

      if (Shopify.theme.jsProduct.template === 'image-scroll') {
        Shopify.theme.jsProduct.scrollSelectedImage(index);
      }
    }
  },
  scrollSelectedImage: function scrollSelectedImage(variant) {
    var headerHeight = 0;
    var announceHeight = 0; // Get header height is sticky enabled

    if (Shopify.theme.jsHeader.enable_sticky == true && Shopify.theme_settings.header_layout != 'vertical') {
      headerHeight = Shopify.theme.jsHeader.getHeaderHeight();
    } // Get announcement height is sticky enabled


    if (typeof Shopify.theme.jsAnnouncementBar !== 'undefined' && Shopify.theme.jsAnnouncementBar.enable_sticky == true && Shopify.theme_settings.header_layout != 'vertical') {
      announceHeight = Shopify.theme.jsAnnouncementBar.getAnnouncementHeight();
    } // Add values


    var totalHeight = headerHeight + announceHeight;
    Shopify.theme.scrollToTop($("[data-index=\"".concat(variant, "\"]")), totalHeight);
  },
  relatedProducts: function relatedProducts() {
    $('.block__recommended-products .js-related-products-slider .products-slider').each(function (index, value) {
      var $relatedSlider = $(this);
      var slideData = {
        products_per_slide: $relatedSlider.data('products-per-slide'),
        products_available: $relatedSlider.data('products-available'),
        products_limit: $relatedSlider.data('products-limit'),
        initialIndex: 0,
        cellAlign: "left",
        wrapAround: true
      };

      if (slideData.products_available > slideData.products_per_slide && slideData.products_limit > slideData.products_per_slide) {
        slideData.wrapAround = true;
      } else {
        slideData.wrapAround = false;
      }

      if (slideData.products_available < slideData.products_per_slide || slideData.products_limit < slideData.products_per_slide) {
        $relatedSlider.addClass('container is-justify-center');
        $relatedSlider.find('.gallery-cell').addClass('column');
      } else {
        $relatedSlider.flickity({
          lazyLoad: 2,
          freeScroll: true,
          imagesLoaded: true,
          draggable: true,
          cellAlign: 'center',
          wrapAround: slideData.wrapAround,
          pageDots: false,
          contain: true,
          prevNextButtons: slideData.products_limit > slideData.products_per_slide ? true : false,
          initialIndex: slideData.initialIndex,
          arrowShape: arrowShape
        });
        setTimeout(function () {
          $relatedSlider.flickity('resize');
        }, 500);
        $(window).on('load', function () {
          $relatedSlider.flickity('resize');
        });
      }
    });
  },
  unload: function unload($section) {
    $('.selector-wrapper select', $section).unwrap();
    this.disableSlideshow($section);
    $('[data-variant-selector]').off();
  }
};
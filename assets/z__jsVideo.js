"use strict";

Shopify.theme.jsVideo = {
  init: function init($section) {
    // Add settings from schema to current object
    Shopify.theme.jsVideo = $.extend(this, Shopify.theme.getSectionData($section)); // Selectors

    var $videoElement = $section.find('[data-video-element]');
    var $playButton = $section.find('[data-play-button]');
    var $videoTextContainer = $section.find('[data-video-text-container]');
    var $imageElement = $section.find('[data-image-element]'); // Load video if the media has been added

    if (this.iframe_video || this.html5_video) {
      this.loadVideo($videoElement, $playButton, $videoTextContainer, $imageElement);
    } else {
      $imageElement.show();
    }
  },
  loadVideo: function loadVideo($videoElement, $playButton, $videoTextContainer, $imageElement) {
    var player = new Plyr(".video-".concat(this.id), {
      controls: videoControls,
      loop: {
        active: this.autoloop
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true
      },
      storage: {
        enabled: false
      }
    });
    player.muted = this.mute;
    player.ratio = this.aspect_ratio; // If autoplay enabled, hide image and text

    if (this.autoplay) {
      player.autoplay = true;
      $imageElement.hide();
      $videoTextContainer.hide();
      $videoElement.show();
    } else {
      // If autoplay disabled, check if poster image added
      if (this.poster) {
        $videoElement.hide();
        $imageElement.show();
        $videoTextContainer.show();
      } else {
        // If autoplay disabled and no poster image
        $imageElement.hide();
        $videoElement.show();
        $videoTextContainer.show();
      }
    } // If button exists, on click show video and hide image/text


    if (this.button) {
      $playButton.on('click', function () {
        player.play();
        $imageElement.hide();
        $videoTextContainer.hide();
        $videoElement.show();
      });
    } // On player ready, hide play icon if play button visible


    player.on('ready', function (index, player) {
      if ($videoTextContainer && Shopify.theme.jsVideo.button) {
        $videoElement.closest('.video-wrapper').find('.plyr--paused.plyr--video .plyr__control--overlaid').hide();
      } else {
        $videoElement.closest('.video-wrapper').find('.plyr--paused.plyr--video .plyr__control--overlaid').show();
      }
    }); // On player pause, show play icon if play button hidden

    player.on('pause', function (index, player) {
      $videoElement.closest('.video-wrapper').find('.plyr--paused.plyr--video .plyr__control--overlaid').show();
    }); // Clicking anywhere on video should play the video

    if (!this.button) {
      $videoTextContainer.on('click', function () {
        player.play();
        $videoElement.show();
        $imageElement.hide();
        $videoTextContainer.hide();
      });
    }
  },
  unload: function unload($section) {
    var $playButton = $section.find('[data-play-button]');
    var $videoTextContainer = $section.find('[data-video-text-container]');
    $playButton.off();
    $videoTextContainer.off();
  }
};
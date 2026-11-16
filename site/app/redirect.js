/* Install page (/app): iPhone, iPad and iPod go to the App Store, Android goes to Google Play, everything else (desktop,
   unknown, iPadOS Safari reporting itself as Macintosh) stays on the page with both buttons. location.replace keeps the
   page out of the history, so "back" from the store does not loop. A separate file because the CSP allows no inline
   scripts. The URLs must match app/index.html. No storage. */
(function () {
  "use strict";
  var STORE_APPLE = "https://apps.apple.com/at/app/id6826770040";
  var STORE_PLAY = "https://play.google.com/store/apps/details?id=com.swordistudios.kortform";
  var ua = window.navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) {
    window.location.replace(STORE_APPLE);
  } else if (/Android/.test(ua)) {
    window.location.replace(STORE_PLAY);
  }
}());

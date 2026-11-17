/* Click-to-load YouTube videos. Until the visitor clicks a play button, no request goes to YouTube or Google.
   Each .video-card carries data-video-id and data-video-title; without JavaScript only the "Auf YouTube ansehen" link is shown. */
(function () {
  "use strict";
  function init() {
    var cards = document.querySelectorAll(".video-card[data-video-id]");
    Array.prototype.forEach.call(cards, function (card) {
      var button = card.querySelector(".video-play");
      var frame = card.querySelector(".video-frame");
      var id = card.getAttribute("data-video-id");
      if (!button || !frame || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      card.classList.add("is-ready");
      button.addEventListener("click", function () {
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
        iframe.title = card.getAttribute("data-video-title") || "Video";
        iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        iframe.setAttribute("allowfullscreen", "");
        frame.replaceChild(iframe, button);
        iframe.focus();
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

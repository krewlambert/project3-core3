
(function (global) {
  "use strict";
  var supported = "speechSynthesis" in global && typeof global.SpeechSynthesisUtterance === "function";

  function speak(text, opts) {
    opts = opts || {};
    if (!supported || !text) return false;
    global.speechSynthesis.cancel();
    var u = new global.SpeechSynthesisUtterance(text);
    u.lang = document.documentElement.lang || "en";
    u.rate = opts.rate || 1;
    if (opts.onend) { u.onend = opts.onend; u.onerror = opts.onend; }
    global.speechSynthesis.speak(u);
    return true;
  }

  function stop() {
    if (supported) global.speechSynthesis.cancel();
  }

  global.ObstacleSpeak = { supported: supported, speak: speak, stop: stop };
})(window);


(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var block = $("block"), hear = $("hear"), shuffle = $("shuffle"), plain = $("plain");
  var status = $("status"), realText = $("real-text");
  var KEYS = window.OBSTACLE_CIPHER.keys;

  var key = 0;
  var plainStr = block.textContent.replace(/\s+/g, " ").trim();
  var under = "";
  var composing = false;

  function encode(text, k) {
    var map = KEYS[k].encode, out = "";
    for (var i = 0; i < text.length; i++) out += map[text[i]] || text[i];
    return out;
  }

  // plaintext-only keeps pasted formatting out where the browser supports it.
  try { block.contentEditable = "plaintext-only"; } catch (e) { block.contentEditable = "true"; }
  if (block.contentEditable !== "plaintext-only") block.contentEditable = "true";

  // ---------------------------------------------------------- caret helpers
  function caretOffset() {
    var sel = window.getSelection();
    if (!sel.rangeCount || !block.contains(sel.focusNode)) return null;
    var r = document.createRange();
    r.selectNodeContents(block);
    r.setEnd(sel.focusNode, sel.focusOffset);
    return r.toString().length;
  }
  function setCaret(offset) {
    var node = block.firstChild;
    if (!node) return;
    var r = document.createRange();
    r.setStart(node, Math.min(offset, node.length));
    r.collapse(true);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  // ---------------------------------------------------------- render
  function setKey(k) {
    key = k;
    block.classList.remove("key-0", "key-1", "key-2");
    block.classList.add("key-" + k);
  }
  function render(caret) {
    block.textContent = under;
    block.dataset.plain = plainStr;
    realText.textContent = plainStr || "(empty)";
    if (caret != null && document.activeElement === block) setCaret(caret);
  }
  function recode() {
    var caret = caretOffset();
    under = encode(plainStr, key);
    render(caret);
  }

  // ---------------------------------------------------------- typing
  // Work out what changed since the last render and put only the new characters into cipher.
  function sync() {
    var next = block.textContent.replace(/[\r\n]/g, " ");
    if (next === under) return;
    var c = caretOffset();
    var p = 0, s = 0;
    if (c != null) {
      s = next.length - c;
      if (s < 0 || s > under.length || under.slice(under.length - s) !== next.slice(c)) s = -1;
    }
    if (c == null || s < 0) {
      s = 0;
      var max = Math.min(under.length, next.length);
      while (s < max && under[under.length - 1 - s] === next[next.length - 1 - s]) s++;
    }
    var maxP = Math.min(under.length - s, next.length - s);
    while (p < maxP && under[p] === next[p]) p++;

    var inserted = next.slice(p, next.length - s);
    plainStr = plainStr.slice(0, p) + inserted + plainStr.slice(plainStr.length - s);
    under = under.slice(0, p) + encode(inserted, key) + under.slice(under.length - s);
    render(p + inserted.length);
  }

  block.addEventListener("beforeinput", function (e) {
    if (e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") e.preventDefault();
    if (e.inputType && e.inputType.indexOf("format") === 0) e.preventDefault();
  });
  block.addEventListener("input", function () { if (!composing) sync(); });
  block.addEventListener("compositionstart", function () { composing = true; });
  block.addEventListener("compositionend", function () { composing = false; sync(); });
  block.addEventListener("paste", function (e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " ");
    document.execCommand("insertText", false, text);
  });
  block.addEventListener("drop", function (e) { e.preventDefault(); });
  // Copying gives the cipher, which is the point.
  block.addEventListener("copy", function () {
    status.textContent = "Copied the cipher underneath, not the words.";
  });

  // ---------------------------------------------------------- shuffle: change to another key
  shuffle.addEventListener("click", function () {
    setKey((key + 1) % KEYS.length);      // A, B, C, A ...
    recode();
    status.textContent = "Cipher " + "ABC"[key] + ". New drawing on the page, new cipher underneath.";
  });

  // ---------------------------------------------------------- plain text: show the cipher as it is
  plain.addEventListener("click", function () {
    var on = !block.classList.contains("is-plain");
    block.classList.toggle("is-plain", on);
    plain.setAttribute("aria-pressed", String(on));
    status.textContent = on ? "Showing the cipher in an ordinary typeface." : "Showing the words.";
  });

  // ---------------------------------------------------------- hear: read the cipher aloud
  if (!window.ObstacleSpeak || !ObstacleSpeak.supported) {
    hear.disabled = true;
    hear.title = "This browser can't speak. Try Chrome, Safari or Edge.";
  }
  var speaking = false;
  function done() { speaking = false; hear.textContent = "Hear"; hear.classList.remove("is-on"); }
  hear.addEventListener("click", function () {
    if (speaking) { ObstacleSpeak.stop(); done(); return; }
    if (!under) return;
    speaking = true; hear.textContent = "Stop"; hear.classList.add("is-on");
    ObstacleSpeak.speak(under, { onend: done });
  });

  // ---------------------------------------------------------- start
  setKey(0);
  recode();
})();

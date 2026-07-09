// Headless validation harness for go-professional, run with jsc (JavaScriptCore's CLI).
// Loads the real js/*.js files with stubbed DOM/canvas globals so syntax and
// runtime errors surface without a browser or Node. No dependencies.
//
// Usage:
//   jsc validate.js -- <repo-root> <lang: en|ru|az>
// jsc puts everything after "--" into `arguments`.
var repoRoot = (typeof arguments !== "undefined" && arguments[0]) || ".";
var lang = (typeof arguments !== "undefined" && arguments[1]) || "en";

globalThis.window = globalThis;
window.__LANG__ = lang;

function makeCtx() {
  return {
    save() {}, restore() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
    moveTo() {}, lineTo() {}, arc() {}, arcTo() {}, rect() {}, clip() {},
    fillRect() {}, strokeRect() {}, clearRect() {}, translate() {}, rotate() {}, scale() {},
    setLineDash() {}, quadraticCurveTo() {}, bezierCurveTo() {}, setTransform() {}, resetTransform() {}, transform() {},
    measureText(s) { return { width: String(s).length * 6 }; },
    fillText(s) { if (s === undefined) throw new Error("fillText got undefined"); },
    strokeText() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    set fillStyle(v) {}, get fillStyle() { return "#000"; },
    set strokeStyle(v) {}, get strokeStyle() { return "#000"; },
    set lineWidth(v) {}, get lineWidth() { return 1; },
    set font(v) {}, get font() { return "10px sans-serif"; },
    set globalAlpha(v) {}, get globalAlpha() { return 1; },
    set textAlign(v) {}, get textAlign() { return "left"; },
    set textBaseline(v) {}, get textBaseline() { return "alphabetic"; },
    set lineCap(v) {}, get lineCap() { return "butt"; },
    set lineJoin(v) {}, get lineJoin() { return "miter"; },
  };
}

function makeCanvas() {
  const ctx = makeCtx();
  return {
    width: 800, height: 450,
    getContext() { return ctx; },
    getBoundingClientRect() { return { width: 800, height: 450, left: 0, top: 0 }; },
    addEventListener() {}, removeEventListener() {},
    style: {},
  };
}

globalThis.document = {
  documentElement: { style: {} },
  createElement(tag) {
    if (tag === "canvas") return makeCanvas();
    return { style: {}, addEventListener() {}, appendChild() {}, setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} } };
  },
  addEventListener() {},
};
globalThis.getComputedStyle = function () { return { getPropertyValue() { return ""; } }; };
globalThis.requestAnimationFrame = function () { return 0; };
globalThis.cancelAnimationFrame = function () {};
globalThis.performance = { now() { return 0; } };
window.addEventListener = function () {};
window.localStorage = (function () {
  const store = {};
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
  };
})();

const jsFiles = [
  "js/strings.js",
  "js/data.js",
  "js/data.ru.js",
  "js/data.az.js",
  "js/lessons.js",
  "js/lessons.ru.js",
  "js/lessons.az.js",
  "js/animations.js",
];

for (const f of jsFiles) {
  load(repoRoot.replace(/\/$/, "") + "/" + f);
}

print("=== Shape check ===");
print("UI_STRINGS keys en/ru/az: " + Object.keys(window.UI_STRINGS.en).length + "/" + Object.keys(window.UI_STRINGS.ru).length + "/" + Object.keys(window.UI_STRINGS.az).length);
print("COURSE_EN modules: " + window.COURSE_EN.MODULES.length);
print("COURSE_RU modules: " + window.COURSE_RU.MODULES.length);
print("COURSE_AZ modules: " + window.COURSE_AZ.MODULES.length);
print("ANIMATIONS count: " + Object.keys(window.ANIMATIONS).length);

print("=== Animation render check (lang=" + lang + ") ===");
const ids = Object.keys(window.ANIMATIONS);
let failures = 0;
for (const id of ids) {
  try {
    const canvas = makeCanvas();
    const api = window.ANIMATIONS[id](canvas);
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      if (api.seek) api.seek(p);
      else if (api.scrub) api.scrub(p);
    }
    print("OK   " + id);
  } catch (e) {
    failures++;
    print("FAIL " + id + " :: " + e);
  }
}
print(failures === 0 ? "RESULT: ALL PASS (" + lang + ")" : "RESULT: " + failures + " FAILURES (" + lang + ")");

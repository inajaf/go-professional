---
paths:
  - js/app.js
---

## UI micro-interactions

`app.js` has a micro-interactions block (route `page-enter` transition, IntersectionObserver scroll-reveal, hero stat count-up + ring draw-in, and a module-completion celebration with a canvas confetti burst + the `celebrate.data.js` gopher sticker).
All of it respects `prefers-reduced-motion` via the shared `REDUCED` flag - any new animated flourish must check it too.
The scroll-reveal removes its `reveal`/`revealed` classes after the transition finishes, specifically so `transform: none` can never fight an element's own hover/active transforms - keep that pattern if you extend the selector list.
The completion celebration fires only on a false→true `moduleDone` transition from the checklist handlers, never on reset.

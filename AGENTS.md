# AGENTS.md — go-professional

@~/.claude/AGENTS.md

This file is project-specific.
The import line above pulls in ELDAR's global agent instructions automatically.
Those cover cross-project conventions: no em dash, commit message hygiene, one-sentence-per-line for long Markdown, quality over dev cost, E2E-first bug fixing, pixel-perfect UI review, and fixing engineering issues you notice along the way even if unrelated to the current task.
Everything below is specific to this repository and adds to, never replaces, those global rules.

## What this project is

A local-first, zero-dependency interactive course site for production-grade Go (1.24 to 1.26) and distributed systems engineering.
Plain HTML/CSS/JS.
No build step, no bundler, no npm, no Node, no ES modules.
It must keep working when opened directly over `file://` by double-clicking `index.html`.
Do not introduce a package manager, a bundler, or module imports/exports as a "quick fix" for anything. That constraint is deliberate, not an oversight.

## File map

```
index.html         shell, loads scripts in a fixed order (see below)
css/styles.css      design system, dark + light themes
js/strings.js       UI_STRINGS chrome dictionary: { en: {...}, ru: {...} }
js/data.js          window.COURSE_EN = { COURSE_META, PARTS, MODULES, VERIFICATION, ASSIGNMENTS, GLOSSARY }
js/data.ru.js       window.COURSE_RU, same shape, Russian translation
js/lessons.js       window.COURSE_EN.LESSONS and window.COURSE_EN.WORKED_EXAMPLES
js/lessons.ru.js    window.COURSE_RU.LESSONS and .WORKED_EXAMPLES (code fields omitted, inherited from EN)
js/animations.js    makeTimeline() engine + 20 ANIM["id"] canvas animations + CANVAS_RU dict + tr()/lang() helpers
js/app.js           routing, localStorage, rendering, mergeCourse()/mergeModule(), language switcher
```

Script load order in `index.html` matters and must stay exactly:
`strings.js, data.js, data.ru.js, lessons.js, lessons.ru.js, animations.js, app.js`.
Later files assume earlier globals already exist.

## Course content model

20 modules total, keyed by stable opaque ids `f1`-`f5` and `m1`-`m15`.
Note: those ids are NO LONGER in learning order — the course sequence (sidebar, home, prev/next) is defined entirely by `PARTS` and each part's `modules` list (6 parts, a single beginner→principal ramp), and `app.js` derives an `ORDERED` list from `PARTS` for navigation. A module's `code`/`num`/`part` fields carry its displayed label/position; edit those + `PARTS`/`PARTS_RU` to reorder, never rely on the physical `MODULES` array order.
Each module has: `title/short/level/summary/plain/animation{id,title,blurb}/concepts[]{title,body,code?}/ai/practice-or-capstone/pitfalls/takeaways/checklist`, plus a `GLOSSARY` entry, an `ASSIGNMENTS` entry, a `LESSONS` section list (`{h, p}` shape), and a `WORKED_EXAMPLES` entry (`{title, intro, steps: [{title, concept, code, lang, why}]}`).
A module may ALSO carry an optional `animations: [{id,title,blurb}, ...]` array to render several visualizations on one page (the first module does this); when present it takes precedence over the single `animation` for the module page, while `animation` stays the representative shown on the home card. `app.js` deep-merges `animations` per-index for RU just like `WORKED_EXAMPLES` steps, so RU entries need only `title`/`blurb`.

When adding or editing a `WORKED_EXAMPLES` step, the `code` field must be an actually runnable Go snippet.
Compile and run it yourself with the local Go toolchain (`go run`, `go test`) in a scratch directory before it goes into `lessons.js`.
Never hand-write Go code into the lesson content on faith.

## i18n architecture

- `window.__LANG__` is the single flag that controls language, set by `app.js` and read everywhere (including inside `animations.js` for canvas-drawn text).
- `mergeCourse()`/`mergeModule()` in `app.js` deep-merge `COURSE_RU` over `COURSE_EN` per module, per field, so a partial or missing Russian translation falls back to English instead of breaking the page or blanking a section.
- `WORKED_EXAMPLES` gets a dedicated deep-merge by step index (not the generic per-module merge) specifically so English-only `code`/`lang` fields are never dropped when Russian steps only provide `title`/`concept`/`why`.
- Go source code is never translated: not in `concepts[].code`, not in `WORKED_EXAMPLES[].steps[].code`. Go identifiers and comments stay English even in the Russian course, by design.
- Literal tool/CLI output stays English for authenticity: `go test` output, structured log lines, HTTP request lines, SQL, file paths. These are meant to look like real output a Go engineer would see, in any language.
- Canvas-drawn text (labels, badges, legends) is translated centrally: `animations.js` has a `CANVAS_RU` dictionary keyed by the exact English string, plus a `tr(s)` helper that every draw call's `text()`/`badge()`/`legend()` routes through. Draw functions themselves are never touched for translation; only the dictionary grows.
- Dynamic/interpolated canvas strings (e.g. `"cycles: " + done`) cannot be caught by exact-match dictionary lookup. Fix these at the call site by wrapping the static prefix in `tr(...)` and leaving the interpolated value untouched, e.g. `tr("cycles: ") + done`.
- When adding a new animation or a new UI string: add the English string first everywhere it is needed, then add the matching Russian entries to `CANVAS_RU` (animations.js), `UI_STRINGS.ru` (strings.js), or the relevant `*_RU` course object (data.ru.js / lessons.ru.js). Never let English-only content silently ship untranslated when a Russian counterpart file already exists for that layer.

## How to validate changes (no Node/npm in this repo)

There is no Node.js toolchain here. Use these instead:

- **JS syntax/runtime check without a browser**: use `jsc` (JavaScriptCore's CLI, ships with macOS). Typical path: `/System/Volumes/Preboot/Cryptexes/OS/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc` (locate with `find / -name jsc 2>/dev/null` if it moves). Load the real files with a small DOM/canvas stub (`document.createElement`, a fake 2D context with `fillText`/`measureText`/`setTransform`/etc., `window.__LANG__`) and drive each `ANIM["id"](canvas)` through `seek(0..1)` to catch exceptions before touching a browser.
- **Go worked examples**: actually `go run` / `go test` the snippet locally. Never trust that Go code "looks right."
- **UI/visual changes**: open `index.html` in a real browser (or take headless-Chrome screenshots) and look at it. Per the global pixel-perfection standard, check both the English and Russian language states, and both dark and light themes, since a translation or a CSS change can silently break one combination while looking fine in another.
- After any i18n-affecting change, re-run the headless animation pass with `window.__LANG__` set to both `"en"` and `"ru"` to confirm no `ReferenceError`/`TypeError` and no untranslated leftover that should have been caught.

## Things that have bitten this project before

- A shallow merge (`Object.assign` by module id) between `COURSE_EN` and `COURSE_RU` for `WORKED_EXAMPLES` silently dropped English-only `code`/`lang` fields, because the Russian steps array replaced the English one wholesale instead of merging per-step. If you touch `mergeCourse`/`mergeModule` in `app.js`, verify with a real load test that `code` survives merge, not just that translated prose appears.
- `PARTS_RU` entries missing their `modules` array caused a silent blank sidebar in Russian only, with no thrown error. Whenever a `*_RU` mirror object is added or edited, diff its shape against the English original field by field, not just spot-check the visible text.
- Canvas text translated via a fixed dictionary breaks the moment a string becomes dynamic (`"label: " + value`). If you see canvas text that isn't translating, check whether it's dynamic before assuming the dictionary entry is missing.

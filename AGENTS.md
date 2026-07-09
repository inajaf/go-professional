# AGENTS.md - go-professional

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
js/strings.js       UI_STRINGS chrome dictionary: { en: {...}, ru: {...}, az: {...} }
js/data.js          window.COURSE_EN = { COURSE_META, PARTS, MODULES, VERIFICATION, ASSIGNMENTS, GLOSSARY }
js/data.ru.js       window.COURSE_RU, same shape, Russian translation
js/data.az.js       window.COURSE_AZ, same shape, Azerbaijani translation
js/lessons.js       window.COURSE_EN.LESSONS and window.COURSE_EN.WORKED_EXAMPLES
js/lessons.ru.js    window.COURSE_RU.LESSONS and .WORKED_EXAMPLES (code fields omitted, inherited from EN)
js/lessons.az.js    window.COURSE_AZ.LESSONS and .WORKED_EXAMPLES (code fields omitted, inherited from EN)
js/animations.js    makeTimeline() engine + 36 ANIM["id"] canvas animations + CANVAS_RU/CANVAS_AZ dicts + tr()/lang() helpers
js/gopher3d.data.js auto-generated: base64 GLB of the dancing gopher hero mascot (window.GOPHER_GLB_B64) - never edit by hand
js/gopher3d.js      zero-dependency GLB parser + raw-WebGL skinned-mesh renderer for the mascot (window.GOPHER3D.mount)
js/celebrate.data.js auto-generated: transparent PNG sticker data URI (window.GOPHER_STICKER_URI) for the completion toast - never edit by hand
js/app.js           routing, localStorage, rendering, mergeCourse()/mergeModule(), language switcher, micro-interactions
```

Script load order in `index.html` matters and must stay exactly:
`strings.js, data.js, data.ru.js, data.az.js, lessons.js, lessons.ru.js, lessons.az.js, animations.js, gopher3d.data.js, gopher3d.js, celebrate.data.js, app.js`.
Later files assume earlier globals already exist.

## UI micro-interactions

See `.claude/rules/micro-interactions.md` (loads automatically when editing `js/app.js`).

## 3D hero mascot

See `.claude/rules/gopher3d.md` (loads automatically when editing `js/gopher3d.js` or `js/gopher3d.data.js`).

## Course content model

25 modules total, keyed by stable opaque ids `f1`-`f5` and `m1`-`m20`.
Note: those ids are NO LONGER in learning order - the course sequence (sidebar, home, prev/next) is defined entirely by `PARTS` and each part's `modules` list (6 parts, a single beginner→principal ramp), and `app.js` derives an `ORDERED` list from `PARTS` for navigation. A module's `code`/`num`/`part` fields carry its displayed label/position; edit those + `PARTS`/`PARTS_RU`/`PARTS_AZ` to reorder, never rely on the physical `MODULES` array order.
Each module has: `title/short/level/summary/plain/animation{id,title,blurb}/videos[]{title,speaker,url,blurb}/concepts[]{title,body,code?}/ai/practice-or-capstone/pitfalls/takeaways/checklist`, plus a `GLOSSARY` entry, an `ASSIGNMENTS` entry, a `LESSONS` section list (`{h, p}` shape), and a `WORKED_EXAMPLES` entry (`{title, intro, steps: [{title, concept, code, lang, why}]}`).
A module may ALSO carry an optional `animations: [{id,title,blurb}, ...]` array to render several visualizations on one page; when present it takes precedence over the single `animation` for the module page, while `animation` stays the representative shown on the home card. `app.js` deep-merges `animations` per-index for translated languages just like `WORKED_EXAMPLES` steps, so a translated entry needs only `title`/`blurb`.

When adding or editing a `WORKED_EXAMPLES` step, the `code` field must be an actually runnable Go snippet.
Compile and run it yourself with the local Go toolchain (`go run`, `go test`) in a scratch directory before it goes into `lessons.js`.
Never hand-write Go code into the lesson content on faith.

## i18n architecture

- Three languages: English (source of truth), Russian, and Azerbaijani. `window.__LANG__` is the single flag that controls language ("en"/"ru"/"az"), set by `app.js` and read everywhere (including inside `animations.js` for canvas-drawn text).
- The language button in the topbar cycles en → ru → az → en on each click (`LANG_CYCLE` in `app.js`); it always displays the code of the language a click will switch *to*, matching `UI_STRINGS[lang].toggleLang`/`toggleLangAria` for the current language.
- `mergeCourse()`/`mergeModule()` in `app.js` deep-merge `COURSE_RU` or `COURSE_AZ` over `COURSE_EN` per module, per field, so a partial or missing translation falls back to English instead of breaking the page or blanking a section.
- `WORKED_EXAMPLES` gets a dedicated deep-merge by step index (not the generic per-module merge) specifically so English-only `code`/`lang` fields are never dropped when translated steps only provide `title`/`concept`/`why`.
- Not every field merges per-item, though. `concepts[]` and `animations[]` merge per-index (safe to translate partially); `videos[]`/`pitfalls[]`/`takeaways[]`/`checklist[]`/`practice.steps[]` and the top-level `GLOSSARY[id]`/`ASSIGNMENTS[id]`/`LESSONS[id]` dicts all replace **wholesale** the moment a translated value is provided for that key - a partial translation of one of these silently deletes the untranslated English items instead of falling back to them. See the `i18n-translate` skill for the full breakdown.
- Go source code is never translated: not in `concepts[].code`, not in `WORKED_EXAMPLES[].steps[].code`. Go identifiers and comments stay English even in translated courses, by design.
- Literal tool/CLI output stays English for authenticity: `go test` output, structured log lines, HTTP request lines, SQL, file paths. These are meant to look like real output a Go engineer would see, in any language. Video `title`/`speaker`/`url` fields also stay in English (real talk metadata) - only `blurb` is translated.
- Canvas-drawn text (labels, badges, legends) is translated centrally: `animations.js` has `CANVAS_RU`/`CANVAS_AZ` dictionaries keyed by the exact English string, plus a `tr(s)` helper that every draw call's `text()`/`badge()`/`legend()` routes through. Draw functions themselves are never touched for translation; only the dictionaries grow.
- Dynamic/interpolated canvas strings (e.g. `"cycles: " + done`) cannot be caught by exact-match dictionary lookup. Fix these at the call site by wrapping the static prefix in `tr(...)` and leaving the interpolated value untouched, e.g. `tr("cycles: ") + done`.
- When adding a new animation or a new UI string: add the English string first everywhere it is needed, then add matching entries to `CANVAS_RU`/`CANVAS_AZ` (animations.js), `UI_STRINGS.ru`/`UI_STRINGS.az` (strings.js), and the relevant `*_RU`/`*_AZ` course objects (data.ru.js/data.az.js, lessons.ru.js/lessons.az.js). Never let English-only content silently ship untranslated when a translated counterpart file already exists for that layer. Azerbaijani technical prose keeps well-established CS/Go loanwords in English (goroutine, channel, mutex, context, cache line, quorum, etc.) rather than forcing awkward native neologisms - check existing `data.az.js` entries for precedent.

## How to validate changes (no Node/npm in this repo)

There is no Node.js toolchain here. Use these instead:

- **JS syntax/runtime check without a browser**: use `jsc` (JavaScriptCore's CLI, ships with macOS). Typical path: `/System/Volumes/Preboot/Cryptexes/OS/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc` (locate with `find / -name jsc 2>/dev/null` if it moves). Load the real files with a small DOM/canvas stub (`document.createElement`, a fake 2D context with `fillText`/`measureText`/`setTransform`/etc., `window.__LANG__`) and drive each `ANIM["id"](canvas)` through `seek(0..1)` to catch exceptions before touching a browser.
- **Go worked examples**: actually `go run` / `go test` the snippet locally. Never trust that Go code "looks right."
- **UI/visual changes**: open `index.html` in a real browser (or take headless-Chrome screenshots) and look at it. Per the global pixel-perfection standard, check the English, Russian, and Azerbaijani language states, and both dark and light themes, since a translation or a CSS change can silently break one combination while looking fine in another.
- After any i18n-affecting change, re-run the headless animation pass with `window.__LANG__` set to `"en"`, `"ru"`, and `"az"` to confirm no `ReferenceError`/`TypeError` and no untranslated leftover that should have been caught.

## Things that have bitten this project before

- A shallow merge (`Object.assign` by module id) between `COURSE_EN` and `COURSE_RU` for `WORKED_EXAMPLES` silently dropped English-only `code`/`lang` fields, because the Russian steps array replaced the English one wholesale instead of merging per-step. If you touch `mergeCourse`/`mergeModule` in `app.js`, verify with a real load test that `code` survives merge, not just that translated prose appears.
- `PARTS_RU` entries missing their `modules` array caused a silent blank sidebar in Russian only, with no thrown error. Whenever a `*_RU`/`*_AZ` mirror object is added or edited, diff its shape against the English original field by field, not just spot-check the visible text.
- Canvas text translated via a fixed dictionary breaks the moment a string becomes dynamic (`"label: " + value`). If you see canvas text that isn't translating, check whether it's dynamic before assuming the dictionary entry is missing.
- LanguageTool (an open-source grammar checker, see the `i18n-translate` skill) is useful for catching mechanical errors but produces a high false-positive rate on this codebase - it flags Go identifiers embedded in prose (`runtime.ReadMemStats`) as sentence-boundary errors, and flags established loanwords (`алерт`, `мок`, `горутина`) as spelling mistakes. Treat every flag as a lead to manually verify, never auto-apply its suggested fix.

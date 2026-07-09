---
name: i18n-translate
description: Translate new or changed go-professional content into Russian or Azerbaijani, or audit existing content for translation gaps. Use this whenever English content changes (a module, a lesson, a worked example, a UI string, or new animation canvas text) and a translated mirror needs to be brought back in sync, or when the user asks "is the Russian/Azerbaijani version up to date", "translate this", or "why is this showing in English on the translated page". This encodes the specific merge rules and past bugs for this repo's multi-language system - do not improvise a different i18n approach.
---

# Keep go-professional's translations in sync

This course has a full English base plus two translated mirrors - Russian and Azerbaijani - across five files each (`data.js`/`data.ru.js`/`data.az.js`, `lessons.js`/`lessons.ru.js`/`lessons.az.js`, and the `CANVAS_RU`/`CANVAS_AZ` dictionaries inside `animations.js`), unified at runtime by `mergeCourse()`/`mergeModule()` in `app.js`. The system is designed so a missing translation degrades gracefully to English rather than breaking - which is exactly why gaps can go unnoticed for a long time. This skill is about finding and closing those gaps deliberately, not about the merge mechanism itself (see `AGENTS.md` for that).

Everything below is written for Russian (`_RU`/`.ru.js`) but applies identically to Azerbaijani - swap `RU`/`ru` for `AZ`/`az`. When translating into Azerbaijani specifically: prefer keeping well-established CS/Go loanwords in English (goroutine, channel, mutex, context, cache line, quorum, etc.) rather than forcing awkward native neologisms - check `data.az.js`/`lessons.az.js`/`CANVAS_AZ` for precedent the same way you'd check the Russian files, and translate from the English source directly rather than from the Russian mirror (translating a translation compounds drift).

## The rule that decides what to translate

Three categories, not one:

1. **Always translate**: prose. Module summaries, plain-English analogies, concept explanations, lesson sections, worked-example `title`/`concept`/`why`, pitfalls, takeaways, checklist items, glossary definitions, assignment questions/explanations, UI chrome strings, canvas labels/badges/legends.
2. **Never translate**: Go source code (`concepts[].code`, `WORKED_EXAMPLES[].steps[].code`), and literal tool/CLI output meant to look authentic (`go test` output, structured log lines, HTTP request lines, SQL, file paths, HTTP status text like `200 OK`). A Russian-speaking Go engineer reads Go code and terminal output in the same form as everyone else - translating it would look wrong, not helpful.
3. **Identifiers that stay as-is**: currency codes (`USD`), version/protocol names (`X25519`, `ML-KEM-768`), single-letter variable labels (`n`, goroutine names like `G1`), state-machine names that are also code constants (`CLOSED`, `OPEN`).

When in doubt about a specific string, check how similar strings were already handled in `data.ru.js`/`lessons.ru.js`/`CANVAS_RU` - this project has already made the judgment call for hundreds of strings; stay consistent with it rather than re-deriving the rule each time.

## Where to add a translation, by content type

| Content changed | Where the English lives | Where the Russian goes | Where the Azerbaijani goes |
|---|---|---|---|
| Module summary/concepts/pitfalls/etc. | `js/data.js` → `MODULES` | `js/data.ru.js` → `MODULES_RU`, same shape | `js/data.az.js` → `MODULES_AZ`, same shape |
| Glossary/Assignments | `js/data.js` → `GLOSSARY`/`ASSIGNMENTS` | `js/data.ru.js` → `GLOSSARY_RU`/`ASSIGNMENTS_RU` | `js/data.az.js` → `GLOSSARY_AZ`/`ASSIGNMENTS_AZ` |
| Lesson sections | `js/lessons.js` → `LESSONS` | `js/lessons.ru.js` → `LESSONS` (same key) | `js/lessons.az.js` → `LESSONS` (same key) |
| Worked example steps | `js/lessons.js` → `WORKED_EXAMPLES` | `js/lessons.ru.js` → `WORKED_EXAMPLES`, **omit `code`/`lang`** so English stays authoritative | `js/lessons.az.js` → `WORKED_EXAMPLES`, same omission |
| UI chrome (buttons, labels, headings) | `js/strings.js` → `UI_STRINGS.en` | `js/strings.js` → `UI_STRINGS.ru`, same key | `js/strings.js` → `UI_STRINGS.az`, same key |
| Canvas-drawn text in an animation | `js/animations.js`, inline in a `draw()` call | `js/animations.js` → `CANVAS_RU` dictionary, keyed by the **exact** English string | `js/animations.js` → `CANVAS_AZ` dictionary, same key |

## Which array/object fields replace wholesale vs. merge per-item

`mergeModule`/`mergeCourse` in `app.js` do NOT treat every field the same way - some fall back to English per-item when a translation is missing, others replace the whole English array/object the moment you provide *any* translated value for that key. Get this backwards and a partial translation silently **deletes** English content on the translated page instead of falling back to it:

- **Per-item merge (safe to translate partially)**: `concepts[]` (merged by index), `animations[]` (merged by index, for modules that carry several visualizations), and the flat sub-objects `ai{title,body,prompt}` / `capstone{...}` (each field falls back independently since it's a plain `Object.assign`). `WORKED_EXAMPLES[id].steps[]` is also merged per-step.
- **Wholesale replace (all-or-nothing per module)**: `videos[]`, `pitfalls[]`, `takeaways[]`, `checklist[]`, `practice.steps[]`. If you translate one of these for a module, translate every item in it - a 2-of-4 translated `pitfalls` array will show only those 2 pitfalls, not the 2 you skipped falling back to English.
- **Wholesale replace by module id**: `GLOSSARY[id]`, `ASSIGNMENTS[id]`, `LESSONS[id]` - translate every term/question/section for a module or omit that module's key from the dict entirely.

## Canvas text specifically: static vs. dynamic

Canvas text is the trickiest layer because translation happens centrally, not at the call site, via a `tr(s)` helper that every `text()`/`badge()`/`legend()` call routes through:

```js
function tr(s) { if (lang() !== "ru") return s; return CANVAS_RU[s] || s; }
```

- **Static literal** (`u.text(ctx, "cache miss ✗", ...)`) - just add `"cache miss ✗": "промах кэша ✗"` to `CANVAS_RU`. Works automatically, including when the literal lives in an array (`const labels = [...]`) that gets passed through `text()` later - the lookup is by value at render time, not by call site.
- **Dynamic/interpolated** (`u.text(ctx, "cycles: " + done, ...)`) - a dictionary entry for `"cycles: "` alone will never match the concatenated result `"cycles: 4"`. Fix it at the call site instead: `tr("cycles: ") + done`. Search `animations.js` for the existing `tr(...)` call-site fixes as templates before writing a new one.
- Ternary ranges (`dead ? "ctx.Done() ✓" : "running ●"`) are static from `tr()`'s point of view - both branches are literals, so both just need dictionary entries; no call-site change needed.

## Auditing for gaps

To find what's untranslated, don't eyeball the translated page - diff structure instead:

1. Run the `validate-js-headless` skill (if available) for `en`, `ru`, and `az`. It prints module counts and `UI_STRINGS` key counts for all three languages - any mismatch is a real gap, not a maybe.
2. For canvas text specifically: grep `js/animations.js` for `u\.text\(ctx, "` and `u\.badge\(ctx,` to list every literal string drawn, then check each one has both a `CANVAS_RU` and a `CANVAS_AZ` entry. A string with no entry renders in English on the translated page with no error - this only shows up by literally comparing the list against the dictionary keys, never by running the code.
3. For course content: compare `Object.keys()` on matching English/translated objects (e.g. `MODULES` vs `MODULES_RU`/`MODULES_AZ` by module id, or a single module's field set) rather than reading every paragraph.

## Bugs this exact project already hit - don't repeat them

- **Shallow per-module merge dropped `code`/`lang`** from `WORKED_EXAMPLES` because the generic merge replaced the whole `steps` array instead of merging step-by-step. `WORKED_EXAMPLES` has its own dedicated merge logic in `app.js` for this reason - if you ever touch that merge code, verify `code` survives by loading a module's worked example in Russian and checking the Go snippet is still there, not just that the prose translated.
- **`PARTS_RU` entries missing `modules` arrays** silently blanked the sidebar in Russian only, with no thrown error, because the render code did `p.modules.map(...)` on `undefined`... actually on an empty/missing array, showing nothing. Whenever a `*_RU` top-level object is added, diff its field set against the English original, don't just check the text reads correctly.
- **A dictionary entry added for a string that's actually dynamic** looks like a fix but never fires, because the interpolated result never matches the dictionary key exactly. If a canvas string still shows English after you "translated" it, check whether it's built with `+` concatenation before assuming the dictionary entry is wrong.

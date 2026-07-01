---
name: validate-js-headless
description: Validate go-professional's JS files (js/data.js, js/data.ru.js, js/lessons.js, js/lessons.ru.js, js/animations.js, js/strings.js, js/app.js) for syntax errors, shape mismatches, and runtime exceptions, without Node.js and without opening a browser. Use this any time you edit those files, add or edit a course module, add or edit an animation, or touch the i18n merge logic in app.js - run it before telling the user a change is done, not just when something looks broken. This repo has no Node/npm toolchain by design (see AGENTS.md), so this is the only fast feedback loop besides manually opening index.html.
---

# Validate go-professional JS headlessly

This repo is deliberately Node-free and build-step-free (see `AGENTS.md` at the repo root).
That means there is no `npm test`, no linter, and no bundler to catch a typo or a dropped field before it reaches the browser.
`jsc` (JavaScriptCore's command-line shell, ships with every macOS install) is the fastest way to catch syntax errors, `ReferenceError`s, and structural mistakes in seconds, in both English and Russian, without a browser.

## Why this exists

The three real bugs hit while building this project's i18n system were all things this exact check would have caught immediately instead of requiring a manual click-through:
- A shallow merge dropped `code`/`lang` fields from `WORKED_EXAMPLES` when Russian steps were merged in.
- `PARTS_RU` entries missing their `modules` array silently blanked the sidebar in Russian only.
- A `CANVAS_RU` dictionary lookup on a dynamic (interpolated) string never matches, so newly-added canvas text can look "translated" in the code but render in English.

None of these throw in English-only testing. They only show up when you actually load both language states and walk every animation through its full timeline. That is exactly what this check does.

## How to run it

Locate `jsc` once per machine (path varies by macOS version):

```bash
find / -name jsc -type f 2>/dev/null | grep -v Preboot/Cryptexes/Incoming | head -1
```

Then run the bundled harness for both languages from the repo root:

```bash
JSC=<path-from-above>
$JSC .claude/skills/validate-js-headless/scripts/validate.js -- . en
$JSC .claude/skills/validate-js-headless/scripts/validate.js -- . ru
```

Each run prints:
- A shape check: `UI_STRINGS` key counts for en/ru (should match), module counts for `COURSE_EN`/`COURSE_RU` (should match, currently 20 each), and the total animation count (currently 20).
- Per-animation `OK <id>` or `FAIL <id> :: <error>` as it drives every `ANIM["id"]` through `seek(0..1)` across 12 sample points.
- A final `RESULT: ALL PASS (<lang>)` or `RESULT: N FAILURES (<lang>)`.

Run both languages, not just one. A change that's correct in English can still throw in Russian (or vice versa) because of the `mergeCourse`/`mergeModule` fallback logic and the `CANVAS_RU` dictionary lookup - see `AGENTS.md`'s i18n section for how those work.

## Interpreting failures

- **`TypeError: ctx.<method> is not a function`** - the stub context in `scripts/validate.js` is missing a canvas API the real code now calls. Add a no-op stub for it in `makeCtx()` in that script, then re-run. This is a harness gap, not a bug in the site.
- **`ReferenceError: X is not defined`** inside an animation - almost always a missing dictionary entry (`CANVAS_RU`) or a typo'd variable name introduced while editing `animations.js`.
- **Module/key counts mismatched between en/ru** - one of the `*_RU` mirror files is missing an entry that the English original has. `mergeModule`/`mergeCourse` will silently fall back to English for that one field, which can hide the gap until you specifically diff counts like this.
- **Everything passes but new text still shows in English on the Russian page** - the string is very likely being built dynamically (e.g. `"cycles: " + done`) rather than passed as a literal, so the `tr()` exact-match lookup in `animations.js` never fires. Fix at the call site by wrapping the static portion in `tr(...)`, per the pattern already used throughout `animations.js`. This check won't flag it as a failure since nothing throws - you have to actually read the render or check the dictionary coverage.

## After validating

If everything passes, that only proves nothing *throws*. For UI or visual changes, still open `index.html` in a real browser (or take a screenshot) and look at both language states and both themes, per `AGENTS.md`. This check is the fast net that catches structural breakage early, not a replacement for actually looking at the page.

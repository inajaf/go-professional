---
name: add-course-module
description: Add a brand-new module to the go-professional course (e.g. "add a module on X", "create a new lesson about Y", "I want to teach Z next"), or substantially restructure an existing one. Use this whenever the user wants a new topic added to the course, since a module touches seven places at once (data.js, lessons.js, animations.js, and three Russian mirror files, plus GLOSSARY/ASSIGNMENTS) and missing any one of them either breaks the page silently or ships an English-only gap in the Russian course. Do not use this for small text tweaks to an existing module — only for adding a new module or reworking one end to end.
---

# Add a new go-professional course module

A module is not one file. It is a matching set of entries spread across seven places, and this course has two full mirrors (English source of truth, Russian translation with automatic English fallback). The fastest way to break the course is to add four of the seven and forget the fifth — it won't throw, it'll just silently show English text on the Russian page, or blank a section, or drop the sync check. Read `AGENTS.md` at the repo root first for the i18n rules this skill depends on (`mergeCourse`/`mergeModule`, what never gets translated, why).

## The seven places a module lives

Pick a module id first (existing pattern: `f1`-`f5` for Foundations, `m1`-`m15` for the hardcore syllabus — the next new one continues that numbering, e.g. `m16`).

1. **`js/data.js`** — add an entry to `MODULES` with `title/short/level/summary/plain/animation{title,blurb}/concepts[]{title,body,code?}/ai/practice-or-capstone/pitfalls/takeaways/checklist`. Also add matching entries to `GLOSSARY` (terms for this module) and `ASSIGNMENTS` (graded questions), and make sure the module id is listed under the right track in `PARTS`.
2. **`js/data.ru.js`** — the same module entry, `GLOSSARY`, `ASSIGNMENTS`, and the `PARTS_RU` listing, all in Russian. **`PARTS_RU` entries need their `modules` array populated** — this exact omission silently blanked the sidebar once already; don't repeat it.
3. **`js/lessons.js`** — add a `LESSONS` entry (`{h, p}` section list) and a `WORKED_EXAMPLES` entry (`{title, intro, steps: [{title, concept, code, lang, why}]}`, typically 3-5 steps).
4. **`js/lessons.ru.js`** — the `LESSONS` and `WORKED_EXAMPLES` translation. For `WORKED_EXAMPLES`, **omit the `code` and `lang` fields entirely** on the Russian side — the dedicated per-step merge in `app.js` inherits those from English on purpose, so Go code is never duplicated or (worse) mistranslated.
5. **`js/animations.js`** — add `ANIM["<module-id-slug>"] = (canvas) => {...}` using the `STEPS` + `stepRender()` pattern already used by every other animation (look at a recent one, e.g. `circuit-breaker`, as the template — isolate one concept per step, keep `title`/`desc`/`why` on each step).
6. **`js/animations.js` again, `CANVAS_RU`** — every literal string the new animation draws via `u.text()`/`u.badge()`/`u.legend()` needs a Russian entry in the `CANVAS_RU` dictionary near the top of the file, keyed by the exact English string. Any dynamic/interpolated canvas string (e.g. `"cycles: " + done`) needs its call site wrapped as `tr("cycles: ") + done` instead — a dictionary entry alone won't catch it.
7. **`js/strings.js`** — only touch this if the new module needs a brand-new piece of *chrome* UI (rare); module content itself doesn't go here.

## Order of operations

1. Write the English module content first, end to end (steps 1, 3, 5) — get it right once before translating.
2. For every `WORKED_EXAMPLES` code step: actually `go run` or `go test` it in a scratch directory with the local Go toolchain before it goes into `lessons.js`. Never hand-write Go into the lesson on faith — this course's credibility rests on every snippet being real, runnable code.
3. Only after the English side is settled, translate into Russian (steps 2, 4, 6). Translating a moving target wastes work.
4. Add the module id to the right `PARTS`/`PARTS_RU` track array so it's actually reachable from the sidebar.
5. Validate. If the `validate-js-headless` skill is available, run it for both `en` and `ru` — it will catch a missing `PARTS_RU.modules` entry, a mismatched module count, or a `ReferenceError` from a typo'd `CANVAS_RU` key. If not, at minimum open `index.html` in a browser, click through the new module in both languages, and run through its animation with the step dots.
6. Check the mastery checklist, assignments, and glossary actually reference terms and claims that appear in the module's own concepts/lessons — a checklist item nobody explained in the lesson is a bad experience.

## Common ways this goes wrong

- Adding the module to `MODULES` but forgetting `PARTS`/`PARTS_RU`, so it exists but is unreachable from navigation.
- Writing `WORKED_EXAMPLES` code that "looks right" for Go but was never actually compiled — this course has caught real mistakes this way before; don't skip the compile/run step.
- Copying an existing animation's `STEPS` structure but forgetting to add its new strings to `CANVAS_RU`, so the new animation is the one gap in an otherwise fully-Russian course.
- Translating `WORKED_EXAMPLES` steps by copying the whole step object into `lessons.ru.js` including `code`/`lang` — don't; leave those two fields out on the Russian side so English stays the single source of truth for Go code.

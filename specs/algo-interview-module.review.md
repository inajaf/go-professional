# Review: Course module F4 - Interview Data Structures & Algorithms

> Spec: specs/algo-interview-module.md · build report: specs/algo-interview-module.build.md · reviewed 2026-07-03
> Verdict: PASS

## Findings

None.

## Out-of-scope work

None attributable to this build.

Two clarifications from scanning the working tree:

- The uncommitted changes to `js/app.js`, `js/strings.js`, `index.html`, `css/styles.css`, and the new `js/celebrate.data.js` (micro-interactions and completion celebration) are NOT part of this build.
  Their file mtimes (01:43-01:46) predate the spec itself (13:24); they are separate parallel work already in the working tree.
- The `ledgerRoadmap.m19` entries (EN `js/data.js:21`, RU `js/data.ru.js:21`) and the AGENTS.md module-count update are the two deviations the build report declared.
  Both are integration of the specified module into existing surfaces, not new features; accepted.

One non-gating observation for a follow-up (no spec item covers it): `README.md` still says "23 modules" and "31 canvas animations"; after this build the real counts are 24 and 35.

## Verified items

All verification below was performed independently; the build report was used only as a map.

### Must-haves

1. **Module id/code/level/placement** - verified by reading: `js/data.js:3640-3808` defines m19 with `code: "F4"`, `num: 4`, `part: "part-0"`, `level: "Beginner → Mid"`. `PARTS` part-0 is `["f4","f5","f3","m19"]` (`js/data.js:630`), i.e. F1, F2, F3, F4; `PARTS_RU` mirrors it exactly (`js/data.ru.js:117`). m19 is a fresh id; m1-m18 already existed.
2. **Five concepts** - slice internals, map internals, heap sift, BFS/DFS, graph representations, each with a Go snippet and interview framing (`js/data.js:3689-3772`). All five snippets assembled into a scratch program, `go vet` clean, `go run` output matches the in-snippet comments (e.g. the aliasing snippet really prints `1`).
3. **Four animations** - `ANIM["bfs-wave"|"lru-cache"|"hashmap-internals"|"slice-heap"]` registered (`js/animations.js:4903/5030/5139/5233`) with 7/6/6/7 phases, each phase carrying title/desc/why. `m19.animations` lists all four with bfs-wave first, and `m19.animation` (home-card representative) is bfs-wave. ANIM registrations grew 31 → 35 in the working tree (+4 from this build; the other 3 are the pre-existing uncommitted SRE work).
4. **LRU worked example** - 4 steps, hand-rolled DLL + map with sentinels, `container/list` appears only as "disallowed" prose. The four steps assembled verbatim into `scratchpad/review-m19/main.go`; `go vet` clean; `go run` prints exactly `100 true / false / 100 true / 300 true`, matching step 4's claimed output character for character.
5. **Full module surface** - ai (with prompt), practice (4 steps), pitfalls (3), takeaways (4), checklist (5), 6-term GLOSSARY.m19, 3-task ASSIGNMENTS.m19 (mcq/blank/predict), 6-section LESSONS.m19. All read and counted.
6. **Complete RU mirrors** - data.ru.js m19 mirrors every prose field including all 5 concepts (no code fields, so EN code is inherited); lessons.ru.js has 6 lesson sections and 4 WE steps carrying only title/concept/why; CANVAS_RU coverage checked programmatically: every title/desc/why of all 26 new phases has an entry (script: `scratchpad/review-m19/canvasru-check.js`, result COMPLETE). A DOM text scan of the rendered RU m19 page found zero untranslated prose lines (only the global noscript fallback, which is not module content).

### Edge cases

1. **RU animations merge per index, title/blurb only** - RU entries carry only title/blurb (`js/data.ru.js:1524-1545`); `mergeModule` in `js/app.js:44-47` merges per index over the EN entries so `id` and any omitted field fall back to English.
2. **Dynamic canvas strings wrapped in tr()** - `tr("queue: ")` (animations.js:4937), `tr("stack: ") + "[C, E]"` (:5015), `tr("bucket ") + b` (:5146); each prefix has a CANVAS_RU entry, and the RU screenshots show them rendered in Russian.
3. **m19 in both PARTS and PARTS_RU** - present in both arrays; the RU sidebar renders Part 1 with four modules (screenshot-verified, no blank sidebar).
4. **Derived counters grow** - jsc shape check reports 24 modules in both COURSE_EN and COURSE_RU; the rendered home page contains 24 distinct module links in both languages; progress ring shows 0/24. Animation total is now 35 (+4 from this build).
5. **Prev/next chain** - DOM probe of the rendered m19 page: EN nav is "← Writing Tests / Garbage Collector →", RU nav is "← Тестирование / Сборщик мусора →", i.e. F3 → F4 → R1 in both languages, derived from PARTS order (`js/app.js:105,560-561`).

### Definition of done

- **jsc headless validation** - re-run myself with the documented jsc binary for both languages: `RESULT: ALL PASS (en)` and `RESULT: ALL PASS (ru)`, all 35 animations (including the 4 new ids) driven through seek(0..1) with no exceptions.
- **Worked-example Go code** - re-compiled and re-run myself (go vet + go run in a scratch module); real output matches the lesson's claimed output exactly.
- **Four render states** - headless-Chrome screenshots taken of the m19 page in EN/dark, EN/light, RU/dark, RU/light (plus full-page 12000px captures of EN and RU covering worked example, concepts, assignments, glossary, checklist, footer nav). All render correctly; RU page has no untranslated prose; Go code and CLI output stay English per policy. Note for future runs: the site's WebGL mascot hangs headless Chrome; pass `--disable-webgl --disable-webgl2` when screenshotting.
- **Home page** - 24 module links in course order, Part 1 = F1, F2, F3, F4 (f4, f5, f3, m19), m19 card shows "F4 · Interview DS & Algorithms" / "F4 · Интервью: структуры и алгоритмы"; prev/next chain verified above.
- **Animations on the page** - all four visualizations render on the module page with step dots, scrub slider, speed control, and translated RU captions (screenshot-verified at step 1 of each; jsc drove every phase in both languages).

### Scope discipline

- Nice-to-haves correctly NOT built: no sorting/binary-search concept, no dedicated Big-O/amortized-analysis concept in m19.
- Non-goals respected: no container/list in the worked example, no changes to existing modules' content, no new UI chrome from this build.

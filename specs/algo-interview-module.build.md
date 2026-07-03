# Build report: Course module F4 - Interview Data Structures & Algorithms

> Spec: specs/algo-interview-module.md · built 2026-07-03

## Requirement coverage
| # | Requirement | Status | Where |
| 1 | New module id m19, code F4, level Beginner → Mid, Part 1 after F3 in PARTS and PARTS_RU | covered | js/data.js MODULES + PARTS part-0; js/data.ru.js MODULES_RU + PARTS_RU part-0 |
| 2 | Five concepts with Go code: slice internals, map internals, heap, BFS/DFS, graph representations | covered | js/data.js m19.concepts (5 entries, all with code, all snippets compiled and run) |
| 3 | Four animations bfs-wave / lru-cache / hashmap-internals / slice-heap, 6-8 phases each, on the module's animations array | covered | js/animations.js ANIM (7/6/6/7 phases); js/data.js m19.animations (bfs-wave is the representative) |
| 4 | LRU worked example, 3-4 steps, hand-rolled DLL + map, code verified locally | covered | js/lessons.js WORKED_EXAMPLES.m19 (4 steps); verified with go vet + go run, output in step 4 is the real run |
| 5 | Full module surface: ai/practice/pitfalls/takeaways/checklist + 6-term glossary + 3 assignments + 6 lesson sections | covered | js/data.js (module fields, GLOSSARY.m19, ASSIGNMENTS.m19); js/lessons.js LESSONS.m19 |
| 6 | Complete RU mirrors: data.ru.js, lessons.ru.js (no code fields), CANVAS_RU for every new canvas string | covered | js/data.ru.js (module, glossary, assignments); js/lessons.ru.js (lessons + WE steps without code/lang); js/animations.js CANVAS_RU (~120 new entries) |

## Edge cases
| # | Case | Status | Where |
| 1 | RU animations merge per index, title/blurb only | covered | js/data.ru.js m19.animations - 4 entries, title/blurb only, order matches EN |
| 2 | Dynamic canvas strings wrapped in tr() at call site | covered | "queue: ", "stack: ", "bucket " prefixes wrapped in tr() in the new draw code; each has a CANVAS_RU entry |
| 3 | Module id in both PARTS and PARTS_RU modules arrays | covered | data.js line ~626, data.ru.js line ~113 |
| 4 | Derived home counters grow | covered | headless check: 24/24 modules both languages; home shows 0/24 ring and 24-module count-up |
| 5 | Prev/next chain F3 → F4 → R1 | covered | headless DOM probe: m19 page nav = "← Writing Tests" / "Garbage Collector →" |

## Definition of done
- [x] jsc validation en + ru: RESULT ALL PASS both, all 35 animations (incl. 4 new) driven through seek(0..1) in both languages.
- [x] Worked-example Go code compiled and run with go1.26.3 (go vet clean); the output block in step 4 is copied from the real run (100 true / false / 100 true / 300 true). Concept snippets additionally compiled in a scratch program.
- [x] Module page rendered EN/dark and RU/light via headless Chrome screenshots; no untranslated prose on the RU page (code and identifiers excepted by policy). Animations additionally screenshotted mid-phase in RU.
- [x] Home shows 24 modules (sidebar Part 1 = F1-F4, ring 0/24); prev/next verified F3 → F4 → R1 by DOM probe.
- [x] All four animations play with step dots, scrubbing and translated RU captions (verified via seek screenshots at multiple phases).

## Interpretations and deviations
- The home page gained a "Distributed Financial Ledger roadmap" section (added to the repo after the spec was written) that lists every module's ledger contribution from COURSE_META.ledgerRoadmap with a fallback to the module's practice block. Without an entry, m19 would render its generic practice text under the "what this module adds to the ledger" heading, which reads wrong. Added ledgerRoadmap.m19 entries (EN+RU) - classified as integrating the specified module into an existing home surface, not a new feature.
- AGENTS.md's module count line updated 23 → 24 (m1-m19) to keep repo docs accurate.
- Animation phase counts: bfs-wave and slice-heap have 7 steps, lru-cache and hashmap-internals have 6 - within the spec's 6-8 range.
- The m19 assignments use mcq/blank/predict types (no "code" type) - the spec fixed the count (3) but not the mix; predict fits the BFS shortest-path question best.

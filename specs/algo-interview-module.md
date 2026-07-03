# Course module F4: Interview Data Structures & Algorithms

> Status: draft · 2026-07-03 · written from a /spec interview

## Objective
Add a new module to the go-professional course teaching the core data structures and algorithms asked at engineering interviews, with detailed explanations grounded in how Go actually implements them.
It sits in Part 1 as the bridge between idiomatic-Go basics and the runtime internals track, so a learner finishing the foundations can prepare for coding interviews without leaving the course.

## Requirements
### Must have
1. A new module with a fresh opaque id (next free `m` id), displayed code `F4`, level "Beginner → Mid", placed in Part 1 immediately after F3 in both `PARTS` and `PARTS_RU` module lists.
2. Five concepts with detailed bodies and Go code where it helps: slice internals (backing array, growth, append cost), map internals (hashing, buckets, why iteration order is random), heap as priority queue (sift-up/sift-down on a slice), tree traversals (BFS with a queue vs DFS with recursion/stack), graph representations (adjacency list vs matrix, when which) - each concept ties back to what interviewers actually probe.
3. Four new canvas animations registered in `ANIM` and carried on the module's `animations` array (the first is the home-card representative): `bfs-wave` (frontier spreading level by level, queue visible), `lru-cache` (Get/Put moving nodes, tail eviction), `hashmap-internals` (hash → bucket → tophash scan, growth/evacuation), `slice-heap` (append with reallocation + heap sift operations). Each has 6-8 phases with title/desc/why captions.
4. A worked example building an LRU cache in 3-4 steps: hand-rolled doubly-linked list plus map for O(1) Get/Put (interviews expect it without `container/list`), with every step's code compiled and run by the local Go toolchain before it ships.
5. Full module surface per AGENTS.md: title/short/summary/plain/ai/practice/pitfalls/takeaways/checklist, a 6-term GLOSSARY entry, a 3-task ASSIGNMENTS entry, and a 6-section LESSONS deep dive.
6. Complete Russian mirrors at every layer: module fields in data.ru.js, lessons + worked-example prose in lessons.ru.js (code fields omitted), and CANVAS_RU entries for every new canvas string, so the Russian page has zero untranslated prose.

### Nice to have
Sorting algorithms and binary-search invariants as a concept.
A Big-O/amortized-analysis dedicated concept.
Both are deferred - the user cut them from this module's scope.

## Constraints
Everything in the repo's AGENTS.md applies: zero-dependency vanilla JS, works over file://, script load order untouched, Go code and literal CLI output never translated, the add-course-module skill governs the seven touch points.
Go snippets verified with the local Go 1.26 toolchain.
Animation architecture: makeTimeline + stepRender, deterministic render as a pure function of time, translated only via the CANVAS_RU dictionary and tr() call-site pattern for dynamic strings.

## Edge cases
1. RU `animations` array merges per index and RU entries carry only title/blurb - a missing RU entry must fall back to English without blanking the section.
2. Any dynamic (concatenated) canvas string must wrap its static prefix in tr() at the call site - dictionary lookup alone will not match it.
3. The module id goes into both `PARTS` and `PARTS_RU` modules arrays - a missing RU entry silently blanks the Russian sidebar (past bug).
4. Home page module/animation counters are derived - verify they grow (24 modules, +4 animations) rather than hardcoding.
5. Prev/next navigation is derived from PARTS order - F3 → F4 → R1 must chain correctly in both languages.

## Non-goals
No sorting, binary search, dynamic programming, or Big-O-theory concepts in this module.
No changes to existing modules' content and no reordering of existing modules.
No new UI chrome, controls, or CSS beyond what the module content itself needs.
No use of container/list in the worked example - the hand-rolled list is the teaching point.

## Definition of done
- [ ] Headless jsc validation passes for en and ru, and all four new animation ids drive through seek(0..1) in both languages without errors.
- [ ] Every worked-example step's Go code compiles and runs locally, and any output shown in the lesson matches the real run.
- [ ] The module page renders correctly in all four states (EN/RU × dark/light), verified with headless-Chrome screenshots, with no untranslated prose on the RU page (code/CLI output excepted by policy).
- [ ] Home page shows 24 modules, Part 1 lists F1-F4, and prev/next chains F3 → F4 → R1 in both languages.
- [ ] All four animations play on the module page with step dots, scrubbing, and translated captions in RU.

## Open questions
None.

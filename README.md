# Hardcore Go & Distributed Systems Engineering - Interactive Course

A **local-first, zero-dependency** interactive course site for production-grade Go
(1.24 → 1.26) and distributed systems. Built with plain HTML/CSS/JS - no build step,
no server, no tracking. Your progress and notes live in your browser's `localStorage`.

## Run it

Just open `index.html` in any modern browser (double-click it, or
`open index.html` on macOS). That's it.

> Everything works over `file://`. No `npm install`, no bundler.

## What's inside

**22 modules across 6 ordered parts**, each with at least one interactive, step-by-step animation:

The home page also includes a **Distributed Financial Ledger roadmap** that shows the final project as one system and links each module to the ledger capability it adds.

- **Foundations - Go Runtime & Tooling** (beginner-friendly tutorials)
  - F1 · Garbage Collector - tri-color mark & sweep, GOGC, GOMEMLIMIT
  - F2 · Profiling with pprof - CPU/heap/goroutine profiles, flame graphs
  - F3 · Writing Tests - table-driven tests, subtests, coverage, fuzzing
  - F4 · Goroutines & Channels - worker pools, fan-out/fan-in, context
  - F5 · Errors & Context - `%w` wrapping, `errors.Is/As`, project layout
- **Part 3–6 - Mid → Senior → Staff/Principal** (the production systems ramp)
  - Native routing & `os.Root`, json/v2 & Swiss Tables, `runtime.AddCleanup` &
    interning, `testing/synctest`, sqlc & pgx, PostgreSQL schema/index/migration
    pitfalls, post-quantum ML-KEM, FlightRecorder & leak forensics, CPU caches,
    SIMD & Green Tea GC, observability, resilience, Redis, container rollout &
    governance.

Every module page has:
- **In plain terms** - a plain-English analogy
- **Interactive visualization** - numbered steps, play/pause, scrub, step, speed
- **Core concepts** with syntax-highlighted, copyable Go snippets
- **Assignments** - graded instantly in your browser: multiple-choice and
  fill-in-the-blank are checked exactly; predict-the-output and "write code"
  tasks are checked structurally (rule by rule), not compiled
- **AI tutor / ready-made prompt** to paste into Claude or Cursor, plus a
  hands-on **Try it yourself** or **Capstone** task
- **Common pitfalls** and **Key takeaways**
- A mastery **checklist** (drives progress) and a local **notes** field

## Tips

- Use the **step dots** under each animation to jump to a phase; the caption explains it.
- The animations default to **0.4×** - click the speed button to slow down or speed up.
- Press **space** to play/pause the animation, **←/→** to move between modules.
- Toggle **dark/light** with the ☾ button (top right). Everything is saved locally.

## Files

```
index.html         # shell, loads scripts in fixed order
css/styles.css     # design system, dark + light themes
js/strings.js      # UI chrome dictionary
js/data.js         # English course structure and assignments
js/data.ru.js      # Russian course structure and assignments
js/lessons.js      # English deep-dive lessons and runnable examples
js/lessons.ru.js   # Russian lesson text, inheriting Go code from English
js/animations.js   # 28 canvas animations + timeline engine
js/app.js          # routing, localStorage, rendering, controls
```

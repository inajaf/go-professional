# Hardcore Go & Distributed Systems Engineering - Interactive Course

A **local-first, zero-dependency** interactive course site for production-grade Go
(1.24 → 1.26) and distributed systems. Built with plain HTML/CSS/JS - no build step,
no server, no tracking. Your progress and notes live in your browser's `localStorage`.

## Run it

Just open `index.html` in any modern browser (double-click it, or
`open index.html` on macOS). That's it.

> Everything works over `file://`. No `npm install`, no bundler.

## What's inside

**14 modules across 4 tracks**, each with an interactive, step-by-step animation:

- **Foundations - Go Runtime & Tooling** (beginner-friendly tutorials)
  - F1 · Garbage Collector - tri-color mark & sweep, GOGC, GOMEMLIMIT
  - F2 · Profiling with pprof - CPU/heap/goroutine profiles, flame graphs
  - F3 · Writing Tests - table-driven tests, subtests, coverage, fuzzing
  - F4 · Goroutines & Channels - worker pools, fan-out/fan-in, context
  - F5 · Errors & Context - `%w` wrapping, `errors.Is/As`, project layout
- **Part 1–3 - Mid → Senior → Staff/Principal** (the original hardcore syllabus)
  - Native routing & `os.Root`, json/v2 & Swiss Tables, `runtime.AddCleanup` &
    interning, `testing/synctest`, sqlc & pgx, post-quantum ML-KEM, FlightRecorder
    & leak forensics, SIMD & Green Tea GC, container rollout & governance.

Every module page has:
- 💡 **In plain terms** - a plain-English analogy
- 🎬 **Interactive visualization** - numbered steps, play/pause, scrub, step, speed
- **Core concepts** with syntax-highlighted, copyable Go snippets
- ✅ **Assignments** - graded instantly in your browser: multiple-choice and
  fill-in-the-blank are checked exactly; predict-the-output and "write code"
  tasks are checked structurally (rule by rule), not compiled
- **AI tutor / ready-made prompt** to paste into Claude or Cursor, plus a
  hands-on **Try it yourself** or **Capstone** task
- ⚠ **Common pitfalls** and 🔑 **Key takeaways**
- A mastery **checklist** (drives progress) and a local **notes** field

## Tips

- Use the **step dots** under each animation to jump to a phase; the caption explains it.
- The animations default to **0.75×** - click the speed button to slow down or speed up.
- Press **space** to play/pause the animation, **←/→** to move between modules.
- Toggle **dark/light** with the ☾ button (top right). Everything is saved locally.

## Files

```
index.html         # shell - loads the three scripts
css/styles.css     # design system (dark + light themes)
js/data.js         # all course content
js/animations.js   # the 14 canvas animations + timeline engine
js/app.js          # routing, localStorage, rendering, controls
```

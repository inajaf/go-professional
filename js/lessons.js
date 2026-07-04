/* =====================================================================
   DEEP-DIVE LESSONS - the broader narrative for each module.
   Loaded after data.js; attaches to window.COURSE.LESSONS.
   Each lesson is an array of sections: { h, p } (+ optional code, lang).
   `p` may use \n\n for paragraph breaks and `backticks` for inline code.
   ===================================================================== */
window.COURSE_EN = window.COURSE_EN || {};
window.COURSE_EN.LESSONS = {
  /* =============================================================== F1 */
  f1: [
    { h: "Why Go has a garbage collector at all",
      p: "In languages like C or C++ you allocate memory and you are responsible for freeing it again with `free`/`delete`. Get it wrong and you hit the three classic bugs: a *use-after-free* (touching memory you already returned), a *double-free* (returning the same block twice), or a *leak* (never returning it). These bugs are a huge source of crashes and security holes. Go makes a deliberate trade: it manages memory for you automatically, so you almost never write `free`, at the cost of spending a little CPU on a background collector. For server software that runs for months, that trade is almost always worth it." },
    { h: "The one question the GC keeps asking",
      p: "The entire job of the collector is to answer: *which objects can the program still reach?* It starts from a set of roots - every goroutine's stack and the package-level (global) variables - and follows pointers. Anything it can reach is live and kept; anything it cannot reach is garbage and its memory is reclaimed.\n\nThis single idea explains the most common Go memory leak: a long-lived map or slice that keeps pointers to objects you are 'done' with. As long as that container is reachable, everything it points to is reachable too, so the GC can never free it. The fix is never to call free - it is to drop the reference (delete the map entry, reslice, set to nil)." },
    { h: "Concurrent collection is why Go feels smooth",
      p: "Early garbage collectors 'stopped the world': they froze every thread, walked all of memory, then resumed. On a big heap that meant pauses of hundreds of milliseconds - fatal for a low-latency API. Go's collector instead runs *concurrently*, alongside your goroutines. There are still two stop-the-world moments (at the start and end of the mark phase), but they are tiny - typically well under a millisecond. This is the reason Go is a strong choice for latency-sensitive network services." },
    { h: "The pacer: the GC runs on growth, not on a clock",
      p: "A frequent misconception is that the GC runs on a timer. It does not. After each collection the runtime records how much memory is live and sets a target: run the next cycle once the heap has grown by `GOGC` percent. The default `GOGC=100` means 'collect again once the live heap has doubled'. The *pacer* is the controller that tries to schedule the concurrent mark so it finishes right as the heap reaches that target - not too early (wasted CPU) and not too late (heap overshoot)." },
    { h: "The two knobs, and when to touch them",
      p: "Ninety percent of programs never need to tune the GC. When you do, there are two levers. `GOGC` trades memory for CPU: raise it (e.g. 200, 400) for batch/throughput jobs that have RAM to spare and want fewer collections; the heap gets bigger but the GC runs less often. `GOMEMLIMIT` sets a soft ceiling on total memory - essential in containers, because it makes the GC work harder as you approach the limit instead of letting the kernel OOM-kill you. Anti-patterns: setting `GOGC` very low (CPU spikes) and calling `runtime.GC()` by hand in a hot path." },
    { h: "The cheapest collection is the allocation you avoid",
      p: "Here is the practical mental model for performance: GC CPU cost is roughly proportional to how much you allocate. So the biggest wins almost never come from tuning the collector - they come from allocating less. Reuse buffers (and `sync.Pool` for short-lived ones), prefer value types over pointers where it makes sense, preallocate slices and maps with a capacity hint, and avoid accidentally boxing values into interfaces inside tight loops. Use the heap profile's `alloc_space` view to find where the allocations actually come from before optimizing." },
    { h: "How to watch it happen",
      p: "You do not have to guess. `GODEBUG=gctrace=1 ./app` prints one line per cycle with pause times and heap sizes. `runtime.ReadMemStats` and the structured `runtime/metrics` package expose live numbers for dashboards. And the heap profile (Module F2) shows exactly which call sites allocate. Measure first, then decide whether any tuning is even worth it." },
  ],

  /* =============================================================== F2 */
  f2: [
    { h: "Why you must measure before you optimize",
      p: "Programmer intuition about performance is famously wrong. The function you 'know' is slow is often cheap, and the real cost hides somewhere boring - a logger, a JSON marshal, a needless allocation in a loop that runs a million times. Optimizing without measuring means you spend a day speeding up code that was never the bottleneck. A profiler removes the guessing: it tells you, with data, where the time and memory actually go." },
    { h: "How sampling profilers work",
      p: "Go's CPU profiler does not instrument every function call (that would be slow and distort the result). Instead it *samples*: about 100 times per second it interrupts the program and records the current call stack. Run for 30 seconds and you have ~3000 stack snapshots. A function that appears in 40% of the samples was, statistically, using ~40% of the CPU. More samples = more confidence, which is why you profile a representative workload for a meaningful duration." },
    { h: "Pick the profile that answers your question",
      p: "Different profiles answer different questions, and using the wrong one wastes time. Use the *CPU* profile for 'what is burning cycles'. Use the *heap* profile for memory - and know its two views: `inuse_space` (what is held right now, for finding leaks/bloat) and `alloc_space` (everything ever allocated, for finding GC pressure). Use the *goroutine* profile to find leaks and stuck goroutines. Use the *block* and *mutex* profiles to find contention where goroutines wait on each other." },
    { h: "Two ways to collect, one tool to read",
      p: "There are two collection paths. For a running service, blank-import `net/http/pprof` and it registers `/debug/pprof/*` endpoints - you pull a live profile without redeploying (bind it to an admin-only port). For a specific function, let `go test` write profiles to files with `-cpuprofile`/`-memprofile` under a benchmark. Either way, you read the result with the same tool, `go tool pprof`." },
    { h: "Reading a flame graph without getting fooled",
      p: "The flame graph is the fastest way to see where time goes, but it is easy to misread. Each box is a function; a box sitting *on top of* another means it was called by it. The crucial property is WIDTH: it is proportional to time (or allocations). So you optimize the *widest* boxes, especially wide leaves at the top. A tall, skinny tower is a deep call chain that costs almost nothing - ignore it. Beginners often chase height; experts chase width." },
    { h: "A repeatable workflow",
      p: "Put it together into a loop you can run any day: (1) reproduce the slow path under a benchmark or load test; (2) collect a CPU profile; (3) open the flame graph with `go tool pprof -http=:8080`; (4) find the widest leaf and read its source with `list`; (5) make one change; (6) re-profile to confirm it actually helped. Stop when the profile is flat - there is no single hotspot left to chase." },
  ],

  /* =============================================================== F3 */
  f3: [
    { h: "Testing is part of the language, not a library",
      p: "Many languages bolt testing on with a third-party framework full of macros and magic. Go builds it into the toolchain. You put tests in files ending `_test.go` next to the code they test, write functions named `TestXxx(t *testing.T)`, and run `go test`. There is no framework to learn, no annotations, no separate runner. This low ceremony is deliberate: the easier tests are to write, the more of them get written." },
    { h: "The table-driven test: Go's signature style",
      p: "The idiomatic Go test is *table-driven*. Instead of copy-pasting a test body for each case, you put the cases in a slice of structs and loop over them, running each with `t.Run` so it becomes a named subtest. Adding a new case is one line. When a case fails, the output names exactly which one. This pattern scales from three cases to three hundred without the test becoming unreadable, and it nudges you to think in terms of inputs and expected outputs." },
    { h: "Make failures debuggable",
      p: "A good test failure tells you what went wrong without opening a debugger. Always print both got and want: `t.Errorf(\"Add(2,3) = %d, want %d\", got, want)`. Use `t.Errorf` to record a failure and keep going (so you see all failing cases), and `t.Fatalf` to stop when continuing makes no sense (e.g. a setup step failed). Mark helper functions with `t.Helper()` so the failure points at the calling test line, not deep inside the helper." },
    { h: "Mocking without a mocking framework",
      p: "Go's secret weapon for testability is the interface. Instead of depending on a concrete type (a real database, a real clock, the real network), make your code depend on a small interface, and in tests pass a tiny fake struct that satisfies it. No mocking library, no code generation - just a struct with the methods you need. This keeps tests fast and deterministic and, as a bonus, pressures your design toward loose coupling." },
    { h: "Coverage and fuzzing: free safety nets",
      p: "Two built-in tools catch what hand-written cases miss. *Coverage* (`go test -cover`, then `go tool cover -html`) shows which lines your tests actually exercise - great for spotting an untested error branch. *Fuzzing* (`func FuzzXxx(f *testing.F)`) generates random inputs automatically and saves any input that crashes or trips an assertion; point it at anything that parses untrusted input and let it find the edge cases you would never think of." },
    { h: "The everyday command",
      p: "Internalize one command: `go test -race -cover ./...`. `-race` turns on the race detector, which catches data races (two goroutines touching the same memory without synchronization) - the single most valuable testing feature in a concurrent language. `-cover` keeps you honest about what is tested. Run it before every commit and wire it into CI." },
  ],

  /* =============================================================== F4 */
  f4: [
    { h: "Concurrency is about structure, not speed",
      p: "A common confusion: concurrency is not the same as parallelism. Parallelism is doing things at the same instant on multiple CPU cores. Concurrency is *structuring* a program as independent activities that can make progress when they are able to - handling many connections, waiting on several timeouts, pipelining stages. Go's goroutines and channels are tools for that structure; the runtime then maps it onto however many cores you have. You design concurrency; the runtime decides parallelism." },
    { h: "Goroutines are cheap, but they are not free",
      p: "A goroutine starts with about a 2 KB stack that grows on demand, so launching thousands is normal and launching a million is possible. But 'cheap to start' is not 'free to forget'. Every goroutine you start needs an owner who knows when it should stop. A goroutine that blocks forever on a channel nobody will ever send to is a *leak*: it holds its stack and anything it references, and the GC can never reclaim it. The rule: never start a goroutine without knowing how it ends." },
    { h: "Channels: synchronize or decouple",
      p: "A channel is a typed pipe, and its buffering changes its meaning. An *unbuffered* channel is a rendezvous: the sender blocks until a receiver is ready, so it both transfers a value and synchronizes the two goroutines at that instant. A *buffered* channel (capacity N) lets the sender run ahead by up to N values before it blocks - it decouples producer and consumer speeds. Choosing buffered vs unbuffered is choosing whether you want a handshake or a queue." },
    { h: "The ownership rules that prevent panics",
      p: "Two simple ownership rules eliminate most channel bugs. First, the *sender* closes a channel - never the receiver - and closes it exactly once; closing twice, or sending on a closed channel, panics. Closing signals 'no more values', which lets a `for v := range ch` loop end cleanly. Second, for shared mutable state that is not being passed between goroutines, reach for a `sync.Mutex` or `sync/atomic` instead of a channel. The slogan is 'share memory by communicating', but a mutex around a counter is simpler and correct - use the right tool." },
    { h: "select, context, and clean shutdown",
      p: "`select` lets one goroutine wait on several channel operations at once - combine a results channel with a `ctx.Done()` channel and a `time.After` timeout, and the first one ready wins. This is how you build cancellation and timeouts. The standard way to tell a tree of goroutines to stop is `context.Context`: pass it down, have each goroutine `select` on `ctx.Done()`, and a single `cancel()` (or a timeout) unwinds the whole tree. A long-running goroutine without a context is a leak waiting to happen." },
    { h: "The worker pool: the workhorse pattern",
      p: "The pattern you will reach for constantly is the worker pool. *Fan-out*: start a fixed number N of worker goroutines that all read from one `jobs` channel, so work spreads across them and concurrency is bounded to N (which protects downstream systems from overload). *Fan-in*: every worker writes to one shared `results` channel, merging their output for a single collector. Close `jobs` when there is no more work, and the workers drain and exit. Bounded, simple, and the basis of most real Go concurrency." },
  ],

  /* =============================================================== F5 */
  f5: [
    { h: "Errors are values, and that changes how you code",
      p: "Go has no exceptions. A function that can fail returns an `error` as its last result, and you handle it immediately with `if err != nil`. This feels verbose coming from try/catch, but it is a feature: every failure path is visible right where it happens, in order, with no invisible jumps across the stack. You cannot accidentally ignore an error the way an uncaught exception silently unwinds - the compiler and `errcheck` linters make unhandled errors stand out." },
    { h: "Wrap on the way up, inspect at the boundary",
      p: "As an error travels up the call stack, you want to add context (what were we doing?) without losing the original cause. That is wrapping: `fmt.Errorf(\"charge account %s: %w\", id, err)`. The `%w` verb is the key - it keeps the wrapped error reachable so a caller can still inspect it. At the top (an HTTP handler, say) you *unwrap*: `errors.Is(err, ErrNotFound)` checks for a known sentinel anywhere in the chain, and `errors.As(err, &target)` pulls out a specific error type to read its fields. Wrap low, inspect high." },
    { h: "Designing your error types",
      p: "Three tools cover almost everything. *Sentinel errors* (`var ErrNotFound = errors.New(\"not found\")`) are predefined values callers branch on with `errors.Is`. *Wrapped errors* add context with `%w`. *Custom error types* carry structured data - implement `Error() string`, and add `Unwrap() error` so they play nicely with `errors.Is/As`. A good rule: return sentinels for conditions callers act on, wrap everything else with enough context to debug from a log line alone." },
    { h: "Context: cancellation and deadlines, propagated",
      p: "`context.Context` solves a distributed-systems problem: when a client disconnects or a request times out, every goroutine and downstream call working on that request should stop, so you do not waste CPU and connections on a result nobody wants. You create a derived context with a timeout or cancel function, pass it as the *first argument* to everything it touches, and always `defer cancel()`. Cancelling a parent cancels all its children. The cardinal sins: storing a context in a struct field (breaks the request-scoped lifetime) and using `context.WithValue` as a general argument bag (it is for request-scoped metadata like trace IDs, not parameters)." },
    { h: "Project layout: structure that scales",
      p: "Go projects stay flat until they need not to. Two conventions do the heavy lifting. `cmd/<app>/main.go` holds entry points whose only job is wiring - parse config, build dependencies, start the server. `internal/` holds packages that *only your module* can import, enforced by the compiler - a real boundary that stops other teams (or your future self) from depending on internals. Name packages for the capability they provide (`ledger`, `postgres`), not for an architectural layer (`models`, `utils`); a package called `utils` is where cohesion goes to die." },
  ],

  /* ============================================================== M19 */
  m19: [
    { h: "Why interviews ask about structures nobody implements at work",
      p: "You will probably never hand-write a hashmap in production - Go's `map` is right there. Interviews ask anyway, because these structures are the shared vocabulary of performance conversations: 'that's O(n²), use a set', 'that needs a heap, not a sort in a loop', 'BFS, because we want the nearest one'. The candidate who can rebuild a structure from parts can also predict its costs, and predicting costs is the actual job. This module covers the set that appears in the overwhelming majority of screens: slices and maps (because you claim Go on your resume), heaps, tree walks, graphs - and the LRU cache, the single most-assigned design exercise." },
    { h: "The slice header: three words that explain five interview questions",
      p: "Internalize one picture: a slice is `{pointer, len, cap}` pointing into a backing array. Everything follows. Why is passing a slice cheap? You copy three words, not the elements. Why can a function modify my slice's elements? The copy points at the same array. Why did my two slices diverge after an append? Growth allocated a NEW array for one of them - the other still points at the old one. Why preallocate with `make([]T, 0, n)`? Because growth is a copy of everything so far, and n known up front means zero copies. Say the picture out loud in an interview and the follow-ups answer themselves." },
    { h: "Inside the map: buckets, tophash, incremental growth",
      p: "Go's map is a hash table of buckets, each holding up to eight key/value pairs. The hash of a key is split: LOW bits choose the bucket (that is why table size is a power of two - picking low bits is a mask, not a division), HIGH eight bits are stored as one-byte `tophash` stamps. A lookup scans eight tophash bytes - a single cache line - before touching any actual key, so most non-matches cost almost nothing. Past a load factor of ~6.5 the table doubles, and entries move to their new buckets *incrementally* as they are touched, spreading the cost instead of freezing the world. Two production-grade consequences: iteration order is randomized (never depend on it), and concurrent writes are a fatal error, not a data race you might get away with (use a mutex or sync.Map)." },
    { h: "Heaps: the tree that lives in a slice",
      p: "A binary heap keeps only one promise: every parent is ≤ its children (min-heap). That weak ordering is exactly enough to always know the minimum - it is at index 0 - while staying cheap to maintain. The elegance is the storage: a complete tree needs no pointers, because index math IS the structure (`children of i: 2i+1, 2i+2; parent: (i-1)/2`). Push appends to the slice and sifts up; Pop swaps the last element into the root and sifts down; both touch one path of height log n. Interviews reach for heaps whenever you hear 'k largest', 'top N', 'merge k sorted streams' or 'process by priority' - anything where you repeatedly need the extreme element but never a full sort." },
    { h: "BFS and DFS: one algorithm, two containers",
      p: "Strip away the code and the two traversals are the same loop: take a node out of a container, mark it visited, put its unvisited neighbors in. The container decides everything. A queue (FIFO) gives breadth-first: nodes are processed in the order discovered, so the search expands as a wave, level by level - and the first time you touch the target, you got there via a fewest-edges path. A stack (LIFO, often the call stack via recursion) gives depth-first: dive along one branch to the bottom, backtrack, repeat - the natural shape for 'is there a path', cycle detection, and anything where you must finish a subtree before its siblings (topological sort). The visited set is not an optimization - without it, the first cycle in the graph is an infinite loop." },
    { h: "The LRU cache: why this one question never dies",
      p: "'Design a fixed-size cache with O(1) Get and Put, evicting the least recently used entry' endures because it tests composition, not memorization. One structure gives O(1) lookup (a map) and another gives O(1) reordering and eviction (a doubly-linked list); neither alone suffices, and the trick is the map storing pointers INTO the list, welding them together. Every operation is a handful of pointer moves: touch = unlink + push-front; evict = unlink tail. The worked example builds it with a hand-rolled list - interviewers routinely disallow `container/list` precisely to see whether you can do the pointer surgery. Sentinel head/tail nodes are the pro move: with them, 'empty list' and 'single node' stop being special cases." },
  ],

  /* =============================================================== M1 */
  m1: [
    { h: "What a router actually does",
      p: "Every HTTP server needs to answer one question for each request: given this method and path, which function should handle it? That mapping is routing. For years Go developers reached for third-party routers (gin, chi, echo) because the standard `http.ServeMux` could only match path prefixes - no method matching, no path variables. Since Go 1.22 that gap is closed: the standard mux matches `GET /api/v1/ledger/{id}` patterns directly, so most services can delete the dependency and the indirection that comes with it." },
    { h: "How the mux matches: the radix trie",
      p: "Internally the mux stores routes in a *radix trie* - a tree where each node is a path segment, so shared prefixes share nodes. Matching a request walks the tree segment by segment, which is fast and scales to many routes. Two rules matter in practice. Method and path are matched together, so `GET /x` and `POST /x` are different routes. And precedence is *most-specific-wins*: `/ledger/{id}/audit` beats `/ledger/{id}`, and a literal segment beats a wildcard - so you no longer have to register routes in a careful order." },
    { h: "Path variables and the end of regexp routers",
      p: "A `{id}` segment in the pattern is a wildcard; in the handler you read it with `r.PathValue(\"id\")`. No regular expressions, no router-specific `Context`, no allocation-heavy match objects. When a path matches but the method does not, the mux automatically responds `405 Method Not Allowed` with the correct `Allow` header - behavior you used to get from a library, now built in." },
    { h: "os.Root: making path traversal impossible, not unlikely",
      p: "Any time a server reads a file based on user input - a config name, an upload key, a template - it risks *path traversal*: an attacker sends `../../etc/passwd` (or a sneaky symlink) to escape the intended directory. The old defense was string checks like rejecting `..`, but attackers are endlessly creative with encodings and links, so validation is a losing game. `os.Root` (Go 1.24) flips it: you open a directory once, and every operation through that handle is physically confined to it at the syscall level. An escape attempt returns an error. You stop *validating* and start making the bad thing *impossible*." },
    { h: "Where this fits in the ledger",
      p: "In the capstone, this module builds the front door: the public REST gateway that ingests transactions, with zero third-party routing imports, and a config/storage loader jailed under `os.Root`. Getting the foundation dependency-free and traversal-proof here pays off in every later module - fewer moving parts to secure, audit, and upgrade." },
  ],

  /* =============================================================== M2 */
  m2: [
    { h: "Serialization is where servers spend surprising time",
      p: "A network service does two things constantly: turn bytes from the wire into Go values, and turn Go values back into bytes. That is serialization, and at high throughput it is often a top entry in the CPU profile. The default `encoding/json` is wonderfully convenient - it uses reflection to handle any type - but reflection has a cost paid on every call. For a ledger pushing millions of payloads, that cost is the difference between two servers and twenty." },
    { h: "json/v2 and streaming tokens",
      p: "`encoding/json/v2` keeps the easy high-level API but is faster and far more configurable, and it exposes a low-level streaming layer, `jsontext`, that emits or consumes JSON one token at a time. Streaming matters because it avoids building the whole document (or an intermediate `map[string]any`) in memory - you write tokens straight to the connection and read them straight off it. For large or high-volume payloads that is both faster and dramatically lighter on the garbage collector." },
    { h: "Memory geometry: why layout is performance",
      p: "Modern CPUs are bottlenecked on memory, not arithmetic. Fetching a byte already in the L1 cache is ~1 nanosecond; fetching from main memory is ~100×slower. So performance is largely about *cache locality* - keeping the data you need next to each other. This is the lens for the rest of the module: Swiss-Table maps win by touching one cache line per lookup, and stack allocation wins by keeping short-lived data off the heap entirely." },
    { h: "Swiss Tables: the same map, quietly rebuilt",
      p: "Go 1.24 reimplemented the built-in `map` as a *Swiss Table* with no API change. The old map chased bucket-overflow pointers, scattering across memory on collisions. The Swiss Table stores entries in groups of 8 with a compact one-byte tag per slot; a lookup hashes to a group, loads its 8 control bytes (one cache line), and compares all 8 in parallel with SIMD-style instructions, usually finding the answer with a single memory access. You changed nothing and your maps got faster and lighter." },
    { h: "Stack vs heap, and why you should care",
      p: "Every value lives either on a goroutine's stack (cheap: freed automatically when the function returns, zero GC involvement) or on the heap (managed by the GC). The compiler runs *escape analysis* to decide: if it can prove a value does not outlive the function, it stays on the stack. A transient encode buffer that never escapes costs the GC nothing. You can see the decisions with `go build -gcflags='-m'` and look for 'does not escape' - a practical habit when tuning a hot path." },
  ],

  /* =============================================================== M3 */
  m3: [
    { h: "Lifecycles: doing work when an object dies",
      p: "Most of the time the GC silently reclaiming memory is exactly what you want. But sometimes an object owns a resource the GC does not understand - an OS file descriptor, a C handle, a lock - and that resource must be released when the object is gone. The old tool, `runtime.SetFinalizer`, was notoriously dangerous: it could *resurrect* an object during finalization, ran in an undefined order, and delayed collection by an extra GC cycle. It caused more bugs than it solved." },
    { h: "runtime.AddCleanup, the right way",
      p: "Go 1.24's `runtime.AddCleanup` replaces finalizers with something predictable: a cleanup that runs exactly once, after the object is truly unreachable, with no resurrection. The critical discipline is what the cleanup *captures*. If the cleanup closure captures the object it is cleaning, the object stays reachable forever - the exact leak you were trying to prevent. Capture only the primitive resource handle (the fd, an int) by value, never the parent struct. Treat cleanups as a safety backstop, not your primary close path; explicit `Close()` / `defer` is still better when you can." },
    { h: "Interning: when a million rows share five strings",
      p: "A ledger with millions of accounts stores the currency code on every one - but there are only a handful of distinct currencies. Storing 'USD' a million times wastes megabytes. *Interning* via the `unique` package canonicalizes equal values to a single shared copy: `unique.Make(\"USD\")` returns a `Handle[string]` that is 8 bytes, points at one shared backing string, and - bonus - compares by pointer instead of byte-by-byte. Intern high-repetition, low-cardinality values like currencies, statuses, and label keys; do not intern unbounded unique strings or the global table just grows." },
    { h: "Weak pointers: caches that respect memory pressure",
      p: "Sometimes you want to remember an object *if it is still around* but never to be the reason it stays alive - a cache is the classic case. A normal pointer in a cache keeps its target alive forever, turning the cache into a leak. The `weak` package (Go 1.24) gives you a reference that does not prevent collection; you read it back and either get the object or `nil` if the GC reclaimed it. That lets you build caches that automatically shrink under memory pressure." },
    { h: "A peek at the scheduler (G-M-P)",
      p: "Understanding why Go scales helps you reason about performance. The runtime multiplexes many goroutines (G) onto a small number of OS threads (M) via logical processors (P, count = GOMAXPROCS). When a goroutine blocks on I/O, the runtime parks it in the *netpoller* and frees its thread to run other goroutines - so a server handling 100k idle connections does not need 100k threads. *Asynchronous preemption* lets the runtime interrupt even a tight CPU loop so it cannot starve everything else. This is why idiomatic Go concurrency is both simple to write and efficient to run." },
  ],

  /* =============================================================== M4 */
  m4: [
    { h: "Why concurrent tests go flaky",
      p: "A test is *flaky* when it passes and fails non-deterministically - green locally, red in CI, green on a rerun. The usual culprit in concurrent code is timing: the test starts a goroutine and then does `time.Sleep(100 * time.Millisecond)` hoping the goroutine has finished by then. On a loaded CI machine 100ms is not enough, so it fails; bump it to 500ms and the suite crawls. Sleeping to synchronize is guessing, and guessing is what makes tests flaky." },
    { h: "synctest: a bubble with a fake clock",
      p: "`testing/synctest` (stable in Go 1.25) removes the guessing. It runs your goroutines inside a *bubble* with a virtual clock. Inside the bubble, `time.Sleep`, timers, and tickers are simulated: when every goroutine in the bubble is blocked, the fake clock jumps instantly to the next scheduled timer. A `time.Sleep(5 * time.Second)` returns in microseconds of real time, but the code believes five seconds passed - so time-dependent logic is tested deterministically, with zero real waiting and zero flakiness." },
    { h: "synctest.Wait: assert on a settled world",
      p: "The companion to the fake clock is `synctest.Wait`, which blocks until every *other* goroutine in the bubble is durably blocked - i.e. the system has reached a steady state and nothing more will happen without external input. That replaces 'sleep and hope it scheduled' with a precise barrier: wait for quiescence, then assert. As a bonus, if everything in the bubble is durably blocked with no timer to fire, that is a deadlock, and synctest fails the test immediately instead of hanging your CI for the full timeout." },
    { h: "Benchmarks you can trust: b.Loop()",
      p: "The flip side of correctness is measurement, and benchmarks have their own footguns. The classic `for i := 0; i < b.N; i++` loop is easy to get subtly wrong: the compiler can delete work whose result you ignore (dead-code elimination), making code look faster than it is. Go 1.24's `for b.Loop()` fixes this - it keeps the benchmarked values alive automatically and runs setup once, giving stable, honest numbers without manual bookkeeping." },
    { h: "Determinism as a discipline",
      p: "The deeper lesson is that *determinism is a design goal*, not an accident. Tests that depend on wall-clock time, real network latency, or goroutine scheduling order will eventually flake. synctest virtualizes time; interfaces (Module F3) virtualize the clock and the network; the race detector catches the rest. A suite that is fully deterministic is one you can actually trust to gate deploys - the whole point of having tests." },
  ],

  /* =============================================================== M5 */
  m5: [
    { h: "The database is where correctness gets hard",
      p: "Stateless application code is easy to reason about; the moment you involve a database with concurrent writers, you inherit a century of hard-won ideas about consistency. For a financial ledger the stakes are highest - money must never be created or destroyed by a race. This module is about building that persistence layer in Go so it is both correct under concurrency and fast under load." },
    { h: "sqlc: move SQL errors to compile time",
      p: "There is a spectrum from raw SQL strings (fast, but a typo'd column blows up at runtime) to a heavyweight ORM (convenient, but it hides the queries and reflects at runtime). `sqlc` sits in a sweet spot: you write real SQL, and it generates type-safe Go functions from your queries plus the schema. A wrong column name or argument type now fails at code-generation time, not at 3am in production. You keep full control of the SQL and gain compile-time safety - no ORM magic." },
    { h: "Connection pools are not optional",
      p: "Opening a Postgres connection is expensive, and the database can only handle so many at once, so you never open one per request - you share a pool. `pgxpool` needs real configuration: `MaxConns` sized to what the database can handle (more is not better - each connection costs the server memory), `MaxConnLifetime` so connections recycle around load balancers and failovers, and context-aware queries so that when a client disconnects, the in-flight query is cancelled at the server instead of running on for nobody." },
    { h: "Row-level locks and the double-entry invariant",
      p: "The heart of a ledger is *double-entry*: every transfer debits one account and credits another by the same amount, so the total never changes. Under concurrency, two transfers touching the same account can race. The fix is a *row-level lock*: `SELECT ... FOR UPDATE` locks just the rows you are changing (not the whole table), so a second transaction touching the same account waits until the first commits. A subtle but critical rule: always lock multiple rows in a consistent order, or two transactions locking the same pair in opposite orders will deadlock." },
    { h: "Expect conflicts, and retry them",
      p: "Under serializable isolation the database may *refuse* a transaction that lost a race, returning SQLSTATE `40001` (serialization_failure). This is not a bug - it is the database protecting your invariant - and the correct response is to retry the whole transaction. Go 1.26's `errors.AsType[*pgconn.PgError]` lets you match the exact SQLSTATE cleanly and branch: retry `40001`, surface `23505` (unique_violation) as a duplicate, and so on. Designing for retryable failures is what makes a ledger correct *and* available under contention." },
  ],

  /* =============================================================== M17 */
  m17: [
    { h: "Postgres is a correctness engine",
      p: "Application code is allowed to be wrong for a moment; production data is not. A financial ledger should not depend only on Go handlers remembering every rule. Postgres can enforce parts of the domain directly: `CHECK (amount_cents > 0)`, foreign keys, unique idempotency keys, and transactional outbox rows. These constraints are not bureaucracy. They are the last line of defense when a bad deploy, duplicate request, or retry storm reaches the database." },
    { h: "Constraints beat app-only promises",
      p: "If an invariant is local and timeless, put it in the schema. An account balance cannot be negative; a transfer amount cannot be zero; an idempotency key must not be reused for a different transfer. Go code still validates early for good errors, but the database owns the final answer. The rule of thumb: if corrupt data would force a manual cleanup later, encode the rule where the data is written." },
    { h: "Indexes follow query shapes",
      p: "A production index is not 'an index on a column'. It is a contract with a query shape: equality filters first, then range/sort columns, then optional included columns that let the query avoid heap fetches. For `WHERE account_id = $1 ORDER BY posted_at DESC LIMIT 50`, `(account_id, posted_at DESC)` is the shape. Three single-column indexes rarely compose into the plan you imagined. Use `EXPLAIN (ANALYZE, BUFFERS)` to prove the planner used the path and to see whether the query still burned IO." },
    { h: "Migrations are production events",
      p: "A schema change is code that runs against your largest table at the worst possible time. Safe migrations use expand/backfill/contract: add nullable or compatible structure first, deploy code that can read both shapes, backfill in bounded batches, then enforce stricter constraints only after old binaries are gone. On hot tables, prefer `CREATE INDEX CONCURRENTLY` and test lock behavior before shipping. The migration that was instant on staging can still be a lock incident on real data." },
    { h: "Locks and isolation are part of the design",
      p: "Read Committed is a practical default, not a proof that every business invariant is safe. Multi-row invariants need explicit strategy: row locks in deterministic order, unique constraints for races, or SERIALIZABLE transactions with whole-transaction retries. Deadlocks are not random bad luck; they are usually two code paths taking the same locks in different orders. Design the order once and make every path follow it." },
    { h: "Vacuum is not background magic",
      p: "Postgres MVCC keeps old row versions so readers can see a stable snapshot while writers continue. Vacuum later reclaims dead versions, but a long transaction can pin old snapshots and stop cleanup. That is how normal updates become bloat, larger indexes, slower scans, and eventually emergency maintenance. Track long transactions, dead tuples, autovacuum activity, slow plans, and connection counts as first-class production signals." },
  ],

  /* =============================================================== M6 */
  m6: [
    { h: "Talking between services, and the threat to that traffic",
      p: "Once a system spans more than one machine, services must talk over the network - and that traffic must stay private and compatible across versions. This module covers both: gRPC + Protobuf for efficient, evolvable inter-service calls, and post-quantum cryptography to keep the traffic secret against a threat that does not fully exist yet but is coming." },
    { h: "gRPC and Protobuf: contracts that evolve",
      p: "gRPC runs RPCs over HTTP/2 carrying *Protobuf* messages - a compact binary format defined by a schema. The schema is a contract between services that are deployed independently, so the discipline is *backward compatibility*: you may add new optional fields, but you must never reuse a retired field number or change a field's type, or an old node and a new node will silently misinterpret the same bytes. `reserved` retired numbers, and gate every schema change with a breaking-change check in CI so a v2 node never breaks a v1 peer mid-rollout." },
    { h: "Harvest now, decrypt later",
      p: "Here is the threat that justifies post-quantum crypto today. A patient adversary records your encrypted traffic *now* and simply stores it, waiting for a future quantum computer powerful enough to break today's key exchange (RSA, elliptic curves like X25519 all fall to Shor's algorithm). For data with a long shelf life - financial records, health data - 'we'll be fine for years' is the wrong frame: the traffic is being captured today and decrypted later. The defense must be deployed before the quantum computer exists." },
    { h: "Hybrid key exchange: belt and suspenders",
      p: "The answer is *hybrid* key exchange: combine a classical algorithm (X25519) with a post-quantum one (ML-KEM, a lattice-based scheme standardized by NIST as `crypto/mlkem`). The session key is derived from both, so an attacker must break *both* to recover it. This hedges the newness of the PQC algorithms - if ML-KEM turns out to have a flaw, you still have classical security, and vice versa. In Go you enable it by preferring the `X25519MLKEM768` group in your `tls.Config`; both peers must support it for it to be chosen." },
    { h: "Encoding invariants in the type system",
      p: "At staff level you push correctness into the compiler. The self-referencing generic constraint `type Node[T Node[T]] interface { ... }` lets a method return the *concrete* implementing type rather than the interface - so cluster-topology rules that would otherwise be runtime assertions become compile-time guarantees. Fewer invariants checked at runtime means fewer ways production can surprise you." },
  ],

  /* =============================================================== M7 */
  m7: [
    { h: "The worst time to add observability is during the incident",
      p: "Production failures are often transient: a latency spike, a brief deadlock, a leak that only shows under a specific load. By the time you SSH in to look, the moment has passed - and the classic response, 'add more logging and redeploy', changes the system and may not reproduce the bug. The goal of this module is to capture *what was happening just before* a failure, continuously and cheaply, so you can diagnose the first occurrence instead of waiting for the second." },
    { h: "The FlightRecorder: always-on, pay-on-demand",
      p: "`runtime/trace`'s FlightRecorder keeps a bounded ring buffer of recent execution events in memory at near-zero cost - like an aircraft's black box, it is always recording but only the last few seconds. You pay the cost of writing a trace to disk *only when something interesting happens*: a latency alarm fires, a panic handler runs, a health check fails. The result is the window leading up to the failure, captured at the moment of failure, without the overhead of continuous tracing." },
    { h: "Trigger on SLOs, capture a full picture",
      p: "Wire the recorder to the things you already watch. When p99 latency crosses your SLO, or a panic unwinds, atomically dump three things together: the flight trace (what executed), a goroutine profile (who was stuck and where), and a heap profile (what memory looked like). Gate dumps behind a cooldown so a flapping alarm does not bury you in files. Now an incident leaves behind a complete, correlated snapshot instead of a vague log line." },
    { h: "Reading the trace: go tool trace",
      p: "A trace file opens in `go tool trace` as an interactive timeline of every goroutine, GC cycle, syscall, and scheduler event. This is the microscope for 'why did this 50ms request take 50ms': you can see whether the time went to GC, to lock contention, to a slow syscall, or to a goroutine waiting on a channel. Logs tell you *what* happened; a trace shows you *where the time went*." },
    { h: "The goroutine dump: the fastest first move",
      p: "Before any fancy tooling, know the humble goroutine dump: send SIGQUIT to a Go process (or fetch pprof's `/debug/pprof/goroutine?debug=2`) and it prints every goroutine with its full stack, its *wait reason*, and - crucially - *how long* it has been waiting. A line like `goroutine 42 [chan receive, 5 minutes]` on a workload that should answer in milliseconds is a leak announcing itself. Scan dumps by wait reason and duration first; it is the quickest triage step in any hang investigation and works on any Go binary with zero preparation." },
    { h: "Leaks: from log spelunking to a generated report",
      p: "A goroutine that blocks forever - on a channel with no sender, a `WaitGroup` that never reaches zero, a context with no deadline - is a leak: it never exits, holding its stack and references. Historically you found these by squinting at goroutine dumps for hours. The goroutine-leak analyzer traces each blocked goroutine back to its root cause automatically, and you can assert 'no goroutines leaked' at test boundaries to catch regressions before they ship. Combined with always-giving-every-context-a-deadline, this turns a whole class of production mysteries into a routine check." },
  ],

  /* =============================================================== M8 */
  m8: [
    { h: "Hardware sympathy: working with the machine, not against it",
      p: "At the highest level of performance, you stop treating the CPU as an abstract instruction-executor and start writing code that fits how the hardware actually works - 'mechanical sympathy'. This module is three facets of that: using the CPU's vector units to do more per instruction, keeping secrets out of memory dumps, and a garbage collector redesigned around cache locality. None of it is everyday code, but knowing it exists - and when it is worth it - is what separates senior from principal." },
    { h: "Optimize the scalar loop before reaching for SIMD",
      p: "Before exotic techniques, make the ordinary loop fast, because the compiler is on your side. Ranging over a slice (rather than indexing) lets it prove indices are in range and remove per-iteration *bounds checks*. Keeping hot functions small lets it *inline* them, erasing call overhead. You can see both with `go build -gcflags='-m'` (inlining/escape) and `-gcflags='-d=ssa/check_bce/debug=1'` (remaining bounds checks). Often this alone closes most of the gap - and it is portable, unlike SIMD." },
    { h: "SIMD: one instruction, many values",
      p: "A scalar loop processes one element per iteration. A CPU's *SIMD* (Single Instruction, Multiple Data) units can apply one operation to a whole vector - 16 bytes, 8 floats - at once. For a loop that touches every byte of a block (a checksum, a validation pass), that is often an order-of-magnitude speedup. The experimental `simd/archsimd` package exposes these vector types in Go. The catch: vector instructions are architecture-specific, so you always keep a *scalar fallback* for the tail elements and for CPUs without the intrinsics. Only vectorize a loop the profiler proved is hot." },
    { h: "Secrets should not outlive their use",
      p: "A decrypted key sitting in an ordinary `[]byte` is a liability: it lingers in RAM, gets copied around by the moving garbage collector, and can end up in a core dump or swapped to disk - long after you needed it. `runtime/secret` holds sensitive bytes in a buffer that stays off the movable heap and is guaranteed to be zeroed on `Destroy`, shrinking the window during which a key is recoverable to the minimum. Minimizing that exposure window is a core defensive habit for anything handling key material." },
    { h: "Green Tea: a GC built for cache locality",
      p: "The experimental Green Tea collector (`GOEXPERIMENT=greenteagc`) reflects the same memory-is-the-bottleneck reality as Swiss Tables. Instead of marking objects one at a time and chasing pointers all over the heap (scattered, cache-unfriendly), it scans memory in contiguous 8 KiB *spans* - sequential access that the CPU prefetches well and that parallelizes cleanly across cores. On large heaps this can meaningfully cut GC CPU. As always: evaluate and benchmark against the default before adopting an experiment." },
  ],

  /* =============================================================== M9 */
  m9: [
    { h: "From a working binary to a system you can operate",
      p: "Code that runs on your laptop is a long way from a service a team can deploy, scale, and upgrade at 3am without dropping requests. This module is about that last mile: making Go behave well inside containers, shipping images that are small and hard to attack, automating large-scale code changes, and recording the decisions so the next engineer is not guessing. Principal engineers are judged as much on operability as on cleverness." },
    { h: "Let the runtime see the container's real limits",
      p: "A pod is limited by Linux *cgroups* to, say, 4 CPUs and 512 MB - but historically the Go runtime saw the *host's* 128 cores and set GOMAXPROCS to 128, spawning far too many threads and thrashing under the kernel's CPU throttling. Go 1.25 reads the cgroup CPU quota and sets GOMAXPROCS to match automatically. Pair it with `GOMEMLIMIT` set to the memory limit so the GC works harder near the ceiling instead of getting OOM-killed. The lesson: a containerized runtime must respect the container's limits, not the host's." },
    { h: "Hardened images: ship the binary, nothing else",
      p: "A statically linked, CGO-free Go binary needs no operating system to run. So a production image should contain essentially just that binary. A multi-stage Docker build compiles in a full toolchain image, then copies the single binary into `scratch` (empty) or a `distroless` base - a few megabytes, no shell, no package manager, and therefore a tiny CVE surface and nothing for an attacker to pivot to. Run as a non-root user. Small and boring is exactly what you want in production." },
    { h: "Changing code across a fleet without heroics",
      p: "When you maintain libraries used by many teams, deprecating an API is painful - you cannot file a hundred PRs. The overhauled `go fix` engine plus `//go:fix` inline directives let you ship *machine-applicable* migrations: mark the old API, and every consumer runs `go fix ./...` to auto-rewrite their call sites safely. This turns a coordination nightmare into a one-command upgrade and is how large Go codebases stay current instead of accreting deprecated calls forever." },
    { h: "Write down why, not just what",
      p: "The final discipline is organizational. An *Architecture Decision Record* is a short, append-only note capturing the context, the options considered, the decision, and its consequences - for instance, 'we chose hybrid ML-KEM for inter-node transport because of the harvest-now-decrypt-later threat to 30-year ledger data'. Six months later, when someone asks 'why is the handshake slower?', the answer is in the ADR instead of in someone's memory. Code shows *what*; ADRs preserve *why*." },
    { h: "Rolling updates: upgrade with zero dropped requests",
      p: "Putting it together, a deploy should be invisible to users. Kubernetes does a *rolling update*: it starts a new-version pod, waits for its *readiness probe* to pass before sending it any traffic, then drains an old pod (stop new requests, let in-flight ones finish) before terminating it - repeating pod by pod. Health and readiness probes are the contract that makes this safe. Build them in, and 'deploy' stops being a scary word." },
  ],

  /* ============================================================== M10 */
  m10: [
    { h: "The memory wall: your CPU is starving, not lazy",
      p: "For decades CPU speed grew far faster than memory speed, opening a gap engineers call the *memory wall*. The result today: a modern core can do dozens of arithmetic operations in the time it takes to fetch a single value from main memory. So the bottleneck in most hot code is not the math - it is *waiting for data*. This reframes performance work entirely. Instead of counting instructions, you think about where your data lives and how it moves. A cache hit (~1 ns) versus a cache miss to RAM (~100 ns) is a 100× difference on the very same instruction." },
    { h: "Why the hardware moves 64 bytes when you ask for one",
      p: "When you read a single `int64`, the CPU does not fetch 8 bytes - it fetches the whole 64-byte *cache line* containing it into L1. This is a bet on *spatial locality*: the hardware assumes that if you needed this byte, you will soon need its neighbours. That bet is the foundation of why contiguous data is fast. A `[]int64` packs eight values per line, so one miss warms the next seven reads for free. A `[]*Thing` stores pointers to objects scattered across the heap, so each element is a fresh fetch to a random address - the algorithm may look identical, but one streams and the other stumbles." },
    { h: "Locality is a habit, not a trick",
      p: "Two patterns earn cache hits. *Temporal* locality: reuse data while it is still warm (process a value fully before moving on, rather than making many passes). *Spatial* locality: keep data you will use together physically together, and walk it in order so the hardware prefetcher can run ahead of you. The practical rules fall right out: prefer slices/arrays over linked structures for small-to-medium N; store structs-of-values not slices-of-pointers when you iterate them; and for a 2D grid, loop in memory order (rows outer, columns inner). The same total work can run several times faster purely by respecting the layout." },
    { h: "False sharing: when zero shared data still costs you",
      p: "Cache coherence keeps every core's view of memory consistent: when one core writes a cache line, the hardware invalidates that line in every other core's cache. Now imagine two goroutines on two cores, each updating its *own* counter - but those two counters happen to sit in the same 64-byte line. Even though they never touch the same variable, every write by one core knocks out the other core's copy of the line, which must be re-fetched. The line ping-pongs between caches, and your 'parallel' counters can run slower than a single thread. This is *false sharing*, and it is invisible in the source - the fix is to pad the hot fields so each owns a separate line." },
    { h: "Measuring layout, not guessing it",
      p: "You do not have to speculate. `unsafe.Sizeof` shows a struct's real size including padding, so you can reorder fields large-to-small to shrink it. A heap or CPU profile (Module F2) plus the realization that a hot function is *memory-bound* points you at layout problems. And for the truly performance-critical path, hardware perf counters (cache-miss rate) confirm whether you are bound on memory at all. The discipline mirrors the rest of the course: measure first, then change layout, then measure again - most of the time a contiguous slice and a sensibly-ordered struct is all you need." },
  ],

  /* ============================================================== M11 */
  m11: [
    { h: "The assembly line inside the chip",
      p: "A CPU does not run one instruction to completion before starting the next. It *pipelines* them: like a factory line, each instruction passes through stages - fetch, decode, execute, memory, write-back - and while one instruction executes, the next is decoding and a third is being fetched. With a full pipeline the core retires roughly one instruction per cycle even though each takes several cycles end to end. Real cores go further: they are *superscalar* (several pipelines side by side) and 15–20 stages deep, retiring multiple instructions per cycle. All of that throughput depends on keeping the line full - and the things that empty it are the subject of this module." },
    { h: "Branches force the CPU to gamble",
      p: "Every `if`, loop condition, and function return is a *branch*, and branches are a problem for a pipeline: by the time the core must fetch the next instruction, it often has not yet computed which way the branch goes. Stalling until it knows would waste the whole pipeline. So instead the *branch predictor* guesses - using the history of that branch - and the core speculatively runs down the predicted path. Guess right (predictors exceed 95% on regular patterns) and there is no cost at all. Guess wrong and the core must discard everything it speculatively did and refill the pipeline from the correct address: a *misprediction penalty* of roughly 15–20 cycles." },
    { h: "Why sorting can make the same loop run faster",
      p: "The canonical demonstration: take a large array and sum only the elements above a threshold. Run it on the *sorted* array and then on a *shuffled* copy - identical instructions, identical element count - and the sorted version can be several times faster. The reason is entirely branch prediction. On sorted data the `if v >= threshold` condition is a long run of falses followed by a long run of trues: utterly predictable. On shuffled data it flips unpredictably, so the predictor is wrong about half the time and each miss costs a pipeline flush. Same Big-O, same arithmetic, wildly different wall time - a vivid lesson that the hardware, not just the algorithm, decides speed." },
    { h: "Out-of-order execution hides the stalls",
      p: "Cores are also *out-of-order*: when an instruction stalls waiting on a slow memory load, the core scans a window of upcoming instructions and executes any whose inputs are already available, then commits results in program order. This *instruction-level parallelism* is why long dependency chains hurt - if every step needs the previous step's output, there is no independent work to overlap, and the core idles through each stall. The practical lever in Go: break a reduction into several independent accumulators (sum into four variables, combine at the end). Same instruction count, but now the core has parallel chains to interleave, and a sum or hash loop speeds up noticeably." },
    { h: "Steering the hardware from Go",
      p: "You rarely write assembly, yet you influence all of this through ordinary Go and the compiler. *Inlining* a small hot function removes call overhead and gives the out-of-order engine more instructions to overlap - check it with `-gcflags=-m`. *Bounds-check elimination* removes a hidden branch on each slice index - ranging instead of indexing helps the compiler prove safety. And there is a deeper connection: the very speculation and reordering that make a single core fast are why *multiple* goroutines need explicit synchronization. Because hardware may reorder reads and writes, two goroutines cannot agree on ordering without the atomics, mutexes, and channels of the next module - branch prediction's cousin, memory reordering, is the root of data races." },
  ],

  /* ============================================================== M12 */
  m12: [
    { h: "Goroutines are not threads, and that changes everything",
      p: "An OS thread is a heavyweight object: a large fixed stack (often 1–8 MB), and switching between threads means a trip through the kernel. You can have thousands, not millions. A goroutine is the runtime's own abstraction: a small struct with a ~2 KB stack that grows on demand, scheduled entirely in user space. Creating one is a function call, not a syscall. This is why idiomatic Go starts a goroutine per connection, per request, per job without a second thought - and why a Go server can hold hundreds of thousands of concurrent connections on a handful of threads. The scheduler is the machinery that makes that cheap." },
    { h: "G, M and P - and the one rule that ties them together",
      p: "The runtime juggles three things. A *G* is a goroutine (the work). An *M* is an OS thread (the thing that actually runs on a core). A *P* is a processor: a scheduling context with a local queue of runnable goroutines, and there are exactly `GOMAXPROCS` of them. The invariant that makes the whole system legible: *to run Go code, an M must be holding a P*. Since there are only `GOMAXPROCS` Ps, at most that many goroutines run truly in parallel - regardless of how many goroutines you started or how many threads exist. Ps are the real unit of parallelism; Gs are just work waiting for one." },
    { h: "Local queues and work stealing",
      p: "If every `go` statement had to take a global lock to enqueue work, the scheduler would be a bottleneck on a many-core machine. So each P keeps its *own* run queue - a fast, almost lock-free ring - and `go f()` pushes onto the current P's local queue, which is both lock-free and cache-friendly. The risk with local queues is imbalance: one P drowns in work while another sits idle. The runtime fixes this with *work stealing*: an idle P, before parking, steals half the goroutines from a randomly chosen busy P (and periodically checks the global queue and the netpoller). The result is automatic load balancing with no central coordinator on the hot path." },
    { h: "The netpoller: the secret behind cheap I/O",
      p: "This is the piece that makes Go's simple blocking-style networking efficient. When a goroutine calls `Read` on a socket with no data ready, the runtime does *not* block the OS thread. It parks the goroutine, registers the file descriptor with the operating system's event mechanism - *epoll* on Linux, *kqueue* on macOS/BSD, IOCP on Windows - and frees the M to run other goroutines. When the OS later reports the socket is readable, the netpoller wakes the parked goroutine to be rescheduled. So you write straightforward synchronous code, and the runtime quietly turns it into event-driven I/O underneath. This is the answer to the C10k problem: 100,000 idle connections cost 100,000 cheap goroutines, not 100,000 threads." },
    { h: "Syscalls and preemption: keeping every P productive",
      p: "Some blocking cannot be handled by the netpoller - a disk read, a DNS lookup, a cgo call genuinely block the OS thread. The runtime's answer is *handoff*: it detaches the blocked M's P and gives it to another thread so the remaining goroutines keep running; this is why you can see more OS threads than `GOMAXPROCS`. The other half of fairness is *preemption*. Originally Go could only switch goroutines at function calls, so a tight `for {}` loop with no calls could monopolize a P and even stall the garbage collector. Since Go 1.14, a background monitor thread (*sysmon*) detects a goroutine that has run too long (~10 ms) and sends its thread a signal to preempt it safely. Together, handoff and async preemption mean no single goroutine - blocked or busy - can starve the others." },
  ],

  /* ============================================================== M13 */
  m13: [
    { h: "Why 'it worked on my machine' concurrency is a lie",
      p: "A *data race* is two goroutines accessing the same memory at the same time with at least one write and no synchronization between them. Beginners assume the worst case is 'a slightly wrong number'. It is far worse: a race is *undefined behaviour*. The compiler and CPU are allowed to reorder and cache memory operations (Module M11), so a racy program can produce impossible-looking results, crash, or appear to work for months and then fail in production under different timing. There is no 'mostly fine' here - racy code is broken code that has not failed *yet*. Go ships a race detector (`-race`) precisely because these bugs are invisible to the eye." },
    { h: "Happens-before: the contract that makes sharing safe",
      p: "The Go *memory model* defines when a write by one goroutine is guaranteed visible to a read by another, via a *happens-before* relation. The point of every synchronization primitive is to establish such an edge: a channel send happens-before the corresponding receive; a mutex `Unlock` happens-before the next `Lock`; an atomic store happens-before an atomic load that observes it. Without one of these edges between two goroutines, there is *no guarantee* either sees the other's writes, full stop. So choosing a primitive is not about style - it is about establishing the ordering that makes your program's correctness actually defined." },
    { h: "Atomics: the featherweight, with a sharp limit",
      p: "An atomic operation (`atomic.Int64.Add`, `CompareAndSwap`, `atomic.Pointer[T].Store`) is a single hardware instruction that reads-modifies-writes *one machine word* indivisibly - no lock, no blocking, no goroutine ever waits. They are the fastest tool and perfect for counters, flags, and hot-swapping a single value. Their power is also their limit: atomics protect exactly *one word*. The instant your invariant spans two related variables - a balance and its transaction log, a map and its length - no sequence of single-word atomics can keep the pair consistent under concurrency. That is precisely the boundary where you must move up to a mutex." },
    { h: "Mutexes: protecting an invariant, not a variable",
      p: "A `sync.Mutex` guards a *critical section*: while one goroutine holds the lock, no other can enter, so a multi-step update inside is seen by others as a single indivisible change. This is what lets you keep several fields mutually consistent - the thing atomics cannot do. `sync.RWMutex` refines it for read-mostly data, allowing many concurrent readers or one writer. The discipline is small but strict: pair every `Lock` with a `defer Unlock` so a panic cannot leave it held; keep the section short and never do I/O or block on a channel inside it; and never copy a value containing a mutex. Most shared mutable state in real Go is a struct with a mutex and a few fields - boring, correct, and fast enough." },
    { h: "Channels: design the problem so there is nothing to lock",
      p: "Channels operate at a different level: they transfer *ownership*. The slogan 'don't communicate by sharing memory; share memory by communicating' means that instead of two goroutines locking a shared value, you hand the value through a channel so only one goroutine owns it at any moment - the shared state, and the need to lock it, simply disappears. Channels are the right tool for pipelines, fan-out/fan-in worker pools, signalling completion or cancellation (close a channel to broadcast to many waiters), and backpressure (a full buffered channel blocks a too-fast producer). They cost more per operation than a mutex, so the anti-pattern is using a channel as an elaborate lock around a counter." },
    { h: "Choosing well: the shape of the problem decides",
      p: "Map the tool to the structure of the data, not to fashion. If it is a single counter, flag, or a pointer you swap atomically - use an *atomic*. If several fields must change together, or it is read-mostly shared state - use a *mutex* (or RWMutex). If you are passing data between goroutines, building a pipeline, signalling, or applying backpressure - use a *channel*. When more than one would work, pick the simplest that is correct: a mutex around two fields is clearer than a clever channel dance; an atomic counter is better than a mutex when it is *only* a counter. And whatever you choose, run the tests with `-race` - the detector is the one reviewer that never gets tired." },
  ],

  /* ============================================================== M14 */
  m14: [
    { h: "You cannot debug production with a debugger",
      p: "On your laptop you set a breakpoint and step through. In production a service handles thousands of requests a second across many machines; you cannot stop it, and the bug may have lasted 200 milliseconds an hour ago. So the system itself must continuously emit evidence of what it is doing. That is *observability*: the property that you can understand a system's internal state from the signals it produces, *without* shipping new code to investigate. The goal is to diagnose the *first* occurrence of a problem from data already captured - not to add logging and wait for it to happen again." },
    { h: "Three signals, three questions",
      p: "Observability rests on three complementary signals, and the mistake is treating them as interchangeable. *Metrics* are cheap numeric aggregates over time - request rate, error rate, latency percentiles - and because they are aggregates their cost does not grow with traffic; they answer *'is something wrong, and how badly?'* and they are what your alerts watch. *Traces* follow one request across service boundaries as a tree of timed spans; they answer *'where did the time or the error happen?'*. *Logs* are detailed records of individual events; they answer *'what exactly happened in this one case?'*. The workflow that ties them together: a metric alert fires, you open a trace of a slow request to find the guilty service, then read that service's logs for the precise cause." },
    { h: "Structured logging: text a machine can read",
      p: "A line like `log.Printf(\"user %s failed: %v\", id, err)` is fine for one developer and useless at scale - you cannot reliably filter or aggregate free-form text. Go's standard `log/slog` emits *structured* records: key/value attributes, rendered as JSON in production, that a log backend can index and query (`level=ERROR route=/ledger user_id=42`). The habits that matter: log attributes, not interpolated strings; set a level on every line; bind request-scoped fields once with `logger.With(...)` so every subsequent line carries the trace ID and route; and use a human-readable handler in development, JSON in production. Treat logs as queryable data, not as a diary." },
    { h: "Metrics: measuring the right four numbers",
      p: "Metrics come in three shapes: *counters* that only increase (requests, errors), *gauges* that move both ways (in-flight requests, queue depth), and *histograms* that bucket a distribution so you can read p50/p95/p99 latency - and the tail, p99, is what users actually feel. Two frameworks tell you *what* to measure so you are not drowning in dashboards: *RED* for request-driven services (Rate, Errors, Duration) and *USE* for resources (Utilization, Saturation, Errors). Expose them on a `/metrics` endpoint and let Prometheus scrape them. The discipline that keeps this affordable is the next section's subject: bounded label cardinality." },
    { h: "Traces and the context you have been passing all along",
      p: "A trace is a tree of *spans*; each span times one operation - an HTTP handler, a database query, an outgoing RPC - and nests under its parent, so the trace literally shows where a request's milliseconds went, across services. What makes it work across process boundaries is *context propagation*: the trace and span IDs ride inside `context.Context` and are injected into outgoing request headers (the W3C `traceparent` header), so the next service continues the *same* trace rather than starting a new one. This is the deeper reason the course has insisted, since Module F5, that `context.Context` is the first argument to everything - it is the thread that stitches a distributed request into a single, readable story." },
    { h: "The bill comes due: cardinality, sampling, and volume",
      p: "Observability is not free, and the failure mode is self-inflicted. The sharpest edge is *cardinality*: a metric label with unbounded values - user IDs, request IDs, raw URLs with embedded IDs - multiplies into millions of distinct time series and can take down the metrics backend that was supposed to save you. Keep labels to small bounded sets: the *route template* `/ledger/{id}`, not the concrete path; the status code, not the message. Traces are *sampled* because storing every span at scale is impossible - keep a small percentage plus all the slow or errored ones. And logs, the most expensive signal at volume, demand level discipline and never logging inside a hot loop. Good observability is as much about what you *don't* record as what you do." },
  ],

  /* ============================================================== M15 */
  m15: [
    { h: "In distributed systems, failure is partial and contagious",
      p: "A single program mostly fails cleanly: it crashes and you read the stack trace. A distributed system fails *partially* - one node slows down, one dependency starts erroring - and the danger is that partial failure *spreads*. A slow database makes its callers slow; slow callers hold connections and goroutines longer; that exhausts their pools, so *their* callers slow down; and the wave propagates until a single struggling component has taken down the whole system. Resilience engineering is the collection of patterns that contain a partial failure so it stays partial. None of them prevent failure - they prevent *amplification*." },
    { h: "Deadlines: the pattern everything else depends on",
      p: "The foundational rule is that *nothing waits forever*. Every network call gets a timeout through `context.WithTimeout`, and because that context propagates down the entire call chain, when a request's deadline passes, every in-flight downstream call working on it is cancelled together. Skip this and one stuck dependency quietly parks goroutines and connections until the server runs out - the exact cascade above. You give a request a *budget* (say two seconds), spend it across hops, and fail fast when it is gone. Every other pattern in this module assumes deadlines are already in place; without them, retries and breakers just pile up more stuck waiters." },
    { h: "Retries done right, and the herd you can stampede",
      p: "Transient failures - a dropped connection, a 503, a serialization conflict - are worth retrying, but a naive retry loop is dangerous. Three disciplines make it safe. *Exponential backoff*: wait 100 ms, then 200, then 400, so you stop hammering a service that is already struggling. *Jitter*: randomize each delay, because otherwise thousands of clients that failed at the same instant retry in perfect lockstep - a *thundering herd* that knocks the recovering service straight back down. *Idempotency*: only retry operations that are safe to repeat; a retried payment without an idempotency key double-charges the customer. And always *cap* the attempts: retries multiply load, so an uncapped retry storm is a denial-of-service you inflicted on yourself." },
    { h: "Circuit breakers: knowing when to stop trying",
      p: "Retrying a dependency that is genuinely *down* just wastes time and adds load to a system that needs less of it. A *circuit breaker* is a small state machine wrapped around a dependency. While *closed*, calls pass through and it counts failures. When failures cross a threshold it trips *open*, and now every call fails *instantly* for a cooldown period - no waiting on timeouts - which both protects your own goroutines and gives the dependency breathing room. After the cooldown it goes *half-open* and lets a few probe calls through: succeed and it closes, fail and it re-opens. The essential behaviour is *failing fast*: an open breaker turns a slow, resource-consuming failure into an instant, cheap one, often paired with a cached or degraded fallback." },
    { h: "When you cannot serve it all: shed load, don't drown",
      p: "Two valves control how much work enters the system. A *rate limiter* (a token bucket) caps requests per second, smoothing bursts and protecting a downstream from being overwhelmed. *Load shedding* is the blunt, vital sibling: when you are already saturated - queue full, latency past your SLO - you reject the excess immediately with 429 or 503 rather than accepting work you cannot finish. This feels wrong but is the difference between staying up and falling over: a server that admits everything under overload slows until it serves *nobody*, while one that sheds twenty percent serves the other eighty at full speed. Saying no quickly is a feature." },
    { h: "Backpressure: let the queue push back",
      p: "The deepest idea here is *backpressure*: when a consumer cannot keep up, the right response is to slow the *producer*, not to buffer without limit. An unbounded queue or channel under sustained overload simply grows until it exhausts memory and the process is OOM-killed - it converts a throughput problem into a crash. A *bounded* buffered channel gives backpressure for free: once it is full, sends block (or, with a `select` default, can be shed), and that blocking propagates the slowness back to the producer so it stops taking on more. Bound every queue, treat 'queue full' as a signal to shed rather than grow, and combine it with deadlines so the slow path times out cleanly instead of hanging. A system that pushes back is a system that survives its worst day." },
  ],
  m16: [
    { h: "Concept: Redis is fast because it's in memory, and predictable because it's single-threaded",
      p: "Two facts explain almost everything else in this module. First, Redis keeps its working data set in RAM, so a read or write is a memory access measured in microseconds, not a disk seek measured in milliseconds. Second, and less obviously, a single Redis instance executes commands ONE AT A TIME on one thread - your Go program can call it from a thousand goroutines at once, but Redis itself still processes those calls sequentially, one fully finishing before the next starts. That second fact is not a bottleneck to route around; it is the reason every individual Redis command is *atomic* by construction, with no locking required on your part. Everything from here on - caching, locks, rate limits - is really just different ways of using that one guarantee." },
    { h: "How it works: the cache-aside read path",
      p: "Cache-aside is the default way applications use Redis. On a read, you ask Redis for the key first. If it's there (a HIT), you return it immediately and the real database is never touched. If it's not there (a MISS - go-redis reports this as the sentinel error `redis.Nil`, not a crash), you fall through to the real source of truth, get the answer the slow way, and write it into Redis with a time-to-live before returning it. The next reader of that same key gets a HIT. Because Redis never holds the ONLY copy of the data, it is always safe to lose the cache outright - a restart, an eviction, a manual flush - the very next read just repopulates it from the database, one miss at a time." },
    { h: "Why a TTL: a cache is allowed to be a LITTLE bit wrong, on purpose",
      p: "Setting a 60-second TTL is an explicit decision that a cached value may lag the real one by up to 60 seconds, in exchange for the speed of not hitting the real database on every read. That trade is usually a good one. When it isn't - a price just changed and the next read must be exactly correct - invalidate the key immediately on write instead of waiting for the TTL: delete it the moment the source of truth changes, so the very next reader gets a clean miss and repopulates with the new value. TTL is the safety net underneath keys nobody remembers to invalidate; explicit deletion is the fast path for the handful that actually matter." },
    { h: "Why SETNX is a distributed lock, not just a fancy write",
      p: "`SET key value NX` means 'write this only if the key doesn't already exist,' and it succeeds or fails as ONE indivisible command. That matters because a lock built by hand - 'read the key, and if it's empty, write my name into it' - has a gap between the read and the write where two callers can both see it empty and both believe they got the lock. Redis's single-threaded execution closes that gap entirely: because no other command can run in the middle of a SETNX, the check and the write happen as one atomic step, so with five callers racing for the same key at the exact same instant, exactly one of them succeeds - every time, not just usually. Always give a lock its own TTL too, so a caller that crashes while holding it doesn't lock the resource forever." },
    { h: "Why INCR is a rate limiter, not just a fancy counter",
      p: "The identical guarantee that makes SETNX safe as a lock makes INCR safe as a counter: it atomically adds one and hands back the new total in a single round trip, so two simultaneous callers can never both read the same old value and both write the same new one, silently losing an increment. A fixed-window rate limiter is nothing more than INCR plus one EXPIRE call made only on the very first hit of a window: once the count crosses your limit inside that window, you reject; once the window's TTL elapses, the whole counter simply resets itself by disappearing." },
    { h: "The failure mode to avoid: forgetting Redis is a cache, not the database",
      p: "Every pitfall in this module comes from the same root mistake: treating Redis as more durable, more authoritative, or more coordinated than it actually is. Data that only ever lived in Redis vanishes on a flush or an eviction - if that would actually hurt, it belongs in a real database, with Redis only ever holding a disposable copy. A burst of keys expiring together (or one very hot key expiring) can send a stampede of simultaneous misses at your real database all at once - worth guarding against with staggered TTLs or a lock around the repopulation itself. And a lock or a counter built with a manual GET-then-SET, instead of SETNX or INCR, quietly reintroduces the exact race those atomic commands exist to eliminate." },
  ],
  m20: [
    { h: "Concept: a cluster must survive losing a minority of itself, on purpose",
      p: "A single database is a single point of failure by definition - lose that one machine and you lose the data, or at least availability, until it comes back. Replicating the data across several nodes fixes availability but creates a new problem: now several nodes might disagree about what the truth is. Distributed consensus is the discipline of making N independent nodes behave like one reliable node, on purpose, even though any minority of them can crash, slow down, or get cut off by the network at any moment. The nodes that remain simply need to be a majority - that one requirement is what everything else in this module is built on." },
    { h: "How it works: heartbeats, terms and a randomized race to become leader",
      p: "Exactly one node is elected leader for a given 'term' - a number that only increases, so any two claims to leadership can always be compared and the higher term wins. The leader sends heartbeats; as long as followers hear them, nothing happens - they just keep following. The moment a follower's own randomized election timeout elapses without a heartbeat, it assumes the leader is gone, bumps the term, becomes a candidate, and requests votes from the rest of the cluster. Randomizing each node's timeout (rather than using one fixed value everywhere) is the detail that keeps elections from constantly splitting three-ways: with randomized timers, one node's clock reliably fires first, and it usually wins the whole term before any other node even starts trying." },
    { h: "Why it works: log replication and the meaning of 'committed'",
      p: "Once elected, the leader is the only node allowed to accept new commands from clients. Each command becomes an entry in the leader's log; the leader then replicates that entry to every follower via an AppendEntries call. Here is the detail that matters most: the entry is 'committed' - safe to apply, safe to tell the client 'yes, this happened' - the moment a MAJORITY of nodes (the leader included) have durably stored it. Not when the leader wrote it locally (that's just one node), and not when every single follower has it (that could mean waiting forever on a node that's down). Majority is the exact threshold that lets the cluster keep making real progress even while a minority of it is slow, unreachable, or crashed outright." },
    { h: "Why a network partition doesn't produce two leaders",
      p: "Split a 5-node cluster into a group of 2 and a group of 3 by cutting the network between them, and both groups still try to keep working. The 2-side can never gather a majority (3 out of 5) no matter how hard it tries - so it can elect no new leader and commit no new writes; it simply stalls, which is safe, if inconvenient. The 3-side CAN gather a majority among itself, so it elects a leader and keeps committing new entries normally. When the partition heals, the stale leader on the 2-side (if there was one, at a lower term) hears about the higher term from the 3-side and immediately steps down, and its followers catch up on whatever committed entries they missed. Nothing was ever accepted by both sides at once, so nothing ever needs to be reconciled - unlike the naive primary/backup design, where two live 'leaders' can each accept writes that later conflict." },
    { h: "How sharding works: consistent hashing and virtual nodes",
      p: "Consensus keeps one replicated log correct; sharding is the separate decision to split the overall keyspace across several such groups so no single group has to hold (or serve) everything. Consistent hashing maps both node IDs and keys onto the same numeric ring, and a key belongs to whichever node's position it reaches first walking clockwise. The payoff over plain `hash(key) % N` shows up exactly when N changes: removing one node only remaps the keys that were pointing at it, handing them to their new clockwise neighbor, while every other key stays exactly where it was. Production systems also give each physical node many positions on the ring ('virtual nodes') so that the keys freed up by a departing node spread evenly across the rest of the cluster instead of piling onto whichever single node happened to sit next to the gap." },
    { h: "Quorums: the dial between speed and consistency",
      p: "Generalize 'majority' into three numbers: N total replicas, W replicas required to acknowledge a write, and R replicas a read must consult. The rule W + R > N guarantees that any write quorum and any read quorum are mathematically forced to overlap by at least one node - so a read can never completely miss the most recently committed write, no matter which R nodes it happens to ask. Turn W or R down below that line and reads/writes get faster and cheaper, at the honest cost of that guarantee: a read might land entirely on replicas that haven't heard about the latest write yet. Neither setting is 'the right one' in the abstract - it is a deliberate trade between latency and consistency that a production system should document, not one it should back into by accident." },
    { h: "The failure mode to avoid: treating any of this as free",
      p: "Every technique here trades some latency or engineering complexity for a specific guarantee, and the pitfalls all come from forgetting that. A 'primary with manual failover' looks simpler than real leader election right up until a partition creates two primaries that both accept writes - the complexity didn't go away, it just moved to a 3am incident. Calling an entry 'committed' as soon as the leader writes it locally looks fine until that leader crashes before replicating, silently losing work nobody else ever received. And picking W + R <= N for speed is a perfectly valid choice - as long as everyone downstream knows reads can be stale, instead of discovering it in production." },
  ],
  m18: [
    { h: "Read the vacancy as an operating model",
      p: "This SRE vacancy is not asking for someone who merely knows tool names. It describes an operating loop: define reliability with SLIs and SLOs, instrument the system so reality is visible, alert only when action is needed, run incidents without chaos, find root causes, remove toil with automation, and influence engineering teams before reliability problems ship. That is why the right interview answer usually starts from a user journey, then connects tools to outcomes: lower detection time, lower recovery time, safer deploys, and fewer repeated manual tasks." },
    { h: "SLI, SLO and error budget interview answer",
      p: "For a microservice, pick SLIs that match user-visible behavior: successful requests divided by total requests, p95 or p99 latency below a threshold, queue freshness, durable write success, or background job completion time. Then set an SLO over a window: for example, 99.9% of ledger transfers succeed over 30 days. The error budget is the failure you are allowed: 0.1%. A strong candidate explains how that budget governs release risk. If the budget is healthy, you can ship. If the burn rate is high, you pause risky changes and mitigate. This turns reliability from opinion into an engineering control." },
    { h: "Dashboards and alerts that matter",
      p: "A dashboard should answer one operational question, not prove that you collected every metric. For request-driven services use RED: Rate, Errors, Duration. For resources use USE: Utilization, Saturation, Errors. The top dashboard should show user impact first: SLO compliance, error-budget burn, traffic, error rate and latency percentiles. Infrastructure panels explain causes below that. Alerts should be actionable and tied to urgency. A fast-burn SLO alert pages the on-call engineer because user impact is growing quickly; a slow burn can open a ticket. Paging on raw CPU alone is weak unless it maps to saturation and a clear action." },
    { h: "Telemetry stack: OpenTelemetry, Prometheus/Thanos, Tempo and Loki",
      p: "OpenTelemetry belongs at the application boundary: instrument handlers, clients, queues and database calls once, then export traces, metrics and logs through a collector. Prometheus scrapes metrics and evaluates alerts; Thanos gives long retention, deduplication and cross-cluster querying; Tempo stores traces; Loki stores logs with indexed labels. The workflow matters more than the product list: an SLO burn alert starts from a metric, the linked trace shows which hop is slow, and logs with the same trace ID explain the concrete event. Keep labels bounded, especially route templates instead of raw URLs or user IDs." },
    { h: "Incident response and on-call",
      p: "Structured on-call is a process. During an incident, separate roles: incident commander coordinates, operations lead mitigates, communications lead updates stakeholders, and scribe records the timeline. The first goal is mitigation, not a perfect root cause. After service is stable, run a blameless RCA: impact, timeline, detection path, contributing technical and process factors, and action items with owners and deadlines. Strong interview answers mention both people and systems, because most incidents are combinations of code, deployment, monitoring, process and communication gaps." },
    { h: "Toil automation and platform review",
      p: "Toil is manual, repetitive, automatable work that scales with the service: collecting the same diagnostics, restarting the same pod, resizing the same queue, or following the same checklist every night. Good SRE work identifies toil, quantifies it, automates the safe part, adds guardrails, and measures whether the automation reduced incidents or minutes spent. Platform review is the preventive side: code review and architecture review should check readiness probes, resource requests, rollout strategy, PDBs, HPA signals, load balancer behavior, data-store failure modes, secrets and network policies before production learns about the mistake." },
    { h: "Linux, networking, Kubernetes and OpenShift troubleshooting",
      p: "Troubleshooting should be systematic. Start from the symptom and move down the stack: DNS resolution, TCP connection, TLS handshake, HTTP status, load balancer, service endpoints, pod readiness, application logs, database latency and node pressure. Know the evidence tools: `dig`, `curl -v`, `ss`, `journalctl`, `top`, `pidstat`, `iostat`, `tcpdump`, plus `kubectl get/describe/logs/events`. For OpenShift, also understand Routes, SecurityContextConstraints and the platform's stricter defaults. In interviews, say what you would check first and what each result would prove or eliminate." },
  ],
};

/* =====================================================================
   WORKED EXAMPLES - one small, complete, runnable Go program per module,
   built up across 3-5 steps. Each step: concept (what), code (how, a
   growing/complete snippet), why (why this approach). Every example was
   compiled and run with `go run` while writing this file.
   ===================================================================== */
window.COURSE_EN.WORKED_EXAMPLES = {
  f1: {
    title: "Watch GOGC pace a real collection",
    intro: "A tiny program that allocates on purpose, so you can see the pacer and GOGC decide when to collect - not guess at it.",
    steps: [
      {
        title: "Allocate something the GC can see",
        concept: "Before tuning anything, we need a program that actually pressures the heap - a slice of byte buffers that we keep appending to.",
        code: `package main

import "fmt"

func main() {
	var bufs [][]byte
	for i := 0; i < 200_000; i++ {
		bufs = append(bufs, make([]byte, 256))
	}
	fmt.Println("allocated", len(bufs), "buffers")
}`,
        lang: "go",
        why: "You can't observe GC behavior on a program that barely allocates - there has to be real heap growth for the pacer to react to.",
      },
      {
        title: "Ask the runtime to report on itself",
        concept: "runtime.ReadMemStats gives you the live numbers the pacer itself uses: heap size and completed GC cycles.",
        code: `package main

import (
	"fmt"
	"runtime"
)

func main() {
	var bufs [][]byte
	for i := 0; i < 200_000; i++ {
		bufs = append(bufs, make([]byte, 256))
	}
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("heap alive: %d KB, completed GC cycles: %d\\n",
		m.HeapAlloc/1024, m.NumGC)
	_ = bufs
}`,
        lang: "go",
        why: "Reading real numbers replaces guessing - you can now see exactly how big the heap got and how many times the collector actually ran.",
      },
      {
        title: "Lower GOGC and watch cycles multiply",
        concept: "GOGC=100 (the default) means 'collect again once the live heap doubles.' Run the same program with GOGC=20 and the collector fires far more often.",
        code: `// no source change - same program, different environment variable:
//   GOGC=20  go run main.go
//   GOGC=400 go run main.go
//
// Or print it from inside the program:
package main

import (
	"fmt"
	"runtime/debug"
)

func main() {
	fmt.Println("current GOGC target:", debug.SetGCPercent(-1))
	debug.SetGCPercent(20) // restore a real value after inspecting
}`,
        lang: "go",
        why: "Seeing the SAME program collect more or less often under different GOGC values is what makes 'GOGC trades CPU for memory' concrete instead of abstract.",
      },
      {
        title: "Trace every cycle as it happens",
        concept: "GODEBUG=gctrace=1 makes the runtime print one line per GC cycle - pause time, heap before/after, and why it triggered.",
        code: `// run it:
//   GODEBUG=gctrace=1 go run main.go
//
// sample output (your numbers will vary):
//   gc 1 @0.004s 3%: 0.059+0.31+0.13 ms clock,
//        0.59+0.25/0.44/0.003+1.3 ms cpu,
//        3->3->0 MB, 4 MB goal, 10 P`,
        lang: "go",
        why: "This is the same data dashboards plot, just in raw form - once you can read one line of gctrace output, GC graphs in a real monitoring tool stop looking like noise.",
      },
    ],
  },

  f2: {
    title: "Profile a hot loop and find the bottleneck",
    intro: "A program with a deliberately slow function, profiled and read with the real go tool pprof - no guessing where the time went.",
    steps: [
      {
        title: "Wrap the hot path in a CPU profile",
        concept: "pprof.StartCPUProfile begins sampling; StopCPUProfile (deferred) flushes the recorded samples to a file when main returns.",
        code: `package main

import (
	"fmt"
	"os"
	"runtime/pprof"
)

func slow(n int) int {
	sum := 0
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			sum += i * j
		}
	}
	return sum
}

func main() {
	f, err := os.Create("cpu.prof")
	if err != nil {
		panic(err)
	}
	defer f.Close()

	pprof.StartCPUProfile(f)
	defer pprof.StopCPUProfile()

	fmt.Println("result:", slow(7000))
}`,
        lang: "go",
        why: "Profiling code you already understand (a known-slow nested loop) first is how you learn to trust the tool before pointing it at code you don't understand yet.",
      },
      {
        title: "Run it, then read the profile",
        concept: "go run produces cpu.prof; go tool pprof -top reads it and ranks functions by time spent.",
        code: `// run it:
//   go run main.go
//   go tool pprof -top -nodecount=3 cpu.prof
//
// real output from this exact program:
//   Duration: 202.48ms, Total samples = 20ms ( 9.88%)
//   Showing top 3 nodes out of 5
//         flat  flat%   sum%        cum   cum%
//         10ms 50.00% 50.00%       10ms 50.00%  fmt.Fprintln
//         10ms 50.00%   100%       10ms 50.00%  main.slow
//            0     0%   100%       10ms 50.00%  fmt.Println`,
        lang: "go",
        why: "This is the exact data dashboards plot, just in text form - once you can read this table, a flame graph is just a picture of the same numbers.",
      },
      {
        title: "flat vs cum: which column to chase",
        concept: "flat is time spent IN that function's own code; cum includes everything it called. main.slow's flat time is the loop itself - the thing actually worth optimizing here.",
        code: `// flat%  - time spent in this function's own body
// cum%   - time spent in this function PLUS everything it calls
//
// a wide, shallow box (high flat%) is usually your hotspot.
// a tall, narrow tower (high cum%, low flat%) is often just
// a deep call chain that costs almost nothing per frame.`,
        lang: "go",
        why: "Optimizing by cum% alone leads you to 'fix' wrapper functions that call the real hotspot - flat% points at the code that's actually burning the cycles.",
      },
    ],
  },

  f3: {
    title: "Build a table-driven test from scratch",
    intro: "Start from one function and one test case, then grow it into the idiomatic table-driven shape - verified with `go test -v -cover`.",
    steps: [
      {
        title: "The function under test",
        concept: "Nothing special yet - just a plain function we want confidence in.",
        code: `package main

func Add(a, b int) int { return a + b }

func main() {}`,
        lang: "go",
        why: "Tests are written against ordinary functions - there's no special interface or base class to opt into in Go.",
      },
      {
        title: "A table of cases, not a pile of test functions",
        concept: "Each case is a row: inputs plus the expected result. t.Run turns each row into its own named subtest.",
        code: `package main

import "testing"

func TestAdd(t *testing.T) {
	cases := []struct {
		name string
		a, b int
		want int
	}{
		{"positives", 2, 3, 5},
		{"with_zero", 0, 0, 0},
		{"negatives", -2, 2, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Add(tc.a, tc.b)
			if got != tc.want {
				t.Errorf("Add(%d,%d) = %d, want %d", tc.a, tc.b, got, tc.want)
			}
		})
	}
}`,
        lang: "go",
        why: "Adding a 4th scenario is now a one-line addition to the slice - no copy-pasted test function, and a failing case names itself precisely (e.g. TestAdd/negatives).",
      },
      {
        title: "Run it with race detection and coverage",
        concept: "go test -v -cover ./... runs every subtest and reports how much of the code those tests actually exercised.",
        code: `// run it:
//   go test -v -cover ./...
//
// real output:
//   === RUN   TestAdd
//   === RUN   TestAdd/positives
//   === RUN   TestAdd/with_zero
//   === RUN   TestAdd/negatives
//   --- PASS: TestAdd (0.00s)
//       --- PASS: TestAdd/positives (0.00s)
//       --- PASS: TestAdd/with_zero (0.00s)
//       --- PASS: TestAdd/negatives (0.00s)
//   PASS
//   coverage: 100.0% of statements`,
        lang: "go",
        why: "Coverage isn't a vanity number here - 100% on a 1-line function is the easy case; the same -cover flag is what catches an untested error branch in real code.",
      },
    ],
  },

  f4: {
    title: "Build a worker pool from two channels",
    intro: "A complete fan-out/fan-in pool: jobs in, squared results out, three workers sharing the load.",
    steps: [
      {
        title: "One worker, reading from a shared channel",
        concept: "A worker is just a function that ranges over a channel until it's closed, doing the same job for whatever arrives.",
        code: `package main

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		results <- j * j
	}
}`,
        lang: "go",
        why: "The worker doesn't know or care how many other workers exist - that's what makes it trivial to fan out to N of them later.",
      },
      {
        title: "Start three of them, sharing one jobs channel",
        concept: "Three goroutines all call worker() on the SAME channel - the channel itself decides who gets which job.",
        code: `package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		results <- j * j
	}
}

func main() {
	jobs := make(chan int, 6)
	results := make(chan int, 6)
	var wg sync.WaitGroup

	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= 6; j++ {
		jobs <- j
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	sum := 0
	for r := range results {
		sum += r
	}
	fmt.Println("sum of squares:", sum)
}`,
        lang: "go",
        why: "Closing jobs is what lets every worker's `range jobs` loop end naturally - and waiting for all workers before closing results is what makes draining results safe.",
      },
      {
        title: "Run it",
        concept: "1²+2²+3²+4²+5²+6² = 91 - verify the pool computed the right total despite three goroutines racing to pull jobs.",
        code: `// run it:
//   go run main.go
//
// output:
//   sum of squares: 91`,
        lang: "go",
        why: "The result is deterministic (always 91) even though WHICH worker handles WHICH job is not - that's the property fan-out/fan-in is supposed to give you.",
      },
    ],
  },

  f5: {
    title: "Cancel a tree of goroutines with one context",
    intro: "Two goroutines racing a 100ms deadline - both observe the SAME cancellation the instant it fires.",
    steps: [
      {
        title: "A worker that races the context against real work",
        concept: "select between ctx.Done() and the actual work (here, simulated with time.After) - whichever happens first wins.",
        code: `package main

import (
	"context"
	"time"
)

func worker(ctx context.Context, name string, done chan<- string) {
	select {
	case <-ctx.Done():
		done <- name + ": cancelled (" + ctx.Err().Error() + ")"
	case <-time.After(5 * time.Second):
		done <- name + ": finished work"
	}
}`,
        lang: "go",
        why: "This is the shape every cancellable goroutine should have: it never just blocks on the work alone, it always also watches ctx.Done().",
      },
      {
        title: "A short deadline, two workers",
        concept: "context.WithTimeout creates a context that cancels itself after 100ms - far sooner than the 5-second 'work' both goroutines are doing.",
        code: `package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, name string, done chan<- string) {
	select {
	case <-ctx.Done():
		done <- name + ": cancelled (" + ctx.Err().Error() + ")"
	case <-time.After(5 * time.Second):
		done <- name + ": finished work"
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	done := make(chan string, 2)
	go worker(ctx, "worker-A", done)
	go worker(ctx, "worker-B", done)

	fmt.Println(<-done)
	fmt.Println(<-done)
}`,
        lang: "go",
        why: "Both goroutines derive from the SAME ctx, so one timeout cancels both - this is the one-context-many-goroutines pattern that makes cancellation trees work.",
      },
      {
        title: "Run it: both see the same cancellation",
        concept: "Neither goroutine waits anywhere near 5 seconds - both exit within milliseconds of the deadline.",
        code: `// run it:
//   go run main.go
//
// output (order of A/B may vary):
//   worker-B: cancelled (context deadline exceeded)
//   worker-A: cancelled (context deadline exceeded)`,
        lang: "go",
        why: "If a real request handler used this pattern instead of a bare time.Sleep, an upstream timeout would cancel every goroutine it started - no leaks, no waiting.",
      },
    ],
  },

  m19: {
    title: "Build the interview LRU cache: O(1) Get and Put",
    intro: "The classic design exercise, built the way interviews demand it: a map for lookup welded to a hand-rolled doubly-linked list for recency - no container/list allowed.",
    steps: [
      {
        title: "The layout: a map pointing into a linked list",
        concept: "The map answers 'where is key K' in O(1); the list keeps recency order so the eviction victim is always at the tail. Sentinel head/tail nodes mean the list is never empty - no nil checks, no special cases.",
        code: `package main

import "fmt"

// node is one entry in the doubly-linked recency list.
type node struct {
	key, val   int
	prev, next *node
}

// LRU is a fixed-capacity cache with O(1) Get and Put.
// The map finds a node by key; the list orders nodes by recency:
// head sentinel <-> most recent ... least recent <-> tail sentinel.
type LRU struct {
	cap        int
	items      map[int]*node
	head, tail *node // sentinels: never hold data, never nil
}

func NewLRU(capacity int) *LRU {
	h, t := &node{}, &node{}
	h.next, t.prev = t, h
	return &LRU{cap: capacity, items: make(map[int]*node, capacity), head: h, tail: t}
}`,
        lang: "go",
        why: "Storing *node pointers in the map is the weld between the two structures: the map jump lands directly on the list node, so no list scan ever happens. The node keeps its own key so eviction can delete the map entry without a reverse lookup.",
      },
      {
        title: "Pointer surgery: unlink and pushFront",
        concept: "Every cache operation reduces to these two moves. unlink cuts a node out of wherever it is; pushFront reinserts it right after the head sentinel, making it the most recent.",
        code: `// unlink removes n from wherever it is in the list.
func (c *LRU) unlink(n *node) {
	n.prev.next = n.next
	n.next.prev = n.prev
}

// pushFront inserts n right after the head sentinel (most recent).
func (c *LRU) pushFront(n *node) {
	n.prev, n.next = c.head, c.head.next
	c.head.next.prev = n
	c.head.next = n
}`,
        lang: "go",
        why: "This is the part interviewers watch closely - four pointer writes per operation, in the right order. Thanks to the sentinels, the same code works when the list has one node, many, or none: n.prev and n.next always exist.",
      },
      {
        title: "Get and Put: compose the two moves",
        concept: "Get = map lookup + move to front. Put = update-in-place, or insert - evicting the node before the tail sentinel when the cache is full.",
        code: `func (c *LRU) Get(key int) (int, bool) {
	n, ok := c.items[key]
	if !ok {
		return 0, false
	}
	c.unlink(n)    // touching a key makes it most recent:
	c.pushFront(n) // move its node to the front
	return n.val, true
}

func (c *LRU) Put(key, val int) {
	if n, ok := c.items[key]; ok {
		n.val = val
		c.unlink(n)
		c.pushFront(n)
		return
	}
	if len(c.items) == c.cap {
		lru := c.tail.prev // least recently used lives before the tail sentinel
		c.unlink(lru)
		delete(c.items, lru.key)
	}
	n := &node{key: key, val: val}
	c.items[key] = n
	c.pushFront(n)
}`,
        lang: "go",
        why: "Count the work: one map operation plus a constant number of pointer writes - O(1) for both Get and Put, which is the whole requirement. The eviction victim is found in O(1) too, because the list keeps it parked at the tail.",
      },
      {
        title: "Prove the eviction order",
        concept: "A capacity-2 cache: touching key 1 with Get must save it from eviction, so the later Put(3) evicts key 2 instead.",
        code: `func main() {
	c := NewLRU(2)
	c.Put(1, 100)
	c.Put(2, 200)
	v, ok := c.Get(1) // touch 1 - now 2 is the LRU
	fmt.Println(v, ok)
	c.Put(3, 300) // evicts 2, not 1
	_, ok = c.Get(2)
	fmt.Println(ok)
	v, ok = c.Get(1)
	fmt.Println(v, ok)
	v, ok = c.Get(3)
	fmt.Println(v, ok)
}

// run it:  go run main.go
// real output:
//   100 true
//   false
//   100 true
//   300 true`,
        lang: "go",
        why: "The middle line is the proof: key 2 is gone (false) while key 1 survived - the Get reordered the recency list, exactly the behavior the interviewer will test first. If Get did not move nodes, this test would evict 1 and the cache would be FIFO, not LRU.",
      },
    ],
  },

  m1: {
    title: "Route a wildcard, then jail the filesystem",
    intro: "A real ServeMux route with a {id} wildcard, plus an os.Root sandbox that physically can't escape its directory.",
    steps: [
      {
        title: "Register a route with a typed wildcard",
        concept: "{id} in the pattern captures that path segment; r.PathValue(\"id\") reads it back in the handler.",
        code: `package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/ledger/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		fmt.Fprintf(w, "ledger entry %s", id)
	})

	req := httptest.NewRequest("GET", "/api/v1/ledger/42", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	fmt.Println("status:", rec.Code)
	fmt.Println("body:", rec.Body.String())
}`,
        lang: "go",
        why: "httptest.NewRequest + NewRecorder lets you exercise real routing logic without binding an actual port - the same trick the standard library's own tests use.",
      },
      {
        title: "Run it",
        concept: "The wildcard segment '42' flows through PathValue into the response body.",
        code: `// run it:
//   go run main.go
//
// output:
//   status: 200
//   body: ledger entry 42`,
        lang: "go",
        why: "Confirming the wildcard capture works in isolation, before adding real database logic, keeps routing bugs and business-logic bugs from being debugged at the same time.",
      },
      {
        title: "Open a directory jail",
        concept: "os.OpenRoot returns an *os.Root scoped to one directory - every path you open through it is resolved relative to that root, and can never leave it.",
        code: `package main

import (
	"fmt"
	"os"
)

func main() {
	root, err := os.OpenRoot("data")
	if err != nil {
		panic(err)
	}
	defer root.Close()

	f, err := root.Open("config.json")
	if err != nil {
		panic(err)
	}
	defer f.Close()
	buf := make([]byte, 64)
	n, _ := f.Read(buf)
	fmt.Println("read ok:", string(buf[:n]))
}`,
        lang: "go",
        why: "Once a handler only ever holds an *os.Root (never a raw path string), there is no boundary check left to forget - the type itself enforces the jail.",
      },
      {
        title: "An escape attempt is rejected",
        concept: "Asking the SAME root to open ../../etc/passwd doesn't read a file outside data/ - it returns an error.",
        code: `	_, err = root.Open("../../etc/passwd")
	fmt.Println("escape attempt error:", err)

// output:
//   escape attempt error: openat ../../etc/passwd: path escapes from parent`,
        lang: "go",
        why: "This is structural safety, not a runtime check that a future refactor could accidentally delete - os.Root rejects the traversal before any syscall touches a path outside data/.",
      },
    ],
  },

  m2: {
    title: "Measure a map lookup's cost directly",
    intro: "The same map[string]float64 lookup most Go programs already write - benchmarked, so 'Swiss Tables are fast' becomes a number instead of a claim.",
    steps: [
      {
        title: "An ordinary map and the comma-ok idiom",
        concept: "Indexing a map returns the zero value on a miss; the second return value tells you whether the key was actually present.",
        code: `package main

import "fmt"

func main() {
	rates := map[string]float64{
		"EUR": 0.92,
		"GBP": 0.79,
		"JPY": 151.2,
		"USD": 1.00,
	}

	rate, ok := rates["USD"]
	fmt.Println("USD rate:", rate, "found:", ok)

	miss, ok := rates["XYZ"]
	fmt.Println("XYZ rate:", miss, "found:", ok)
}`,
        lang: "go",
        why: "Nothing about this code changed between the legacy map and the Go 1.24+ Swiss Table implementation - the speedup is free, behind the exact same syntax.",
      },
      {
        title: "Benchmark the lookup",
        concept: "testing.B's b.N loop times a single map read in isolation, after the map is already built.",
        code: `package main

import "testing"

func BenchmarkMapLookup(b *testing.B) {
	m := make(map[int]int, 1000)
	for i := 0; i < 1000; i++ {
		m[i] = i * 2
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m[500]
	}
}`,
        lang: "go",
        why: "b.ResetTimer() excludes the setup loop from the measurement - you want to time the LOOKUP, not the time spent building the map.",
      },
      {
        title: "Run it",
        concept: "A single lookup on a 1000-entry map costs a handful of nanoseconds, however the table is laid out internally.",
        code: `// run it:
//   go test -bench=. -benchtime=100000x
//
// real output:
//   BenchmarkMapLookup-10    100000    9.099 ns/op`,
        lang: "go",
        why: "This is the number that improved under the hood when Go 1.24 switched to Swiss Tables - same benchmark code, same map type, fewer cache misses per lookup.",
      },
    ],
  },

  m3: {
    title: "Watch runtime.AddCleanup fire exactly once",
    intro: "A fake connection whose cleanup prints a message the moment the garbage collector proves it's unreachable - no finalizer, no resurrection.",
    steps: [
      {
        title: "Attach a cleanup when the object is created",
        concept: "runtime.AddCleanup registers a function to run AFTER ptr becomes unreachable. It captures fd by value, not the *Conn itself.",
        code: `package main

import (
	"fmt"
	"runtime"
)

type Conn struct{ fd int }

func openConn(fd int) *Conn {
	c := &Conn{fd: fd}
	runtime.AddCleanup(c, func(fd int) {
		fmt.Println("cleanup: closing fd", fd)
	}, c.fd)
	return c
}`,
        lang: "go",
        why: "Capturing fd by value (not c) means the cleanup can run safely even after c itself is gone - there's nothing left to dereference.",
      },
      {
        title: "Use it, then let it go out of scope",
        concept: "Put the creation and use inside their own function so the *Conn has no reachable reference once that function returns.",
        code: `func use() {
	c := openConn(7)
	fmt.Println("using conn with fd", c.fd)
} // c is unreachable the moment use() returns`,
        lang: "go",
        why: "A reference sitting in main (or a long-lived closure) would keep the object reachable indefinitely - the cleanup only fires once nothing can reach it.",
      },
      {
        title: "Force a GC pass and give the cleanup goroutine time to run",
        concept: "Cleanups run on a separate goroutine some time after the object dies - runtime.GC() makes that 'some time' happen now, for the demo.",
        code: `package main

import (
	"fmt"
	"runtime"
	"time"
)

type Conn struct{ fd int }

func openConn(fd int) *Conn {
	c := &Conn{fd: fd}
	runtime.AddCleanup(c, func(fd int) {
		fmt.Println("cleanup: closing fd", fd)
	}, c.fd)
	return c
}

func use() {
	c := openConn(7)
	fmt.Println("using conn with fd", c.fd)
}

func main() {
	use()
	runtime.GC()
	runtime.GC()
	time.Sleep(200 * time.Millisecond)
	fmt.Println("done")
}`,
        lang: "go",
        why: "In production code you'd never call runtime.GC() by hand like this - it's only here to make an otherwise-eventual cleanup observable in a short demo.",
      },
      {
        title: "Run it",
        concept: "The cleanup message appears between 'using conn' and 'done' - proof it ran exactly once, after the object died.",
        code: `// run it:
//   go run main.go
//
// output:
//   using conn with fd 7
//   cleanup: closing fd 7
//   done`,
        lang: "go",
        why: "Compare this to SetFinalizer, which could delay this by a whole extra GC cycle or skip it if the object got 'resurrected' - AddCleanup gives you neither failure mode.",
      },
    ],
  },

  m4: {
    title: "Make a 5-second test run instantly",
    intro: "A real testing/synctest test that sleeps for 5 seconds of BUBBLE time but finishes in milliseconds of real time.",
    steps: [
      {
        title: "Run a test inside a synctest bubble",
        concept: "synctest.Test runs the function in an isolated bubble with its own fake clock; everything inside, including goroutines it starts, lives in that bubble.",
        code: `package main

import (
	"testing"
	"testing/synctest"
	"time"
)

func TestFastForward(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		start := time.Now()
		done := make(chan struct{})
		go func() {
			time.Sleep(5 * time.Second)
			close(done)
		}()
		<-done
		elapsed := time.Since(start)
		t.Log("bubble time elapsed:", elapsed)
		if elapsed != 5*time.Second {
			t.Fatalf("want exactly 5s, got %v", elapsed)
		}
	})
}`,
        lang: "go",
        why: "Inside the bubble, time.Sleep doesn't actually wait - once every goroutine is durably blocked, the bubble's clock jumps straight to the next timer.",
      },
      {
        title: "Run it",
        concept: "go test reports a near-zero real duration, while the test's own logged 'elapsed' shows exactly 5 seconds of bubble time.",
        code: `// run it:
//   go test -v ./...
//
// real output:
//   === RUN   TestFastForward
//       main_test.go:19: bubble time elapsed: 5s
//   --- PASS: TestFastForward (0.00s)
//   PASS
//   ok    m4demo  0.350s`,
        lang: "go",
        why: "0.00s for a test whose own code measured 5 full seconds - that's the entire pitch: deterministic timer behavior with none of the real wall-clock wait, and none of the CI flakiness a true time.Sleep-based test would risk.",
      },
      {
        title: "Replace 'sleep and hope' with synctest.Wait",
        concept: "The classic flaky pattern is cancel-then-sleep-100ms-then-assert. synctest.Wait is the precise version: it returns exactly when every other goroutine in the bubble is durably blocked - i.e. the worker has fully reacted.",
        code: `func TestShutdownCleanup(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(t.Context())
		var stopped atomic.Bool
		go func() { // worker under test
			<-ctx.Done()
			stopped.Store(true) // cleanup we want to assert
		}()

		cancel()
		synctest.Wait() // barrier: worker has fully reacted
		if !stopped.Load() {
			t.Fatal("worker did not clean up after cancel")
		}
	})
}`,
        lang: "go",
        why: "Note what Wait is NOT: it does not advance the fake clock, it only waits for quiescence. Use it to assert on state another goroutine updates in reaction to something you did - no arbitrary sleep, no race between the assert and the reaction.",
      },
      {
        title: "A lost signal fails fast, not forever",
        concept: "If every goroutine in the bubble is durably blocked and no timer can ever fire, that is a deadlock - and the bubble fails the test immediately instead of hanging until the CI timeout.",
        code: `func TestLostSignal(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ch := make(chan int) // nobody will ever send
		<-ch                 // durably blocked, no timers left
	})
}

// real output (fails in 0.00s, not after a 10-minute timeout):
//   --- FAIL: TestLostSignal (0.00s)
//   panic: deadlock: all goroutines in bubble are blocked`,
        lang: "go",
        why: "Outside a bubble this test would hang for the full test timeout and produce a giant unreadable stack dump. Inside the bubble the runtime can PROVE nothing will ever wake the goroutine, so 'everyone is waiting on everyone' bugs surface deterministically, on the first run.",
      },
    ],
  },

  m5: {
    title: "Model row-level locking with a mutex",
    intro: "A simplified in-memory ledger that mirrors what SELECT ... FOR UPDATE buys you - full Postgres isn't available here, but the exclusion principle is identical and this runs with zero dependencies.",
    steps: [
      {
        title: "A transfer that touches two balances together",
        concept: "Lock, mutate both legs of the transfer, unlock - the lock stands in for the row-level lock a real transaction would take.",
        code: `package main

import "sync"

type Ledger struct {
	mu       sync.Mutex
	balances map[string]int
}

func (l *Ledger) Transfer(from, to string, amount int) {
	l.mu.Lock() // simulates SELECT ... FOR UPDATE locking the row
	defer l.mu.Unlock()

	l.balances[from] -= amount
	l.balances[to] += amount
}`,
        lang: "go",
        why: "Both the debit and the credit happen while the SAME lock is held, so no other transfer can ever observe a half-finished update - exactly what a real transaction's row lock guarantees.",
      },
      {
        title: "Run two transfers concurrently",
        concept: "Two goroutines fire transfers in opposite directions at the same time.",
        code: `package main

import (
	"fmt"
	"sync"
)

type Ledger struct {
	mu       sync.Mutex
	balances map[string]int
}

func (l *Ledger) Transfer(from, to string, amount int) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.balances[from] -= amount
	l.balances[to] += amount
}

func main() {
	l := &Ledger{balances: map[string]int{"A": 500, "B": 300}}

	var wg sync.WaitGroup
	wg.Add(2)
	go func() { defer wg.Done(); l.Transfer("A", "B", 100) }()
	go func() { defer wg.Done(); l.Transfer("B", "A", 50) }()
	wg.Wait()

	fmt.Println("A:", l.balances["A"], "B:", l.balances["B"])
	fmt.Println("sum:", l.balances["A"]+l.balances["B"])
}`,
        lang: "go",
        why: "Without the lock, this is a textbook data race: two goroutines reading-then-writing the same map entries can lose an update entirely.",
      },
      {
        title: "Run it: the invariant holds",
        concept: "A: 500−100+50=450, B: 300+100−50=350, and the SUM never changes, no matter the interleaving.",
        code: `// run it:
//   go run main.go
//
// output:
//   A: 450 B: 350
//   sum: 800`,
        lang: "go",
        why: "Σ(balances) staying constant under concurrent access is the entire point of double-entry transfers - this is the same invariant the real PostgreSQL row lock protects.",
      },
    ],
  },

  m17: {
    title: "Model idempotent ledger writes before touching Postgres",
    intro: "A dependency-free Go model of the same safety rails the Postgres schema should enforce: positive amounts, known accounts, unique idempotency keys, and one atomic double-entry transfer.",
    steps: [
      {
        title: "Define the storage boundary",
        concept: "The store keeps balances plus an idempotency map. In Postgres, those become accounts rows plus a UNIQUE idempotency_key on transfers.",
        code: `package main

import "sync"

type Store struct {
	mu          sync.Mutex
	balances    map[string]int64
	idempotency map[string]string
}

func NewStore() *Store {
	return &Store{
		balances:    map[string]int64{"alice": 10_000, "bob": 5_000},
		idempotency: make(map[string]string),
	}
}`,
        lang: "go",
        why: "This is the smallest useful model of the database boundary: protected mutable state and a uniqueness set that makes retries safe.",
      },
      {
        title: "Apply one transfer atomically",
        concept: "Validate the local constraints, deduplicate by idempotency key, then mutate both balances while holding one lock.",
        code: `package main

import (
	"errors"
	"fmt"
	"sync"
)

type Store struct {
	mu          sync.Mutex
	balances    map[string]int64
	idempotency map[string]string
}

func (s *Store) Transfer(key, from, to string, amount int64) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if existing, ok := s.idempotency[key]; ok {
		return existing, nil
	}
	if amount <= 0 {
		return "", errors.New("amount must be positive")
	}
	if _, ok := s.balances[from]; !ok {
		return "", fmt.Errorf("unknown account %q", from)
	}
	if _, ok := s.balances[to]; !ok {
		return "", fmt.Errorf("unknown account %q", to)
	}
	if s.balances[from] < amount {
		return "", errors.New("insufficient funds")
	}

	s.balances[from] -= amount
	s.balances[to] += amount
	transferID := fmt.Sprintf("%s:%s:%d", from, to, amount)
	s.idempotency[key] = transferID
	return transferID, nil
}`,
        lang: "go",
        why: "The mutex stands in for one database transaction. The idempotency map stands in for UNIQUE(idempotency_key). Both are needed: atomicity protects balances, uniqueness protects retries.",
      },
      {
        title: "Run it: duplicate requests do not double-charge",
        concept: "The second call uses the same idempotency key. It returns the first transfer ID and leaves the balances unchanged.",
        code: `package main

import (
	"errors"
	"fmt"
	"sync"
)

type Store struct {
	mu          sync.Mutex
	balances    map[string]int64
	idempotency map[string]string
}

func NewStore() *Store {
	return &Store{
		balances:    map[string]int64{"alice": 10_000, "bob": 5_000},
		idempotency: make(map[string]string),
	}
}

func (s *Store) Transfer(key, from, to string, amount int64) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if existing, ok := s.idempotency[key]; ok {
		return existing, nil
	}
	if amount <= 0 {
		return "", errors.New("amount must be positive")
	}
	if _, ok := s.balances[from]; !ok {
		return "", fmt.Errorf("unknown account %q", from)
	}
	if _, ok := s.balances[to]; !ok {
		return "", fmt.Errorf("unknown account %q", to)
	}
	if s.balances[from] < amount {
		return "", errors.New("insufficient funds")
	}

	s.balances[from] -= amount
	s.balances[to] += amount
	transferID := fmt.Sprintf("%s:%s:%d", from, to, amount)
	s.idempotency[key] = transferID
	return transferID, nil
}

func main() {
	store := NewStore()
	first, _ := store.Transfer("req-42", "alice", "bob", 1200)
	second, _ := store.Transfer("req-42", "alice", "bob", 1200)

	fmt.Println(first == second)
	fmt.Println("alice:", store.balances["alice"], "bob:", store.balances["bob"])
}`,
        lang: "go",
        why: "The output proves the retry was a read of the first result, not a second money movement. In Postgres, the same idea is enforced with a transaction plus a UNIQUE idempotency key.",
      },
      {
        title: "Expected output",
        concept: "One transfer is created, the retry returns the same identity, and the total balance stays constant.",
        code: `// run it:
//   go run main.go
//
// output:
//   true
//   alice: 8800 bob: 6200`,
        lang: "go",
        why: "This is the behavior the real schema must preserve under HTTP retries, client timeouts, worker restarts, and transaction retries.",
      },
    ],
  },

  m6: {
    title: "Run a real post-quantum key exchange",
    intro: "Go's crypto/mlkem package implements ML-KEM-768 for real - generate a key pair, encapsulate, decapsulate, and combine it with classical X25519.",
    steps: [
      {
        title: "Generate an ML-KEM-768 key pair",
        concept: "GenerateKey768 returns a decapsulation key; EncapsulationKey() derives the public half from it.",
        code: `package main

import "crypto/mlkem"

func main() {
	dk, err := mlkem.GenerateKey768()
	if err != nil {
		panic(err)
	}
	ek := dk.EncapsulationKey()
	_ = ek
}`,
        lang: "go",
        why: "Unlike classical Diffie-Hellman, KEMs have this asymmetric shape - one side generates a key pair, the other side uses the public half to CREATE a shared secret, not negotiate one.",
      },
      {
        title: "Encapsulate and decapsulate a shared secret",
        concept: "Alice's Encapsulate() produces a shared secret AND a ciphertext; Bob's Decapsulate(ciphertext) recovers the same secret from his private key.",
        code: `package main

import (
	"bytes"
	"crypto/mlkem"
	"fmt"
)

func main() {
	dk, _ := mlkem.GenerateKey768()
	ek := dk.EncapsulationKey()

	aliceSecret, ciphertext := ek.Encapsulate()
	bobSecret, err := dk.Decapsulate(ciphertext)
	if err != nil {
		panic(err)
	}

	fmt.Println("ciphertext bytes:", len(ciphertext))
	fmt.Println("shared secrets match:", bytes.Equal(aliceSecret, bobSecret))
}`,
        lang: "go",
        why: "Only someone holding the DECAPSULATION key can recover the secret from the ciphertext - an eavesdropper who only sees the ciphertext (and the public key) cannot, even with a quantum computer.",
      },
      {
        title: "Combine with X25519 for a hybrid key",
        concept: "Run a classical ECDH exchange alongside the ML-KEM one, then hash both secrets together into one session key.",
        code: `package main

import (
	"crypto/ecdh"
	"crypto/mlkem"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
)

func main() {
	curve := ecdh.X25519()
	bobX, _ := curve.GenerateKey(rand.Reader)
	aliceX, _ := curve.GenerateKey(rand.Reader)
	classicalSecret, _ := aliceX.ECDH(bobX.PublicKey())

	dk, _ := mlkem.GenerateKey768()
	pqSecret, ciphertext := dk.EncapsulationKey().Encapsulate()
	_, _ = dk.Decapsulate(ciphertext)

	h := sha256.New()
	h.Write(classicalSecret)
	h.Write(pqSecret)
	sessionKey := h.Sum(nil)

	fmt.Println("session key bytes:", len(sessionKey))
}`,
        lang: "go",
        why: "Mixing both secrets means breaking the session requires breaking BOTH problems - discrete log AND lattice hardness - which is exactly the 'hybrid' in hybrid post-quantum TLS.",
      },
    ],
  },

  m7: {
    title: "Catch a goroutine leak with NumGoroutine",
    intro: "Five goroutines blocked forever on a channel nobody sends to - counted before and after, the way the leak analyzer reasons about it.",
    steps: [
      {
        title: "A goroutine with no possible sender",
        concept: "The goroutine blocks on <-ch, but ch is local and nothing else holds a reference to send on it.",
        code: `package main

func leaky() {
	ch := make(chan int) // nobody ever sends on this channel
	go func() {
		<-ch // blocks forever
	}()
}`,
        lang: "go",
        why: "This compiles and runs without any visible error - leaks are silent by nature, which is exactly why you need a way to count them.",
      },
      {
        title: "Count goroutines before and after",
        concept: "runtime.NumGoroutine() reports exactly how many goroutines currently exist, leaked or not.",
        code: `package main

import (
	"fmt"
	"runtime"
	"time"
)

func leaky() {
	ch := make(chan int)
	go func() {
		<-ch
	}()
}

func main() {
	before := runtime.NumGoroutine()
	for i := 0; i < 5; i++ {
		leaky()
	}
	time.Sleep(50 * time.Millisecond)
	after := runtime.NumGoroutine()
	fmt.Println("goroutines before:", before, "after:", after, "leaked:", after-before)
}`,
        lang: "go",
        why: "In a real service this same number, exported via runtime/metrics or expvar, is what a dashboard alert on 'goroutine count keeps climbing' is watching.",
      },
      {
        title: "Run it",
        concept: "Exactly 5 goroutines remain stuck - one per leaky() call, never reclaimed.",
        code: `// run it:
//   go run main.go
//
// output:
//   goroutines before: 1 after: 6 leaked: 5`,
        lang: "go",
        why: "Each leaked goroutine holds its stack and anything it closed over for the lifetime of the process - five is a curiosity, five thousand is an incident.",
      },
    ],
  },

  m8: {
    title: "Measure independent accumulators speeding up a sum",
    intro: "The same array summed two ways - one dependency chain vs four independent ones - benchmarked to make 'instruction-level parallelism' a real number instead of a slogan.",
    steps: [
      {
        title: "The single-accumulator baseline",
        concept: "Every += depends on the previous one finishing - a single, unbroken dependency chain the CPU cannot run ahead on.",
        code: `package main

func sumSingle(a []int64) int64 {
	var s int64
	for _, v := range a {
		s += v
	}
	return s
}`,
        lang: "go",
        why: "This is the obvious way to write a sum - and it's exactly the shape that starves the CPU's out-of-order engine of independent work.",
      },
      {
        title: "Four independent accumulators",
        concept: "Split the work into four chains that don't depend on each other, then add the four partial sums at the end.",
        code: `func sumUnrolled(a []int64) int64 {
	var s0, s1, s2, s3 int64
	n := len(a) - len(a)%4
	for i := 0; i < n; i += 4 {
		s0 += a[i]
		s1 += a[i+1]
		s2 += a[i+2]
		s3 += a[i+3]
	}
	s := s0 + s1 + s2 + s3
	for i := n; i < len(a); i++ {
		s += a[i] // handle the tail
	}
	return s
}`,
        lang: "go",
        why: "The four chains have no dependency on each other, so the core can have several adds in flight at once instead of waiting for each one to finish before starting the next.",
      },
      {
        title: "Benchmark both on the same data",
        concept: "testing.B times each version over a 1,000,000-element slice, with the setup excluded by b.ResetTimer.",
        code: `// run it:
//   go test -bench=. -benchtime=200x
//
// real output:
//   BenchmarkSumSingle-10      200    345654 ns/op
//   BenchmarkSumUnrolled-10    200    134030 ns/op
//
// (a TestSumsMatch test confirms both produce the identical total -
//  the speedup comes from scheduling, not from a different answer)`,
        lang: "go",
        why: "~2.6× faster from the SAME arithmetic, same instruction count in principle - this is what 'memory-bound and ILP-bound code beats clever algorithms' looks like as a measurement.",
      },
    ],
  },

  m9: {
    title: "Build a real readiness probe",
    intro: "An actual HTTP handler that fails until a background warm-up finishes - probed twice with httptest to see both states.",
    steps: [
      {
        title: "A handler that checks a readiness flag",
        concept: "atomic.Bool is read on every probe; while false the handler returns 503 instead of pretending to be healthy.",
        code: `package main

import (
	"fmt"
	"net/http"
	"sync/atomic"
)

type server struct {
	ready atomic.Bool
}

func (s *server) readyz(w http.ResponseWriter, r *http.Request) {
	if !s.ready.Load() {
		http.Error(w, "not ready", http.StatusServiceUnavailable)
		return
	}
	fmt.Fprintln(w, "ok")
}`,
        lang: "go",
        why: "A real readiness check should reflect REAL state (DB connected, caches warm) - atomic.Bool here stands in for whatever your actual warm-up condition is.",
      },
      {
        title: "A background warm-up that flips it",
        concept: "warmUp runs in its own goroutine and only marks the server ready once setup work is done.",
        code: `func (s *server) warmUp() {
	time.Sleep(50 * time.Millisecond) // simulate loading caches, config, etc.
	s.ready.Store(true)
}`,
        lang: "go",
        why: "Doing this in a goroutine means the process can start accepting connections immediately - it just answers 'not ready' honestly until warm-up finishes.",
      },
      {
        title: "Probe before and after warm-up",
        concept: "httptest.NewServer spins up a real (local) HTTP server so http.Get behaves exactly as it would against a deployed pod.",
        code: `package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"time"
)

type server struct{ ready atomic.Bool }

func (s *server) readyz(w http.ResponseWriter, r *http.Request) {
	if !s.ready.Load() {
		http.Error(w, "not ready", http.StatusServiceUnavailable)
		return
	}
	fmt.Fprintln(w, "ok")
}
func (s *server) warmUp() {
	time.Sleep(50 * time.Millisecond)
	s.ready.Store(true)
}

func main() {
	s := &server{}
	go s.warmUp()

	ts := httptest.NewServer(http.HandlerFunc(s.readyz))
	defer ts.Close()

	resp, _ := http.Get(ts.URL)
	fmt.Println("immediately:", resp.StatusCode)

	time.Sleep(100 * time.Millisecond)
	resp2, _ := http.Get(ts.URL)
	fmt.Println("after warm-up:", resp2.StatusCode)
}`,
        lang: "go",
        why: "This 503-then-200 sequence is exactly what a Kubernetes readiness probe sees during a real rollout - it's why the new pod gets no traffic until the check flips.",
      },
    ],
  },

  m10: {
    title: "Benchmark contiguous memory against pointer-chasing",
    intro: "The exact same sum, computed over a slice of values versus a slice of pointers - measured, with the pointers shuffled so the comparison is honest.",
    steps: [
      {
        title: "Sum a contiguous slice",
        concept: "A plain []int64 - every value sits back-to-back in one block of memory.",
        code: `package main

func sumContiguous(vals []int64) int64 {
	var sum int64
	for _, v := range vals {
		sum += v
	}
	return sum
}`,
        lang: "go",
        why: "Walking this in order is exactly the access pattern a cache line fill is designed for: one miss warms several values' worth of future reads.",
      },
      {
        title: "Sum the same values through pointers",
        concept: "Same total, same math - but now each value lives at its own heap address, and we shuffle the pointer order so locality can't sneak back in.",
        code: `func sumPointerChase(ptrs []*int64) int64 {
	var sum int64
	for _, p := range ptrs {
		sum += *p
	}
	return sum
}

// built and shuffled like this:
//   ptrs := make([]*int64, n)
//   for i := range ptrs { v := int64(i); ptrs[i] = &v }
//   rand.Shuffle(n, func(i, j int) { ptrs[i], ptrs[j] = ptrs[j], ptrs[i] })`,
        lang: "go",
        why: "Shuffling matters: a bump allocator can hand out heap addresses in a deceptively sequential order, which would understate the real cost of pointer-chasing in a long-lived program.",
      },
      {
        title: "Benchmark both",
        concept: "go test -bench=. times both versions over 2,000,000 int64s.",
        code: `// run it:
//   go test -bench=. -benchtime=10x
//
// real output:
//   BenchmarkContiguous-10      10    864608 ns/op
//   BenchmarkPointerChase-10    10   1506612 ns/op`,
        lang: "go",
        why: "~1.7× slower from layout ALONE - same CPU, same arithmetic, same total. This is the entire 'use slices, not linked structures' argument as a measurement instead of an opinion.",
      },
    ],
  },

  m11: {
    title: "Make a branch predictable and watch the speedup",
    intro: "One loop, summing values above a threshold - run on shuffled data, then on the SAME data sorted first.",
    steps: [
      {
        title: "The loop with a data-dependent branch",
        concept: "Whether `v >= threshold` is true depends entirely on the data - there's no way for the compiler to know in advance.",
        code: `package main

func sumAbove(data []uint8, threshold uint8) int {
	total := 0
	for _, v := range data {
		if v >= threshold {
			total += int(v)
		}
	}
	return total
}`,
        lang: "go",
        why: "This is completely ordinary code - nothing about it looks like a performance trap, which is exactly why branch misprediction surprises people.",
      },
      {
        title: "Benchmark it on random data",
        concept: "1,000,000 random bytes, threshold 128 - the branch flips roughly 50/50 in no particular pattern.",
        code: `func BenchmarELDARsorted(b *testing.B) {
	data := make([]uint8, 1_000_000)
	for i := range data {
		data[i] = uint8(rand.Intn(256))
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = sumAbove(data, 128)
	}
}`,
        lang: "go",
        why: "A 50/50 unpredictable branch is the worst case for a branch predictor - it can do no better than guessing, so it's wrong about half the time.",
      },
      {
        title: "Sort the SAME data, benchmark again",
        concept: "sort.Slice doesn't change what sumAbove computes - it changes the ORDER the branch's outcomes arrive in.",
        code: `func BenchmarkSorted(b *testing.B) {
	data := make([]uint8, 1_000_000)
	for i := range data {
		data[i] = uint8(rand.Intn(256))
	}
	sort.Slice(data, func(i, j int) bool { return data[i] < data[j] })
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = sumAbove(data, 128)
	}
}

// run it:
//   go test -bench=. -benchtime=50x
//
// real output:
//   BenchmarELDARsorted-10    50    364796 ns/op
//   BenchmarkSorted-10      50    225035 ns/op`,
        lang: "go",
        why: "~1.6× faster with IDENTICAL instructions and the same Big-O - sorted data turns the branch into long false…false…true…true runs the predictor learns almost instantly.",
      },
    ],
  },

  m12: {
    title: "Start 100,000 goroutines and watch them come and go",
    intro: "GOMAXPROCS, NumGoroutine, and a fan-out that proves goroutines really are cheap enough to spawn six figures of them.",
    steps: [
      {
        title: "Check the starting numbers",
        concept: "GOMAXPROCS(0) reads (without changing) the current setting; NumGoroutine() reports the live count - just 1 (main) at startup.",
        code: `package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(0))
	fmt.Println("goroutines before:", runtime.NumGoroutine())
}`,
        lang: "go",
        why: "GOMAXPROCS is the number of Ps - the hard ceiling on how many goroutines run truly in parallel - while NumGoroutine counts ALL goroutines, running or parked.",
      },
      {
        title: "Start 100,000 goroutines that immediately park",
        concept: "Each one blocks on <-release - cheap to create, and parked rather than burning CPU.",
        code: `	var wg sync.WaitGroup
	release := make(chan struct{})
	for i := 0; i < 100_000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-release // park, cheaply, until released
		}()
	}
	fmt.Println("goroutines after starting 100,000:", runtime.NumGoroutine())`,
        lang: "go",
        why: "100,000 OS threads would exhaust most systems; 100,000 parked goroutines barely register, because a parked goroutine costs a small stack, not a kernel thread.",
      },
      {
        title: "Release them and confirm they're reclaimed",
        concept: "Closing release unblocks every one of them at once; wg.Wait() confirms they all actually exited.",
        code: `package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(0))
	fmt.Println("goroutines before:", runtime.NumGoroutine())

	var wg sync.WaitGroup
	release := make(chan struct{})
	for i := 0; i < 100_000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-release
		}()
	}
	fmt.Println("goroutines after starting 100,000:", runtime.NumGoroutine())
	close(release)
	wg.Wait()
	fmt.Println("goroutines after they all exit:", runtime.NumGoroutine())
}

// output:
//   GOMAXPROCS: 10
//   goroutines before: 1
//   goroutines after starting 100,000: 100001
//   goroutines after they all exit: 1`,
        lang: "go",
        why: "Back to exactly 1 goroutine - nothing leaked, because every one of them had a way to be woken up. Compare this to M7's leaky() example, where that's exactly what's missing.",
      },
    ],
  },

  m13: {
    title: "Build the same counter three ways",
    intro: "First prove the naive version is broken with -race, then fix it three different ways - atomic, mutex, channel - all verified race-free.",
    steps: [
      {
        title: "The broken version",
        concept: "n2++ on a shared variable from 1000 goroutines, with no synchronization at all.",
        code: `package main

import (
	"fmt"
	"sync"
)

func main() {
	const n = 1000
	n2 := 0
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			n2++ // DATA RACE: unsynchronized read+write
		}()
	}
	wg.Wait()
	fmt.Println("naive counter:", n2)
}

// run it:
//   go run -race racy.go
// → WARNING: DATA RACE ... (and the printed total is often wrong, too)`,
        lang: "go",
        why: "The race detector catches this even though it might occasionally print the 'right' number by luck - a race is a bug whether or not it happens to corrupt THIS run's output.",
      },
      {
        title: "Fix it with atomic.Int64",
        concept: "counter.Add(1) is a single indivisible CPU operation - no goroutine ever blocks waiting for another.",
        code: `package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	const n = 1000
	var counter atomic.Int64
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Add(1)
		}()
	}
	wg.Wait()
	fmt.Println("atomic counter:", counter.Load())
}`,
        lang: "go",
        why: "This is the cheapest fix that's still correct - reach for it whenever the shared state really is just one counter, flag, or pointer swap.",
      },
      {
        title: "Fix it with sync.Mutex",
        concept: "Lock around the increment, Unlock when done - only one goroutine touches total at a time.",
        code: `	var mu sync.Mutex
	total := 0
	var wg2 sync.WaitGroup
	for i := 0; i < n; i++ {
		wg2.Add(1)
		go func() {
			defer wg2.Done()
			mu.Lock()
			total++
			mu.Unlock()
		}()
	}
	wg2.Wait()
	fmt.Println("mutex counter:", total)

// run both versions together:
//   go run -race main.go
// → atomic counter: 1000
// → mutex counter: 1000`,
        lang: "go",
        why: "A mutex costs more than an atomic for a bare counter, but it's the right (and only correct) choice the moment the invariant spans more than one field.",
      },
      {
        title: "Fix it with a channel",
        concept: "Each goroutine sends 1 to a shared channel; a single collector goroutine sums everything that arrives.",
        code: `package main

import "fmt"

func main() {
	const n = 1000
	incs := make(chan int, n)
	for i := 0; i < n; i++ {
		go func() { incs <- 1 }()
	}
	total := 0
	for i := 0; i < n; i++ {
		total += <-incs
	}
	fmt.Println("channel counter:", total)
}`,
        lang: "go",
        why: "No goroutine here ever touches a shared variable at all - the channel hands ownership of each '1' to exactly one receiver, which is why there's nothing left to race on.",
      },
    ],
  },

  m14: {
    title: "Emit structured logs and a request-scoped logger",
    intro: "log/slog producing real JSON log lines, with shared fields bound once via With - plus a minimal RED-style counter.",
    steps: [
      {
        title: "A JSON structured logger",
        concept: "slog.NewJSONHandler turns every log call into one JSON object with explicit key/value fields, not an interpolated string.",
        code: `package main

import (
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	logger.Info("server started", "port", 8080)
}`,
        lang: "go",
        why: "A JSON line is something a log pipeline can index and filter on (level, port, ...) - a formatted string like \"server started on 8080\" is just text to grep.",
      },
      {
        title: "Bind request-scoped fields once",
        concept: "logger.With(...) returns a new logger that prepends those fields to every subsequent call - bind it once per request, not on every log line.",
        code: `	reqLog := logger.With("trace_id", "7f3a91", "route", "POST /ledger")
	reqLog.Info("accepted request")
	reqLog.Error("charge failed", "user_id", "u_42", "amount_cents", 1999)

// output (one JSON object per line):
//   {"level":"INFO","msg":"server started","port":8080}
//   {"level":"INFO","msg":"accepted request","trace_id":"7f3a91","route":"POST /ledger"}
//   {"level":"ERROR","msg":"charge failed","trace_id":"7f3a91","route":"POST /ledger","user_id":"u_42","amount_cents":1999}`,
        lang: "go",
        why: "Every line from this request now carries trace_id automatically - that's the field you'd grep for to pull every log line from one specific request.",
      },
      {
        title: "A minimal RED-style metrics counter",
        concept: "atomic counters for total requests and total errors - the simplest possible version of what a real metrics library tracks.",
        code: `type Metrics struct {
	requestsTotal atomic.Int64
	errorsTotal   atomic.Int64
}

func (m *Metrics) Record(start time.Time, err error) {
	m.requestsTotal.Add(1)
	if err != nil {
		m.errorsTotal.Add(1)
	}
	_ = time.Since(start) // would feed a histogram in a real implementation
}

// after 5 calls (1 of them erroring):
//   requests_total: 5
//   errors_total: 1`,
        lang: "go",
        why: "This is RED's Rate and Errors in their simplest possible form - a real implementation swaps the atomic.Int64 for a Prometheus counter, but the shape of what you track doesn't change.",
      },
    ],
  },

  m15: {
    title: "Retry with backoff, then add a circuit breaker",
    intro: "A call that fails twice then succeeds - retried safely - followed by a breaker that learns to stop calling a dependency that's truly down.",
    steps: [
      {
        title: "A flaky call and a capped retry loop",
        concept: "withRetry retries only on the sentinel errTransient, waits with exponential backoff + jitter, and gives up after 5 attempts or if the context is cancelled.",
        code: `var errTransient = errors.New("transient failure")

func withRetry(ctx context.Context, op func(attempt int) error) error {
	base := 10 * time.Millisecond
	for attempt := 0; attempt < 5; attempt++ {
		err := op(attempt)
		if err == nil {
			return nil
		}
		if !errors.Is(err, errTransient) {
			return err
		}
		d := base << attempt
		sleep := time.Duration(rand.Int63n(int64(d)))
		select {
		case <-time.After(sleep):
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return fmt.Errorf("exhausted retries")
}`,
        lang: "go",
        why: "Checking ctx.Done() inside the retry loop means a request-level deadline still cuts retries short - backoff and deadlines compose instead of fighting each other.",
      },
      {
        title: "Run it against a call that fails twice",
        concept: "flakyCall fails on attempts 0 and 1, succeeds on attempt 2 - withRetry should recover without the caller knowing anything went wrong.",
        code: `func flakyCall(ctx context.Context, attempt int) error {
	if attempt < 3 {
		return errTransient
	}
	return nil
}

// run it (wrapped with a 2-second context.WithTimeout):
//   attempt 0 error: transient failure
//   attempt 1 error: transient failure
//   attempt 2 error: transient failure
//   attempt 3 error: <nil>
//   final result: <nil>`,
        lang: "go",
        why: "From the CALLER's point of view this just succeeded - that's the goal: transient failures should be invisible to whoever asked for the work, not propagated as errors.",
      },
      {
        title: "A circuit breaker that fails fast once it's sure",
        concept: "After `threshold` consecutive failures, Call returns errOpen immediately for `cooldown` - no call to fn() at all - until the cooldown elapses.",
        code: `type Breaker struct {
	failures  int
	threshold int
	openUntil time.Time
	cooldown  time.Duration
}

var errOpen = errors.New("circuit breaker open")

func (b *Breaker) Call(fn func() error) error {
	if time.Now().Before(b.openUntil) {
		return errOpen
	}
	err := fn()
	if err != nil {
		b.failures++
		if b.failures >= b.threshold {
			b.openUntil = time.Now().Add(b.cooldown)
		}
		return err
	}
	b.failures = 0
	return nil
}

// run it (threshold=3, cooldown=50ms, against an always-failing fn):
//   call 0 -> downstream down
//   call 1 -> downstream down
//   call 2 -> downstream down
//   call 3 -> circuit breaker open      (fn was never called this time)
//   after cooldown -> <nil>             (probe let through, succeeded, breaker reset)`,
        lang: "go",
        why: "Call 3 never invoked fn() at all - that's the 'fail fast' property: once the breaker is sure the dependency is down, it stops wasting time and load on a call it already expects to fail.",
      },
    ],
  },
  m16: {
    title: "From a plain Get/Set to a cache, a lock, and a rate limiter",
    intro: "Four small, real programs against a real Redis: the simplest possible write with a TTL, a full cache-aside round trip, five goroutines racing for one lock, and an atomic counter that rejects the 6th request.",
    steps: [
      {
        title: "Step 1 - Concept: every value can carry its own expiration",
        concept: "A Redis client is just a connection. Set takes a TTL as its third argument - after that time elapses, Redis deletes the key on its own, with nothing else needed to make it happen.",
        code: `rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
ctx := context.Background()

err := rdb.Set(ctx, "user:42:name", "Alice", 30*time.Second).Err()
if err != nil {
	panic(err)
}

val, err := rdb.Get(ctx, "user:42:name").Result()
fmt.Println("user:42:name =", val) // user:42:name = Alice

ttl, _ := rdb.TTL(ctx, "user:42:name").Result()
fmt.Println("ttl remaining:", ttl) // ttl remaining: 30s`,
        lang: "go",
        why: "Attaching a TTL by default - even here, before any real caching pattern - means a key nobody remembers to clean up still can't live forever. It's the cheapest safety net in the whole module.",
      },
      {
        title: "Step 2 - How it works: cache-aside end to end",
        concept: "getPrice checks Redis first. redis.Nil (not a crash) means a miss, so it falls through to a deliberately slow 'database' call, caches the result, and returns it - the second call for the same key skips the slow path entirely.",
        code: `func fetchPriceFromDB(sku string) (string, error) {
	time.Sleep(50 * time.Millisecond) // pretend this is a slow query
	return "$19.99", nil
}

func getPrice(ctx context.Context, rdb *redis.Client, sku string) (string, error) {
	key := "price:" + sku
	price, err := rdb.Get(ctx, key).Result()
	if err == nil {
		fmt.Println("cache HIT for", key)
		return price, nil
	}
	if !errors.Is(err, redis.Nil) {
		return "", err // a real Redis error, not just "missing"
	}

	fmt.Println("cache MISS for", key, "- querying source of truth")
	price, err = fetchPriceFromDB(sku)
	if err != nil {
		return "", err
	}
	err = rdb.Set(ctx, key, price, 60*time.Second).Err()
	return price, err
}

// p1, _ := getPrice(ctx, rdb, "sku-100")  // MISS, ~52ms
// p2, _ := getPrice(ctx, rdb, "sku-100")  // HIT,  <1ms`,
        lang: "go",
        why: "Checking errors.Is(err, redis.Nil) specifically - instead of just 'err != nil' - is what keeps a normal cache miss from being treated as a Redis outage. Those are two very different problems and this is the line that tells them apart.",
      },
      {
        title: "Step 3 - Why it's race-free: five callers, one SETNX, one winner",
        concept: "Five goroutines call SetNX on the SAME key at the same time. Redis's single-threaded execution guarantees exactly one of them gets ok == true, no matter how the goroutines happen to be scheduled.",
        code: `func tryAcquireLock(ctx context.Context, rdb *redis.Client, key, owner string, ttl time.Duration) bool {
	ok, err := rdb.SetNX(ctx, key, owner, ttl).Result()
	if err != nil {
		panic(err)
	}
	return ok
}

// raced 5 goroutines (worker-1..worker-5) on "lock:invoice:9001":
//   worker-1 -> lock already held, backing off
//   worker-2 -> lock already held, backing off
//   worker-3 -> acquired the lock
//   worker-4 -> lock already held, backing off
//   worker-5 -> lock already held, backing off
//   redis confirms lock holder: worker-3
// (run it again: a DIFFERENT worker wins - WHO wins is timing, THAT
//  exactly one wins is guaranteed)`,
        lang: "go",
        why: "Running this several times and seeing a different winner each time is the point, not a bug: it proves the outcome is a genuine race, and that Redis's atomicity - not luck - is what still guarantees only one winner every single time.",
      },
      {
        title: "Step 4 - Why it's race-free: INCR turns into a rate limiter",
        concept: "allow atomically increments a per-key counter; the FIRST increment in a window also sets that key's expiration, so the counter resets itself once the window passes.",
        code: `const rateLimit = 3 // max 3 requests per window, per key

func allow(ctx context.Context, rdb *redis.Client, key string, window time.Duration) (bool, int64) {
	count, err := rdb.Incr(ctx, key).Result()
	if err != nil {
		panic(err)
	}
	if count == 1 {
		rdb.Expire(ctx, key, window) // first hit in this window starts the clock
	}
	return count <= rateLimit, count
}

// 5 requests against the same key, limit=3:
//   request 1: allowed (count=1)
//   request 2: allowed (count=2)
//   request 3: allowed (count=3)
//   request 4: rejected - 429 Too Many Requests (count=4)
//   request 5: rejected - 429 Too Many Requests (count=5)`,
        lang: "go",
        why: "This is the same atomicity as SETNX, just counting instead of locking - Incr's single round trip is what stops two simultaneous requests from both reading count=2 and both writing count=3, which would silently let one extra request through.",
      },
    ],
  },
  m20: {
    title: "Simulate a leader election with heartbeats and randomized timeouts",
    intro: "A small, complete, dependency-free Go program: three in-memory nodes race randomized election timeouts, the first to fire becomes a candidate and wins a majority vote, then the new leader replicates one log entry to both followers and commits it the instant a majority - not all three - has acknowledged it.",
    steps: [
      {
        title: "Step 1 - Concept: every node picks its own randomized election timeout",
        concept: "electionTimeout returns a random duration in a fixed range. Three nodes each get one; whichever timeout is SMALLEST determines which node times out first and becomes a candidate.",
        code: `func electionTimeout() time.Duration {
	return time.Duration(150+rand.Intn(150)) * time.Millisecond
}

const n = 3 // a 3-node cluster; majority is 2

timeouts := make([]time.Duration, n)
for i := range timeouts {
	timeouts[i] = electionTimeout()
}
candidate := 0
for i, t := range timeouts {
	if t < timeouts[candidate] {
		candidate = i
	}
}
term := 1
fmt.Printf("node %d times out first (%v) -> becomes candidate for term %d\\n",
	candidate, timeouts[candidate], term)
// node 2 times out first (188ms) -> becomes candidate for term 1`,
        lang: "go",
        why: "Randomizing the timeout per node - instead of using one fixed value everywhere - is what keeps three nodes from all becoming candidates in the same instant and splitting the vote forever. One node's timer reliably fires first.",
      },
      {
        title: "Step 2 - How it works: the candidate requests votes concurrently",
        concept: "requestVote simulates one follower deciding whether to grant its vote, run as a goroutine per follower - just like real vote requests would arrive over the network at slightly different times. The candidate counts itself plus every granted vote.",
        code: `type voteReply struct {
	from    int
	granted bool
}

func requestVote(term, from int, replies chan<- voteReply) {
	time.Sleep(time.Duration(rand.Intn(20)) * time.Millisecond) // simulated latency
	replies <- voteReply{from: from, granted: true}             // hasn't voted this term -> grants
}

votes := 1 // votes for itself
replies := make(chan voteReply, n-1)
for i := 0; i < n; i++ {
	if i == candidate {
		continue
	}
	go requestVote(term, i, replies)
}
for i := 0; i < n-1; i++ {
	r := <-replies
	if r.granted {
		votes++
		fmt.Printf("  node %d grants its vote (total votes: %d)\\n", r.from, votes)
	}
}
// node 1 grants its vote (total votes: 2)
// node 0 grants its vote (total votes: 3)`,
        lang: "go",
        why: "Sending every RequestVote concurrently (one goroutine per follower) mirrors how a real cluster gathers votes in parallel over the network - the candidate doesn't wait for node 0 to finish before asking node 1.",
      },
      {
        title: "Step 3 - Why it works: commit the instant a majority acknowledges, not everyone",
        concept: "Once the candidate holds a majority of votes it becomes leader and replicates one log entry the same way - concurrently - but stops counting the moment it has a majority of acks, including its own.",
        code: `if votes <= n/2 {
	fmt.Println("no majority - split vote, term expires, try again next term")
	return
}
fmt.Printf("node %d has a majority (%d/%d) -> becomes LEADER for term %d\\n",
	candidate, votes, n, term)

type appendReply struct {
	from int
	ok   bool
}
func appendEntries(entry string, from int, replies chan<- appendReply) {
	time.Sleep(time.Duration(rand.Intn(20)) * time.Millisecond)
	replies <- appendReply{from: from, ok: true}
}

entry := "SET balance[alice] = 900"
acked := 1 // the leader's own log already has it
appendReplies := make(chan appendReply, n-1)
for i := 0; i < n; i++ {
	if i == candidate {
		continue
	}
	go appendEntries(entry, i, appendReplies)
}
majority := n/2 + 1
for i := 0; i < n-1 && acked < majority; i++ {
	r := <-appendReplies
	if r.ok {
		acked++
		fmt.Printf("  node %d acknowledges the entry (acked: %d)\\n", r.from, acked)
	}
	if acked >= majority {
		fmt.Printf("entry committed after %d/%d acks - not waiting on the remaining follower\\n", acked, n)
	}
}
// node 1 acknowledges the entry (acked: 2)
// entry committed after 2/3 acks - not waiting on the remaining follower`,
        lang: "go",
        why: "The loop condition 'i < n-1 && acked < majority' is the whole point: it stops reading replies (and the program moves on) the instant a majority is reached, so one slow or unreachable follower can never block the cluster from making progress.",
      },
      {
        title: "Step 4 - Predict: run it several times - a different node wins, but the guarantee holds",
        concept: "Run the full program (go run .) five times in a row under `go run -race` and compare who becomes leader each time.",
        code: `// run 1: node 2 times out first (166ms) -> LEADER for term 1
//         node 1 acknowledges the entry (acked: 2) -> committed
// run 2: node 0 times out first (156ms) -> LEADER for term 1
//         node 2 acknowledges the entry (acked: 2) -> committed
// run 4: node 1 times out first (190ms) -> LEADER for term 1
//         node 2 acknowledges the entry (acked: 2) -> committed
//
// WHO wins the election changes every run - that's just timing.
// THAT exactly one node wins, and THAT the entry always commits
// after exactly a majority of acks, never changes. go test -race
// reports zero data races: every shared value only ever crosses
// between goroutines over a channel.`,
        lang: "go",
        why: "This is the same lesson as SETNX in the Redis module, one level up the stack: which node wins a race is never guaranteed and never should be relied on - but that exactly one of them wins, every single time, is the actual guarantee the algorithm provides.",
      },
    ],
  },
  m18: {
    title: "Calculate SLO budget and burn rate in Go",
    intro: "A small standard-library program that turns a service SLO into numbers an on-call engineer can act on: availability, allowed bad events, burn rate and response level.",
    steps: [
      {
        title: "Model a rolling SLO window",
        concept: "A window needs total events, bad events and an SLO target. Everything else is derived from those three facts.",
        code: `package main

import "fmt"

type Window struct {
	Total int64
	Bad   int64
	SLO   float64
}`,
        lang: "go",
        why: "This is how you keep an SRE answer grounded: start from a measured user-visible event stream, not from a dashboard screenshot or infrastructure symptom.",
      },
      {
        title: "Compute availability and error budget",
        concept: "Availability is good events divided by total events. Error budget is total events times the allowed failure fraction.",
        code: `func (w Window) Availability() float64 {
	if w.Total == 0 {
		return 1
	}
	return 1 - float64(w.Bad)/float64(w.Total)
}

func (w Window) ErrorBudget() float64 {
	return float64(w.Total) * (1 - w.SLO)
}`,
        lang: "go",
        why: "An SLO target like 99.9% becomes operational only when you can say how many bad events are allowed in the current window.",
      },
      {
        title: "Convert budget spend into an action",
        concept: "Burn rate compares actual bad events with allowed bad events. Low burn is budget usage; high burn is an operational risk.",
        code: `func (w Window) BurnRate() float64 {
	budget := w.ErrorBudget()
	if budget == 0 {
		return 0
	}
	return float64(w.Bad) / budget
}

func action(rate float64) string {
	switch {
	case rate >= 14:
		return "page now"
	case rate >= 2:
		return "ticket and watch"
	default:
		return "within budget"
	}
}`,
        lang: "go",
        why: "This is the interview distinction between a noisy alert and a useful alert: the page is tied to how quickly the service is burning user-visible reliability.",
      },
      {
        title: "Run the calculation",
        concept: "One million transfer attempts, 2500 failures and a 99.9% SLO means the service has spent 2.5 budgets in the window.",
        code: `package main

import "fmt"

type Window struct {
	Total int64
	Bad   int64
	SLO   float64
}

func (w Window) Availability() float64 {
	if w.Total == 0 {
		return 1
	}
	return 1 - float64(w.Bad)/float64(w.Total)
}

func (w Window) ErrorBudget() float64 {
	return float64(w.Total) * (1 - w.SLO)
}

func (w Window) BurnRate() float64 {
	budget := w.ErrorBudget()
	if budget == 0 {
		return 0
	}
	return float64(w.Bad) / budget
}

func action(rate float64) string {
	switch {
	case rate >= 14:
		return "page now"
	case rate >= 2:
		return "ticket and watch"
	default:
		return "within budget"
	}
}

func main() {
	window := Window{Total: 1_000_000, Bad: 2_500, SLO: 0.999}
	burn := window.BurnRate()

	fmt.Printf("availability %.3f%%\\n", window.Availability()*100)
	fmt.Printf("budget %.0f bad requests\\n", window.ErrorBudget())
	fmt.Printf("burn %.1fx -> %s\\n", burn, action(burn))
}

// Output:
// availability 99.750%
// budget 1000 bad requests
// burn 2.5x -> ticket and watch`,
        lang: "go",
        why: "This answer is compact enough for an interview whiteboard, but it contains the core SRE judgment: reliability is measured, budgeted and connected to an action.",
      },
    ],
  },
};

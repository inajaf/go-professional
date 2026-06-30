/* =====================================================================
   COURSE DATA
   Production Syllabus: Hardcore Go & Distributed Systems Engineering
   (Go 1.26+ & the 2026–2030 Horizon) + a Go Foundations & Tooling track.
   ---------------------------------------------------------------------
   Plain global object so the file works over file:// without ES modules.
   ===================================================================== */

const COURSE_META = {
  title: "Hardcore Go & Distributed Systems Engineering",
  subtitle: "Beginner Foundations → Senior / Staff / Principal",
  tagline:
    "Start with the Go runtime fundamentals — the garbage collector, pprof, testing, concurrency — then build a zero-dependency, post-quantum-secure Distributed Financial Ledger on Go 1.24–1.26.",
  target: "go 1.26 (strictly enforced via CI)",
  capstone: "Distributed Financial Ledger",
};

const PARTS = [
  {
    id: "part-0",
    label: "Foundations",
    title: "Go Runtime Foundations & Tooling",
    level: "Beginner → Mid-Level",
    modules: ["f1", "f2", "f3", "f4", "f5"],
  },
  {
    id: "part-1",
    label: "Part 1",
    title: "Foundations of Modern Idiomatic Go",
    level: "Mid-Level Transition",
    modules: ["m1", "m2"],
  },
  {
    id: "part-2",
    label: "Part 2",
    title: "Advanced Concurrency & Systems Control",
    level: "Senior Level",
    modules: ["m3", "m4", "m5"],
  },
  {
    id: "part-3",
    label: "Part 3",
    title: "Distributed Architectures & Hardware Sympathy",
    level: "Staff / Principal Level",
    modules: ["m6", "m7", "m8", "m9"],
  },
];

const MODULES = [
  /* ================================================================= F1 */
  {
    id: "f1",
    code: "F1",
    num: 1,
    part: "part-0",
    title: "How Go's Garbage Collector Works",
    short: "Garbage Collector",
    level: "Beginner",
    duration: "2–3 hrs",
    icon: "recycle",
    summary:
      "Demystify automatic memory management: the concurrent tri-color mark-and-sweep collector, what GOGC and GOMEMLIMIT actually do, and how to cut GC pressure.",
    plain:
      "Think of the garbage collector (GC) as an automatic janitor for memory. In a language like C you must manually free() everything you allocate. In Go you simply stop using a value and the GC reclaims it for you — while your program keeps running. It does this by repeatedly asking one question: 'starting from what is definitely live right now (global variables and the goroutine stacks), which objects can I still reach by following pointers?' Anything it can no longer reach is garbage, and its memory is given back.",
    animation: {
      id: "gc-mark-sweep",
      title: "Tri-Color Mark & Sweep",
      blurb:
        "Watch the collector start at the roots, paint reachable objects grey then black, and sweep away everything left white — all while the program keeps running.",
    },
    concepts: [
      {
        title: "Tri-color mark & sweep, in pictures",
        body:
          "The GC mentally colours every object white (not yet seen), grey (reachable, but its pointers aren't scanned yet) or black (reachable and fully scanned). It greys the roots, then keeps scanning greys to black — greying their children as it goes. When no grey objects remain, anything still white is unreachable and gets swept (freed).",
        code: `// Conceptually, every GC cycle is:
//   1. white = all objects
//   2. grey  = roots (globals + goroutine stacks)
//   3. while grey not empty:
//        pick a grey object, scan its pointers,
//        grey any white children, mark it black
//   4. sweep: every object still white is freed
//
// You never write this — the runtime does it concurrently.`,
        lang: "go",
      },
      {
        title: "It runs concurrently (tiny pauses)",
        body:
          "Go's GC runs at the same time as your goroutines, so 'stop-the-world' pauses are usually sub-millisecond. Because your code can change pointers mid-scan, a write barrier quietly records new pointers so the collector never loses track of a live object.",
        code: `// You don't call the GC. It triggers itself based on heap growth.
// To SEE it happen, run with a debug flag:
//   GODEBUG=gctrace=1 go run .
//
// each cycle prints a line like:
// gc 7 @0.412s 1%: 0.021+0.45+0.004 ms clock, ...
//        ^cycle  ^%CPU  ^STW + concurrent + STW pause times`,
        lang: "go",
      },
      {
        title: "GOGC — the speed/memory dial",
        body:
          "GOGC (default 100) controls how much the heap may grow before the next collection. 100 means 'let the live heap double before collecting again'. Raise it to spend more memory for fewer GCs (more throughput); lower it to use less memory at the cost of more CPU.",
        code: `import "runtime/debug"

// Default: collect when heap doubles.
//   GOGC=100  (env var) == debug.SetGCPercent(100)

// Fewer, larger collections — trade memory for CPU:
debug.SetGCPercent(200)

// Disable entirely (rare; only with GOMEMLIMIT set):
//   GOGC=off`,
        lang: "go",
      },
      {
        title: "GOMEMLIMIT — the soft memory cap",
        body:
          "GOMEMLIMIT (Go 1.19+) tells the runtime a total memory budget. As you approach it the GC runs more aggressively, which prevents the dreaded out-of-memory (OOM) kill in containers. It's a soft limit: the runtime will work hard to stay under it.",
        code: `import "runtime/debug"

// Cap the runtime's memory footprint at 512 MiB.
debug.SetMemoryLimit(512 << 20) // == GOMEMLIMIT=512MiB

// Common container pattern: a memory limit + generous GOGC,
// letting the limit (not GOGC) drive collection near the ceiling.`,
        lang: "go",
      },
      {
        title: "Observing & reducing GC work",
        body:
          "Measure before tuning: GODEBUG=gctrace=1 prints a line per cycle, and runtime.ReadMemStats / the runtime/metrics package expose live numbers for dashboards. The cheapest GC work is the allocation you never make — reuse buffers, prefer values over pointers, and preallocate slices with a capacity.",
        code: `var stats runtime.MemStats
runtime.ReadMemStats(&stats)
fmt.Println("heap in use:", stats.HeapInuse, "GCs:", stats.NumGC)

// Reuse short-lived buffers instead of reallocating:
var bufPool = sync.Pool{New: func() any { return new(bytes.Buffer) }}
b := bufPool.Get().(*bytes.Buffer)
b.Reset(); defer bufPool.Put(b)`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Paste a real gctrace line into an LLM and have it decode every field, then ask it to predict how the numbers change if you double GOGC.",
      prompt:
        "Here is a GODEBUG=gctrace=1 line from my Go service: <paste>. Explain each field (cycle number, %CPU, the three pause/phase times, heap sizes). Then tell me what likely changes if I set GOGC=200, and when that would be a bad idea.",
    },
    practice: {
      title: "Try it yourself",
      body: "Watch the collector work on any tiny Go program.",
      steps: [
        "Write a loop that allocates lots of short-lived slices, then run: GODEBUG=gctrace=1 go run main.go",
        "Re-run with GOGC=400 go run main.go and notice fewer, bigger GC lines.",
        "Add debug.SetMemoryLimit(50<<20) and watch the GC get more aggressive near the cap.",
        "Print runtime.ReadMemStats before and after to see HeapInuse and NumGC.",
      ],
    },
    pitfalls: [
      "Calling runtime.GC() in production 'to be safe' — it forces extra stop-the-world work and almost always hurts throughput.",
      "Cranking GOGC very low to save memory, then being surprised that CPU is pegged by constant collections.",
      "Ignoring GOMEMLIMIT in containers and getting OOM-killed by the orchestrator instead of letting the GC reclaim memory first.",
    ],
    takeaways: [
      "The GC is concurrent: pauses are tiny — throughput (CPU spent collecting) is the real cost.",
      "GOGC trades memory for CPU; GOMEMLIMIT puts a soft ceiling on total memory.",
      "The fastest collection is the allocation you avoided — reuse buffers and preallocate.",
    ],
    checklist: [
      "Can explain white/grey/black and why a write barrier is needed.",
      "Know what GOGC=100 means and how to change it (env + debug.SetGCPercent).",
      "Set GOMEMLIMIT for any containerized service.",
      "Used gctrace and ReadMemStats to observe real GC behaviour.",
    ],
  },

  /* ================================================================= F2 */
  {
    id: "f2",
    code: "F2",
    num: 2,
    part: "part-0",
    title: "Profiling with pprof",
    short: "Profiling (pprof)",
    level: "Beginner",
    duration: "2–3 hrs",
    icon: "activity",
    summary:
      "Stop guessing where your program is slow. Collect CPU, heap, goroutine and mutex profiles, then read them with go tool pprof and flame graphs.",
    plain:
      "A profiler is a fitness tracker for your program. Instead of staring at code wondering what's slow, pprof samples the running program many times per second and tells you exactly which functions burn CPU or hold memory. You then optimize the real hotspot instead of a guess — and most of the time the hotspot is somewhere you didn't expect.",
    animation: {
      id: "pprof-flame",
      title: "CPU Sampling → Flame Graph",
      blurb:
        "See the sampler snapshot the running call stack ~100×/second, watch those samples stack up into a flame graph, and spot the widest box — your hotspot.",
    },
    concepts: [
      {
        title: "The profile types",
        body:
          "Different profiles answer different questions. CPU: where is time spent? Heap: what's holding/allocating memory? Goroutine: how many goroutines and where are they stuck (great for leaks)? Block & mutex: where do goroutines wait on synchronization?",
        code: `// Profile        Answers
// ------------    --------------------------------
// cpu             which functions burn CPU time
// heap            inuse_space / alloc_space by call site
// goroutine       every goroutine's current stack
// block           time blocked on channels / sync
// mutex           lock contention hot spots`,
        lang: "go",
      },
      {
        title: "Collect from a live server (net/http/pprof)",
        body:
          "The easiest way: import net/http/pprof for its side effect and it registers debug endpoints on the default mux. Then pull a 30-second CPU profile from the running process — no redeploy needed.",
        code: `import (
    "net/http"
    _ "net/http/pprof" // registers /debug/pprof/* handlers
)

func main() {
    go http.ListenAndServe("localhost:6060", nil) // admin only!
    // ... your real server ...
}

// Grab a 30s CPU profile from the running process:
//   go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30`,
        lang: "go",
      },
      {
        title: "Collect from tests & benchmarks",
        body:
          "You don't need a server. go test writes profiles straight to files, which is perfect for optimizing a specific function under a benchmark.",
        code: `// Profile a benchmark to files, then open them:
//   go test -bench=BenchmarkValidate -cpuprofile cpu.out -memprofile mem.out
//   go tool pprof cpu.out
//
// Or wrap a chunk of code with runtime/pprof:
f, _ := os.Create("cpu.out")
pprof.StartCPUProfile(f)
defer pprof.StopCPUProfile()`,
        lang: "go",
      },
      {
        title: "Driving go tool pprof",
        body:
          "Inside pprof, top shows the heaviest functions, list <func> annotates the source line-by-line, and web / -http opens an interactive graph and flame graph in the browser. The flame graph is usually where you start.",
        code: `// Interactive web UI with a flame graph (best first stop):
//   go tool pprof -http=:8080 cpu.out
//
// Or the text REPL:
//   (pprof) top10           # heaviest functions
//   (pprof) list parseJSON  # per-line cost inside a function
//   (pprof) peek reflect    # callers/callees of matching funcs`,
        lang: "go",
      },
      {
        title: "Reading a flame graph",
        body:
          "Each box is a function; the box directly above sits inside its caller. Width is proportional to time (or allocations) spent — so the widest boxes are the hotspots. Tall-but-narrow stacks are deep call chains that don't actually cost much. Optimize width, not height.",
        code: `// main ───────────────────────────────────────── 100%
//   handleRequest ─────────────────────────────── 100%
//     parseJSON ───────────────── 50%   <- widest leaf
//       reflectWalk ──────── 40%         === HOTSPOT
//     validate ──── 30%
//     writeLog ── 20%
// Wider == more time. Fix the widest leaf first.`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Export the text profile (go tool pprof -top) and let an LLM rank suspects and suggest concrete fixes for the top frames.",
      prompt:
        "Here is the output of `go tool pprof -top cpu.out`: <paste>. Identify the top 3 hotspots, explain in plain English what each function likely does, and suggest specific Go optimizations (allocation reduction, algorithm, caching) for each — with the trade-offs.",
    },
    practice: {
      title: "Try it yourself",
      body: "Profile a benchmark end-to-end in five minutes.",
      steps: [
        "Write a slow function (e.g. building strings with += in a loop) and a benchmark for it.",
        "Run: go test -bench=. -cpuprofile cpu.out",
        "Open the flame graph: go tool pprof -http=:8080 cpu.out",
        "Find the widest leaf, rewrite that function (e.g. strings.Builder), and re-profile to confirm.",
      ],
    },
    pitfalls: [
      "Profiling a binary built with the race detector (-race) or no optimizations — the numbers are skewed. Profile a normal build.",
      "Chasing a tall, narrow stack in the flame graph — height is call depth, not cost. Optimize the widest boxes.",
      "Leaving net/http/pprof exposed on a public port — it leaks internals. Bind it to localhost or an admin-only listener.",
    ],
    takeaways: [
      "Measure first: profile, find the widest box, optimize that, then re-measure.",
      "CPU profile for speed, heap profile for memory, goroutine profile for leaks.",
      "The web flame graph (`-http`) is the fastest way to see where time goes.",
    ],
    checklist: [
      "Can collect a CPU profile from both a benchmark and a live server.",
      "Comfortable with top, list, and the -http flame graph.",
      "Can read a flame graph: width = cost, stacking = call nesting.",
      "Know which profile type answers which question.",
    ],
  },

  /* ================================================================= F3 */
  {
    id: "f3",
    code: "F3",
    num: 3,
    part: "part-0",
    title: "Writing Tests in Go",
    short: "Writing Tests",
    level: "Beginner",
    duration: "2–3 hrs",
    icon: "flask",
    summary:
      "Go ships testing in the toolchain. Write table-driven tests and subtests, measure coverage, fuzz inputs, and build test doubles with plain interfaces — no framework required.",
    plain:
      "Testing in Go has no magic and needs no third-party framework. You put tests in files ending in _test.go right next to your code, write functions that start with Test, and run `go test`. The standard library gives you everything: subtests, benchmarks, fuzzing, and coverage. The most idiomatic style is the 'table-driven test' — a list of cases run through the same logic.",
    animation: {
      id: "test-runner",
      title: "Table-Driven Test Runner",
      blurb:
        "Follow a table of cases as `go test` runs each one as a subtest: inputs flow through the function, the result is compared to want, and each row turns green.",
    },
    concepts: [
      {
        title: "The simplest possible test",
        body:
          "A test is a function named TestXxx taking *testing.T. Use t.Errorf to report a failure and keep going, or t.Fatalf to stop this test immediately. Always print got and want so a failure is self-explanatory.",
        code: `// file: math_test.go
func TestAdd(t *testing.T) {
    got := Add(2, 3)
    if got != 5 {
        t.Errorf("Add(2, 3) = %d, want 5", got)
    }
}
// run it:  go test ./...   (verbose: go test -v ./...)`,
        lang: "go",
      },
      {
        title: "Table-driven tests with subtests",
        body:
          "List your cases in a slice of structs and loop, running each with t.Run so they show up as named subtests. Adding a new case is one line, and a failure points at the exact case name.",
        code: `func TestAdd(t *testing.T) {
    cases := []struct {
        name     string
        a, b, want int
    }{
        {"positives", 2, 3, 5},
        {"with zero", 0, 0, 0},
        {"negatives", -2, 2, 0},
    }
    for _, c := range cases {
        t.Run(c.name, func(t *testing.T) {
            if got := Add(c.a, c.b); got != c.want {
                t.Errorf("Add(%d,%d)=%d, want %d", c.a, c.b, got, c.want)
            }
        })
    }
}`,
        lang: "go",
      },
      {
        title: "Helpers, parallelism, cleanup",
        body:
          "t.Helper() makes failures point at the caller, not the helper. t.Parallel() runs cases concurrently for speed. t.Cleanup() registers teardown that runs when the test finishes — cleaner than defer across helpers.",
        code: `func mustOpen(t *testing.T, name string) *os.File {
    t.Helper() // report failures at the call site
    f, err := os.Open(name)
    if err != nil { t.Fatalf("open: %v", err) }
    t.Cleanup(func() { f.Close() }) // auto-closed at test end
    return f
}

func TestThing(t *testing.T) { t.Parallel(); /* ... */ }`,
        lang: "go",
      },
      {
        title: "Coverage & fuzzing",
        body:
          "Coverage shows which lines your tests exercise. Fuzzing (built in since Go 1.18) generates random inputs to find crashes and edge cases you'd never think of — it automatically saves any input that breaks your code.",
        code: `// Coverage report in the browser:
//   go test -coverprofile=cov.out ./... && go tool cover -html=cov.out

func FuzzParse(f *testing.F) {
    f.Add("1,2,3")          // seed corpus
    f.Fuzz(func(t *testing.T, in string) {
        _ = Parse(in)       // must never panic on any input
    })
}
// run:  go test -fuzz=FuzzParse`,
        lang: "go",
      },
      {
        title: "Test doubles with interfaces (no mock framework)",
        body:
          "Go's secret weapon: accept an interface, not a concrete type. In tests you pass a tiny fake implementation. No mocking library, no code generation — just a struct that satisfies the interface.",
        code: `type Clock interface{ Now() time.Time }

type fakeClock struct{ t time.Time }
func (f fakeClock) Now() time.Time { return f.t }

func TestExpiry(t *testing.T) {
    s := NewSession(fakeClock{t: time.Unix(0, 0)})
    // ... assert behaviour at a fixed, controllable time ...
}`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Have an LLM generate a thorough table of cases for a tricky function — then review which edge cases you'd have missed.",
      prompt:
        "Write an idiomatic Go table-driven test for this function: <paste func>. Use subtests with descriptive names, cover boundary and error cases, and print got vs want. Don't use any third-party assertion library.",
    },
    practice: {
      title: "Try it yourself",
      body: "Build the everyday testing habit.",
      steps: [
        "Add a _test.go file next to a function and write one table-driven TestXxx with t.Run.",
        "Run the everyday command: go test -race -cover ./...",
        "Open the coverage map: go test -coverprofile=cov.out ./... && go tool cover -html=cov.out",
        "Add a FuzzXxx for any function that parses input and run go test -fuzz for 30s.",
      ],
    },
    pitfalls: [
      "Comparing structs that contain times or maps with == or reflect.DeepEqual and getting flaky failures — compare fields or use google/go-cmp's cmp.Diff.",
      "Calling t.Fatal from inside a spawned goroutine — it only works on the test's own goroutine. Send the error back on a channel and Fatal in the test.",
      "Sharing state between t.Parallel() subtests (or, pre-Go 1.22, capturing the loop variable) so cases interfere with each other.",
    ],
    takeaways: [
      "Table-driven tests + t.Run give readable, isolated cases with pinpoint failure messages.",
      "`go test -race -cover` is the command you run all day.",
      "Mock with small interfaces and fakes, not a framework.",
    ],
    checklist: [
      "Can write a table-driven test with named subtests.",
      "Use t.Helper, t.Cleanup, and t.Parallel appropriately.",
      "Can produce and read an HTML coverage report.",
      "Wrote at least one fuzz target and one interface-based fake.",
    ],
  },

  /* ================================================================= F4 */
  {
    id: "f4",
    code: "F4",
    num: 4,
    part: "part-0",
    title: "Goroutines, Channels & Concurrency Patterns",
    short: "Goroutines & Channels",
    level: "Beginner → Mid",
    duration: "3 hrs",
    icon: "share",
    summary:
      "Goroutines are cheap concurrent functions; channels are typed pipes that pass data safely between them. Master select, worker pools, fan-in/fan-out, and context cancellation.",
    plain:
      "A goroutine is a function that runs concurrently — like kicking off a background task, but so cheap you can run thousands or millions. Channels are typed pipes: one goroutine puts a value in, another takes it out, and Go handles the synchronization so you don't need locks for the handoff. The Go mantra: 'Don't communicate by sharing memory; share memory by communicating.'",
    animation: {
      id: "worker-pool",
      title: "Worker Pool: Fan-Out / Fan-In",
      blurb:
        "Jobs queue on a channel, several worker goroutines pull them concurrently (fan-out), process, and send results back onto a single channel (fan-in).",
    },
    concepts: [
      {
        title: "Goroutines: concurrency for almost free",
        body:
          "Prefix any call with go to run it concurrently. A goroutine starts with a tiny ~2 KB stack that grows as needed, so spawning thousands is normal. But every goroutine needs an owner and a way to stop — a leaked goroutine is a memory leak.",
        code: `go doWork()              // runs concurrently, returns immediately

// Wait for a group of goroutines to finish:
var wg sync.WaitGroup
for _, url := range urls {
    wg.Add(1)
    go func(u string) {     // (Go 1.22+: loop var is safe)
        defer wg.Done()
        fetch(u)
    }(url)
}
wg.Wait()`,
        lang: "go",
      },
      {
        title: "Channels: typed, synchronized pipes",
        body:
          "An unbuffered channel is a rendezvous: the sender blocks until a receiver is ready (perfect synchronization). A buffered channel decouples them up to its capacity. The sender closes the channel, once, to signal 'no more values'; receivers can range over it.",
        code: `ch := make(chan int)      // unbuffered: hand-off / sync
buf := make(chan int, 100) // buffered: decouples rates

go func() {
    for i := 0; i < 3; i++ { ch <- i }
    close(ch)              // sender closes — exactly once
}()
for v := range ch {        // ranges until the channel is closed
    fmt.Println(v)
}`,
        lang: "go",
      },
      {
        title: "select: waiting on many things",
        body:
          "select blocks until one of several channel operations can proceed. Add a default for a non-blocking try, or a time.After case for a timeout. It's how you combine work, cancellation, and timeouts in one place.",
        code: `select {
case v := <-results:
    use(v)
case <-ctx.Done():        // someone cancelled us
    return ctx.Err()
case <-time.After(2 * time.Second):
    return errors.New("timed out")
}`,
        lang: "go",
      },
      {
        title: "The worker-pool pattern (fan-out / fan-in)",
        body:
          "Fan-out: start N workers that all read from one jobs channel, so work spreads across them. Fan-in: every worker writes to one results channel, merging their output. This bounds concurrency to N — the most common production concurrency shape.",
        code: `jobs := make(chan int, 100)
results := make(chan int, 100)

for w := 0; w < 3; w++ {          // fan-out: 3 workers
    go func() {
        for j := range jobs {     // each pulls jobs concurrently
            results <- process(j) // fan-in: one results channel
        }
    }()
}
for _, j := range work { jobs <- j }
close(jobs)`,
        lang: "go",
      },
      {
        title: "Stopping cleanly with context",
        body:
          "context.Context is how you tell a tree of goroutines to stop — a timeout, a cancel, or a client disconnect. Pass ctx as the first argument, select on ctx.Done(), and you have a clean shutdown path with no leaks.",
        code: `func worker(ctx context.Context, jobs <-chan Job) {
    for {
        select {
        case <-ctx.Done():
            return            // cancelled — exit promptly
        case j, ok := <-jobs:
            if !ok { return } // channel closed — done
            handle(j)
        }
    }
}`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Ask an LLM to review a concurrent snippet specifically for leaks, deadlocks, and missing cancellation — the three classic bugs.",
      prompt:
        "Review this Go concurrency code for goroutine leaks, deadlocks, data races, and missing context cancellation: <paste>. For each issue, explain how it manifests and show the minimal fix. Assume Go 1.22+ loop-variable semantics.",
    },
    practice: {
      title: "Try it yourself",
      body: "Build a worker pool and prove it's correct.",
      steps: [
        "Write a worker pool: a jobs channel, 4 workers, a results channel; submit 20 jobs.",
        "Run it under the race detector: go run -race main.go",
        "Add a context.WithTimeout and make workers exit on ctx.Done().",
        "Force a leak (a worker blocked on a channel nobody closes), then catch it with a goroutine profile.",
      ],
    },
    pitfalls: [
      "Leaking goroutines: starting one that blocks forever on a channel nobody closes. Always give every goroutine a stop path (close or context).",
      "Closing a channel from the receiver, or closing it twice — both panic. The sender owns the close, and closes exactly once.",
      "Reaching for channels to protect a shared counter — a sync.Mutex or atomic is simpler. Channels pass ownership; mutexes guard state.",
    ],
    takeaways: [
      "Unbuffered channels synchronize; buffered channels decouple producer and consumer rates.",
      "Every goroutine needs an owner and a way to stop — usually a context.",
      "Use channels to pass data/ownership, mutexes/atomics to guard shared state.",
    ],
    checklist: [
      "Can spawn goroutines and wait with sync.WaitGroup.",
      "Understand unbuffered vs buffered channels and who closes them.",
      "Built a worker pool with fan-out/fan-in.",
      "Wire context cancellation into every long-running goroutine.",
    ],
  },

  /* ================================================================= F5 */
  {
    id: "f5",
    code: "F5",
    num: 5,
    part: "part-0",
    title: "Errors, Context & Project Layout",
    short: "Errors & Context",
    level: "Beginner → Mid",
    duration: "2 hrs",
    icon: "git",
    summary:
      "Go treats errors as values you handle explicitly. Wrap them with %w, inspect with errors.Is/As, propagate deadlines with context, and lay out a project the idiomatic way.",
    plain:
      "Go has no exceptions. A function that can fail returns an error value, and you check it right where it happens. To keep the original cause as the error travels up the call stack, you 'wrap' it — building a chain you can later inspect with errors.Is and errors.As. Separately, context carries cancellation and deadlines across function and API boundaries so a whole request can be stopped at once.",
    animation: {
      id: "error-context",
      title: "Context Cancellation Tree",
      blurb:
        "A request builds a tree of contexts across goroutines. When a timeout fires at the root, the cancellation propagates down every branch and each goroutine stops.",
    },
    concepts: [
      {
        title: "Errors are values",
        body:
          "The idiom is everywhere: a function returns (result, error) and you check err != nil immediately. Define sentinel errors with errors.New for conditions callers branch on (like 'not found').",
        code: `var ErrNotFound = errors.New("not found")

func Lookup(id string) (Account, error) {
    a, ok := store[id]
    if !ok {
        return Account{}, ErrNotFound
    }
    return a, nil
}

acct, err := Lookup(id)
if err != nil { /* handle right here */ }`,
        lang: "go",
      },
      {
        title: "Wrap with %w, inspect with Is / As",
        body:
          "Wrapping with fmt.Errorf and the %w verb adds context (where/what) while keeping the original error reachable. errors.Is checks for a specific sentinel anywhere in the chain; errors.As pulls out a specific error type.",
        code: `if err != nil {
    return fmt.Errorf("charge account %s: %w", id, err) // wraps
}

// At the boundary, inspect the whole chain:
if errors.Is(err, ErrNotFound) {
    http.Error(w, "no such account", 404)
}
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) { useCode(pgErr.Code) }`,
        lang: "go",
      },
      {
        title: "context: cancellation & deadlines",
        body:
          "Create a derived context with a cancel function or a timeout, pass it as the first argument to every call that does I/O, and always defer cancel() to release resources. Cancelling a parent cancels every child.",
        code: `ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
defer cancel() // release timer + signal children, always

rows, err := db.QueryContext(ctx, sql, id)
// If the client disconnects or 3s passes, the query is aborted
// and every goroutine watching ctx.Done() wakes up to stop.`,
        lang: "go",
      },
      {
        title: "Custom error types",
        body:
          "When callers need structured details (a field name, an HTTP status), define an error type. Implement Error() string, and optionally Unwrap() so it plays nicely with errors.Is/As.",
        code: `type ValidationError struct {
    Field string
    Err   error
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("field %q: %v", e.Field, e.Err)
}
func (e *ValidationError) Unwrap() error { return e.Err }`,
        lang: "go",
      },
      {
        title: "Idiomatic project layout",
        body:
          "Keep it flat until you need structure. cmd/<app> holds main packages (entry points); internal/ holds code only your module can import (a compile-time boundary); name packages for what they provide, and avoid a junk-drawer 'utils' package.",
        code: `// myledger/
//   cmd/
//     ledger/main.go      // entry point: wiring only
//   internal/
//     ledger/...          // core domain (not importable outside)
//     postgres/...        // a driver/adapter package
//   go.mod
//
// Rule of thumb: package = a capability, not a layer named "models".`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Ask an LLM to audit your error handling for lost context and your context usage for the classic mistakes.",
      prompt:
        "Audit this Go code's error handling and context usage: <paste>. Flag any place that uses %v instead of %w (losing the chain), stores context in a struct, or uses context.WithValue for required parameters. Show the idiomatic fix for each.",
    },
    practice: {
      title: "Try it yourself",
      body: "Make an error chain you can inspect.",
      steps: [
        "Define a sentinel error and wrap it with fmt.Errorf(\"...: %w\", err) two layers up.",
        "At the top, branch with errors.Is(err, ErrYour) and confirm it matches through the chain.",
        "Add a context.WithTimeout(50ms) around a slow call and observe ctx.Err() == context.DeadlineExceeded.",
        "Reorganize a small program into cmd/ + internal/ and confirm the internal boundary is enforced.",
      ],
    },
    pitfalls: [
      "Wrapping with %v instead of %w — you get a nice string but lose the ability to errors.Is/As the cause.",
      "Storing a context.Context in a struct field instead of passing it as the first argument — it breaks cancellation and confuses lifetimes.",
      "Using context.WithValue for required parameters — it's for request-scoped metadata (trace IDs), not a bag of arguments.",
    ],
    takeaways: [
      "Wrap with %w on the way up; inspect with errors.Is/As at the boundary.",
      "context is for cancellation and deadlines — always pass it, never store it.",
      "internal/ enforces your module's API boundary at compile time.",
    ],
    checklist: [
      "Wrap errors with %w and inspect with errors.Is/As.",
      "Pass context as the first arg and defer cancel().",
      "Wrote a custom error type with Error() and Unwrap().",
      "Can lay out cmd/ and internal/ correctly.",
    ],
  },

  /* ================================================================= M1 */
  {
    id: "m1",
    code: "M1",
    num: 1,
    part: "part-1",
    title: "Zero-Dependency Network Routing & Restricted IO",
    short: "Routing & Restricted IO",
    level: "Mid-Level",
    duration: "3–4 hrs",
    icon: "route",
    summary:
      "Drop gin/chi for the native net/http ServeMux, extract path variables safely, and sandbox file-system access with os.Root to kill path-traversal bugs at the syscall boundary.",
    plain:
      "A router is the part of a web server that decides which function handles an incoming URL. For years everyone reached for libraries like gin or chi to do this. Since Go 1.22 the standard library's own router can match methods and capture URL variables, so you can delete that dependency entirely. Separately, os.Root is a safety fence around a folder: file reads physically cannot escape it, which stops a whole class of 'path traversal' attacks.",
    animation: {
      id: "mux-trie",
      title: "The Mux Trie & IO Sandbox",
      blurb:
        "Watch the router match an inbound URL against an internal radix trie while an IO call is physically blocked from escaping its os.Root boundary.",
    },
    concepts: [
      {
        title: "Native pattern matching with http.ServeMux",
        body:
          "Go 1.22 turned the standard ServeMux into a real router: method matching, wildcard segments and precedence rules are built in. You no longer pay a third-party dependency tax for routing a financial gateway.",
        code: `mux := http.NewServeMux()

// Method + path are matched together. A bare "/" no longer
// swallows everything — precedence is longest-pattern-wins.
mux.HandleFunc("GET /api/v1/ledger/{id}", getEntry)
mux.HandleFunc("POST /api/v1/ledger", ingestTxn)
mux.HandleFunc("GET /api/v1/ledger/{id}/audit", getAudit)

http.ListenAndServe(":8080", mux)`,
        lang: "go",
      },
      {
        title: "Clean path variables with r.PathValue",
        body:
          "Wildcards captured in the pattern are pulled out with r.PathValue — no regexp, no context juggling, no allocation-heavy router state. An unmatched method returns 405 with the correct Allow header automatically.",
        code: `func getEntry(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id") // "{id}" from the pattern
    if id == "" {
        http.Error(w, "missing id", http.StatusBadRequest)
        return
    }
    entry, err := ledger.Lookup(r.Context(), id)
    if err != nil {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    writeJSON(w, http.StatusOK, entry)
}`,
        lang: "go",
      },
      {
        title: "Directory-restricted IO with os.Root",
        body:
          "os.Root (Go 1.24) opens a directory and refuses any operation that resolves outside it — including symlink escapes and ../ traversal. Config loaders and local-storage readers become traversal-proof by construction, not by validation.",
        code: `// Everything below is jailed to ./data — even if an
// attacker supplies "../../etc/passwd".
root, err := os.OpenRoot("data")
if err != nil { return err }
defer root.Close()

f, err := root.Open(userSuppliedName)
if err != nil {
    // os.Root returns an error instead of escaping the jail.
    return fmt.Errorf("restricted read: %w", err)
}
defer f.Close()`,
        lang: "go",
      },
      {
        title: "Dev tools via the go.mod tool directive",
        body:
          "Go 1.24 added first-class `tool` directives. Declare executable dev tools (sqlc, golangci-lint, protoc plugins) directly in go.mod and run them with `go tool`. The legacy tools.go blank-import hack is gone.",
        code: `// go.mod
module ledger

go 1.26

tool (
    github.com/sqlc-dev/sqlc/cmd/sqlc
    github.com/golangci/golangci-lint/cmd/golangci-lint
)

// then:  go tool sqlc generate`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Prompt Cursor / Claude with explicit Go structural specs to refactor legacy gin/chi routes into native ServeMux configurations while preserving exact HTTP status codes and middleware order.",
      prompt:
        "Refactor this gin router group into a Go 1.22+ http.ServeMux. Preserve every status code, keep GET/POST method matching explicit, replace c.Param(\"id\") with r.PathValue(\"id\"), and return 405 with an Allow header for method mismatches. Output only the rewritten handler + mux wiring.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Build the public REST gateway for transaction ingestion with zero third-party routing imports: GET /ledger/{id}, POST /ledger, GET /ledger/{id}/audit, plus an os.Root-jailed config loader.",
    },
    pitfalls: [
      "Assuming the old catch-all behaviour: a pattern like \"/\" no longer matches everything — ServeMux now uses longest-pattern-wins precedence.",
      "Validating paths with string checks (strings.Contains(p, \"..\")) instead of os.Root — clever symlink and encoding tricks slip past manual checks.",
      "Forgetting the method in the pattern (\"/x\" vs \"GET /x\") and being surprised that every verb hits the same handler.",
    ],
    takeaways: [
      "Go 1.22+ ServeMux does method + wildcard routing — most apps can drop their router dependency.",
      "r.PathValue beats regexp routers for clarity and allocations.",
      "os.Root makes traversal attacks impossible by construction, not by validation.",
    ],
    checklist: [
      "All routes served by net/http ServeMux — no gin/chi/echo imports.",
      "Path variables read via r.PathValue, never regexp.",
      "Every filesystem read goes through an os.Root jail.",
      "Dev tools declared with the go.mod tool directive.",
    ],
  },

  /* ================================================================= M2 */
  {
    id: "m2",
    code: "M2",
    num: 2,
    part: "part-1",
    title: "High-Performance Serialization & Memory Geometry",
    short: "Serialization & Memory",
    level: "Mid-Level",
    duration: "4 hrs",
    icon: "layers",
    summary:
      "Move heavy reflection JSON to encoding/json/v2 + streaming jsontext, allocate optional fields inline with new(expr), and understand why Go 1.24's Swiss-Table maps eliminate cache misses.",
    plain:
      "Serialization means turning your in-memory structs into bytes (like JSON) to send over the network, and back again. The classic encoding/json uses reflection, which is flexible but slow on hot paths. The new json/v2 and a streaming token API make it much faster. Separately, Go 1.24 quietly rebuilt the built-in map type using a 'Swiss Table' layout that checks many slots at once, so lookups touch far fewer cache lines.",
    animation: {
      id: "swiss-table",
      title: "Swiss Table vs. Legacy Map",
      blurb:
        "A side-by-side lookup trace: the legacy map probes buckets one slot at a time, while a Swiss Table hashes an 8-slot group and checks every control byte at once.",
    },
    concepts: [
      {
        title: "encoding/json/v2 and streaming tokens",
        body:
          "json/v2 replaces the reflection-per-call model with a faster, option-driven encoder and a low-level jsontext token stream. For a ledger pushing millions of payloads, streaming tokens avoid building the whole document in memory.",
        code: `import (
    "encoding/json/v2"
    "encoding/json/jsontext"
)

// Stream tokens straight to the wire — no intermediate map[string]any.
enc := jsontext.NewEncoder(w)
enc.WriteToken(jsontext.BeginObject)
enc.WriteToken(jsontext.String("amount"))
enc.WriteToken(jsontext.Int(txn.Amount))
enc.WriteToken(jsontext.EndObject)

// Or the high-level path with explicit options:
json.MarshalWrite(w, txn, json.Deterministic(true))`,
        lang: "go",
      },
      {
        title: "Inline pointer allocation with new(expr)",
        body:
          "The new(expr) form lets you allocate a pointer to a literal value in one expression — perfect for optional JSON/Protobuf fields where nil means 'absent'. No throwaway local variables.",
        code: `type Txn struct {
    Amount   int64
    FeeBasis *int64 \`json:"feeBasis,omitempty"\`
    Memo     *string\`json:"memo,omitempty"\`
}

txn := Txn{
    Amount:   5000,
    FeeBasis: new(int64(25)),   // &(int64(25)) inline
    Memo:     new("settlement"),
}`,
        lang: "go",
      },
      {
        title: "Swiss Tables: cache-friendly maps",
        body:
          "Go 1.24 reimplemented the built-in map as a Swiss Table. Entries live in groups of 8 with a compact control byte per slot; a group's control bytes are scanned with SIMD-style parallelism, so a lookup usually touches one cache line instead of chasing bucket overflow pointers.",
        code: `// No API change — same map[K]V — but lookups now:
//   1. hash key -> pick a group of 8 slots
//   2. load the 8 control bytes (one cache line)
//   3. SIMD-compare all 8 tags in parallel
//   4. confirm the single candidate
m := make(map[string]int64, 1_000_000)
m["USD"] = 1
v := m["USD"] // ~1 cache line, no pointer chasing`,
        lang: "go",
      },
      {
        title: "Stack-allocation of slice backing stores",
        body:
          "The compiler increasingly proves that small, non-escaping slices can keep their backing array on the stack. Escape analysis on hot serialization buffers means zero heap pressure and no GC work for transient encode buffers.",
        code: `func encode(txn Txn) []byte {
    // If buf never escapes, the backing array stays on the stack.
    buf := make([]byte, 0, 64)
    buf = append(buf, txn.Currency...)
    buf = appendInt(buf, txn.Amount)
    return slices.Clone(buf) // clone to safely escape
}
// go build -gcflags='-m' to confirm "does not escape".`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Configure custom golangci-lint rules that flag reflection-based json.Marshal calls on hot paths and auto-recommend json/v2 token streams.",
      prompt:
        "Write a golangci-lint custom rule (ruleguard/gorules) that flags json.Marshal/json.Unmarshal usage inside any function whose name matches /Encode|Serialize|hot/ and suggests the encoding/json/v2 MarshalWrite + jsontext.Encoder equivalent.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Design the transaction serialization engine: a jsontext streaming encoder for outbound payloads and json/v2 decoders for ingestion, benchmarked under sustained high-throughput stress.",
    },
    pitfalls: [
      "Reaching for map[string]any to parse JSON on a hot path — it allocates heavily and defeats the point of json/v2.",
      "Assuming Swiss Tables change semantics — map iteration order is still randomized; don't rely on it.",
      "Returning a slice that aliases a stack buffer — clone it (slices.Clone) before letting it escape.",
    ],
    takeaways: [
      "json/v2 + jsontext is the high-throughput path; reflection json is the convenience path.",
      "Swiss-Table maps win by touching one cache line per lookup — keys and values benefit from locality.",
      "Use -gcflags='-m' to confirm a buffer really stays on the stack.",
    ],
    checklist: [
      "Hot encode/decode paths use encoding/json/v2, not reflection.",
      "Optional fields allocated with new(expr).",
      "Map-heavy code reviewed for Swiss-Table cache locality.",
      "Escape analysis confirms transient buffers stay on the stack.",
    ],
  },

  /* ================================================================= M3 */
  {
    id: "m3",
    code: "M3",
    num: 3,
    part: "part-2",
    title: "Object Lifecycles, Interning & Runtime Internals",
    short: "Lifecycles & Interning",
    level: "Senior",
    duration: "4–5 hrs",
    icon: "recycle",
    summary:
      "Replace unpredictable finalizers with runtime.AddCleanup, shrink memory with the unique interning package, and read the scheduler's preemption, netpoller and lockless paths.",
    plain:
      "When an object is about to be collected you sometimes need to run cleanup — close a file descriptor, release a handle. The old tool (finalizers) was unreliable. runtime.AddCleanup is the modern, predictable replacement. 'Interning' is a separate memory trick: if a million accounts all store the string \"USD\", you can keep just one copy and have everyone point to it. This module also peeks inside the scheduler that runs your goroutines.",
    animation: {
      id: "cleanup-seq",
      title: "The Cleanup Sequence",
      blurb:
        "An object becomes unreachable; the GC runs its AddCleanup handler deterministically — without delaying collection of the parent span.",
    },
    concepts: [
      {
        title: "Deterministic cleanup with runtime.AddCleanup",
        body:
          "runtime.SetFinalizer is fragile: it resurrects objects, runs in undefined order, and blocks collection. runtime.AddCleanup (Go 1.24) attaches a cleanup that runs once, after the object is truly unreachable, with no resurrection and no cycle traps.",
        code: `type Conn struct{ fd int }

func newConn(fd int) *Conn {
    c := &Conn{fd: fd}
    // The cleanup captures fd by value, NOT c — so it can't
    // keep c alive and create a leak.
    runtime.AddCleanup(c, func(fd int) {
        syscall.Close(fd)
    }, c.fd)
    return c
}`,
        lang: "go",
      },
      {
        title: "Value interning with the unique package",
        body:
          "Millions of ledger rows repeat the same currency codes and status strings. unique.Make canonicalizes equal values to a single shared handle, collapsing memory and turning string comparison into a pointer compare.",
        code: `import "unique"

// Handle[T] is comparable and dedups equal values globally.
var (
    usd = unique.Make("USD")
    eur = unique.Make("EUR")
)

type Account struct {
    Currency unique.Handle[string] // 8 bytes, shared
    Status   unique.Handle[string]
}

// Comparison is a pointer compare, not a byte scan.
if acct.Currency == usd { /* ... */ }`,
        lang: "go",
      },
      {
        title: "Inside the runtime scheduler",
        body:
          "The G-M-P model multiplexes goroutines (G) onto OS threads (M) via processors (P). Understand asynchronous preemption (the runtime can interrupt tight loops), netpoller wakeups (blocked-on-IO goroutines are parked, not spinning), and lockless run-queue steals between Ps.",
        code: `// A tight loop used to starve the scheduler. Since Go 1.14,
// async preemption interrupts it at a safe point via signals,
// so other goroutines still get CPU time.
for {
    n := work()        // preemptible
    publish(n)
}

// Blocking on IO parks the G in the netpoller; the M is freed
// to run other goroutines. No thread is wasted spinning.`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Use LLM code synthesis to inspect pointer loops and emit memory-safe runtime.AddCleanup structures that capture by value and never trap the parent object.",
      prompt:
        "Audit this struct graph for runtime.AddCleanup safety. Flag any cleanup closure that captures the cleaned object (creating a self-reference leak) and rewrite it to capture only the primitive resource handle by value.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Build an interning cache for currency symbols and account-prefix strings so millions of active accounts share canonical handles, and attach AddCleanup release hooks to pooled connection structs.",
    },
    pitfalls: [
      "Capturing the object itself in an AddCleanup closure — it keeps the object alive forever, the exact leak you were trying to avoid. Capture the raw handle by value.",
      "Treating cleanups as guaranteed to run promptly or at all — they run after collection, which may be never at shutdown. Use them as a backstop, not your primary close path.",
      "Interning unbounded, rarely-repeated values — the global table just grows. Intern high-cardinality-but-repeated values like currency codes.",
    ],
    takeaways: [
      "Prefer runtime.AddCleanup over SetFinalizer — once, predictable, no resurrection.",
      "unique.Make collapses repeated strings to a shared, pointer-comparable handle.",
      "Understanding G-M-P explains why blocking I/O doesn't waste threads.",
    ],
    checklist: [
      "Zero runtime.SetFinalizer — all cleanup via runtime.AddCleanup.",
      "Cleanups capture resource handles by value, never the parent.",
      "Repeated metadata strings interned with unique.Make.",
      "Can explain G-M-P, async preemption and netpoller wakeups.",
    ],
  },

  /* ================================================================= M4 */
  {
    id: "m4",
    code: "M4",
    num: 4,
    part: "part-2",
    title: "Flake-Free Concurrency & Deterministic Testing",
    short: "Deterministic Testing",
    level: "Senior",
    duration: "3–4 hrs",
    icon: "flask",
    summary:
      "Kill flaky time.Sleep tests with testing/synctest's controlled time bubbles, and write predictable benchmarks with testing.B.Loop.",
    plain:
      "Concurrency tests are notoriously 'flaky' — they pass locally and randomly fail in CI because they rely on time.Sleep to wait for goroutines. testing/synctest fixes this by giving the test a fake clock inside a 'bubble': when every goroutine is blocked, virtual time jumps forward instantly and deterministically, so there's nothing left to race.",
    animation: {
      id: "synctest-bubble",
      title: "The Synctest Clock Bubble",
      blurb:
        "Concurrent routines run inside an isolated bubble with a fake clock. When every routine blocks, time fast-forwards cleanly — no sleeps, no flakes.",
    },
    concepts: [
      {
        title: "Isolated time with synctest.Run",
        body:
          "testing/synctest (stable in Go 1.25) runs a goroutine tree inside a 'bubble' with a fake clock. time.Sleep, timers and tickers are virtual: when all bubbled goroutines are blocked, the fake clock jumps to the next timer instantly and deterministically.",
        code: `import "testing/synctest"

func TestTimeout(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        start := time.Now()
        done := make(chan struct{})
        go func() {
            time.Sleep(5 * time.Second) // virtual — runs instantly
            close(done)
        }()
        <-done
        // Wall clock barely moved; the bubble clock advanced 5s.
        if time.Since(start) != 5*time.Second {
            t.Fatalf("unexpected: %v", time.Since(start))
        }
    })
}`,
        lang: "go",
      },
      {
        title: "Reaching steady state with synctest.Wait",
        body:
          "synctest.Wait blocks the caller until every other goroutine in the bubble is durably blocked. That replaces racy 'sleep 100ms and hope it scheduled' patterns with a precise barrier on quiescence.",
        code: `synctest.Test(t, func(t *testing.T) {
    ch := make(chan int)
    go producer(ch)
    go consumer(ch)

    synctest.Wait() // block until producer+consumer are parked
    // Now assert on a known, settled state — zero flake risk.
    assertLedgerBalanced(t)
})`,
        lang: "go",
      },
      {
        title: "Predictable benchmarks with testing.B.Loop",
        body:
          "b.Loop() (Go 1.24) replaces the for i := 0; i < b.N pattern. It keeps benchmarked values alive against dead-code elimination and runs setup once, giving stable, compiler-friendly iteration counts.",
        code: `func BenchmarkValidate(b *testing.B) {
    txn := buildTxn()
    for b.Loop() {            // no b.N bookkeeping
        sink = ledger.Validate(txn) // kept alive automatically
    }
}`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Use an LLM to refactor flaky integration tests that lean on time.Sleep into deterministic synctest bubbles.",
      prompt:
        "Convert this integration test from time.Sleep-based synchronization to testing/synctest. Wrap the body in synctest.Test, replace each 'sleep then assert' with synctest.Wait, and keep all original assertions. Explain any sleep you could not mechanically remove.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Write deterministic tests for the audit-log processing pipeline that reliably catch concurrent updates, plus B.Loop benchmarks for the validation hot path.",
    },
    pitfalls: [
      "Doing real I/O (network, disk) inside a synctest bubble — only the fake clock is virtualized; real blocking still blocks. Keep bubbles to in-memory concurrency.",
      "Replacing time.Sleep in production code thinking synctest helps there — it's a testing tool only.",
      "Still writing for i := 0; i < b.N loops — they're easy to get wrong with dead-code elimination; use b.Loop().",
    ],
    takeaways: [
      "synctest gives concurrency tests a deterministic virtual clock — no sleeps, no flakes.",
      "synctest.Wait is a precise 'everyone is parked' barrier.",
      "b.Loop() is the modern, footgun-free benchmark loop.",
    ],
    checklist: [
      "No time.Sleep in tests — concurrency tested via synctest.",
      "synctest.Wait used to assert on settled state.",
      "Benchmarks use b.Loop(), not manual b.N loops.",
      "CI runs the race detector with zero flakes.",
    ],
  },

  /* ================================================================= M5 */
  {
    id: "m5",
    code: "M5",
    num: 5,
    part: "part-2",
    title: "Type-Safe Persistence Layers & Performance Testing",
    short: "Type-Safe Persistence",
    level: "Senior",
    duration: "4–5 hrs",
    icon: "database",
    summary:
      "Generate compile-checked DB code from raw SQL with sqlc, tune pgxpool for production, and match Postgres error codes with Go 1.26's errors.AsType.",
    plain:
      "Talking to a database is where many bugs hide. sqlc lets you write plain SQL and generates type-safe Go functions from it — so a misspelled column fails at compile time, not at 3am. pgxpool manages a pool of Postgres connections efficiently. And row-level locking is how two transfers touching the same account stay correct under load.",
    animation: {
      id: "sql-txn",
      title: "The SQL Transaction Cycle",
      blurb:
        "Follow a ledger record from a Go function through a pgx batch, visualizing row-level locks as two transactions contend under load.",
    },
    concepts: [
      {
        title: "Compile-checked queries with sqlc",
        body:
          "sqlc reads your real SQL and your schema, then generates typed Go methods. A typo'd column or wrong argument type fails at code-gen time, not at 3am in production. No ORM, no runtime reflection.",
        code: `-- name: DebitAccount :one
UPDATE accounts
   SET balance = balance - $2
 WHERE id = $1 AND balance >= $2
RETURNING id, balance;

// generated -> fully typed, no string SQL in Go:
acct, err := q.DebitAccount(ctx, DebitAccountParams{
    ID: from, Amount: cents,
})`,
        lang: "sql",
      },
      {
        title: "Production pgxpool tuning",
        body:
          "pgxpool needs real limits: MaxConns sized to the DB, MaxConnLifetime to recycle around load balancers, and context-aware queries that cancel cleanly mid-flight when a client disconnects.",
        code: `cfg, _ := pgxpool.ParseConfig(dsn)
cfg.MaxConns = 32
cfg.MinConns = 4
cfg.MaxConnLifetime = 30 * time.Minute
cfg.MaxConnIdleTime = 5 * time.Minute
cfg.HealthCheckPeriod = time.Minute

pool, _ := pgxpool.NewWithConfig(ctx, cfg)
// Cancelling ctx aborts the in-flight query at the server.
row := pool.QueryRow(ctx, sql, id)`,
        lang: "go",
      },
      {
        title: "Typed errors with errors.AsType",
        body:
          "Go 1.26's errors.AsType[T] is a generic, allocation-free errors.As: match a *pgconn.PgError and read its SQLSTATE without the var-and-assert dance. Handle unique violations and serialization failures precisely.",
        code: `if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok {
    switch pgErr.Code {
    case "23505": // unique_violation
        return ErrDuplicateTxn
    case "40001": // serialization_failure -> retry
        return retryable(err)
    }
}`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Point an agent at slow-query logs to propose schema/index changes and re-emit the sqlc-generated data layer.",
      prompt:
        "Here are pg_stat_statements rows for the 10 slowest queries plus the schema. Propose covering indexes and query rewrites, output the modified SQL files in sqlc format, and list the exact sqlc generate command and the migration order.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Build the account-balancing engine: double-entry validation, SELECT ... FOR UPDATE row locks, retry-on-serialization-failure, and clean context-cancel on client disconnect.",
    },
    pitfalls: [
      "Setting MaxConns far higher than Postgres can handle — connections aren't free; size to the database, not the app.",
      "Updating two account rows in an inconsistent lock order across code paths — that's how you deadlock. Always lock rows in a fixed order.",
      "Swallowing a 40001 serialization_failure as a generic error instead of retrying the transaction.",
    ],
    takeaways: [
      "sqlc moves SQL mistakes from runtime to compile time.",
      "A connection pool needs explicit sizing and lifetimes for production.",
      "Row locks + a fixed lock order keep double-entry writes correct under contention.",
    ],
    checklist: [
      "All DB access is sqlc-generated — no hand-written SQL strings in Go.",
      "pgxpool sized with explicit Max/Min conns and lifetimes.",
      "Postgres errors matched via errors.AsType + SQLSTATE.",
      "Double-entry writes use row-level locks inside a transaction.",
    ],
  },

  /* ================================================================= M6 */
  {
    id: "m6",
    code: "M6",
    num: 6,
    part: "part-3",
    title: "Post-Quantum Microservice Defenses & Protocols",
    short: "Post-Quantum Defenses",
    level: "Staff",
    duration: "5 hrs",
    icon: "shield",
    summary:
      "Wire gRPC + Protobuf with strict back-compat, harden transport against harvest-now-decrypt-later attacks using hybrid ML-KEM / HPKE, and encode invariants with self-referencing generics.",
    plain:
      "Services talk to each other over the network, and that traffic must stay private — even against a future quantum computer. The threat is 'harvest now, decrypt later': an attacker records today's encrypted traffic and decrypts it years later once quantum computers can break classical crypto. Hybrid post-quantum key exchange (combining today's X25519 with quantum-resistant ML-KEM) defends against that now.",
    animation: {
      id: "pqc-lattice",
      title: "The Cryptographic Lattice",
      blurb:
        "A classic TLS handshake next to a hybrid ML-KEM exchange — see why a future quantum attacker cracks one captured key but not the lattice-protected one.",
    },
    concepts: [
      {
        title: "gRPC + Protobuf with strict back-compat",
        body:
          "Cross-node ledger traffic runs on gRPC. The discipline is schema evolution: never reuse field numbers, only add optional fields, and validate wire compatibility in CI so a v2 node never breaks a v1 peer mid-cluster.",
        code: `message Transfer {
  string id        = 1;
  int64  amount    = 2;
  string currency  = 3;
  // Added later — new tag, optional, old nodes ignore it.
  optional string memo = 4;
  // reserved 5;  // never reuse a retired field number
}`,
        lang: "go",
      },
      {
        title: "Hybrid PQC with crypto/mlkem + crypto/hpke",
        body:
          "A 'harvest now, decrypt later' adversary records today's traffic to crack with a future quantum computer. Hybrid key exchange combines classical X25519 with ML-KEM-768 — the session is safe unless BOTH are broken.",
        code: `import "crypto/mlkem"

// Receiver publishes an encapsulation key.
dk, _ := mlkem.GenerateKey768()
ek := dk.EncapsulationKey()

// Sender derives a shared secret + ciphertext from ek.
sharedSecret, ct := ek.Encapsulate()

// Receiver recovers the same secret from the ciphertext.
recovered, _ := dk.Decapsulate(ct)
// Combine with X25519 output -> hybrid session key.`,
        lang: "go",
      },
      {
        title: "Self-referencing generic constraints",
        body:
          "The curiously-recurring pattern type Node[T Node[T]] lets the compiler enforce that a method returns the concrete implementing type — encoding cluster-topology invariants that would otherwise be runtime asserts.",
        code: `type Node[T Node[T]] interface {
    ID() string
    Peers() []T          // returns concrete node type, not interface
    Merge(other T) T
}

type LedgerNode struct{ id string; peers []*LedgerNode }
func (n *LedgerNode) ID() string             { return n.id }
func (n *LedgerNode) Peers() []*LedgerNode    { return n.peers }
func (n *LedgerNode) Merge(o *LedgerNode) *LedgerNode { /* ... */ }`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Use code-gen agents to evolve Protobuf schemas and validate backward compatibility across separate repositories before merge.",
      prompt:
        "Given proto schema v1 (repo A) and a proposed v2, check wire-compatibility: flag any reused/changed field numbers or type changes, confirm new fields are optional, and generate a buf breaking-change report plus the safe migration diff.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Secure intra-cluster ledger updates over a hybrid quantum-resistant transport, with Protobuf schemas versioned for zero-break rolling upgrades.",
    },
    pitfalls: [
      "Reusing a retired Protobuf field number — old and new nodes will silently misinterpret bytes. Always 'reserved' it.",
      "Going pure post-quantum instead of hybrid — the PQC algorithms are newer; hybrid keeps classical security as a fallback.",
      "Assuming TLS 'just handles it' — you must explicitly choose a hybrid key-exchange group; defaults may still be classical-only.",
    ],
    takeaways: [
      "Protobuf compatibility is a discipline: add optional fields, never reuse numbers.",
      "Hybrid X25519 + ML-KEM defends against harvest-now-decrypt-later today.",
      "Self-referencing generics push topology invariants into the type checker.",
    ],
    checklist: [
      "Inter-node calls run on gRPC with reserved/never-reused field numbers.",
      "Transport uses hybrid X25519 + ML-KEM key exchange.",
      "Topology invariants encoded with self-referencing generics.",
      "buf breaking checks gate every schema change in CI.",
    ],
  },

  /* ================================================================= M7 */
  {
    id: "m7",
    code: "M7",
    num: 7,
    part: "part-3",
    title: "Live Diagnostics, Profiling & Forensics",
    short: "Diagnostics & Forensics",
    level: "Staff",
    duration: "4 hrs",
    icon: "activity",
    summary:
      "Keep a rolling in-memory trace with the FlightRecorder, dump diagnostic state on alarms, and trace deadlocks/leaks automatically with the goroutine-leak analyzer.",
    plain:
      "When a production incident happens, the worst feeling is 'I wish I'd been recording'. The FlightRecorder keeps a few seconds of detailed execution history in memory at all times, cheaply — so when latency spikes or the process crashes, you dump the window leading up to the failure. The goroutine-leak analyzer then automatically points at why a goroutine got stuck.",
    animation: {
      id: "leak-graph",
      title: "The Leak Forensic Graph",
      blurb:
        "A blocked production goroutine; the leak analyzer walks the channel graph back to the root blocker — an un-triggered channel or a missing context deadline.",
    },
    concepts: [
      {
        title: "Always-on tracing with FlightRecorder",
        body:
          "trace.FlightRecorder (Go 1.25) keeps a bounded ring buffer of recent execution events in memory at near-zero cost. You only pay to write a trace when something interesting happens — so you capture the window *before* a crash, not after you redeploy with logging.",
        code: `import "runtime/trace"

fr := trace.NewFlightRecorder(trace.FlightRecorderConfig{
    MinAge:   5 * time.Second,
    MaxBytes: 16 << 20,
})
fr.Start()
defer fr.Stop()

// When a latency alarm fires, freeze the last few seconds:
func onAlarm() {
    f, _ := os.Create("incident.trace")
    fr.WriteTo(f) // the window leading up to the spike
    f.Close()
}`,
        lang: "go",
      },
      {
        title: "Threshold-triggered diagnostic dumps",
        body:
          "Wire the recorder to your SLO alarms and panic handlers. When p99 latency crosses a line or the process crashes, atomically write the trace, a heap profile and goroutine dump so the root cause is captured at the moment of failure.",
        code: `func guard(threshold time.Duration, latency time.Duration) {
    if latency > threshold {
        dump("latency", fr)        // flight trace window
        pprof.Lookup("heap").WriteTo(heapFile, 0)
        pprof.Lookup("goroutine").WriteTo(grFile, 2)
    }
}`,
        lang: "go",
      },
      {
        title: "Automatic leak detection",
        body:
          "The goroutine-leak analyzer inspects parked goroutines and traces each blockade back to its cause: a channel with no sender, a WaitGroup that never reaches zero, or a missing context deadline — turning hours of log spelunking into a generated report.",
        code: `// In tests, assert no goroutines leaked past the test boundary:
func TestNoLeak(t *testing.T) {
    defer goroutineleak.Check(t) // fails if any G is stuck

    ctx, cancel := context.WithTimeout(ctx, time.Second)
    defer cancel() // forgetting this is exactly what it catches
    process(ctx)
}`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Feed FlightRecorder trace windows into a diagnostic agent to localize the root cause of latency regressions.",
      prompt:
        "Analyze this runtime/trace flight recording captured around a p99 latency spike. Identify the dominant blocking events, the goroutines on the critical path, and whether the cause is GC, lock contention, or a syscall stall. Output a ranked root-cause hypothesis list.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Add automatic diagnostic-dump hooks to the balance processor so anomalous latency spikes auto-capture a flight trace plus goroutine/heap profiles.",
    },
    pitfalls: [
      "Turning on a full continuous trace 'just in case' — that's expensive. The FlightRecorder's bounded ring buffer is the cheap, always-on option.",
      "Dumping diagnostics on every minor blip — you'll drown in files. Gate dumps on real SLO breaches with a cooldown.",
      "Shipping without leak checks in tests, then discovering goroutine growth only in production.",
    ],
    takeaways: [
      "FlightRecorder captures the moments before a failure cheaply and continuously.",
      "Trigger dumps from SLO alarms and panic handlers, not manually.",
      "Assert zero goroutine leaks at test boundaries to catch them early.",
    ],
    checklist: [
      "FlightRecorder runs continuously with a bounded buffer.",
      "SLO alarms + panic handlers trigger atomic trace dumps.",
      "Tests assert zero goroutine leaks at boundaries.",
      "Every context has a deadline or explicit cancel path.",
    ],
  },

  /* ================================================================= M8 */
  {
    id: "m8",
    code: "M8",
    num: 8,
    part: "part-3",
    title: "Hardware Acceleration & Memory Scrubbing",
    short: "SIMD & Secure Memory",
    level: "Principal",
    duration: "5 hrs",
    icon: "cpu",
    summary:
      "Vectorize hot math with simd/archsimd, scrub secret keys from memory with runtime/secret, and understand the Green Tea GC's spatial-locality span scanning.",
    plain:
      "Modern CPUs can do the same operation on many numbers at once — that's SIMD (Single Instruction, Multiple Data). For a loop that checksums every byte of a block, processing 16 bytes per instruction instead of one is a huge speedup. Separately, secret keys left lying in memory can leak into crash dumps; runtime/secret scrubs them. And 'Green Tea' is an experimental redesign of the garbage collector for better cache locality.",
    animation: {
      id: "simd-gc",
      title: "SIMD Processing vs. Green Tea GC",
      blurb:
        "A scalar loop chews one element per cycle while a SIMD lane processes 8–16 at once; alongside, the Green Tea GC sweeps contiguous 8 KiB spans in parallel.",
    },
    concepts: [
      {
        title: "Vector lanes with simd/archsimd",
        body:
          "The experimental simd/archsimd package exposes CPU vector types (Int8x16, Float64x8). A checksum or validation loop that touches every byte can process a whole lane per instruction — often an order of magnitude faster than scalar Go.",
        code: `import "simd/archsimd"

// Sum 16 bytes per instruction instead of 1.
func checksum(data []byte) uint32 {
    var acc archsimd.Uint32x4
    for i := 0; i+16 <= len(data); i += 16 {
        v := archsimd.LoadUint8x16(data[i:])
        acc = acc.AddPairwise(v.WidenToUint32())
    }
    return acc.ReduceSum()
}`,
        lang: "go",
      },
      {
        title: "Memory scrubbing with runtime/secret",
        body:
          "Decrypted keys linger in RAM and leak into core dumps and swap. runtime/secret holds sensitive bytes in a buffer that is guaranteed to be zeroed after use and kept off the GC's movable heap, shrinking the key-exposure window to its minimum.",
        code: `import "runtime/secret"

func sign(msg []byte) []byte {
    key := secret.New(32)        // not on the movable heap
    defer key.Destroy()          // overwritten with zeros
    deriveKey(key.Bytes())
    return hmacSign(key.Bytes(), msg)
    // After Destroy, the key bytes are unrecoverable.
}`,
        lang: "go",
      },
      {
        title: "The Green Tea garbage collector",
        body:
          "Green Tea (GOEXPERIMENT=greenteagc) restructures the GC around spatial locality: it scans memory in contiguous 8 KiB spans rather than chasing individual objects, dramatically improving cache behaviour and parallel scan throughput on big heaps.",
        code: `// Same code — opt in at build time:
//   GOEXPERIMENT=greenteagc go build ./...
//
// Old GC: object-by-object marking -> scattered cache access.
// Green Tea: mark whole 8 KiB spans -> sequential, parallel,
//            cache-friendly sweeps that scale with cores.`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Use specialized agents to refactor scalar array algorithms into vectorized simd/archsimd blocks with a scalar fallback.",
      prompt:
        "Vectorize this scalar checksum loop using simd/archsimd. Process 16 bytes per iteration, handle the non-multiple-of-16 tail with a scalar remainder loop, and keep a build-tag fallback for architectures without the intrinsics. Add a benchmark comparing both.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Build an ultra-fast transaction-validation loop that verifies block checksums with vector instructions, with secure zeroing of encryption keys via runtime/secret.",
    },
    pitfalls: [
      "Vectorizing without a scalar fallback — your binary then breaks on CPUs/arches without those instructions. Always keep a tail/remainder path.",
      "Hand-rolling SIMD before profiling — only vectorize a loop the profiler proved is hot.",
      "Keeping decrypted keys in ordinary []byte — they survive in core dumps and swap. Use runtime/secret and Destroy.",
    ],
    takeaways: [
      "SIMD turns per-element loops into per-lane loops — huge wins on hot math.",
      "runtime/secret minimizes the window a key is recoverable in memory.",
      "Green Tea trades the object-graph walk for cache-friendly span sweeps.",
    ],
    checklist: [
      "Hot validation loop vectorized with simd/archsimd + scalar fallback.",
      "All key material held in runtime/secret buffers and destroyed.",
      "Green Tea GC evaluated and benchmarked against default.",
      "No secret bytes reachable after use (verified in core dumps).",
    ],
  },

  /* ================================================================= M9 */
  {
    id: "m9",
    code: "M9",
    num: 9,
    part: "part-3",
    title: "Production Governance & Automated Refactoring",
    short: "Governance & Rollout",
    level: "Principal",
    duration: "4 hrs",
    icon: "ship",
    summary:
      "Make GOMAXPROCS cgroup-aware, ship hardened scratch/distroless images, automate fleet-wide refactors with go fix + //go:fix, and capture decisions in ADRs.",
    plain:
      "Running Go in containers and rolling it out safely is its own skill. Go 1.25 now reads the container's CPU limit so it doesn't spawn 128 threads on a 4-core pod. A 'distroless' image ships just your binary — tiny and hard to attack. go fix can rewrite deprecated APIs across an entire codebase automatically. And ADRs are short notes that record why you made a big decision, so the next engineer isn't guessing.",
    animation: {
      id: "container-rollout",
      title: "The Container Rollout",
      blurb:
        "A runtime watches readiness probes during a rolling update, smoothly shifting traffic to new instances as they go healthy and draining the old ones.",
    },
    concepts: [
      {
        title: "Cgroup-aware GOMAXPROCS",
        body:
          "Go 1.25 reads the cgroup CPU bandwidth limit and sets GOMAXPROCS to match the container's real quota instead of the host's core count. No more a 4-core-limited pod spawning 128 Ps and thrashing under CFS throttling.",
        code: `// Go 1.25+ default: GOMAXPROCS follows the cgroup quota.
//   docker run --cpus=4  ->  GOMAXPROCS == 4 automatically
//
// Override only if you must:
//   runtime.SetDefaultGOMAXPROCS() // re-read the limit at runtime
// Pair with GOMEMLIMIT for a soft heap cap inside the pod.`,
        lang: "go",
      },
      {
        title: "Hardened scratch / distroless images",
        body:
          "A static CGO-free Go binary needs no OS. Multi-stage builds compile in a full toolchain image, then copy the single binary into scratch or distroless — a few MB, no shell, no package manager, minimal CVE surface.",
        code: `# build stage
FROM golang:1.26 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /ledger ./cmd/ledger

# final stage — nothing but the binary
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /ledger /ledger
USER nonroot
ENTRYPOINT ["/ledger"]`,
        lang: "go",
      },
      {
        title: "Fleet-wide refactors with go fix + //go:fix",
        body:
          "The overhauled go fix engine plus //go:fix inline directives let library authors ship machine-applicable migrations. Mark a deprecated API and every consumer can be auto-rewritten across repos with a single command.",
        code: `// In a library:
//go:fix inline
func OldValidate(t Txn) error { return Validate(t) }

// Downstream, one command rewrites all call sites:
//   go fix ./...
// OldValidate(x) -> Validate(x) everywhere, safely.`,
        lang: "go",
      },
      {
        title: "Architecture Decision Records",
        body:
          "ADRs are short, append-only records of *why* a choice was made: context, options, decision, consequences. They turn tribal knowledge (and Slack threads) into durable, reviewable history for the next engineer.",
        code: `# ADR-014: Hybrid ML-KEM for inter-node transport
Status: Accepted
Context: harvest-now-decrypt-later threat to 30-year ledger data.
Decision: X25519 + ML-KEM-768 hybrid KEM on all intra-cluster TLS.
Consequences: +1 RTT handshake cost; quantum-resistant confidentiality;
              requires Go 1.24+ crypto/mlkem on every node.`,
        lang: "go",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Auto-draft accurate ADR blueprints from historical Slack threads and internal engineering docs.",
      prompt:
        "From these Slack threads and design-doc excerpts, draft an ADR in the Context / Decision / Consequences format. Extract the real options that were debated, the chosen one, the trade-offs raised, and mark anything still unresolved as an open question.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Package the complete distributed ledger with health/readiness probes and a distroless image, ready for zero-downtime rolling updates on Kubernetes.",
    },
    pitfalls: [
      "Hard-coding GOMAXPROCS in a container — let the cgroup-aware default match the real CPU quota, or you'll thrash under throttling.",
      "Shipping a full Linux base image when a distroless/scratch image would do — it's a needless CVE and size burden.",
      "Rolling an update without readiness probes — traffic hits pods that aren't ready and requests drop.",
    ],
    takeaways: [
      "Let Go size GOMAXPROCS (and GOMEMLIMIT) to the container, not the host.",
      "Distroless/scratch images shrink both size and attack surface.",
      "//go:fix turns deprecations into one-command, fleet-wide migrations.",
    ],
    checklist: [
      "GOMAXPROCS + GOMEMLIMIT respect the container's cgroup limits.",
      "Production image is scratch/distroless, non-root, CGO-free.",
      "Deprecations ship //go:fix directives for auto-migration.",
      "Major infra decisions captured as ADRs.",
    ],
  },
];

/* ------------------------ Extra depth concepts (merged into modules) */
const MORE_CONCEPTS = {
  m3: [{
    title: "Weak pointers for caches (the weak package)",
    body: "Go 1.24's weak package gives you a reference that does NOT keep its target alive. It's ideal for a cache or canonical map that should let entries be collected under memory pressure — the weak handle simply reads back nil once the object is gone.",
    code: `import "weak"

// A cache whose values never prevent garbage collection.
var cache sync.Map // key -> weak.Pointer[Big]

func get(k string) *Big {
    if v, ok := cache.Load(k); ok {
        if p := v.(weak.Pointer[Big]).Value(); p != nil {
            return p // still alive — reuse it
        }
    }
    b := load(k)
    cache.Store(k, weak.Make(b)) // weak ref: GC may reclaim b
    return b
}`,
    lang: "go",
  }],
  m4: [{
    title: "Bubbles detect durable deadlocks",
    body: "A bonus of synctest: if every goroutine in the bubble becomes durably blocked and no timer can fire, that's a deadlock — and the bubble fails the test immediately instead of hanging your CI. You catch 'everyone is waiting on everyone' bugs deterministically.",
    code: `synctest.Test(t, func(t *testing.T) {
    ch := make(chan int) // nobody will ever send
    <-ch                 // durably blocked, no timers left
    // synctest reports a deadlock and FAILS the test here,
    // instead of hanging for the whole test timeout.
})`,
    lang: "go",
  }],
  m5: [{
    title: "Explicit transactions with pgx.Tx",
    body: "For multi-statement atomicity, begin a transaction, defer a Rollback, and Commit at the end. The deferred Rollback is a no-op after a successful Commit, so this pattern is always safe — any early return undoes the partial work.",
    code: `tx, err := pool.Begin(ctx)
if err != nil { return err }
defer tx.Rollback(ctx) // no-op once we Commit

if _, err = tx.Exec(ctx, debitSQL, from, cents); err != nil {
    return err // deferred Rollback undoes the debit
}
if _, err = tx.Exec(ctx, creditSQL, to, cents); err != nil {
    return err
}
return tx.Commit(ctx) // both legs land atomically`,
    lang: "go",
  }],
  m6: [{
    title: "Turn on the hybrid group in crypto/tls",
    body: "Post-quantum protection only applies if the TLS 1.3 handshake actually negotiates a hybrid group. Recent Go enables X25519MLKEM768 by default; pin it explicitly via CurvePreferences so both peers prefer it, with classical X25519 as a fallback.",
    code: `cfg := &tls.Config{
    MinVersion: tls.VersionTLS13,
    CurvePreferences: []tls.CurveID{
        tls.X25519MLKEM768, // hybrid post-quantum, preferred
        tls.X25519,         // classical fallback
    },
}
// Both peers must support the group for it to be chosen.`,
    lang: "go",
  }],
  m7: [{
    title: "Full execution traces with go tool trace",
    body: "A FlightRecorder dump is a runtime/trace file — open it with `go tool trace` for a timeline of every goroutine, GC cycle, syscall and scheduler event. It's the microscope for 'why did this 50 ms request actually take 50 ms'.",
    code: `import "runtime/trace"

f, _ := os.Create("trace.out")
trace.Start(f)
defer trace.Stop()
// ... run the workload (or dump from the FlightRecorder) ...

// Then explore it interactively:
//   go tool trace trace.out
//   -> per-goroutine timelines, GC, syscalls, scheduler latency`,
    lang: "go",
  }],
  m8: [{
    title: "Help the compiler first: bounds-check elimination & inlining",
    body: "Before reaching for SIMD, make the scalar loop fast: range over a slice (not an index) so the compiler can prove indices are in range and remove per-iteration bounds checks, and keep hot functions small enough to inline. Measure both with gcflags.",
    code: `func sum(b []byte) (s uint64) {
    for i := range b {
        s += uint64(b[i]) // bounds check usually eliminated
    }
    return
}
// Inspect the compiler's decisions:
//   go build -gcflags='-m'                          (inlining/escape)
//   go build -gcflags='-d=ssa/check_bce/debug=1'    (bounds checks)`,
    lang: "go",
  }],
};
MODULES.forEach((m) => { if (MORE_CONCEPTS[m.id]) m.concepts = m.concepts.concat(MORE_CONCEPTS[m.id]); });

/* ------------------------------------- Glossary / key terms per module */
const GLOSSARY = {
  f1: [
    ["Mark & sweep", "Find every reachable (live) object, then free all the rest."],
    ["Tri-color", "White = untouched, grey = reached-not-scanned, black = scanned. White at the end is garbage."],
    ["Write barrier", "Tiny bookkeeping on pointer writes so concurrent marking never loses a live object."],
    ["GOGC", "Heap-growth target before the next GC (default 100 = let the live heap double)."],
    ["GOMEMLIMIT", "Soft total-memory cap; the GC works harder as you approach it to avoid OOM."],
    ["Stop-the-world", "The brief pauses where all goroutines halt — sub-millisecond in Go."],
  ],
  f2: [
    ["Profile", "A statistical sample of where a program spends a resource (CPU, memory…)."],
    ["Flame graph", "Stacked bars where width = time/resources and stacking = call nesting."],
    ["net/http/pprof", "Blank-import package that exposes /debug/pprof/* endpoints on a live server."],
    ["Sampling", "Recording the running stack many times/second instead of instrumenting every call."],
    ["inuse vs alloc", "Heap-profile views: memory currently held vs total ever allocated."],
  ],
  f3: [
    ["Table-driven test", "A slice of cases run through the same logic, each as a subtest."],
    ["Subtest (t.Run)", "A named, isolated child test with its own pass/fail."],
    ["Coverage", "The share of code lines exercised by your tests."],
    ["Fuzzing", "Auto-generated random inputs that hunt for crashes and edge cases."],
    ["t.Helper()", "Marks a function as a helper so failures point at the caller."],
    ["Golden file", "A recorded 'expected output' file a test compares against."],
  ],
  f4: [
    ["Goroutine", "A lightweight, runtime-scheduled concurrent function (~2 KB starting stack)."],
    ["Channel", "A typed, synchronized pipe for passing values between goroutines."],
    ["Unbuffered / buffered", "Rendezvous (block until paired) vs holds up to N values."],
    ["select", "Wait on several channel operations; the first ready one proceeds."],
    ["Fan-out / fan-in", "Spread work to N workers / merge their results onto one channel."],
    ["Goroutine leak", "A goroutine blocked forever that is never reclaimed."],
  ],
  f5: [
    ["error", "A value returned to signal failure; checked with if err != nil."],
    ["Wrapping (%w)", "Embedding a cause inside a new error so the chain stays inspectable."],
    ["errors.Is / As", "Search the error chain for a sentinel value / a concrete type."],
    ["Sentinel error", "A predefined error value callers compare against."],
    ["context.Context", "Carries cancellation, deadlines and request-scoped values across calls."],
    ["internal/", "A directory whose packages only your own module may import."],
  ],
  m1: [
    ["ServeMux", "Go's standard-library HTTP request router."],
    ["Pattern", "A method + path template such as 'GET /api/v1/ledger/{id}'."],
    ["Wildcard / PathValue", "A {name} path segment, read with r.PathValue(name)."],
    ["Radix trie", "The prefix-tree the mux matches incoming paths against."],
    ["os.Root", "A directory handle that refuses any access resolving outside it."],
    ["Path traversal", "An attack using ../ to read files outside the intended folder."],
  ],
  m2: [
    ["Serialization", "Converting in-memory values to bytes (e.g. JSON) and back."],
    ["Reflection", "Runtime type inspection — flexible but comparatively slow."],
    ["jsontext", "The low-level streaming JSON token API in encoding/json/v2."],
    ["Swiss Table", "A cache-friendly map layout that checks 8 slots' tags at once."],
    ["Control byte", "A 1-byte per-slot tag a Swiss Table compares SIMD-style."],
    ["Escape analysis", "The compiler deciding whether a value lives on the stack or heap."],
  ],
  m3: [
    ["Finalizer", "Legacy, unreliable pre-collection callback — avoid it."],
    ["runtime.AddCleanup", "Modern, run-once cleanup that fires after an object is unreachable."],
    ["Interning", "Deduplicating equal values to one shared copy (unique.Make)."],
    ["Weak pointer", "A reference that does not keep its target alive (weak package)."],
    ["G-M-P", "The goroutine / OS-thread (M) / processor (P) scheduling model."],
    ["Netpoller", "Parks IO-blocked goroutines so no OS thread spins waiting."],
  ],
  m4: [
    ["Flaky test", "A test that passes or fails non-deterministically between runs."],
    ["synctest bubble", "An isolated group of goroutines running on a fake clock."],
    ["Virtual clock", "Simulated time that jumps forward when all goroutines block."],
    ["synctest.Wait", "A barrier that returns once every bubbled goroutine is parked."],
    ["b.Loop()", "The modern benchmark loop that replaces for i := 0; i < b.N."],
    ["Durably blocked", "Blocked such that it cannot proceed without external input."],
  ],
  m5: [
    ["sqlc", "Generates type-safe Go from raw SQL + schema at build time."],
    ["pgxpool", "A managed pool of Postgres connections with lifetimes and limits."],
    ["Row-level lock", "SELECT … FOR UPDATE — locks specific rows, not the whole table."],
    ["Double-entry", "Every transfer debits one account and credits another by the same amount."],
    ["SQLSTATE", "Postgres's 5-character error code (e.g. 23505 = unique_violation)."],
    ["40001", "serialization_failure — a concurrency conflict that should be retried."],
  ],
  m6: [
    ["gRPC", "An RPC framework over HTTP/2 that carries Protobuf messages."],
    ["Protobuf", "Compact, schema-defined binary serialization."],
    ["ML-KEM", "NIST's post-quantum key-encapsulation mechanism (lattice-based)."],
    ["Hybrid KEM", "Classical + post-quantum combined; secure unless BOTH break."],
    ["Harvest-now-decrypt-later", "Recording ciphertext today to decrypt with a future quantum computer."],
    ["Field number", "A Protobuf tag identifying a field — never reuse a retired one."],
  ],
  m7: [
    ["FlightRecorder", "An always-on, bounded in-memory buffer of recent trace events."],
    ["Execution trace", "A timeline of goroutines, GC, syscalls and scheduling (go tool trace)."],
    ["Goroutine dump", "A snapshot of every goroutine's current stack."],
    ["p99 latency", "The latency 99% of requests beat — the slow tail."],
    ["Goroutine leak", "A goroutine stuck forever and never reclaimed."],
  ],
  m8: [
    ["SIMD", "One instruction operating on a vector of values at once."],
    ["Vector lane", "One element slot within a SIMD register."],
    ["Scalar fallback", "A plain loop for CPUs/arches without the vector path."],
    ["runtime/secret", "A buffer that zeroes secrets and stays off the movable heap."],
    ["Green Tea GC", "Experimental collector that scans contiguous 8 KiB spans."],
    ["Bounds-check elimination", "The compiler removing provably-safe slice index checks."],
  ],
  m9: [
    ["GOMAXPROCS", "How many OS threads may run Go code simultaneously."],
    ["cgroup", "Linux kernel resource limits applied to a container."],
    ["Distroless / scratch", "Minimal base images that contain little or no OS."],
    ["go fix / //go:fix", "Tooling that auto-rewrites deprecated call sites across a repo."],
    ["ADR", "Architecture Decision Record — a short note on why a choice was made."],
    ["Readiness probe", "A health check telling the load balancer a pod can take traffic."],
  ],
};

/* ----------------------------------------------------- Verification grid */
const VERIFICATION = [
  ["Go Environment Target", "go 1.26 — strictly enforced via CI checks"],
  ["Linting System", "golangci-lint with custom rule presets"],
  [
    "Concurrency Rule",
    "Zero raw `go` keywords without explicit lifecycle control or errgroup packaging",
  ],
  [
    "Memory Constraint",
    "Zero unmanaged long-term pointers; strict use of runtime.AddCleanup",
  ],
  [
    "Security Enforcement",
    "Strict exclusion of CGO; hybrid ML-KEM PQC configuration for all TLS paths",
  ],
];

/* --------------------------------------------------------- Assignments
   Auto-checkable practice. Types:
     mcq    — multiple choice (answer = index)
     blank  — fill in the blank (accept = list of accepted answers, case-insensitive)
     predict— predict the printed output (accept = list)
     code   — write code, graded by structural rules:
                { has: "substr" } must contain
                { not: "substr" } must NOT contain
                { re:  "regex"  } must match
   ------------------------------------------------------------------- */
const ASSIGNMENTS = {
  f1: [
    { type: "mcq", prompt: "At the end of the mark phase, what does a WHITE object represent?",
      options: ["Reachable and fully scanned", "Reachable but not yet scanned", "Unreachable — it will be swept", "Pinned in memory forever"],
      answer: 2, explain: "White = never reached from the roots, so it is garbage and gets swept. Grey = reachable but not yet scanned; black = scanned." },
    { type: "blank", prompt: "Set a 512 MiB soft memory limit at runtime. Fill the blank:",
      code: `debug.____(512 << 20)`, accept: ["SetMemoryLimit"],
      explain: "debug.SetMemoryLimit(512<<20) sets GOMEMLIMIT in code; the GC gets more aggressive as the heap approaches it." },
    { type: "code", prompt: "Write one line (using runtime/debug) that lets the heap grow ~2× before each GC — i.e. double the default GOGC.",
      starter: `// runtime/debug is already imported\n`,
      checks: [{ has: "SetGCPercent", msg: "Call debug.SetGCPercent" }, { has: "200", msg: "Pass 200 (double the default of 100)" }],
      explain: "debug.SetGCPercent(200) is the programmatic form of GOGC=200: fewer collections, more memory used." },
  ],
  f2: [
    { type: "mcq", prompt: "You want to find which functions burn the most CPU. Which profile do you collect?",
      options: ["goroutine", "cpu", "heap", "mutex"], answer: 1,
      explain: "The CPU profile samples the running stack to show where time is spent. heap = memory, goroutine = leaks, mutex = lock contention." },
    { type: "blank", prompt: "Expose the /debug/pprof endpoints by importing this package for its side effects:",
      code: `import _ "____"`, accept: ["net/http/pprof"],
      explain: 'A blank import of "net/http/pprof" registers the debug handlers on the default mux.' },
    { type: "code", prompt: "Write the command that opens the interactive flame-graph web UI for cpu.out on port 8080.",
      starter: ``, checks: [{ has: "go tool pprof", msg: "Use go tool pprof" }, { has: "-http", msg: "Use the -http web UI flag" }, { has: "cpu.out", msg: "Point it at cpu.out" }],
      explain: "go tool pprof -http=:8080 cpu.out — the fastest way to see the flame graph." },
  ],
  f3: [
    { type: "mcq", prompt: "Which method reports a failure but lets the rest of the test keep running?",
      options: ["t.Fatal", "t.Error", "t.Skip", "t.Log"], answer: 1,
      explain: "t.Error/t.Errorf record a failure and continue; t.Fatal/t.Fatalf stop the current test immediately." },
    { type: "blank", prompt: "Run each table case as a named, isolated subtest. Fill the blank:",
      code: `t.____(c.name, func(t *testing.T) { /* ... */ })`, accept: ["Run"],
      explain: "t.Run(name, fn) creates a subtest — failures point at the exact case name." },
    { type: "code", prompt: "Write the everyday command to run all tests with the race detector and coverage.",
      starter: ``, checks: [{ has: "go test", msg: "Use go test" }, { has: "-race", msg: "Enable the race detector with -race" }, { has: "-cover", msg: "Enable coverage with -cover" }],
      explain: "go test -race -cover ./... — run it constantly." },
  ],
  f4: [
    { type: "mcq", prompt: "A send on an UNBUFFERED channel blocks until:",
      options: ["the buffer is full", "a receiver is ready to receive", "the channel is closed", "the GC runs"], answer: 1,
      explain: "Unbuffered channels are a rendezvous: the send completes only when a receiver is ready. Buffered channels block only when full." },
    { type: "predict", prompt: "What does this print?",
      code: `ch := make(chan int, 2)\nch <- 1\nch <- 2\nfmt.Println(len(ch), cap(ch))`, accept: ["2 2"],
      explain: "Two values are buffered (len 2) in a channel of capacity 2 → prints: 2 2." },
    { type: "code", prompt: "Start 3 worker goroutines that each range over a `jobs` channel.",
      starter: `jobs := make(chan int)\n// start 3 workers here\n`,
      checks: [{ has: "go func", msg: "Spawn goroutines with go func" }, { has: "range jobs", msg: "Each worker should range over jobs" }],
      explain: "for w := 0; w < 3; w++ { go func() { for j := range jobs { process(j) } }() } — the classic fan-out." },
  ],
  f5: [
    { type: "mcq", prompt: "Which fmt verb wraps an error so errors.Is / errors.As can later unwrap it?",
      options: ["%v", "%w", "%s", "%e"], answer: 1,
      explain: "%w wraps and preserves the chain; %v/%s only format the text and lose the cause." },
    { type: "predict", prompt: "What does this print?",
      code: `var ErrNF = errors.New("not found")\ne := fmt.Errorf("load: %w", ErrNF)\nfmt.Println(errors.Is(e, ErrNF))`, accept: ["true"],
      explain: "Because %w wrapped ErrNF, errors.Is finds it in the chain → true." },
    { type: "blank", prompt: "Always release a timeout context's resources. Fill the blank:",
      code: `ctx, cancel := context.WithTimeout(ctx, 3*time.Second)\ndefer ____()`, accept: ["cancel"],
      explain: "defer cancel() releases the timer and signals children — required even if the timeout never fires." },
  ],
  m1: [
    { type: "mcq", prompt: "When two patterns could match, Go 1.22+ ServeMux picks:",
      options: ["the first one registered", "the longest (most specific) matching pattern", "alphabetical order", "a random one"], answer: 1,
      explain: "Precedence is most-specific-wins, so /ledger/{id}/audit beats /ledger/{id}." },
    { type: "blank", prompt: "Read the {id} wildcard captured by the pattern. Fill the blank:",
      code: `id := r.____("id")`, accept: ["PathValue"],
      explain: "r.PathValue(\"id\") returns the wildcard segment — no regexp, no allocations." },
    { type: "code", prompt: "Register getEntry for GET /api/v1/ledger/{id} on mux — no third-party router.",
      starter: `mux := http.NewServeMux()\n`,
      checks: [{ has: "HandleFunc", msg: "Use mux.HandleFunc" }, { has: "GET /api/v1/ledger/{id}", msg: "Match method + path: GET /api/v1/ledger/{id}" }, { not: "gin", msg: "No gin import" }, { not: "chi", msg: "No chi import" }],
      explain: 'mux.HandleFunc("GET /api/v1/ledger/{id}", getEntry)' },
  ],
  m2: [
    { type: "mcq", prompt: "Swiss-Table map lookups are faster mainly because they:",
      options: ["avoid hashing the key", "check 8 slots' control bytes in parallel within one cache line", "keep entries sorted", "never resize"], answer: 1,
      explain: "A group of 8 control bytes fits in a cache line and is compared SIMD-style, so a lookup usually touches one cache line." },
    { type: "blank", prompt: "Allocate a *int64 pointing to 25 in one expression (Go's new(expr)). Fill the blank:",
      code: `fee := ____(int64(25))`, accept: ["new"],
      explain: "new(int64(25)) allocates and returns a *int64 inline — handy for optional fields." },
    { type: "code", prompt: "Write the `go build` command that prints the compiler's escape-analysis decisions.",
      starter: ``, checks: [{ has: "go build", msg: "Use go build" }, { has: "-gcflags", msg: "Pass compiler flags with -gcflags" }, { has: "-m", msg: "Enable escape analysis output with -m" }],
      explain: "go build -gcflags='-m' ./... — look for 'does not escape'." },
  ],
  m3: [
    { type: "mcq", prompt: "Why must a runtime.AddCleanup closure NOT capture the object it cleans?",
      options: ["it would run too early", "it keeps the object reachable forever — the exact leak you wanted to avoid", "cleanups can't take arguments", "it panics at compile time"], answer: 1,
      explain: "Capturing the object makes it reachable, so it's never collected and the cleanup never runs. Capture the raw handle (fd) by value instead." },
    { type: "blank", prompt: "Intern a repeated string to a shared, comparable handle. Fill the blank:",
      code: `usd := unique.____("USD")`, accept: ["Make"],
      explain: "unique.Make(\"USD\") returns a Handle[string]; equal values share one copy and compare by pointer." },
    { type: "mcq", prompt: "Compared to runtime.SetFinalizer, runtime.AddCleanup:",
      options: ["can resurrect the object", "runs once and never resurrects the object", "delays collection by a full GC cycle", "is deprecated"], answer: 1,
      explain: "AddCleanup runs exactly once after the object is truly unreachable, with no resurrection — strictly better than finalizers." },
  ],
  m4: [
    { type: "mcq", prompt: "Inside a synctest bubble, time.Sleep(5 * time.Second):",
      options: ["really blocks for 5 seconds", "advances the fake clock instantly once all goroutines are blocked", "is ignored entirely", "panics"], answer: 1,
      explain: "The bubble clock is virtual: when every goroutine is blocked, time jumps to the next timer instantly and deterministically." },
    { type: "blank", prompt: "Block the test until every other goroutine in the bubble is parked. Fill the blank:",
      code: `synctest.____()`, accept: ["Wait"],
      explain: "synctest.Wait() is a precise 'everyone is durably blocked' barrier — replaces 'sleep and hope'." },
    { type: "code", prompt: "Write the header line of a modern benchmark loop (no b.N bookkeeping).",
      starter: `func BenchmarkValidate(b *testing.B) {\n    // your loop here\n}`,
      checks: [{ has: "b.Loop()", msg: "Use for b.Loop()" }],
      explain: "for b.Loop() { ... } — keeps values alive and runs setup once." },
  ],
  m5: [
    { type: "mcq", prompt: "sqlc's main benefit is that it moves SQL mistakes:",
      options: ["from compile time to runtime", "from runtime to compile time", "from the client to the server", "into the logs only"], answer: 1,
      explain: "sqlc generates typed Go from your SQL + schema, so a wrong column or type fails at code-gen, not in production." },
    { type: "mcq", prompt: "A Postgres error with SQLSTATE '40001' (serialization_failure) should be:",
      options: ["ignored", "retried (re-run the transaction)", "always returned as HTTP 500", "logged and dropped"], answer: 1,
      explain: "40001 means the transaction lost a serialization race; the correct response is to retry it." },
    { type: "blank", prompt: "Match a typed *pgconn.PgError without the var-and-assert dance (Go 1.26). Fill the blank:",
      code: `if pgErr, ok := errors.____[*pgconn.PgError](err); ok {`, accept: ["AsType"],
      explain: "errors.AsType[*pgconn.PgError](err) is a generic, allocation-free errors.As." },
  ],
  m6: [
    { type: "mcq", prompt: "'Harvest now, decrypt later' attacks are defeated by:",
      options: ["bigger RSA keys", "a hybrid classical + ML-KEM key exchange", "turning off TLS", "faster CPUs"], answer: 1,
      explain: "Hybrid key exchange stays secure unless BOTH X25519 and ML-KEM are broken — so recorded traffic resists a future quantum computer." },
    { type: "mcq", prompt: "When evolving a Protobuf message, you must NEVER:",
      options: ["add a new optional field", "reuse a retired field number", "add a brand-new message type", "bump the Go version"], answer: 1,
      explain: "Reusing a field number makes old and new nodes misread the same bytes. Reserve retired numbers." },
    { type: "blank", prompt: "Generate an ML-KEM-768 decapsulation key with crypto/mlkem. Fill the blank:",
      code: `dk, _ := mlkem.____()`, accept: ["GenerateKey768"],
      explain: "mlkem.GenerateKey768() returns a decapsulation key; its EncapsulationKey() is published to peers." },
  ],
  m7: [
    { type: "mcq", prompt: "The FlightRecorder is cheap to keep always-on because it:",
      options: ["writes every event straight to disk", "keeps a bounded in-memory ring buffer, written out only on demand", "samples once per day", "disables the GC while running"], answer: 1,
      explain: "It holds a small rolling window in memory; you only pay to serialize a trace when something interesting happens." },
    { type: "mcq", prompt: "A goroutine parked forever on <-ch with no possible sender is a:",
      options: ["whole-program deadlock", "goroutine leak", "compile error", "data race"], answer: 1,
      explain: "Other goroutines keep running, but this one never exits and its memory is never freed — a leak the analyzer can trace." },
    { type: "blank", prompt: "Dump all goroutine stacks to a file. Fill the blank:",
      code: `pprof.Lookup("____").WriteTo(f, 2)`, accept: ["goroutine"],
      explain: 'pprof.Lookup("goroutine").WriteTo(f, 2) writes every goroutine stack (debug level 2).' },
  ],
  m8: [
    { type: "mcq", prompt: "Why keep a scalar fallback alongside a simd/archsimd loop?",
      options: ["the scalar path is faster", "not every CPU/architecture has the vector instructions", "to save memory", "purely for style"], answer: 1,
      explain: "Vector intrinsics are arch-specific; a scalar remainder/fallback path keeps the binary correct everywhere (and handles the non-multiple-of-lane tail)." },
    { type: "mcq", prompt: "runtime/secret protects a key in memory by:",
      options: ["encrypting it in place", "zeroing the buffer after use and keeping it off the movable heap", "printing it to verify", "handing it to the GC"], answer: 1,
      explain: "It minimizes the exposure window: the key is scrubbed on Destroy and never copied around the movable heap (so it won't linger in core dumps)." },
    { type: "blank", prompt: "Opt into the Green Tea GC at build time. Fill the blank:",
      code: `GOEXPERIMENT=____ go build ./...`, accept: ["greenteagc"],
      explain: "GOEXPERIMENT=greenteagc enables the span-based collector — no code changes." },
  ],
  m9: [
    { type: "mcq", prompt: "On a pod limited to 4 CPUs, Go 1.25 sets GOMAXPROCS to:",
      options: ["the host's total core count", "4 — the cgroup CPU quota", "1", "128"], answer: 1,
      explain: "Go 1.25 reads the cgroup limit so GOMAXPROCS matches the real quota, avoiding CFS throttling." },
    { type: "mcq", prompt: "Shipping a distroless / scratch final image gives you:",
      options: ["a full shell for debugging", "smaller size and a much smaller attack surface", "faster compiles", "more CVEs"], answer: 1,
      explain: "A static Go binary needs no OS — no shell, no package manager, minimal CVE surface, a few MB." },
    { type: "blank", prompt: "Auto-rewrite deprecated call sites flagged by //go:fix across the repo. Fill the blank:",
      code: `go ____ ./...`, accept: ["fix"],
      explain: "go fix ./... applies machine-applicable migrations declared with //go:fix." },
  ],
};

window.COURSE = { COURSE_META, PARTS, MODULES, VERIFICATION, ASSIGNMENTS, GLOSSARY };

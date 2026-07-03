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
    "Start by writing idiomatic Go - goroutines, channels, errors, tests - then go under the runtime and the hardware, and build a zero-dependency, post-quantum-secure Distributed Financial Ledger on Go 1.24–1.26.",
  target: "go 1.26 (strictly enforced via CI)",
  capstone: "Distributed Financial Ledger",
  ledgerRoadmap: {
    f4: {
      title: "Ledger command pipeline",
      body: "Build the bounded goroutine/channel pipeline that accepts transfer commands, fans out validation work, and shuts down cleanly under cancellation.",
    },
    m19: {
      title: "Hot-account LRU cache",
      body: "Add the O(1) LRU cache that keeps hot account balances in memory, plus the BFS-style dependency walk used to validate transfer chains.",
    },
    f5: {
      title: "Request lifecycle and error contract",
      body: "Define context propagation, wrapped domain errors, and package boundaries so every ledger request has one owner and one observable failure path.",
    },
    f3: {
      title: "Invariant test harness",
      body: "Lock in ledger invariants with table tests, subtests, fuzz cases, and test doubles before the system grows distributed.",
    },
    f1: {
      title: "Memory budget for sustained throughput",
      body: "Set the GC and allocation discipline that keeps ledger ingestion predictable under long-running load.",
    },
    f2: {
      title: "Profiling loop for real bottlenecks",
      body: "Add pprof workflows that prove where ledger CPU, heap, and goroutine costs are actually coming from.",
    },
    m1: {
      title: "HTTP API and restricted IO boundary",
      body: "Expose the zero-dependency ledger API and keep file access inside a safe, auditable root.",
    },
    m2: {
      title: "Wire format and hot in-memory indexes",
      body: "Design JSON/event serialization and cache-friendly maps for accounts, transfers, and idempotency lookups.",
    },
    m5: {
      title: "Type-safe persistence gateway",
      body: "Create compile-checked SQL access and transaction boundaries for the ledger write path.",
    },
    m17: {
      title: "Postgres source of truth",
      body: "Protect ledger invariants with schema constraints, idempotency keys, outbox rows, indexes, online migrations, and vacuum discipline.",
    },
    m13: {
      title: "Concurrent state coordination",
      body: "Choose atomics, mutexes, or channels for account caches, sequencing, metrics, and cross-goroutine ownership.",
    },
    m4: {
      title: "Deterministic concurrency tests",
      body: "Make timeout, retry, and race-sensitive ledger flows reproducible with controlled time and stable benchmarks.",
    },
    m3: {
      title: "Lifecycle cleanup and interning",
      body: "Attach cleanup to resources, intern repeated identifiers, and keep runtime lifecycles from leaking ledger memory.",
    },
    m7: {
      title: "Live diagnostics and leak forensics",
      body: "Add flight recording, triggerable dumps, and goroutine leak checks for production ledger incidents.",
    },
    m10: {
      title: "Cache-friendly ledger layout",
      body: "Shape hot structs and slices so balances, sequence numbers, and audit entries move through CPU caches efficiently.",
    },
    m11: {
      title: "Branch-aware hot path",
      body: "Reduce unpredictable branches and dependency chains in validation, balance checks, and serialization loops.",
    },
    m12: {
      title: "Scheduler-aware worker sizing",
      body: "Tune goroutine fan-out, netpoll behavior, and GOMAXPROCS expectations for the ledger's latency and throughput goals.",
    },
    m8: {
      title: "SIMD batches and secret scrubbing",
      body: "Batch verify ledger records where vectorization helps and scrub sensitive key material after use.",
    },
    m6: {
      title: "Post-quantum service boundary",
      body: "Harden ledger service-to-service communication with hybrid ML-KEM defenses and strict protocol compatibility.",
    },
    m14: {
      title: "Observability contract",
      body: "Instrument logs, metrics, traces, and SLOs so every ledger transfer can be explained without guesswork.",
    },
    m15: {
      title: "Resilient distributed execution",
      body: "Add retries, idempotency, circuit breakers, backpressure, and graceful degradation around ledger dependencies.",
    },
    m16: {
      title: "Redis coordination and cache-aside",
      body: "Use Redis deliberately for cache-aside reads, distributed locks, and invalidation without making it the ledger source of truth.",
    },
    m9: {
      title: "Production rollout and governance",
      body: "Package, deploy, refactor, and govern the ledger with container-aware runtime settings and ADR-backed production controls.",
    },
    m18: {
      title: "SRE operating model",
      body: "Define SLOs, alerts, on-call, RCA, toil automation and platform review standards so the ledger is operated like a reliable production service.",
    },
  },
  finalProjectFiles: [
    {
      path: "go.mod",
      lang: "mod",
      code: `module example.com/distributed-financial-ledger

go 1.26`,
    },
    {
      path: "cmd/ledger/main.go",
      lang: "go",
      code: `package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"

	"example.com/distributed-financial-ledger/internal/ledger"
	"example.com/distributed-financial-ledger/internal/security"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	repo := ledger.NewMemoryRepository(map[string]int64{"alice": 10_000, "bob": 5_000, "treasury": 1_000_000})
	svc := ledger.NewService(repo)
	pq, err := security.NewPQBox()
	if err != nil {
		log.Error("pq init failed", "err", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /accounts", func(w http.ResponseWriter, r *http.Request) {
		accounts, err := svc.Snapshot(r.Context())
		if err != nil {
			writeError(w, http.StatusRequestTimeout, err)
			return
		}
		writeJSON(w, http.StatusOK, accounts)
	})
	mux.HandleFunc("GET /entries", func(w http.ResponseWriter, r *http.Request) {
		entries, err := svc.Entries(r.Context())
		if err != nil {
			writeError(w, http.StatusRequestTimeout, err)
			return
		}
		writeJSON(w, http.StatusOK, entries)
	})
	mux.HandleFunc("POST /transfers", func(w http.ResponseWriter, r *http.Request) {
		var req ledger.TransferRequest
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		entry, err := svc.Transfer(r.Context(), req)
		if err != nil {
			status := http.StatusBadRequest
			if errors.Is(err, ledger.ErrInsufficient) {
				status = http.StatusConflict
			}
			writeError(w, status, err)
			return
		}
		log.Info("transfer committed", "id", entry.ID, "from", entry.From, "to", entry.To, "amount", entry.Amount)
		writeJSON(w, http.StatusCreated, entry)
	})
	mux.HandleFunc("GET /security/mlkem768/public", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"alg":        "ML-KEM-768",
			"public_key": base64.StdEncoding.EncodeToString(pq.PublicKey()),
		})
	})

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           requestLog(log, mux),
		ReadHeaderTimeout: 3 * time.Second,
	}
	log.Info("ledger listening", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Error("server stopped", "err", err)
		os.Exit(1)
	}
}

func requestLog(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Info("request", "method", r.Method, "path", r.URL.Path, "dur", time.Since(start).String())
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}`,
    },
    {
      path: "internal/ledger/model.go",
      lang: "go",
      code: `package ledger

import (
	"errors"
	"time"
)

var (
	ErrInvalidTransfer = errors.New("invalid transfer")
	ErrInsufficient    = errors.New("insufficient funds")
)

type TransferRequest struct {
	From           string
	To             string
	Amount         int64
	IdempotencyKey string
}

type Entry struct {
	ID             uint64
	From           string
	To             string
	Amount         int64
	At             time.Time
	IdempotencyKey string
}

type Account struct {
	ID      string
	Balance int64
}`,
    },
    {
      path: "internal/ledger/repository.go",
      lang: "go",
      code: `package ledger

import "context"

type Repository interface {
	WithIdempotency(ctx context.Context, key string, fn func(Tx) (Entry, error)) (Entry, error)
	Snapshot(ctx context.Context) ([]Account, error)
	Entries(ctx context.Context) ([]Entry, error)
}

type Tx interface {
	Balance(account string) int64
	Move(from, to string, amount int64) error
	Append(entry Entry) (Entry, error)
}`,
    },
    {
      path: "internal/ledger/service.go",
      lang: "go",
      code: `package ledger

import (
	"context"
	"fmt"
	"time"
)

type Service struct {
	repo  Repository
	clock func() time.Time
}

func NewService(repo Repository) *Service {
	return &Service{
		repo:  repo,
		clock: func() time.Time { return time.Now().UTC() },
	}
}

func (s *Service) Transfer(ctx context.Context, req TransferRequest) (Entry, error) {
	if err := validate(req); err != nil {
		return Entry{}, err
	}
	return s.repo.WithIdempotency(ctx, req.IdempotencyKey, func(tx Tx) (Entry, error) {
		if balance := tx.Balance(req.From); balance < req.Amount {
			return Entry{}, fmt.Errorf("%w: %s has %d, needs %d", ErrInsufficient, req.From, balance, req.Amount)
		}
		if err := tx.Move(req.From, req.To, req.Amount); err != nil {
			return Entry{}, err
		}
		return tx.Append(Entry{
			From:           req.From,
			To:             req.To,
			Amount:         req.Amount,
			At:             s.clock(),
			IdempotencyKey: req.IdempotencyKey,
		})
	})
}

func (s *Service) Snapshot(ctx context.Context) ([]Account, error) {
	return s.repo.Snapshot(ctx)
}

func (s *Service) Entries(ctx context.Context) ([]Entry, error) {
	return s.repo.Entries(ctx)
}

func validate(req TransferRequest) error {
	if req.From == "" || req.To == "" || req.From == req.To || req.Amount <= 0 || req.IdempotencyKey == "" {
		return fmt.Errorf("%w: from, to, positive amount and idempotency key are required", ErrInvalidTransfer)
	}
	return nil
}`,
    },
    {
      path: "internal/ledger/memory_repository.go",
      lang: "go",
      code: `package ledger

import (
	"context"
	"hash/fnv"
	"sort"
	"sync"
	"sync/atomic"
)

const shardCount = 32

type shard struct {
	mu       sync.Mutex
	balances map[string]int64
}

type idemRecord struct {
	done  chan struct{}
	entry Entry
	err   error
}

type MemoryRepository struct {
	shards  [shardCount]shard
	entries struct {
		sync.RWMutex
		list []Entry
	}
	idem struct {
		sync.Mutex
		m map[string]*idemRecord
	}
	next atomic.Uint64
}

func NewMemoryRepository(seed map[string]int64) *MemoryRepository {
	r := &MemoryRepository{}
	r.idem.m = make(map[string]*idemRecord)
	for i := range r.shards {
		r.shards[i].balances = make(map[string]int64)
	}
	for id, balance := range seed {
		s := r.shardFor(id)
		s.balances[id] = balance
	}
	return r
}

func (r *MemoryRepository) WithIdempotency(ctx context.Context, key string, fn func(Tx) (Entry, error)) (Entry, error) {
	if err := ctx.Err(); err != nil {
		return Entry{}, err
	}
	if entry, wait, owner := r.beginIdempotent(key); !owner {
		if wait == nil {
			return entry, nil
		}
		select {
		case <-ctx.Done():
			return Entry{}, ctx.Err()
		case <-wait:
			return r.lookupIdempotent(key)
		}
	}

	tx := &memoryTx{repo: r}
	entry, err := fn(tx)
	r.finishIdempotent(key, entry, err)
	return entry, err
}

func (r *MemoryRepository) Snapshot(ctx context.Context) ([]Account, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	out := make([]Account, 0)
	for i := range r.shards {
		s := &r.shards[i]
		s.mu.Lock()
		for id, balance := range s.balances {
			out = append(out, Account{ID: id, Balance: balance})
		}
		s.mu.Unlock()
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func (r *MemoryRepository) Entries(ctx context.Context) ([]Entry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.entries.RLock()
	defer r.entries.RUnlock()
	return append([]Entry(nil), r.entries.list...), nil
}

func (r *MemoryRepository) beginIdempotent(key string) (Entry, <-chan struct{}, bool) {
	r.idem.Lock()
	defer r.idem.Unlock()
	if rec := r.idem.m[key]; rec != nil {
		if rec.done == nil {
			return rec.entry, nil, false
		}
		return Entry{}, rec.done, false
	}
	r.idem.m[key] = &idemRecord{done: make(chan struct{})}
	return Entry{}, nil, true
}

func (r *MemoryRepository) finishIdempotent(key string, entry Entry, err error) {
	r.idem.Lock()
	rec := r.idem.m[key]
	if err != nil {
		delete(r.idem.m, key)
	} else {
		rec.entry = entry
		rec.err = nil
	}
	done := rec.done
	rec.done = nil
	r.idem.Unlock()
	close(done)
}

func (r *MemoryRepository) lookupIdempotent(key string) (Entry, error) {
	r.idem.Lock()
	defer r.idem.Unlock()
	rec := r.idem.m[key]
	if rec == nil {
		return Entry{}, ErrInvalidTransfer
	}
	return rec.entry, rec.err
}

func (r *MemoryRepository) shardFor(account string) *shard {
	return &r.shards[r.shardIndex(account)]
}

func (r *MemoryRepository) shardIndex(account string) uint32 {
	h := fnv.New32a()
	_, _ = h.Write([]byte(account))
	return h.Sum32() % shardCount
}

type memoryTx struct {
	repo *MemoryRepository
}

func (tx *memoryTx) Balance(account string) int64 {
	s := tx.repo.shardFor(account)
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.balances[account]
}

func (tx *memoryTx) Move(from, to string, amount int64) error {
	a := tx.repo.shardIndex(from)
	b := tx.repo.shardIndex(to)
	first, second := a, b
	if second < first {
		first, second = second, first
	}
	tx.repo.shards[first].mu.Lock()
	if second != first {
		tx.repo.shards[second].mu.Lock()
	}
	defer tx.repo.shards[first].mu.Unlock()
	if second != first {
		defer tx.repo.shards[second].mu.Unlock()
	}

	tx.repo.shards[a].balances[from] -= amount
	tx.repo.shards[b].balances[to] += amount
	return nil
}

func (tx *memoryTx) Append(entry Entry) (Entry, error) {
	entry.ID = tx.repo.next.Add(1)
	tx.repo.entries.Lock()
	tx.repo.entries.list = append(tx.repo.entries.list, entry)
	tx.repo.entries.Unlock()
	return entry, nil
}`,
    },
    {
      path: "internal/security/pq.go",
      lang: "go",
      code: `package security

import (
	"crypto/mlkem"
	"crypto/sha256"
)

type PQBox struct {
	decap *mlkem.DecapsulationKey768
}

func NewPQBox() (*PQBox, error) {
	k, err := mlkem.GenerateKey768()
	if err != nil {
		return nil, err
	}
	return &PQBox{decap: k}, nil
}

func (p *PQBox) PublicKey() []byte {
	return p.decap.EncapsulationKey().Bytes()
}

func (p *PQBox) Decapsulate(ciphertext []byte) ([32]byte, error) {
	shared, err := p.decap.Decapsulate(ciphertext)
	if err != nil {
		return [32]byte{}, err
	}
	return sha256.Sum256(shared), nil
}

func Encapsulate(publicKey []byte) (sharedHash [32]byte, ciphertext []byte, err error) {
	ek, err := mlkem.NewEncapsulationKey768(publicKey)
	if err != nil {
		return [32]byte{}, nil, err
	}
	shared, ciphertext := ek.Encapsulate()
	return sha256.Sum256(shared), ciphertext, nil
}`,
    },
    {
      path: "internal/ledger/service_test.go",
      lang: "go",
      code: `package ledger

import (
	"context"
	"sync"
	"testing"
)

func TestTransferIsIdempotent(t *testing.T) {
	repo := NewMemoryRepository(map[string]int64{"alice": 100, "bob": 0})
	svc := NewService(repo)
	req := TransferRequest{From: "alice", To: "bob", Amount: 10, IdempotencyKey: "tx-1"}
	const calls = 32
	var wg sync.WaitGroup
	wg.Add(calls)
	for i := 0; i < calls; i++ {
		go func() {
			defer wg.Done()
			if _, err := svc.Transfer(context.Background(), req); err != nil {
				t.Errorf("Transfer: %v", err)
			}
		}()
	}
	wg.Wait()
	accounts, err := svc.Snapshot(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got := accounts[0].Balance; got != 90 {
		t.Fatalf("alice balance = %d, want 90", got)
	}
	if got := accounts[1].Balance; got != 10 {
		t.Fatalf("bob balance = %d, want 10", got)
	}
	entries, err := svc.Entries(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got := len(entries); got != 1 {
		t.Fatalf("entries = %d, want 1", got)
	}
}`,
    }
  ],
};

/* Parts are ordered as a single beginner → principal ramp. The part `id`s
   are stable opaque keys (part-0..part-5); the visible sequence comes from
   this array's order and each part's `modules` list. Module display order,
   sidebar order, and prev/next navigation are all derived from PARTS in
   app.js, so a module's position is defined here, not by the MODULES array. */
const PARTS = [
  {
    id: "part-0",
    label: "Part 1",
    title: "Writing Idiomatic Go",
    level: "Beginner",
    modules: ["f4", "f5", "f3", "m19"],
  },
  {
    id: "part-1",
    label: "Part 2",
    title: "The Go Runtime",
    level: "Beginner → Mid-Level",
    modules: ["f1", "f2"],
  },
  {
    id: "part-2",
    label: "Part 3",
    title: "Building Real Systems",
    level: "Mid → Senior",
    modules: ["m1", "m2", "m5", "m17"],
  },
  {
    id: "part-3",
    label: "Part 4",
    title: "Advanced Concurrency & Correctness",
    level: "Senior",
    modules: ["m13", "m4", "m3", "m7"],
  },
  {
    id: "part-4",
    label: "Part 5",
    title: "Under the Hood - Hardware Sympathy",
    level: "Staff · Deep Architecture",
    modules: ["m10", "m11", "m12", "m8"],
  },
  {
    id: "part-5",
    label: "Part 6",
    title: "Distributed Systems & Production",
    level: "Staff / Principal",
    modules: ["m6", "m14", "m15", "m16", "m9", "m18"],
  },
];

const MODULES = [
  /* ================================================================= F1 */
  {
    id: "f1",
    code: "R1",
    num: 4,
    part: "part-1",
    title: "How Go's Garbage Collector Works",
    short: "Garbage Collector",
    level: "Beginner",
    duration: "2–3 hrs",
    icon: "recycle",
    summary:
      "Demystify automatic memory management: the concurrent tri-color mark-and-sweep collector, what GOGC and GOMEMLIMIT actually do, and how to cut GC pressure.",
    plain:
      "Think of the garbage collector (GC) as an automatic janitor for memory. In a language like C you must manually free() everything you allocate. In Go you simply stop using a value and the GC reclaims it for you - while your program keeps running. It does this by repeatedly asking one question: 'starting from what is definitely live right now (global variables and the goroutine stacks), which objects can I still reach by following pointers?' Anything it can no longer reach is garbage, and its memory is given back.",
    animation: {
      id: "gc-mark-sweep",
      title: "Tri-Color Mark & Sweep",
      blurb:
        "Watch the collector start at the roots, paint reachable objects grey then black, and sweep away everything left white - all while the program keeps running.",
    },
    concepts: [
      {
        title: "Tri-color mark & sweep, in pictures",
        body:
          "The GC mentally colours every object white (not yet seen), grey (reachable, but its pointers aren't scanned yet) or black (reachable and fully scanned). It greys the roots, then keeps scanning greys to black - greying their children as it goes. When no grey objects remain, anything still white is unreachable and gets swept (freed).",
        code: `// Conceptually, every GC cycle is:
//   1. white = all objects
//   2. grey  = roots (globals + goroutine stacks)
//   3. while grey not empty:
//        pick a grey object, scan its pointers,
//        grey any white children, mark it black
//   4. sweep: every object still white is freed
//
// You never write this - the runtime does it concurrently.`,
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
        title: "GOGC - the speed/memory dial",
        body:
          "GOGC (default 100) controls how much the heap may grow before the next collection. 100 means 'let the live heap double before collecting again'. Raise it to spend more memory for fewer GCs (more throughput); lower it to use less memory at the cost of more CPU.",
        code: `import "runtime/debug"

// Default: collect when heap doubles.
//   GOGC=100  (env var) == debug.SetGCPercent(100)

// Fewer, larger collections - trade memory for CPU:
debug.SetGCPercent(200)

// Disable entirely (rare; only with GOMEMLIMIT set):
//   GOGC=off`,
        lang: "go",
      },
      {
        title: "GOMEMLIMIT - the soft memory cap",
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
          "Measure before tuning: GODEBUG=gctrace=1 prints a line per cycle, and runtime.ReadMemStats / the runtime/metrics package expose live numbers for dashboards. The cheapest GC work is the allocation you never make - reuse buffers, prefer values over pointers, and preallocate slices with a capacity.",
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
      "Calling runtime.GC() in production 'to be safe' - it forces extra stop-the-world work and almost always hurts throughput.",
      "Cranking GOGC very low to save memory, then being surprised that CPU is pegged by constant collections.",
      "Ignoring GOMEMLIMIT in containers and getting OOM-killed by the orchestrator instead of letting the GC reclaim memory first.",
    ],
    takeaways: [
      "The GC is concurrent: pauses are tiny - throughput (CPU spent collecting) is the real cost.",
      "GOGC trades memory for CPU; GOMEMLIMIT puts a soft ceiling on total memory.",
      "The fastest collection is the allocation you avoided - reuse buffers and preallocate.",
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
    code: "R2",
    num: 5,
    part: "part-1",
    title: "Profiling with pprof",
    short: "Profiling (pprof)",
    level: "Beginner",
    duration: "2–3 hrs",
    icon: "activity",
    summary:
      "Stop guessing where your program is slow. Collect CPU, heap, goroutine and mutex profiles, then read them with go tool pprof and flame graphs.",
    plain:
      "A profiler is a fitness tracker for your program. Instead of staring at code wondering what's slow, pprof samples the running program many times per second and tells you exactly which functions burn CPU or hold memory. You then optimize the real hotspot instead of a guess - and most of the time the hotspot is somewhere you didn't expect.",
    animation: {
      id: "pprof-flame",
      title: "CPU Sampling → Flame Graph",
      blurb:
        "See the sampler snapshot the running call stack ~100×/second, watch those samples stack up into a flame graph, and spot the widest box - your hotspot.",
    },
    animations: [
      {
        id: "pprof-flame",
        title: "CPU Sampling → Flame Graph",
        blurb:
          "See the sampler snapshot the running call stack ~100×/second, watch those samples stack up into a flame graph, and spot the widest box - your hotspot.",
      },
      {
        id: "pprof-profile-types",
        title: "Pick the Right pprof Profile",
        blurb:
          "Match the symptom to the profile: CPU for burned cycles, heap for memory pressure, goroutine for leaks, and block/mutex for waiting.",
      },
      {
        id: "pprof-optimize-loop",
        title: "Profile → Fix → Re-profile",
        blurb:
          "Walk the production optimization loop: reproduce the slow path, collect evidence, change one hotspot, and confirm the graph actually got flatter.",
      },
    ],
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
          "The easiest way: import net/http/pprof for its side effect and it registers debug endpoints on the default mux. Then pull a 30-second CPU profile from the running process - no redeploy needed.",
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
          "Each box is a function; the box directly above sits inside its caller. Width is proportional to time (or allocations) spent - so the widest boxes are the hotspots. Tall-but-narrow stacks are deep call chains that don't actually cost much. Optimize width, not height.",
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
        "Here is the output of `go tool pprof -top cpu.out`: <paste>. Identify the top 3 hotspots, explain in plain English what each function likely does, and suggest specific Go optimizations (allocation reduction, algorithm, caching) for each - with the trade-offs.",
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
      "Profiling a binary built with the race detector (-race) or no optimizations - the numbers are skewed. Profile a normal build.",
      "Chasing a tall, narrow stack in the flame graph - height is call depth, not cost. Optimize the widest boxes.",
      "Leaving net/http/pprof exposed on a public port - it leaks internals. Bind it to localhost or an admin-only listener.",
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
    /* Writing Tests - stays 3rd in Part 1 (Writing Idiomatic Go) */
    title: "Writing Tests in Go",
    short: "Writing Tests",
    level: "Beginner",
    duration: "2–3 hrs",
    icon: "flask",
    summary:
      "Go ships testing in the toolchain. Write table-driven tests and subtests, measure coverage, fuzz inputs, and build test doubles with plain interfaces - no framework required.",
    plain:
      "Testing in Go has no magic and needs no third-party framework. You put tests in files ending in _test.go right next to your code, write functions that start with Test, and run `go test`. The standard library gives you everything: subtests, benchmarks, fuzzing, and coverage. The most idiomatic style is the 'table-driven test' - a list of cases run through the same logic.",
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
          "t.Helper() makes failures point at the caller, not the helper. t.Parallel() runs cases concurrently for speed. t.Cleanup() registers teardown that runs when the test finishes - cleaner than defer across helpers.",
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
          "Coverage shows which lines your tests exercise. Fuzzing (built in since Go 1.18) generates random inputs to find crashes and edge cases you'd never think of - it automatically saves any input that breaks your code.",
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
          "Go's secret weapon: accept an interface, not a concrete type. In tests you pass a tiny fake implementation. No mocking library, no code generation - just a struct that satisfies the interface.",
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
        "Have an LLM generate a thorough table of cases for a tricky function - then review which edge cases you'd have missed.",
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
      "Comparing structs that contain times or maps with == or reflect.DeepEqual and getting flaky failures - compare fields or use google/go-cmp's cmp.Diff.",
      "Calling t.Fatal from inside a spawned goroutine - it only works on the test's own goroutine. Send the error back on a channel and Fatal in the test.",
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
    code: "F1",
    num: 1,
    part: "part-0",
    title: "Goroutines, Channels & Concurrency Patterns",
    short: "Goroutines & Channels",
    level: "Beginner → Mid",
    duration: "3 hrs",
    icon: "share",
    summary:
      "Goroutines are cheap concurrent functions; channels are typed pipes that pass data safely between them. Master select, worker pools, fan-in/fan-out, and context cancellation.",
    plain:
      "A goroutine is a function that runs concurrently - like kicking off a background task, but so cheap you can run thousands or millions. Channels are typed pipes: one goroutine puts a value in, another takes it out, and Go handles the synchronization so you don't need locks for the handoff. The Go mantra: 'Don't communicate by sharing memory; share memory by communicating.'",
    animation: {
      id: "worker-pool",
      title: "Worker Pool: Fan-Out / Fan-In",
      blurb:
        "Jobs queue on a channel, several worker goroutines pull them concurrently (fan-out), process, and send results back onto a single channel (fan-in).",
    },
    // This first module carries three visualizations, built up from the
    // basics (spawning goroutines, channel mechanics) to the worker-pool
    // pattern that combines them.
    animations: [
      {
        id: "goroutine-spawn",
        title: "Spawning Goroutines with go & WaitGroup",
        blurb:
          "Watch main launch six lightweight goroutines with `go`, run them concurrently, then wait for every one to finish with sync.WaitGroup before continuing.",
      },
      {
        id: "channel-flow",
        title: "Channels: Handshake, Buffering & select",
        blurb:
          "See how an unbuffered send blocks until a receiver meets it, how a buffered channel absorbs bursts until it's full, and how select proceeds with whichever channel is ready first.",
      },
      {
        id: "worker-pool",
        title: "Worker Pool: Fan-Out / Fan-In",
        blurb:
          "Jobs queue on a channel, several worker goroutines pull them concurrently (fan-out), process, and send results back onto a single channel (fan-in).",
      },
    ],
    concepts: [
      {
        title: "Goroutines: concurrency for almost free",
        body:
          "Prefix any call with go to run it concurrently. A goroutine starts with a tiny ~2 KB stack that grows as needed, so spawning thousands is normal. But every goroutine needs an owner and a way to stop - a leaked goroutine is a memory leak.",
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
    close(ch)              // sender closes - exactly once
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
          "Fan-out: start N workers that all read from one jobs channel, so work spreads across them. Fan-in: every worker writes to one results channel, merging their output. This bounds concurrency to N - the most common production concurrency shape.",
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
          "context.Context is how you tell a tree of goroutines to stop - a timeout, a cancel, or a client disconnect. Pass ctx as the first argument, select on ctx.Done(), and you have a clean shutdown path with no leaks.",
        code: `func worker(ctx context.Context, jobs <-chan Job) {
    for {
        select {
        case <-ctx.Done():
            return            // cancelled - exit promptly
        case j, ok := <-jobs:
            if !ok { return } // channel closed - done
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
        "Ask an LLM to review a concurrent snippet specifically for leaks, deadlocks, and missing cancellation - the three classic bugs.",
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
      "Closing a channel from the receiver, or closing it twice - both panic. The sender owns the close, and closes exactly once.",
      "Reaching for channels to protect a shared counter - a sync.Mutex or atomic is simpler. Channels pass ownership; mutexes guard state.",
    ],
    takeaways: [
      "Unbuffered channels synchronize; buffered channels decouple producer and consumer rates.",
      "Every goroutine needs an owner and a way to stop - usually a context.",
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
    code: "F2",
    num: 2,
    part: "part-0",
    title: "Errors, Context & Project Layout",
    short: "Errors & Context",
    level: "Beginner → Mid",
    duration: "2 hrs",
    icon: "git",
    summary:
      "Go treats errors as values you handle explicitly. Wrap them with %w, inspect with errors.Is/As, propagate deadlines with context, and lay out a project the idiomatic way.",
    plain:
      "Go has no exceptions. A function that can fail returns an error value, and you check it right where it happens. To keep the original cause as the error travels up the call stack, you 'wrap' it - building a chain you can later inspect with errors.Is and errors.As. Separately, context carries cancellation and deadlines across function and API boundaries so a whole request can be stopped at once.",
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
      "Wrapping with %v instead of %w - you get a nice string but lose the ability to errors.Is/As the cause.",
      "Storing a context.Context in a struct field instead of passing it as the first argument - it breaks cancellation and confuses lifetimes.",
      "Using context.WithValue for required parameters - it's for request-scoped metadata (trace IDs), not a bag of arguments.",
    ],
    takeaways: [
      "Wrap with %w on the way up; inspect with errors.Is/As at the boundary.",
      "context is for cancellation and deadlines - always pass it, never store it.",
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
    code: "S1",
    num: 6,
    part: "part-2",
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
// swallows everything - precedence is longest-pattern-wins.
mux.HandleFunc("GET /api/v1/ledger/{id}", getEntry)
mux.HandleFunc("POST /api/v1/ledger", ingestTxn)
mux.HandleFunc("GET /api/v1/ledger/{id}/audit", getAudit)

http.ListenAndServe(":8080", mux)`,
        lang: "go",
      },
      {
        title: "Clean path variables with r.PathValue",
        body:
          "Wildcards captured in the pattern are pulled out with r.PathValue - no regexp, no context juggling, no allocation-heavy router state. An unmatched method returns 405 with the correct Allow header automatically.",
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
          "os.Root (Go 1.24) opens a directory and refuses any operation that resolves outside it - including symlink escapes and ../ traversal. Config loaders and local-storage readers become traversal-proof by construction, not by validation.",
        code: `// Everything below is jailed to ./data - even if an
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
      "Assuming the old catch-all behaviour: a pattern like \"/\" no longer matches everything - ServeMux now uses longest-pattern-wins precedence.",
      "Validating paths with string checks (strings.Contains(p, \"..\")) instead of os.Root - clever symlink and encoding tricks slip past manual checks.",
      "Forgetting the method in the pattern (\"/x\" vs \"GET /x\") and being surprised that every verb hits the same handler.",
    ],
    takeaways: [
      "Go 1.22+ ServeMux does method + wildcard routing - most apps can drop their router dependency.",
      "r.PathValue beats regexp routers for clarity and allocations.",
      "os.Root makes traversal attacks impossible by construction, not by validation.",
    ],
    checklist: [
      "All routes served by net/http ServeMux - no gin/chi/echo imports.",
      "Path variables read via r.PathValue, never regexp.",
      "Every filesystem read goes through an os.Root jail.",
      "Dev tools declared with the go.mod tool directive.",
    ],
  },

  /* ================================================================= M2 */
  {
    id: "m2",
    code: "S2",
    num: 7,
    part: "part-2",
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

// Stream tokens straight to the wire - no intermediate map[string]any.
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
          "The new(expr) form lets you allocate a pointer to a literal value in one expression - perfect for optional JSON/Protobuf fields where nil means 'absent'. No throwaway local variables.",
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
        code: `// No API change - same map[K]V - but lookups now:
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
      "Reaching for map[string]any to parse JSON on a hot path - it allocates heavily and defeats the point of json/v2.",
      "Assuming Swiss Tables change semantics - map iteration order is still randomized; don't rely on it.",
      "Returning a slice that aliases a stack buffer - clone it (slices.Clone) before letting it escape.",
    ],
    takeaways: [
      "json/v2 + jsontext is the high-throughput path; reflection json is the convenience path.",
      "Swiss-Table maps win by touching one cache line per lookup - keys and values benefit from locality.",
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
    code: "C3",
    num: 12,
    part: "part-3",
    title: "Object Lifecycles, Interning & Runtime Internals",
    short: "Lifecycles & Interning",
    level: "Senior",
    duration: "4–5 hrs",
    icon: "recycle",
    summary:
      "Replace unpredictable finalizers with runtime.AddCleanup, shrink memory with the unique interning package, and read the scheduler's preemption, netpoller and lockless paths.",
    plain:
      "When an object is about to be collected you sometimes need to run cleanup - close a file descriptor, release a handle. The old tool (finalizers) was unreliable. runtime.AddCleanup is the modern, predictable replacement. 'Interning' is a separate memory trick: if a million accounts all store the string \"USD\", you can keep just one copy and have everyone point to it. This module also peeks inside the scheduler that runs your goroutines.",
    animation: {
      id: "cleanup-seq",
      title: "The Cleanup Sequence",
      blurb:
        "An object becomes unreachable; the GC runs its AddCleanup handler deterministically - without delaying collection of the parent span.",
    },
    concepts: [
      {
        title: "Deterministic cleanup with runtime.AddCleanup",
        body:
          "runtime.SetFinalizer is fragile: it resurrects objects, runs in undefined order, and blocks collection. runtime.AddCleanup (Go 1.24) attaches a cleanup that runs once, after the object is truly unreachable, with no resurrection and no cycle traps.",
        code: `type Conn struct{ fd int }

func newConn(fd int) *Conn {
    c := &Conn{fd: fd}
    // The cleanup captures fd by value, NOT c - so it can't
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
      "Capturing the object itself in an AddCleanup closure - it keeps the object alive forever, the exact leak you were trying to avoid. Capture the raw handle by value.",
      "Treating cleanups as guaranteed to run promptly or at all - they run after collection, which may be never at shutdown. Use them as a backstop, not your primary close path.",
      "Interning unbounded, rarely-repeated values - the global table just grows. Intern high-cardinality-but-repeated values like currency codes.",
    ],
    takeaways: [
      "Prefer runtime.AddCleanup over SetFinalizer - once, predictable, no resurrection.",
      "unique.Make collapses repeated strings to a shared, pointer-comparable handle.",
      "Understanding G-M-P explains why blocking I/O doesn't waste threads.",
    ],
    checklist: [
      "Zero runtime.SetFinalizer - all cleanup via runtime.AddCleanup.",
      "Cleanups capture resource handles by value, never the parent.",
      "Repeated metadata strings interned with unique.Make.",
      "Can explain G-M-P, async preemption and netpoller wakeups.",
    ],
  },

  /* ================================================================= M4 */
  {
    id: "m4",
    code: "C2",
    num: 11,
    part: "part-3",
    title: "Flake-Free Concurrency & Deterministic Testing",
    short: "Deterministic Testing",
    level: "Senior",
    duration: "3–4 hrs",
    icon: "flask",
    summary:
      "Kill flaky time.Sleep tests with testing/synctest's controlled time bubbles, and write predictable benchmarks with testing.B.Loop.",
    plain:
      "Concurrency tests are notoriously 'flaky' - they pass locally and randomly fail in CI because they rely on time.Sleep to wait for goroutines. testing/synctest fixes this by giving the test a fake clock inside a 'bubble': when every goroutine is blocked, virtual time jumps forward instantly and deterministically, so there's nothing left to race.",
    animation: {
      id: "synctest-bubble",
      title: "The Synctest Clock Bubble",
      blurb:
        "Concurrent routines run inside an isolated bubble with a fake clock. When every routine blocks, time fast-forwards cleanly - no sleeps, no flakes.",
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
            time.Sleep(5 * time.Second) // virtual - runs instantly
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
    // Now assert on a known, settled state - zero flake risk.
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
      "Doing real I/O (network, disk) inside a synctest bubble - only the fake clock is virtualized; real blocking still blocks. Keep bubbles to in-memory concurrency.",
      "Replacing time.Sleep in production code thinking synctest helps there - it's a testing tool only.",
      "Still writing for i := 0; i < b.N loops - they're easy to get wrong with dead-code elimination; use b.Loop().",
    ],
    takeaways: [
      "synctest gives concurrency tests a deterministic virtual clock - no sleeps, no flakes.",
      "synctest.Wait is a precise 'everyone is parked' barrier.",
      "b.Loop() is the modern, footgun-free benchmark loop.",
    ],
    checklist: [
      "No time.Sleep in tests - concurrency tested via synctest.",
      "synctest.Wait used to assert on settled state.",
      "Benchmarks use b.Loop(), not manual b.N loops.",
      "CI runs the race detector with zero flakes.",
    ],
  },

  /* ================================================================= M5 */
  {
    id: "m5",
    code: "S3",
    num: 8,
    part: "part-2",
    title: "Type-Safe Persistence Layers & Performance Testing",
    short: "Type-Safe Persistence",
    level: "Senior",
    duration: "4–5 hrs",
    icon: "database",
    summary:
      "Generate compile-checked DB code from raw SQL with sqlc, tune pgxpool for production, and match Postgres error codes with Go 1.26's errors.AsType.",
    plain:
      "Talking to a database is where many bugs hide. sqlc lets you write plain SQL and generates type-safe Go functions from it - so a misspelled column fails at compile time, not at 3am. pgxpool manages a pool of Postgres connections efficiently. And row-level locking is how two transfers touching the same account stay correct under load.",
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
      "Setting MaxConns far higher than Postgres can handle - connections aren't free; size to the database, not the app.",
      "Updating two account rows in an inconsistent lock order across code paths - that's how you deadlock. Always lock rows in a fixed order.",
      "Swallowing a 40001 serialization_failure as a generic error instead of retrying the transaction.",
    ],
    takeaways: [
      "sqlc moves SQL mistakes from runtime to compile time.",
      "A connection pool needs explicit sizing and lifetimes for production.",
      "Row locks + a fixed lock order keep double-entry writes correct under contention.",
    ],
    checklist: [
      "All DB access is sqlc-generated - no hand-written SQL strings in Go.",
      "pgxpool sized with explicit Max/Min conns and lifetimes.",
      "Postgres errors matched via errors.AsType + SQLSTATE.",
      "Double-entry writes use row-level locks inside a transaction.",
    ],
  },

  /* ================================================================= M17 */
  {
    id: "m17",
    code: "S4",
    num: 9,
    part: "part-2",
    title: "PostgreSQL Foundations & Production Pitfalls",
    short: "Postgres Pitfalls",
    level: "Senior",
    duration: "self-paced",
    icon: "database",
    summary:
      "Design Postgres schemas that protect ledger invariants, read query plans, build safe indexes and migrations, and avoid production traps around locks, vacuum, bloat, and connection pressure.",
    plain:
      "Postgres is not just the place where rows live. It is part of your correctness boundary. Constraints reject impossible states, indexes decide whether a query is instant or catastrophic, transactions decide which concurrent writes are legal, and vacuum decides whether yesterday's workload becomes tomorrow's latency spike. Treat the database as a production subsystem, not a passive storage box.",
    animation: {
      id: "pg-schema-constraints",
      title: "Ledger Schema & Constraints",
      blurb:
        "Watch a transfer move through accounts, ledger entries, idempotency keys, and the outbox so the database rejects impossible states before Go can ship them.",
    },
    animations: [
      {
        id: "pg-schema-constraints",
        title: "Schema Constraints, Idempotency & Outbox",
        blurb:
          "See how CHECK, UNIQUE, foreign keys, and an outbox row turn Postgres into the ledger's last line of defense.",
      },
      {
        id: "pg-index-planner",
        title: "Query Planner, Composite Indexes & EXPLAIN",
        blurb:
          "Follow one ledger-history query from sequential scan to composite covering index, then verify it with EXPLAIN ANALYZE BUFFERS.",
      },
      {
        id: "pg-lock-vacuum",
        title: "Locks, Online Migrations & Vacuum Bloat",
        blurb:
          "Visualize the production traps: heavy DDL locks, long transactions pinning dead tuples, and batch backfills that keep writes moving.",
      },
    ],
    concepts: [
      {
        title: "Let the schema protect invariants",
        body:
          "A ledger schema should reject impossible money states even if a buggy service deploys. Use CHECK constraints for local truths, foreign keys for ownership, UNIQUE constraints for idempotency, and an outbox table written in the same transaction as the ledger mutation.",
        code: `CREATE TABLE accounts (
    id uuid PRIMARY KEY,
    balance_cents bigint NOT NULL CHECK (balance_cents >= 0)
);

CREATE TABLE transfers (
    id uuid PRIMARY KEY,
    idempotency_key text NOT NULL UNIQUE,
    from_account uuid NOT NULL REFERENCES accounts(id),
    to_account uuid NOT NULL REFERENCES accounts(id),
    amount_cents bigint NOT NULL CHECK (amount_cents > 0)
);

CREATE TABLE outbox_events (
    id bigserial PRIMARY KEY,
    transfer_id uuid NOT NULL REFERENCES transfers(id),
    kind text NOT NULL,
    published_at timestamptz
);`,
        lang: "sql",
      },
      {
        title: "Indexes are contracts with query shapes",
        body:
          "Index columns in the order your query filters, sorts, and paginates. A query for one account's recent ledger entries wants `(account_id, posted_at DESC)`, not three unrelated single-column indexes. INCLUDE can cover projected columns, but only EXPLAIN tells you whether the planner actually used it.",
        code: `CREATE INDEX CONCURRENTLY ledger_entries_account_time_idx
    ON ledger_entries (account_id, posted_at DESC)
    INCLUDE (amount_cents, direction);

EXPLAIN (ANALYZE, BUFFERS)
SELECT posted_at, amount_cents, direction
  FROM ledger_entries
 WHERE account_id = $1
 ORDER BY posted_at DESC
 LIMIT 50;`,
        lang: "sql",
      },
      {
        title: "Migrations must be expand/contract",
        body:
          "A safe production migration first expands the schema in a backward-compatible way, backfills in bounded batches, then contracts after every old binary is gone. Avoid single-shot rewrites and heavy locks on hot tables.",
        code: `-- 1. expand: nullable, no table rewrite
ALTER TABLE transfers ADD COLUMN risk_score integer;

-- 2. backfill in small batches from the app or a job
UPDATE transfers
   SET risk_score = 0
 WHERE risk_score IS NULL
   AND id IN (SELECT id FROM transfers WHERE risk_score IS NULL LIMIT 500);

-- 3. add read path, deploy, then enforce later
ALTER TABLE transfers ALTER COLUMN risk_score SET NOT NULL;`,
        lang: "sql",
      },
      {
        title: "Isolation, locks and deadlocks are design inputs",
        body:
          "Read Committed does not make multi-row business invariants magically safe. For transfers, lock the affected accounts in a deterministic order, keep transactions short, and retry serialization failures. Lock order is application design, not an afterthought.",
        code: `SELECT id, balance_cents
  FROM accounts
 WHERE id = ANY($1::uuid[])
 ORDER BY id
 FOR UPDATE;

-- Do the debit + credit only after every row is locked.
-- If SQLSTATE 40001 or 40P01 happens, retry the whole transaction.`,
        lang: "sql",
      },
      {
        title: "Vacuum, bloat and long transactions",
        body:
          "MVCC keeps old row versions so concurrent readers see a stable snapshot. That is powerful, but a long transaction can pin old versions and prevent vacuum from cleaning them. Watch idle-in-transaction sessions, dead tuples, and slow statements before bloat becomes the incident.",
        code: `SELECT pid, state, now() - xact_start AS age, query
  FROM pg_stat_activity
 WHERE xact_start IS NOT NULL
 ORDER BY age DESC;

SELECT relname, n_dead_tup, vacuum_count, autovacuum_count
  FROM pg_stat_user_tables
 ORDER BY n_dead_tup DESC
 LIMIT 10;`,
        lang: "sql",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Use an agent as a database-review partner: give it schema, migrations, pg_stat_statements, EXPLAIN output, and the exact traffic pattern, then ask for concrete index and migration risks.",
      prompt:
        "Review this Postgres schema and migration plan for a financial ledger. Identify invariant gaps, missing constraints, unsafe DDL locks, indexes that do not match the query shapes, long-transaction/vacuum risks, and the exact EXPLAIN ANALYZE BUFFERS evidence you would require before approving it.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Design the production Postgres layer for the ledger: schema, constraints, idempotency keys, outbox, query indexes, online migrations, lock order, retry policy, and operational dashboards for vacuum, bloat, slow queries, and connection pressure.",
    },
    pitfalls: [
      "Adding NOT NULL, defaults, or rewritten columns to a hot table as one big migration without measuring the lock it will take.",
      "Indexing columns one by one instead of building composite indexes that match WHERE, ORDER BY, pagination, and projected columns.",
      "Leaving sessions idle in transaction, which pins old row versions and can turn normal MVCC churn into table bloat.",
      "Assuming Read Committed prevents every business anomaly. It does not; you still need explicit locks, constraints, or SERIALIZABLE with retries.",
      "Letting every service open a large pool. Too many connections increase memory, contention, and failover pain on the database itself.",
    ],
    takeaways: [
      "Postgres is part of the correctness boundary, not just storage.",
      "Constraints and idempotency keys are production safety rails for bad deploys and duplicate requests.",
      "Query performance starts with shape: filters, sort order, pagination, and returned columns.",
      "Online migrations are expand/backfill/contract events, not one-shot DDL.",
      "Vacuum and lock behavior must be observable before they become outages.",
    ],
    checklist: [
      "Ledger invariants represented with CHECK, foreign keys, UNIQUE idempotency keys, and transactional outbox rows.",
      "Every hot query has EXPLAIN (ANALYZE, BUFFERS) evidence and an index that matches its shape.",
      "Migrations follow expand/backfill/contract and avoid long exclusive locks on hot paths.",
      "Transactions lock rows in deterministic order and retry SQLSTATE 40001 / 40P01 safely.",
      "Dashboards track long transactions, dead tuples, autovacuum, slow queries, and connection pool saturation.",
    ],
  },

  /* ================================================================= M6 */
  {
    id: "m6",
    code: "D1",
    num: 18,
    part: "part-5",
    title: "Post-Quantum Microservice Defenses & Protocols",
    short: "Post-Quantum Defenses",
    level: "Staff",
    duration: "5 hrs",
    icon: "shield",
    summary:
      "Wire gRPC + Protobuf with strict back-compat, harden transport against harvest-now-decrypt-later attacks using hybrid ML-KEM / HPKE, and encode invariants with self-referencing generics.",
    plain:
      "Services talk to each other over the network, and that traffic must stay private - even against a future quantum computer. The threat is 'harvest now, decrypt later': an attacker records today's encrypted traffic and decrypts it years later once quantum computers can break classical crypto. Hybrid post-quantum key exchange (combining today's X25519 with quantum-resistant ML-KEM) defends against that now.",
    animation: {
      id: "pqc-lattice",
      title: "The Cryptographic Lattice",
      blurb:
        "A classic TLS handshake next to a hybrid ML-KEM exchange - see why a future quantum attacker cracks one captured key but not the lattice-protected one.",
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
  // Added later - new tag, optional, old nodes ignore it.
  optional string memo = 4;
  // reserved 5;  // never reuse a retired field number
}`,
        lang: "go",
      },
      {
        title: "Hybrid PQC with crypto/mlkem + crypto/hpke",
        body:
          "A 'harvest now, decrypt later' adversary records today's traffic to crack with a future quantum computer. Hybrid key exchange combines classical X25519 with ML-KEM-768 - the session is safe unless BOTH are broken.",
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
          "The curiously-recurring pattern type Node[T Node[T]] lets the compiler enforce that a method returns the concrete implementing type - encoding cluster-topology invariants that would otherwise be runtime asserts.",
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
      "Reusing a retired Protobuf field number - old and new nodes will silently misinterpret bytes. Always 'reserved' it.",
      "Going pure post-quantum instead of hybrid - the PQC algorithms are newer; hybrid keeps classical security as a fallback.",
      "Assuming TLS 'just handles it' - you must explicitly choose a hybrid key-exchange group; defaults may still be classical-only.",
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
    code: "C4",
    num: 13,
    part: "part-3",
    title: "Live Diagnostics, Profiling & Forensics",
    short: "Diagnostics & Forensics",
    level: "Staff",
    duration: "4 hrs",
    icon: "activity",
    summary:
      "Keep a rolling in-memory trace with the FlightRecorder, dump diagnostic state on alarms, and trace deadlocks/leaks automatically with the goroutine-leak analyzer.",
    plain:
      "When a production incident happens, the worst feeling is 'I wish I'd been recording'. The FlightRecorder keeps a few seconds of detailed execution history in memory at all times, cheaply - so when latency spikes or the process crashes, you dump the window leading up to the failure. The goroutine-leak analyzer then automatically points at why a goroutine got stuck.",
    animation: {
      id: "leak-graph",
      title: "The Leak Forensic Graph",
      blurb:
        "A blocked production goroutine; the leak analyzer walks the channel graph back to the root blocker - an un-triggered channel or a missing context deadline.",
    },
    concepts: [
      {
        title: "Always-on tracing with FlightRecorder",
        body:
          "trace.FlightRecorder (Go 1.25) keeps a bounded ring buffer of recent execution events in memory at near-zero cost. You only pay to write a trace when something interesting happens - so you capture the window *before* a crash, not after you redeploy with logging.",
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
          "The goroutine-leak analyzer inspects parked goroutines and traces each blockade back to its cause: a channel with no sender, a WaitGroup that never reaches zero, or a missing context deadline - turning hours of log spelunking into a generated report.",
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
      "Turning on a full continuous trace 'just in case' - that's expensive. The FlightRecorder's bounded ring buffer is the cheap, always-on option.",
      "Dumping diagnostics on every minor blip - you'll drown in files. Gate dumps on real SLO breaches with a cooldown.",
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
    code: "H4",
    num: 17,
    part: "part-4",
    title: "Hardware Acceleration & Memory Scrubbing",
    short: "SIMD & Secure Memory",
    level: "Principal",
    duration: "5 hrs",
    icon: "cpu",
    summary:
      "Vectorize hot math with simd/archsimd, scrub secret keys from memory with runtime/secret, and understand the Green Tea GC's spatial-locality span scanning.",
    plain:
      "Modern CPUs can do the same operation on many numbers at once - that's SIMD (Single Instruction, Multiple Data). For a loop that checksums every byte of a block, processing 16 bytes per instruction instead of one is a huge speedup. Separately, secret keys left lying in memory can leak into crash dumps; runtime/secret scrubs them. And 'Green Tea' is an experimental redesign of the garbage collector for better cache locality.",
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
          "The experimental simd/archsimd package exposes CPU vector types (Int8x16, Float64x8). A checksum or validation loop that touches every byte can process a whole lane per instruction - often an order of magnitude faster than scalar Go.",
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
        code: `// Same code - opt in at build time:
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
      "Vectorizing without a scalar fallback - your binary then breaks on CPUs/arches without those instructions. Always keep a tail/remainder path.",
      "Hand-rolling SIMD before profiling - only vectorize a loop the profiler proved is hot.",
      "Keeping decrypted keys in ordinary []byte - they survive in core dumps and swap. Use runtime/secret and Destroy.",
    ],
    takeaways: [
      "SIMD turns per-element loops into per-lane loops - huge wins on hot math.",
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
    code: "D5",
    num: 22,
    part: "part-5",
    title: "Production Governance & Automated Refactoring",
    short: "Governance & Rollout",
    level: "Principal",
    duration: "4 hrs",
    icon: "ship",
    summary:
      "Make GOMAXPROCS cgroup-aware, ship hardened scratch/distroless images, automate fleet-wide refactors with go fix + //go:fix, and capture decisions in ADRs.",
    plain:
      "Running Go in containers and rolling it out safely is its own skill. Go 1.25 now reads the container's CPU limit so it doesn't spawn 128 threads on a 4-core pod. A 'distroless' image ships just your binary - tiny and hard to attack. go fix can rewrite deprecated APIs across an entire codebase automatically. And ADRs are short notes that record why you made a big decision, so the next engineer isn't guessing.",
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
          "A static CGO-free Go binary needs no OS. Multi-stage builds compile in a full toolchain image, then copy the single binary into scratch or distroless - a few MB, no shell, no package manager, minimal CVE surface.",
        code: `# build stage
FROM golang:1.26 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /ledger ./cmd/ledger

# final stage - nothing but the binary
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
      "Hard-coding GOMAXPROCS in a container - let the cgroup-aware default match the real CPU quota, or you'll thrash under throttling.",
      "Shipping a full Linux base image when a distroless/scratch image would do - it's a needless CVE and size burden.",
      "Rolling an update without readiness probes - traffic hits pods that aren't ready and requests drop.",
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

  /* ================================================================ M10 */
  {
    id: "m10",
    code: "H1",
    num: 14,
    part: "part-4",
    title: "CPU Caches & the Memory Hierarchy",
    short: "Caches & Memory",
    level: "Deep Architecture",
    duration: "3–4 hrs",
    icon: "cpu",
    summary:
      "Why the same Go code can run 10× faster or slower depending on memory layout: the cache hierarchy, the 64-byte cache line, spatial/temporal locality, and the false-sharing trap that silently kills concurrent counters.",
    plain:
      "Your CPU is almost never waiting on arithmetic - it is waiting on memory. Reading a value already sitting in the fastest on-chip cache (L1) takes about a nanosecond; reading the same value from main memory (RAM) takes roughly 100× longer. The CPU hides this gap with a hierarchy of small, fast caches, and it never moves a single byte - it moves a whole 64-byte 'cache line' at a time. Once you understand that, a lot of Go performance advice (use slices not linked lists, keep hot fields together, avoid pointer-chasing) stops being folklore and becomes obvious. This module is about writing code that fits how the memory system actually works.",
    animation: {
      id: "cache-hierarchy",
      title: "The Memory Hierarchy & a Cache Line Fill",
      blurb:
        "Follow one memory read down the hierarchy - L1 miss, L2 miss, L3 miss, then a full 64-byte line pulled from RAM - and see why the next few reads are suddenly free.",
    },
    concepts: [
      {
        title: "The hierarchy: small-and-fast down to big-and-slow",
        body:
          "Memory is organized as a pyramid. Registers (a few hundred bytes) feed the ALU in zero cycles. Below them sit L1 (~32–64 KB, ~1 ns), L2 (~256 KB–2 MB, ~4 ns), and a shared L3 (several MB, ~10–40 ns). Below the chip is RAM (~100 ns) and then storage (microseconds to milliseconds). Each level down is roughly an order of magnitude bigger and slower. The CPU's whole job is to keep the data it needs near the top - and your job is to give it access patterns that make that possible.",
        code: `// Rough latencies - memorize the SHAPE, not exact numbers.
//   register        ~0   ns
//   L1 cache        ~1   ns   (~4 cycles)
//   L2 cache        ~4   ns
//   L3 cache        ~10–40 ns
//   main memory     ~100 ns   (~100× slower than L1!)
//   NVMe SSD        ~50–150 µs
//   network / disk  ~ms
//
// "Memory is the new disk." Most hot loops are memory-bound,
// not compute-bound - so layout beats micro-optimizing math.`,
        lang: "go",
      },
      {
        title: "You never load one byte - you load a 64-byte line",
        body:
          "Caches deal in fixed-size blocks called cache lines, almost always 64 bytes (Apple silicon uses 128). Touch a single int and the CPU pulls the entire 64-byte line containing it into L1. This is the single most important fact in this module: reads near each other in memory are nearly free once the line is warm, while reads scattered across memory each pay a fresh miss. A []int64 packs 8 values per line; a []*T forces a pointer-chase to a random address per element.",
        code: `// A 64-byte line holds eight int64 values.
// Walking a slice sequentially gets ~7 free hits per miss:
var sum int64
for _, v := range nums { // nums []int64, contiguous
    sum += v             // 1 miss warms 8 values
}

// A linked list (or []*T) scatters nodes across the heap -
// every step is a likely cache MISS, no matter how clever
// the algorithm looks on paper.`,
        lang: "go",
      },
      {
        title: "Locality: the two kinds, and why slices win",
        body:
          "Caches bet on two patterns. Temporal locality: data you used recently you will use again soon (so it is kept). Spatial locality: data next to what you just used will be needed soon (so the hardware prefetcher streams the next lines ahead of you). Sequential access over a contiguous []T maximizes both - which is why an array/slice often beats a 'theoretically faster' tree or map for small-to-medium N. Iterate in memory order: for a row-major 2D slice, loop rows in the outer loop, columns in the inner, never the reverse.",
        code: `// Cache-friendly: inner loop walks contiguous memory.
for i := 0; i < rows; i++ {
    for j := 0; j < cols; j++ {
        total += grid[i][j] // stride 1 - prefetcher loves it
    }
}
// Swap the loops and the SAME work can be several times slower:
// each grid[i][j] jumps a full row, thrashing the cache.`,
        lang: "go",
      },
      {
        title: "False sharing: the bug that hides on one cache line",
        body:
          "Caches are kept coherent across cores: when one core writes a line, every other core's copy of that line is invalidated. If two goroutines on two cores hammer two DIFFERENT variables that happen to sit on the SAME 64-byte line, the line ping-pongs between the cores' caches even though they never touch the same data. This 'false sharing' can make a parallel counter SLOWER than a single-threaded one. The fix is padding: push the hot fields onto separate lines.",
        code: `// BAD: a and b share one cache line → cores fight over it.
type counters struct {
    a atomic.Int64 // written by goroutine 1
    b atomic.Int64 // written by goroutine 2
}

// GOOD: pad so each counter owns its own line.
type counters struct {
    a atomic.Int64
    _ [56]byte // 8 (Int64) + 56 = 64 → b starts a new line
    b atomic.Int64
}`,
        lang: "go",
      },
      {
        title: "Struct layout: padding, alignment & field order",
        body:
          "The compiler aligns fields and inserts invisible padding so each field sits on its natural boundary. Order fields badly and a struct bloats with holes; order them large-to-small and it shrinks - fitting more objects per cache line and per allocation. Use `unsafe.Sizeof` to measure, and reach for `//go:packed`-style hand layout only when a profiler says a hot struct's size matters. Smaller hot structs = more of them per line = fewer misses.",
        code: `// 24 bytes: a bool forces 7 bytes of padding before the int64.
type Bad struct { flag bool; id int64; kind uint8 }

// 16 bytes: group same-size fields; small ones together.
type Good struct { id int64; kind uint8; flag bool }

import "unsafe"
fmt.Println(unsafe.Sizeof(Bad{}), unsafe.Sizeof(Good{})) // 24 16`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Paste a hot struct or a slow loop and have an LLM reason about its cache behaviour before you benchmark.",
      prompt:
        "Here is a Go struct and the loop that walks a slice of it: <paste>. Assuming 64-byte cache lines, estimate the struct's size with padding, how many fit per cache line, and whether my access pattern is cache-friendly. Suggest a field reordering or layout change and explain the expected effect on cache misses.",
    },
    practice: {
      title: "Try it yourself",
      body: "Feel the cache with two tiny benchmarks.",
      steps: [
        "Benchmark summing a []int64 of 10M elements vs a []*int64 of the same length - the pointer version is far slower purely from cache misses.",
        "Write a 2D grid sum two ways (row-major vs column-major inner loop) and compare with `go test -bench`.",
        "Build the false-sharing counters struct, then the padded version; benchmark both with parallel goroutines and watch padding win.",
        "Print unsafe.Sizeof for a struct, reorder its fields large-to-small, and confirm it shrank.",
      ],
    },
    pitfalls: [
      "Choosing a 'faster' data structure (tree, linked list, map) for small N and losing to a plain slice because every node is a cache miss.",
      "Sharing a hot, frequently-written struct across goroutines without padding - false sharing can erase all parallel speedup.",
      "Iterating a 2D structure in the wrong (column-major) order and blaming the algorithm for the slowdown.",
    ],
    takeaways: [
      "Most hot loops are memory-bound: layout and access pattern beat clever arithmetic.",
      "The CPU moves 64-byte cache lines, never single bytes - sequential, contiguous access is nearly free.",
      "False sharing silently kills parallel counters; pad hot, separately-written fields onto their own cache lines.",
    ],
    checklist: [
      "Can recite the latency shape: L1 ~1 ns vs RAM ~100 ns, and why it matters.",
      "Know that a cache line is ~64 bytes and what that implies for slices vs pointer-chasing.",
      "Can spot and fix false sharing with padding.",
      "Use unsafe.Sizeof and field ordering to keep hot structs compact.",
    ],
  },

  /* ================================================================ M11 */
  {
    id: "m11",
    code: "H2",
    num: 15,
    part: "part-4",
    title: "Inside the CPU: Pipelines & Branch Prediction",
    short: "Pipeline & Branches",
    level: "Deep Architecture",
    duration: "3 hrs",
    icon: "activity",
    summary:
      "How a modern core overlaps instructions in a pipeline, guesses which way branches go, and runs work out of order - and why a single unpredictable `if` in a hot loop can cost more than the arithmetic around it.",
    plain:
      "A CPU does not finish one instruction before starting the next. Like an assembly line, it has stages - fetch, decode, execute, write-back - and keeps a dozen-plus instructions in flight at once, each at a different stage. This works beautifully until the CPU hits a branch (an `if`, a loop condition) and does not yet know which way to go. Rather than stall, it GUESSES, runs ahead speculatively, and throws the work away if it guessed wrong. A wrong guess costs ~15–20 cycles of flushed pipeline. So the surprising lesson is: in a tight loop, a predictable branch is almost free, and an unpredictable one can dominate your runtime - sometimes sorting the data first makes the same loop several times faster.",
    animation: {
      id: "cpu-pipeline",
      title: "The Pipeline & a Branch Misprediction",
      blurb:
        "Watch instructions flow through five overlapping stages, then hit a branch: the CPU speculates, guesses wrong, and flushes the pipeline - a visible bubble of wasted cycles.",
    },
    concepts: [
      {
        title: "The pipeline: instructions overlap like an assembly line",
        body:
          "A classic pipeline splits each instruction into stages - Fetch, Decode, Execute, Memory, Write-back. While instruction 1 is executing, instruction 2 is decoding and instruction 3 is being fetched. Ideally the core retires one instruction per cycle even though each takes several cycles end-to-end. Real cores are deeper (15–20 stages) and SUPERSCALAR (multiple pipelines side by side), retiring several instructions per cycle. The catch: anything that breaks the steady flow - a wrong branch guess, a cache miss, a data dependency - leaves 'bubbles' of idle stages.",
        code: `// Conceptually, five instructions overlapping in a pipeline:
// cycle:   1    2    3    4    5    6    7
// instr1:  F    D    E    M    W
// instr2:       F    D    E    M    W
// instr3:            F    D    E    M    W
// instr4:                 F    D    E    M    W
// instr5:                      F    D    E    M    W
//
// One instruction RETIRES every cycle once the pipe is full,
// even though each takes 5 cycles to pass through.`,
        lang: "go",
      },
      {
        title: "Branches: the CPU guesses so it never stalls",
        body:
          "When the core reaches a conditional branch, the condition often is not computed yet - but stalling would waste the whole pipeline. So a branch predictor guesses the outcome from history (this loop branch was taken the last 1000 times → take it again) and the core speculatively executes down the predicted path. If the guess was right, zero cost. If wrong, every speculatively-executed instruction must be discarded and the pipeline refilled from the correct target - a misprediction penalty of roughly 15–20 cycles. Predictors are very good (often >95%) on regular patterns and helpless on random ones.",
        code: `// Predictable: the branch goes the same way almost every time.
for i := range data {
    if i < len(data)-1 { // ~always true → predicted, free
        process(data[i])
    }
}

// Unpredictable: a 50/50 data-dependent branch in a hot loop
// mispredicts ~half the time - each miss ~ a cache-miss-sized
// stall, dwarfing the cheap comparison itself.`,
        lang: "go",
      },
      {
        title: "The classic demo: sorting unlocks the predictor",
        body:
          "The famous result: summing only the elements above a threshold runs dramatically faster on SORTED data than on the same data shuffled - with identical instructions and identical element count. Why? On sorted data the `if v >= threshold` branch is false-false-…-false then true-true-…-true: long predictable runs the predictor nails. On shuffled data it flips randomly and mispredicts constantly. Same Big-O, same arithmetic, multiples-different wall time - all from branch prediction. The fix when it matters: make the work branchless (compute both sides) or arrange data so branches are predictable.",
        code: `total := 0
for _, v := range data {
    if v >= 128 { total += v } // sorted: ~free / shuffled: slow
}

// Branchless version - no data-dependent branch to mispredict:
for _, v := range data {
    mask := -(int(v) >> 31 ^ ...) // (illustrative) select via math
    total += v & keepMask(v)
}
// Only go branchless when a profile proves the branch hurts.`,
        lang: "go",
      },
      {
        title: "Out-of-order & ILP: filling the gaps with independent work",
        body:
          "Modern cores execute out of order: while one instruction waits on a slow load from memory, the core looks ahead in a window of upcoming instructions and runs any that do not depend on the stalled result. This is instruction-level parallelism (ILP), and it is why long dependency chains hurt - if each step needs the previous step's result, the core cannot find independent work to overlap. Breaking a reduction into several independent accumulators gives the core parallel chains to interleave, often speeding up a sum or hash loop with no change in instruction count.",
        code: `// Single dependency chain - each add waits on the last.
var s int64
for _, v := range a { s += v }

// Four independent chains the core can run in parallel:
var s0, s1, s2, s3 int64
for i := 0; i < len(a)-3; i += 4 {
    s0 += a[i]; s1 += a[i+1]; s2 += a[i+2]; s3 += a[i+3]
}
s := s0 + s1 + s2 + s3 // + handle the tail`,
        lang: "go",
      },
      {
        title: "How this connects to Go: inlining, bounds checks & the memory model",
        body:
          "You rarely write assembly, but you steer the pipeline through the compiler. Inlining (`-gcflags=-m`) removes call overhead and exposes more instructions for the core to overlap. Eliminated bounds checks remove a hidden branch per index. And the same speculation that powers performance is exactly why the Go memory model exists: because cores reorder and speculate, two goroutines need explicit synchronization (atomics, mutexes, channels - Module M13) to agree on the order of memory operations. Hardware reordering is the reason 'it worked on my machine' races exist.",
        code: `// Help the core: range (not index) drops per-iteration bounds checks,
// small hot funcs inline so their instructions can overlap.
func sum(b []byte) (s uint64) {
    for i := range b { s += uint64(b[i]) }
    return
}
//   go build -gcflags='-m'                        (inlining)
//   go build -gcflags='-d=ssa/check_bce/debug=1'  (bounds checks)
// Reordering across goroutines? That needs M13's primitives.`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Have an LLM reason about whether a hot branch is predictable before you try to make it branchless.",
      prompt:
        "Here is a hot Go loop with a data-dependent `if`: <paste>. Explain whether a branch predictor would handle it well or badly given my data distribution, estimate the misprediction cost, and show a branchless rewrite. Tell me how to confirm the win with a benchmark and perf counters.",
    },
    practice: {
      title: "Try it yourself",
      body: "Reproduce the famous branch-prediction result.",
      steps: [
        "Fill a large []uint8 with random values; sum only those >= 128 and time it.",
        "sort.Slice the same data, run the identical sum, and compare - sorted is dramatically faster.",
        "Rewrite the sum branchlessly (e.g. multiply by a 0/1 mask) and confirm it is fast regardless of order.",
        "Try four independent accumulators on a large int64 sum and measure the ILP speedup.",
      ],
    },
    pitfalls: [
      "Assuming runtime is dominated by arithmetic when an unpredictable branch in the hot loop is the real cost.",
      "Writing branchless code everywhere 'for speed' - it hurts readability and only helps when the branch is genuinely unpredictable and hot.",
      "Building one long dependency chain (a single accumulator, a pointer walk) and starving the core's out-of-order engine of independent work.",
    ],
    takeaways: [
      "Cores overlap many instructions in a pipeline; mispredicted branches and cache misses are what stall it.",
      "A predictable branch is nearly free; an unpredictable one in a hot loop can cost ~15–20 cycles each.",
      "Hardware speculation and reordering are exactly why goroutines need explicit synchronization.",
    ],
    checklist: [
      "Can explain pipeline stages and why a misprediction flushes the pipe.",
      "Understand why sorted data can make an identical loop several times faster.",
      "Know how to break a dependency chain into independent accumulators for ILP.",
      "Connect hardware reordering to the need for the memory-model primitives in M13.",
    ],
  },

  /* ================================================================ M12 */
  {
    id: "m12",
    code: "H3",
    num: 16,
    part: "part-4",
    title: "The Scheduler Up Close: G-M-P, Netpoller & Preemption",
    short: "Go Scheduler",
    level: "Deep Architecture",
    duration: "4 hrs",
    icon: "share",
    summary:
      "How Go runs a million goroutines on a handful of OS threads: the G-M-P model, per-P run queues and work stealing, the netpoller that makes blocking I/O cheap, syscall handoff, and asynchronous preemption.",
    plain:
      "Goroutines are not OS threads - they are far cheaper, and the Go runtime has its own scheduler that maps many goroutines onto a small number of threads. Understanding this 'G-M-P' machine explains the things that otherwise feel like magic: why you can start 100,000 goroutines, why a blocking network read does not burn a thread, why a tight CPU loop no longer freezes the whole program, and why GOMAXPROCS is the dial that controls real parallelism. This is the runtime working on your behalf - and knowing how it works lets you reason about latency, throughput, and the leaks that happen when goroutines never get to run again.",
    animation: {
      id: "gmp-scheduler",
      title: "G-M-P Scheduling & Work Stealing",
      blurb:
        "Goroutines (G) queued on logical processors (P), run by OS threads (M). Watch a P run dry and STEAL work from a busy neighbour, and a blocking syscall hand its P to a fresh thread.",
    },
    concepts: [
      {
        title: "G, M and P: the three players",
        body:
          "Three entities cooperate. A G is a goroutine: a tiny struct with a ~2 KB growable stack and a program counter - cheap to create by the thousands. An M is a machine, i.e. a real OS thread that actually executes code. A P is a processor: a scheduling context that owns a local run queue of ready goroutines; the number of Ps equals GOMAXPROCS. The rule that makes it all work: to run Go code, an M must hold a P. So at most GOMAXPROCS goroutines run truly in parallel, no matter how many Gs or Ms exist.",
        code: `// G = goroutine   (millions possible; ~2 KB stack, grows on demand)
// M = OS thread   (the thing the kernel schedules onto a core)
// P = processor   (a run-queue + scheduling context; count = GOMAXPROCS)
//
// Invariant: an M needs a P to run Go code.
//   #P  = GOMAXPROCS         → max parallelism
//   #M  ≥ #P                 → extra threads for blocked syscalls
//   #G  = however many you start

import "runtime"
fmt.Println(runtime.GOMAXPROCS(0), runtime.NumGoroutine())`,
        lang: "go",
      },
      {
        title: "Run queues & work stealing: keeping every P busy",
        body:
          "Each P has its own local run queue (a fast, mostly lock-free ring of ~256 goroutines), plus there is one global queue for overflow. When you `go f()`, the new G usually lands on the current P's local queue - no global lock, great cache locality. When a P empties its local queue, it does not go idle: it steals half the goroutines from a randomly chosen victim P, and occasionally checks the global queue and netpoller. Work stealing is what keeps all cores fed without a central bottleneck, even when work is created unevenly.",
        code: `// go f()  → push G onto THIS P's local run queue (cheap, local).
go handle(conn)

// When a P's local queue is empty, its M tries, in order:
//   1. pull from the global run queue (occasionally)
//   2. poll the netpoller for I/O-ready goroutines
//   3. STEAL half of a random other P's local queue
//
// Result: load balances itself; no global scheduler lock on
// the hot path.`,
        lang: "go",
      },
      {
        title: "The netpoller: why 100k blocked connections are cheap",
        body:
          "Here is the trick behind Go's networking. When a goroutine does a blocking read on a socket that has no data, the runtime does NOT block the OS thread. It parks the goroutine and registers the socket with the OS event system (epoll on Linux, kqueue on BSD/macOS, IOCP on Windows) - the netpoller. The M is freed to run other goroutines. When the OS later signals the socket is readable, the netpoller wakes the parked goroutine and it gets scheduled again. So a server with 100,000 idle connections needs ~100,000 cheap goroutines, not 100,000 threads - the C10k problem, solved by the runtime.",
        code: `// This LOOKS like a thread-per-connection blocking read…
func serve(conn net.Conn) {
    buf := make([]byte, 4096)
    n, err := conn.Read(buf) // blocks the GOROUTINE, not the thread
    // ...
}
for { conn, _ := ln.Accept(); go serve(conn) }

// …but under the hood Read parks the G in the netpoller and
// frees its M. Synchronous-looking code, async-efficient runtime.`,
        lang: "go",
      },
      {
        title: "Syscalls: handing off the P so others keep running",
        body:
          "A blocking syscall the netpoller cannot handle - a disk read, a DNS lookup, some cgo call - is different: it really does block the OS thread for its duration. To stop that from stalling a whole P's worth of goroutines, the runtime detaches the P from the blocked M and hands it to another M (spinning one up or reusing a parked one) so the remaining goroutines keep running on a different thread. When the syscall returns, the original M tries to reacquire a P; if none is free, its goroutine goes to the global queue. This is why #M can exceed GOMAXPROCS.",
        code: `// Blocking syscall (e.g. a file read) holds its OS thread.
data, err := os.ReadFile("big.dat") // M blocks in the kernel

// Runtime response: detach this M's P, give P to another M so
// its other goroutines keep running. That's why you may see
// more OS threads than GOMAXPROCS.
//   GODEBUG=schedtrace=1000 ./app   → per-second scheduler stats
//   (Ps, Ms, run-queue lengths, steals)`,
        lang: "go",
      },
      {
        title: "Preemption: no goroutine can hog a core",
        body:
          "Early Go could only switch goroutines at function calls (cooperative preemption), so a tight loop with no calls - `for {}` - could starve every other goroutine on that P, and even stall the GC. Since Go 1.14 the runtime uses ASYNCHRONOUS preemption: a background monitor (sysmon) notices a goroutine that has run more than ~10 ms and sends the thread a signal, which safely interrupts it at a preemption point and lets the scheduler run something else. This is why a CPU-bound goroutine no longer freezes your program, and why STW phases can actually stop the world promptly.",
        code: `// Pre-1.14 this could hang the whole program; now sysmon
// preempts it after ~10 ms via a signal.
go func() { for { /* pure CPU, no function calls */ } }()

// sysmon (a special M with no P) also:
//   - retakes Ps from long syscalls
//   - forces a GC if none has run for ~2 minutes
//   - injects netpoller results when all Ps are busy`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Feed a schedtrace dump to an LLM and have it explain what the scheduler is doing under your load.",
      prompt:
        "Here is GODEBUG=schedtrace=1000 output from my Go service under load: <paste>. Explain each field (runqueue, idle Ps, threads, steal counts), tell me whether I'm CPU-bound, syscall-bound, or starved, and what GOMAXPROCS or code change would help.",
    },
    practice: {
      title: "Try it yourself",
      body: "Watch the scheduler with built-in tracing.",
      steps: [
        "Run any concurrent program with GODEBUG=schedtrace=1000 and read the per-second Ps/Ms/run-queue numbers.",
        "Print runtime.NumGoroutine() before and after a fan-out to see goroutines created and reclaimed.",
        "Set runtime.GOMAXPROCS(1) on a CPU-bound parallel workload and watch throughput collapse to one core.",
        "Start 100,000 goroutines that each block on a channel and confirm NumGoroutine, then close to let them exit.",
      ],
    },
    pitfalls: [
      "Assuming each goroutine is an OS thread and sizing pools to CPU count out of fear - goroutines are cheap; the netpoller handles the blocking.",
      "Leaking goroutines: a G parked forever in the netpoller or on a channel is never reclaimed and holds its stack (see M7).",
      "Setting GOMAXPROCS by hand in a container instead of letting Go 1.25 read the cgroup quota (see M9), then thrashing under throttling.",
    ],
    takeaways: [
      "G-M-P maps many goroutines onto few threads; parallelism is capped at GOMAXPROCS (the number of Ps).",
      "Per-P run queues plus work stealing load-balance without a global lock on the hot path.",
      "The netpoller makes blocking-looking I/O cheap; syscall handoff and async preemption keep every P productive.",
    ],
    checklist: [
      "Can define G, M, P and state the 'M needs a P to run Go' invariant.",
      "Explain work stealing and why local run queues are fast.",
      "Explain how the netpoller turns 100k blocked connections into cheap goroutines.",
      "Know why async preemption exists and what sysmon does.",
    ],
  },

  /* ================================================================ M13 */
  {
    id: "m13",
    code: "C1",
    num: 10,
    part: "part-3",
    title: "Atomics vs Mutexes vs Channels",
    short: "Synchronization",
    level: "Senior",
    duration: "4 hrs",
    icon: "lock",
    summary:
      "The three ways Go goroutines coordinate - lock-free atomics, mutexes, and channels - what each actually guarantees through the memory model, their relative cost, and a clear decision guide for which to reach for.",
    plain:
      "When two goroutines touch the same data, you need synchronization - without it you have a data race, where the result depends on timing and the program is simply broken (and the compiler/CPU are free to reorder your reads and writes). Go gives you three tools. Atomics are the lightest: a single machine instruction to update one word, no lock. A Mutex is a lock you take around a critical section to protect more complex state. Channels pass ownership of data from one goroutine to another, coordinating who is allowed to touch it. They are not interchangeable - each fits a different shape of problem - and this module is about choosing correctly and understanding the guarantees underneath.",
    animation: {
      id: "sync-primitives",
      title: "Atomic CAS vs Mutex vs Channel Handoff",
      blurb:
        "Three lanes, the same job under contention: a lock-free atomic compare-and-swap, a mutex serializing a critical section, and a channel handing a value from producer to consumer.",
    },
    concepts: [
      {
        title: "The data race & the memory model (happens-before)",
        body:
          "A data race is two goroutines accessing the same memory concurrently with at least one write and no synchronization between them. The result is undefined - not 'a wrong number', but genuinely unspecified behaviour, because the compiler and CPU may reorder operations (Module M11). The Go memory model defines 'happens-before': synchronization operations (a channel send/receive, a mutex Lock/Unlock, an atomic) establish an ordering that makes one goroutine's writes visible to another. Every correct concurrent program is built from these ordering guarantees. Always test with `-race`.",
        code: `// DATA RACE - undefined behaviour, not just a wrong total:
var n int
for i := 0; i < 1000; i++ { go func() { n++ }() } // BROKEN

// The race detector finds these for you:
//   go test -race ./...     go run -race main.go
//
// Synchronization (atomic/mutex/channel) creates the
// happens-before edges that make writes visible across goroutines.`,
        lang: "go",
      },
      {
        title: "Atomics: lock-free updates to a single word",
        body:
          "`sync/atomic` (use the typed `atomic.Int64`, `atomic.Bool`, `atomic.Pointer[T]`) performs an indivisible read-modify-write on one machine word using a CPU instruction - no lock, no blocking, no goroutine ever waits. They are the fastest primitive, ideal for counters, flags, and lock-free swaps of a single value. The building block is compare-and-swap (CAS): 'set X to new only if it still equals old', looped until it succeeds. The limit: atomics protect ONE word. The moment your invariant spans two related variables, an atomic cannot keep them consistent - you need a mutex.",
        code: `var requests atomic.Int64
requests.Add(1)               // lock-free increment from any goroutine
cur := requests.Load()

// CAS - the heart of lock-free algorithms:
for {
    old := gauge.Load()
    if gauge.CompareAndSwap(old, old+1) {
        break // won the race; otherwise retry with the new old
    }
}

var cfg atomic.Pointer[Config] // hot-swap an immutable config
cfg.Store(newCfg)              // readers see old-or-new, never torn`,
        lang: "go",
      },
      {
        title: "Mutex: a lock around a critical section",
        body:
          "A `sync.Mutex` guards a critical section: only one goroutine holds the lock at a time, so the multi-step update inside is atomic with respect to other goroutines. This is the right tool when an invariant spans several fields (a map plus its size, a balance plus a log) - exactly what atomics cannot do. `sync.RWMutex` allows many concurrent readers OR one writer, a win for read-mostly state. The discipline: keep critical sections SHORT (no I/O under a lock), always pair Lock with `defer Unlock`, and never copy a struct that contains a mutex.",
        code: `type Account struct {
    mu      sync.Mutex
    balance int64
    log     []Entry
}
func (a *Account) Deposit(amt int64, e Entry) {
    a.mu.Lock()
    defer a.mu.Unlock()       // always paired; survives panics
    a.balance += amt          // two related fields stay consistent
    a.log = append(a.log, e)  // - an atomic can't span both
}

// Read-mostly? RWMutex lets readers run in parallel:
//   var mu sync.RWMutex; mu.RLock()/RUnlock() for readers.`,
        lang: "go",
      },
      {
        title: "Channels: transfer ownership, coordinate work",
        body:
          "A channel does more than move data - it moves OWNERSHIP. 'Don't communicate by sharing memory; share memory by communicating': instead of locking a value that two goroutines both touch, hand the value through a channel so only one goroutine owns it at a time, removing the shared state entirely. Channels shine for pipelines, fan-out/fan-in worker pools, signalling completion or cancellation, and applying backpressure (a full buffered channel blocks fast producers). They are heavier than a mutex per operation, so use them for coordination and data flow - not as a fancy lock around a counter.",
        code: `// Ownership of each job passes through the channel; no shared
// state, so no lock is needed on the job itself.
jobs := make(chan Job, 64)        // buffer = backpressure
for w := 0; w < n; w++ { go worker(jobs) }
for _, j := range work { jobs <- j }
close(jobs)                        // sender closes; workers drain & exit

// Signalling (not data) - close to broadcast 'stop' to many:
done := make(chan struct{})
go func() { <-done; cleanup() }()
close(done)`,
        lang: "go",
      },
      {
        title: "The decision guide: which one, and when",
        body:
          "Pick by the SHAPE of the problem, not by taste. One counter or flag, or hot-swapping a single value → atomic (fastest, lock-free). An invariant over several fields, or read-mostly shared state → mutex (RWMutex if reads dominate). Passing data between goroutines, pipelines, worker pools, cancellation, or backpressure → channels. When two fit, prefer the simplest that is correct: a mutex around a counter is fine and clearer than a clever channel; an atomic counter beats a mutex when it is literally just a counter. Measure contention before optimizing - and remember every choice still needs `-race` to verify.",
        code: `// Rule of thumb:
//   atomic   → one word: counter, flag, lock-free pointer swap
//   mutex    → multi-field invariant / read-mostly (RWMutex)
//   channel  → move data + ownership, pipelines, signalling, backpressure
//
// Heuristics:
//   "Is it just a counter?"            → atomic
//   "Do several fields change together?" → mutex
//   "Am I handing work to a goroutine?"  → channel
//   When unsure: the simplest correct one. Verify with -race.`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Describe shared state and let an LLM argue which primitive fits - then sanity-check its reasoning against the rules above.",
      prompt:
        "I have this shared state accessed by multiple goroutines in Go: <describe the fields and who reads/writes them>. Recommend atomic vs sync.Mutex/RWMutex vs channel, explain the happens-before guarantee that makes it correct, point out any data race, and show the idiomatic implementation. Note the trade-offs if I picked a different primitive.",
    },
    practice: {
      title: "Try it yourself",
      body: "Build the same counter three ways and feel the difference.",
      steps: [
        "Increment a shared counter from 100 goroutines with no synchronization, run with -race, and watch it both report a race and produce a wrong total.",
        "Fix it with atomic.Int64.Add, then with a sync.Mutex, then by sending increments over a channel to a single owner goroutine.",
        "Benchmark all three under contention with `go test -bench` and `-cpu=1,4,8` - note where atomics win and where channels cost more.",
        "Build a read-mostly cache with RWMutex and compare RLock throughput against a plain Mutex.",
      ],
    },
    pitfalls: [
      "Using an atomic per field to protect an invariant that spans two fields - each update is atomic but the pair can still be observed inconsistent; use a mutex.",
      "Holding a mutex across I/O or a channel operation, turning a short critical section into a contention bottleneck (or a deadlock).",
      "Reaching for channels as a general-purpose lock around a counter - it is slower and less clear than an atomic or mutex.",
    ],
    takeaways: [
      "Synchronization is not optional: an unsynchronized shared write is a data race and undefined behaviour - always run `-race`.",
      "Atomics protect one word lock-free; mutexes protect multi-field invariants; channels transfer ownership and coordinate.",
      "Choose by the shape of the problem and prefer the simplest correct primitive; measure contention before optimizing.",
    ],
    checklist: [
      "Can define a data race and name the happens-before edge each primitive provides.",
      "Know when an atomic is insufficient and a mutex is required.",
      "Can implement a counter with atomic, mutex, and channel, and explain the trade-offs.",
      "Default to running every concurrent test with -race.",
    ],
  },

  /* ================================================================ M14 */
  {
    id: "m14",
    code: "D2",
    num: 19,
    part: "part-5",
    title: "Observability: Logs, Metrics & Traces",
    short: "Observability",
    level: "Production",
    duration: "3–4 hrs",
    icon: "gauge",
    summary:
      "Making a running system explain itself: structured logging with slog, the RED/USE metrics that page you, and distributed traces that follow one request across services - the three pillars and how they fit together.",
    plain:
      "In production you cannot attach a debugger to a service handling thousands of requests a second. Instead the system has to tell you what it is doing, continuously and cheaply. That is observability, and it rests on three complementary signals. Logs are timestamped records of discrete events. Metrics are cheap numeric aggregates over time (request rate, error rate, latency) - what your dashboards and alerts watch. Traces follow a single request as it hops across services, showing where its time actually went. None alone is enough: metrics tell you SOMETHING is wrong, traces tell you WHERE, and logs tell you WHY. This module wires all three into a Go service the idiomatic way.",
    animation: {
      id: "three-pillars",
      title: "One Request Across the Three Pillars",
      blurb:
        "A single request flows through three services. Watch it emit a trace of nested spans, bump latency/error metrics, and drop structured log lines - and see how a trace ID ties them together.",
    },
    concepts: [
      {
        title: "The three pillars, and the question each answers",
        body:
          "Logs, metrics, and traces are not competitors - they answer different questions and you want all three. Metrics answer 'is something wrong, and how bad?' cheaply and continuously (they are aggregates, so cost does not grow with traffic). Traces answer 'where in the request path did the time/error happen?' across service boundaries. Logs answer 'what exactly happened in this one event?' with full detail. The mature workflow: an alert fires on a METRIC, you open a TRACE of a slow request to find the offending service, then read its LOGS for the precise cause. Correlate them by stamping a trace ID into logs and metrics labels.",
        code: `// Each pillar, one question:
//   metrics → "IS it broken, and how badly?"   (alert here)
//   traces  → "WHERE did the time/error go?"    (across services)
//   logs    → "WHAT exactly happened here?"      (full detail)
//
// Glue: put the trace_id on every log line and span so you can
// jump metric → trace → log for the same request.`,
        lang: "go",
      },
      {
        title: "Structured logging with log/slog",
        body:
          "Plain text logs (`log.Printf(\"user %s failed: %v\", id, err)`) are unsearchable at scale. `log/slog` (standard since Go 1.21) emits structured key/value records - JSON in production - that a log system can index and filter. Log key/value attributes, not interpolated strings; set levels (Debug/Info/Warn/Error); and attach request-scoped fields once with `logger.With(...)` so every line in that request carries them. Use a JSON handler in prod and a human handler in dev. Pass the logger (or pull a request-scoped one from context) rather than using a global.",
        code: `import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
// Key/value attrs, not formatted strings → searchable, filterable:
logger.Error("charge failed",
    "user_id", id, "amount_cents", cents, "err", err)

// Bind request-scoped context once; every line inherits it:
reqLog := logger.With("trace_id", tid, "route", "POST /ledger")
reqLog.Info("accepted")   // → {"level":"INFO","trace_id":...,"route":...}`,
        lang: "go",
      },
      {
        title: "Metrics: counters, gauges, histograms & RED/USE",
        body:
          "Metrics are cheap because they aggregate: a counter that only ever goes up (requests, errors), a gauge that goes up and down (in-flight requests, queue depth), and a histogram that buckets a distribution (latency) so you can compute p50/p95/p99. Two framings tell you WHAT to measure: RED for request-driven services - Rate, Errors, Duration; USE for resources - Utilization, Saturation, Errors. Expose them on a `/metrics` endpoint for Prometheus to scrape. The cardinal rule below: never label a metric with an unbounded value.",
        code: `// RED for a service:  rate · errors · duration
//   requests_total{route,method,status}   counter
//   request_duration_seconds{route}        histogram → p99
//   inflight_requests                       gauge
// USE for a resource:  utilization · saturation · errors

// Histograms let you ask the tail:
//   histogram_quantile(0.99, rate(request_duration_seconds_bucket[5m]))
// Expose for scraping:
//   mux.Handle("GET /metrics", promhttp.Handler())`,
        lang: "go",
      },
      {
        title: "Distributed tracing: spans & context propagation",
        body:
          "A trace is a tree of spans - each span is one timed operation (an HTTP handler, a DB query, an RPC) with a start, duration, and attributes. The root span covers the whole request; child spans nest beneath it, so the trace literally shows where the milliseconds went across services. The magic is CONTEXT PROPAGATION: the trace ID and current span ID ride along in `context.Context` and are injected into outgoing request headers (W3C `traceparent`), so the next service continues the SAME trace. This is exactly why Module F5 insists context is the first argument to everything - it carries the trace.",
        code: `import "go.opentelemetry.io/otel"

func handle(w http.ResponseWriter, r *http.Request) {
    ctx, span := tracer.Start(r.Context(), "POST /ledger")
    defer span.End()
    span.SetAttributes(attribute.String("account", id))

    if err := charge(ctx, id); err != nil { // ctx carries the trace
        span.RecordError(err)
        span.SetStatus(codes.Error, "charge failed")
    }
}
// charge() starts a CHILD span; an outgoing HTTP/gRPC call injects
// 'traceparent' so the next service joins the same trace.`,
        lang: "go",
      },
      {
        title: "Cardinality, sampling & cost: the production realities",
        body:
          "Observability has a cost you must control. CARDINALITY is the killer: a metric label with unbounded values (user ID, request ID, raw URL with IDs) explodes into millions of time series and can take down your metrics backend - keep labels to small, bounded sets (route template, status code, method). Traces are sampled (you cannot store every span at scale) - head-based (decide at the root) or tail-based (keep the slow/errored ones); always sample, but keep the interesting traces. Logs are the most expensive at volume - log at the right level, avoid logging in tight loops, and prefer a sampled-trace + metric over a per-request log line.",
        code: `// CARDINALITY TRAP - do NOT do this:
//   requests_total{user_id="...", url="/ledger/8f3a-..."}  💥 millions of series
// Bounded labels only:
//   requests_total{route="/ledger/{id}", method="POST", status="200"}  ✓
//
// Traces: sample (e.g. 1% + always-keep errors/slow).
// Logs: level discipline; never log.Info inside a hot loop.`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Have an LLM design the signals for a specific endpoint, then pressure-test it for cardinality.",
      prompt:
        "For this Go HTTP handler: <paste>, propose the RED metrics (with bounded label sets), the slog fields to log, and the trace spans to create. Then review your own metric labels for cardinality risk and flag anything unbounded. Show the slog and OpenTelemetry setup code.",
    },
    practice: {
      title: "Try it yourself",
      body: "Instrument a tiny HTTP service end to end.",
      steps: [
        "Replace log.Printf with a slog JSON handler and log key/value attributes, including a trace_id with logger.With.",
        "Add a requests_total counter and a request_duration histogram; expose /metrics and scrape it with a local Prometheus.",
        "Wrap a handler in an OpenTelemetry span, add a child span around a fake DB call, and view the trace.",
        "Deliberately add a high-cardinality label, watch the series count explode, then fix it to a bounded label.",
      ],
    },
    pitfalls: [
      "Labeling metrics with unbounded values (user/request IDs, raw paths) - a cardinality explosion that can crash the metrics backend.",
      "Logging unstructured strings or logging inside hot loops - unsearchable and ruinously expensive at production volume.",
      "Starting spans but dropping the context (not passing ctx down), so child operations land in a different trace or none at all.",
    ],
    takeaways: [
      "Use all three pillars: metrics say IF it's broken, traces say WHERE, logs say WHY - correlate them with a trace ID.",
      "Structured slog + RED/USE metrics + context-propagated spans is the idiomatic Go stack.",
      "Control cost deliberately: bounded metric labels, sampled traces, level-disciplined logs.",
    ],
    checklist: [
      "Can name the question each of the three pillars answers and how to correlate them.",
      "Emit structured slog records with request-scoped attributes, JSON in prod.",
      "Define RED metrics with bounded labels and read p99 from a histogram.",
      "Propagate context so spans nest into one cross-service trace, and control cardinality/sampling.",
    ],
  },

  /* ================================================================ M15 */
  {
    id: "m15",
    code: "D3",
    num: 20,
    part: "part-5",
    title: "Resilience: Timeouts, Retries, Circuit Breakers & Load Shedding",
    short: "Resilience",
    level: "Production",
    duration: "3–4 hrs",
    icon: "bolt",
    summary:
      "How a distributed system survives partial failure instead of amplifying it: deadlines on every call, retries with backoff and jitter, circuit breakers, rate limiting, load shedding, and bounded-queue backpressure.",
    plain:
      "In a single program a failure is usually a crash you can read in a stack trace. In a distributed system, failures are PARTIAL and contagious: one slow dependency makes its callers slow, which exhausts their connections and goroutines, which makes THEIR callers slow - a cascade that takes down a whole system from one struggling node. Resilience engineering is the set of patterns that stop a partial failure from becoming a total one: put a deadline on everything, retry transient errors carefully (without becoming a self-inflicted DDoS), stop calling a service that is clearly down, and shed load you cannot serve instead of falling over. These patterns are the difference between a blip and an outage.",
    animation: {
      id: "circuit-breaker",
      title: "The Circuit Breaker State Machine",
      blurb:
        "Watch a breaker move Closed → Open → Half-Open as a downstream service fails and recovers: failures trip it open, a cooldown lets one probe through, and success closes it again.",
    },
    concepts: [
      {
        title: "Deadlines everywhere: the foundation of resilience",
        body:
          "The first rule: no call waits forever. Every network operation gets a timeout via `context.WithTimeout`, and that context propagates down the whole call chain (Module F5), so when a request's deadline passes, every in-flight downstream call for it is cancelled at once. Without deadlines, one stuck dependency parks goroutines and connections until the server runs out - the classic cascade. A request budget (e.g. 2 s total) is split across hops, and each hop checks `ctx.Err()`. Timeouts are not a nicety; they are what bound the blast radius of a slow dependency.",
        code: `// Bound every external call; cancel propagates to all children.
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

resp, err := client.Do(req.WithContext(ctx)) // aborts at the deadline
if errors.Is(err, context.DeadlineExceeded) {
    // fail fast - don't pile up waiters behind a slow dependency
}
// Servers need deadlines too:
//   &http.Server{ReadHeaderTimeout: 5*time.Second, ...}`,
        lang: "go",
      },
      {
        title: "Retries: backoff, jitter & idempotency",
        body:
          "Transient failures (a dropped connection, a 503, a serialization conflict from M5) are worth retrying - but naively. Three rules. EXPONENTIAL BACKOFF: wait 100 ms, 200 ms, 400 ms… so you do not hammer a struggling service. JITTER: randomize each delay, or thousands of clients retry in lockstep and create a synchronized 'thundering herd' that knocks the recovering service back down. IDEMPOTENCY: only retry operations that are safe to repeat (a retried payment must carry an idempotency key, or you double-charge). And cap the attempts - retries multiply load, so an uncapped retry storm is a self-inflicted DDoS.",
        code: `func withRetry(ctx context.Context, op func() error) error {
    base := 100 * time.Millisecond
    for attempt := 0; attempt < 5; attempt++ {
        if err := op(); err == nil || !transient(err) {
            return err // success, or a non-retryable error
        }
        // exponential backoff + full jitter
        d := base << attempt
        sleep := time.Duration(rand.Int63n(int64(d)))
        select {
        case <-time.After(sleep):
        case <-ctx.Done(): return ctx.Err() // respect the deadline
        }
    }
    return errors.New("exhausted retries")
}`,
        lang: "go",
      },
      {
        title: "Circuit breakers: stop calling what is already down",
        body:
          "Retrying a service that is genuinely down just wastes time and piles on load. A circuit breaker is a state machine that wraps a dependency. CLOSED: calls flow normally while it tracks the failure rate. When failures cross a threshold it trips to OPEN: every call fails INSTANTLY for a cooldown period - no waiting on timeouts, giving the dependency room to recover. After the cooldown it goes HALF-OPEN and lets a few probe calls through; if they succeed it closes again, if they fail it re-opens. This 'fail fast' behaviour is what prevents one dead dependency from consuming all your goroutines and connections.",
        code: `// Conceptual breaker states:
//   CLOSED   → calls pass; count failures
//   OPEN     → trip after N failures; calls fail FAST for cooldown
//   HALF-OPEN→ after cooldown, allow a few probes
//                success → CLOSED   failure → OPEN
b := breaker.New(breaker.Settings{
    Trip:    func(c breaker.Counts) bool { return c.ConsecutiveFailures > 5 },
    Timeout: 10 * time.Second, // open → half-open cooldown
})
res, err := b.Execute(func() (any, error) { return call(ctx) })
if errors.Is(err, breaker.ErrOpen) { return cachedFallback() }`,
        lang: "go",
      },
      {
        title: "Rate limiting & load shedding: protect yourself and others",
        body:
          "Two valves bound how much work enters the system. A RATE LIMITER (token bucket - `golang.org/x/time/rate`) caps the requests per second you accept or send, smoothing bursts and protecting a downstream from overload. LOAD SHEDDING is the harder-edged sibling: when you are already saturated (queue full, latency past SLO), reject excess requests immediately with 429/503 instead of accepting work you cannot finish. Counter-intuitively, shedding load KEEPS the system up: a server that accepts everything under overload slows to a crawl and serves NOBODY, while one that sheds 20% serves the other 80% at full speed.",
        code: `import "golang.org/x/time/rate"

lim := rate.NewLimiter(rate.Limit(1000), 200) // 1000 rps, burst 200
func handler(w http.ResponseWriter, r *http.Request) {
    if !lim.Allow() {                 // shed instead of queueing forever
        http.Error(w, "slow down", http.StatusTooManyRequests) // 429
        return
    }
    // ... serve ...
}
// Load shedding > infinite queueing: serve 80% fast, not 100% slowly.`,
        lang: "go",
      },
      {
        title: "Backpressure: bounded queues that push back",
        body:
          "The deepest resilience idea is backpressure: when a consumer cannot keep up, the system must SLOW THE PRODUCER rather than buffer without limit. An unbounded queue (or channel) under overload just grows until it exhausts memory and the process is OOM-killed - it converts a throughput problem into a crash. A BOUNDED buffered channel gives you backpressure for free: when it is full, sends block, which propagates the slowness back to the producer so it stops accepting more. Combined with deadlines, the slow path then times out cleanly. Bound every queue; treat 'queue full' as a signal to shed, not to grow.",
        code: `// Bounded channel = built-in backpressure.
jobs := make(chan Job, 100) // NOT unbounded

// Producer that refuses to wait forever / overfill:
select {
case jobs <- job:                       // room available
case <-ctx.Done():                       // deadline hit
    return ctx.Err()
default:                                 // queue full → shed, don't grow
    return ErrOverloaded                 // 503 upstream
}
// Unbounded buffering turns overload into an OOM crash.`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Hand an LLM a fragile call path and have it layer the resilience patterns in the right order.",
      prompt:
        "Here is a Go function that calls a flaky downstream service: <paste>. Add the resilience patterns in the correct order - context deadline, capped retries with exponential backoff + jitter, a circuit breaker, and a fallback - and explain which failures each layer handles. Point out any non-idempotent operation that is unsafe to retry.",
    },
    practice: {
      title: "Try it yourself",
      body: "Harden a flaky client step by step.",
      steps: [
        "Wrap an HTTP call in context.WithTimeout and confirm it aborts (and propagates cancellation) at the deadline.",
        "Add capped retries with exponential backoff + full jitter; simulate a flaky server and watch the delays grow.",
        "Add a circuit breaker (e.g. sony/gobreaker) and verify calls fail fast once it trips OPEN, then recover via HALF-OPEN.",
        "Put a rate.Limiter in front of a handler and load-test it: confirm it returns 429 under overload instead of collapsing.",
      ],
    },
    pitfalls: [
      "Retrying without backoff, jitter, or a cap - turning a brief downstream blip into a self-inflicted thundering-herd DDoS.",
      "Retrying non-idempotent operations (payments, sends) without an idempotency key, causing duplicates.",
      "Using unbounded channels/queues so overload becomes an OOM crash instead of clean backpressure and shedding.",
    ],
    takeaways: [
      "Put a context deadline on every external call; propagation cancels the whole request's in-flight work at once.",
      "Retry only transient, idempotent operations - capped, with exponential backoff AND jitter.",
      "Fail fast (circuit breaker) and shed load under saturation; bounded queues give backpressure instead of an OOM.",
    ],
    checklist: [
      "Every outbound call has a deadline and respects context cancellation.",
      "Retries are capped, jittered, exponential, and only on idempotent operations.",
      "A circuit breaker fails fast for a known-down dependency and recovers via half-open probes.",
      "Queues are bounded; the system sheds load (429/503) under saturation instead of growing or crashing.",
    ],
  },
  /* ================================================================ M16 */
  {
    id: "m16",
    code: "D4",
    num: 21,
    part: "part-5",
    title: "Redis: Caching, Rate Limiting & Distributed Locks",
    short: "Redis",
    level: "Production",
    duration: "3–4 hrs",
    icon: "database",
    summary:
      "Redis as a single-threaded, in-memory data structure server: the cache-aside pattern that keeps it safely beside your real database, and the atomic commands (SETNX, INCR) that turn the same server into a distributed lock and a rate limiter for free.",
    plain:
      "Think of Redis as a small whiteboard sitting right next to a filing cabinet that holds the real records. Reading the whiteboard is nearly instant; digging through the cabinet is slow. So you check the whiteboard first - there (a HIT), you're done. Not there (a MISS), you go to the cabinet, find the answer, and jot it on the whiteboard before you leave, with a sticky note that says 'erase this in 60 seconds' so nobody trusts stale handwriting forever. The twist that makes Redis more than just 'a fast whiteboard' is that only one clerk ever touches it, and that clerk handles one request at a time, start to finish, never two at once. That means an instruction like 'write this ONLY IF the space is still blank' is automatically fair - even if five people shout it at the exact same instant, the clerk still processes them one after another, so exactly one of them succeeds. That single property, one clerk handling one command at a time, is what turns a fast cache into a working distributed lock and a working rate limiter, with no extra coordination required on top.",
    animation: {
      id: "redis-cache",
      title: "The Cache-Aside Lifecycle & the Atomic Lock",
      blurb:
        "Watch a read fall through from a miss to the real database, get cached with a TTL, come back as a near-instant hit, expire, and miss again - then watch SETNX let exactly one of five racing clients win a lock.",
    },
    concepts: [
      {
        title: "What Redis actually is: an in-memory store with one clerk",
        body:
          "Redis keeps its data set in memory (not on disk, though it CAN persist to disk for recovery), so reads and writes are measured in microseconds instead of the milliseconds a disk-backed database needs. The part that surprises people: Redis is single-threaded for command execution - one event loop processes commands one at a time, start to finish, even though your Go program is calling it from many goroutines at once. That single-threaded core is not a limitation to work around; it is the reason every individual command is atomic with zero extra locking, a property the rest of this module leans on directly.",
        code: `rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
ctx := context.Background()

err := rdb.Set(ctx, "user:42:name", "Alice", 30*time.Second).Err()
val, err := rdb.Get(ctx, "user:42:name").Result()
// val == "Alice"; the key auto-expires in 30s regardless of whether
// anyone ever explicitly deletes it.`,
        lang: "go",
      },
      {
        title: "Cache-aside: Redis sits BESIDE the source of truth, not instead of it",
        body:
          "In the cache-aside pattern, your application code checks Redis first. On a HIT, it returns straight from Redis and never touches the real database. On a MISS (the Go client surfaces this as the sentinel error `redis.Nil`), it queries the real source of truth, writes the result into Redis with a TTL, and returns it. Crucially, Redis is never the only copy of the data - the database is still authoritative, so it is safe to lose the cache entirely (a restart, an eviction, an `flushall`) and simply repopulate it on the next miss.",
        code: `price, err := rdb.Get(ctx, "price:"+sku).Result()
if errors.Is(err, redis.Nil) {
    price, err = fetchPriceFromDB(sku)        // slow path: the real source
    if err == nil {
        rdb.Set(ctx, "price:"+sku, price, 60*time.Second)
    }
}
// First call: MISS, ~50ms (a real query). Second call: HIT, <1ms.`,
        lang: "go",
      },
      {
        title: "TTL and invalidation: a cache is allowed to be a little wrong",
        body:
          "A TTL bounds exactly how stale a cached value can ever be - set it to 60s and you have accepted, on purpose, that a value may lag reality by up to 60 seconds. That is usually a fine trade for the speed you get back. When it is not fine (a price just changed and must be correct immediately), invalidate explicitly: delete the key the moment the source of truth is updated, rather than waiting for the TTL to catch up. The two techniques compose - TTL is the safety net for keys nobody explicitly invalidates, explicit deletion is the fast path for the ones that matter.",
        code: `func updatePrice(ctx context.Context, rdb *redis.Client, sku, newPrice string) error {
    if err := writeToRealDatabase(sku, newPrice); err != nil {
        return err
    }
    return rdb.Del(ctx, "price:"+sku).Err() // next read is a clean miss + repopulate
}`,
        lang: "go",
      },
      {
        title: "Atomicity for free: SETNX as a distributed lock",
        body:
          "`SET key value NX` ('set if Not eXists') either creates the key and returns success, or does nothing and returns failure if the key is already there. Because the whole check-and-write happens as ONE command on Redis's single-threaded event loop, there is no gap between 'check' and 'write' for a second caller to slip into - the exact race that a naive `if GET key == nil { SET key }` in your own Go code would have. That makes SETNX (with a TTL, so a crashed holder does not lock things forever) a correct distributed lock across any number of processes or machines, using nothing but one Redis instance.",
        code: `ok, err := rdb.SetNX(ctx, "lock:invoice:9001", "worker-3", 5*time.Second).Result()
if ok {
    // this caller, and only this caller, holds the lock
    defer rdb.Del(ctx, "lock:invoice:9001")
} else {
    // someone else already holds it - back off and retry, or skip
}`,
        lang: "go",
      },
      {
        title: "Atomic counters: INCR as a rate limiter",
        body:
          "The same single-threaded guarantee makes `INCR` safe for counting under concurrency: it atomically adds one and returns the new total in a single round trip, so two simultaneous callers can never both read '2' and both write '3', silently losing one increment. A fixed-window rate limiter is just INCR plus an EXPIRE set once, on the first hit in a window: count past your limit inside that window and you reject the request, and the whole counter resets itself when the key expires.",
        code: `count, _ := rdb.Incr(ctx, "ratelimit:ip:"+clientIP).Result()
if count == 1 {
    rdb.Expire(ctx, "ratelimit:ip:"+clientIP, 10*time.Second) // start the window
}
if count > 100 {
    return errTooManyRequests // 429
}`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body: "Hand an LLM a naive GET-then-SET counter or lock and have it show you the exact race, then rebuild it atomically.",
      prompt:
        "Here is a Go function that checks a value with GET, modifies it in Go, and writes it back with SET: <paste>. Show me precisely how two concurrent callers can race and lose an update, then rewrite it using Redis's atomic INCR (for a counter) or SETNX (for a lock) so the race is structurally impossible instead of just unlikely.",
    },
    practice: {
      title: "Try it yourself",
      body: "Build and break the cache-aside pattern, then the lock, then the limiter.",
      steps: [
        "Point go-redis at a local Redis, run a cache-aside Get/Set, and confirm a cold miss populates the cache while a warm read skips your 'slow' source entirely.",
        "Set a short TTL, wait past it, and confirm the next read is a clean miss again - then add explicit Del-on-write invalidation and confirm it beats the TTL to the punch.",
        "Race 5+ goroutines on the same SETNX key and run it several times: confirm exactly one succeeds every run, even though WHICH one wins changes.",
        "Build the INCR + EXPIRE limiter, fire more requests than the limit inside one window, and confirm the excess get rejected instead of silently allowed.",
      ],
    },
    pitfalls: [
      "Treating Redis as the system of record instead of a cache - if it is flushed, evicted, or restarted, anything that only ever lived in Redis is simply gone.",
      "Doing a non-atomic GET-then-SET in application code for a counter or a lock - the exact check-then-act race that SETNX and INCR exist specifically to make impossible.",
      "Cache stampede: many keys expiring at once (or one very hot key expiring) sends a burst of simultaneous misses straight at the real database all together.",
      "Acquiring a lock with SETNX but forgetting its TTL - a holder that crashes before releasing leaves the lock stuck forever with nobody able to acquire it.",
    ],
    takeaways: [
      "Cache-aside: check Redis first, fall through to the real source of truth on a miss, repopulate with a TTL.",
      "Redis is single-threaded for command execution, so SETNX and INCR are atomic across every caller - that gives you a distributed lock and a rate limiter with zero extra synchronization.",
      "A cached value can be wrong for up to its TTL; design for that staleness window on purpose instead of assuming the cache is always correct.",
    ],
    checklist: [
      "Every cached key has either an explicit TTL or an explicit invalidation path on write.",
      "Cache misses fall through cleanly to the real source of truth and repopulate the cache before returning.",
      "Locks and counters use SETNX/INCR - never a separate GET followed by a SET.",
      "Every lock key carries its own TTL, so a crashed holder cannot lock a resource forever.",
    ],
  },
  /* ================================================================ M18 */
  {
    id: "m18",
    code: "D6",
    num: 23,
    part: "part-5",
    title: "SRE: SLOs, Observability, Incidents & Platform Reliability",
    short: "SRE & Interview Prep",
    level: "Production",
    duration: "self-paced",
    icon: "activity",
    summary:
      "Turn an SRE vacancy into engineering skill: define SLI/SLO/error budgets, build useful dashboards and alerts, operate OpenTelemetry + Prometheus/Thanos + Tempo + Loki, run on-call/RCA, automate toil, and reason about Kubernetes/OpenShift reliability.",
    plain:
      "SRE is the discipline of making production systems reliable on purpose. You do not just 'watch dashboards'; you define what reliability means for users (SLIs/SLOs), alert only when users are being hurt or the error budget is burning, collect telemetry that shortens debugging, run incidents with a clear command structure, and remove repetitive manual work with automation. In an interview, the strongest answers connect tools to outcomes: Prometheus is not the goal - lower detection time, lower recovery time, and safer releases are the goal.",
    animation: {
      id: "sre-slo-budget",
      title: "SLO Error Budget & Burn Rate",
      blurb:
        "Watch a 99.9% availability SLO turn into an error budget, then see how slow burn and fast burn alerts mean very different operational responses.",
    },
    animations: [
      {
        id: "sre-slo-budget",
        title: "SLO Error Budget & Burn Rate",
        blurb:
          "Watch a 99.9% availability SLO turn into an error budget, then see how slow burn and fast burn alerts mean very different operational responses.",
      },
      {
        id: "sre-telemetry-stack",
        title: "OpenTelemetry → Prometheus/Thanos + Tempo + Loki",
        blurb:
          "Follow one request as it becomes metrics, traces and logs, then see where Prometheus, Thanos, Tempo and Loki fit in the operational stack.",
      },
      {
        id: "sre-incident-toil",
        title: "On-call, RCA and Toil Automation",
        blurb:
          "Move from alert to triage, mitigation, root cause analysis and automation backlog - the loop that turns incidents into reliability improvements.",
      },
    ],
    concepts: [
      {
        title: "SLI, SLO and error budget",
        body:
          "An SLI is a measured signal of user experience: availability, successful requests, latency under a threshold, freshness of a queue. An SLO is the target for that signal, such as 99.9% of transfers succeed over 30 days. The error budget is the allowed failure: 0.1% for a 99.9% SLO. Strong SRE work starts here because alerts, release gates and reliability investments become objective. If the budget is healthy, ship. If it is burning fast, freeze risky releases and mitigate.",
        code: `// Availability SLI over a rolling window:
//   successful_requests / total_requests
//
// 99.9% SLO means a 0.1% error budget.
// If 1,000,000 requests happen in the window:
//   allowed bad requests = 1,000,000 * 0.001 = 1,000
//
// Burn rate asks: are we consuming that budget too fast?`,
        lang: "go",
      },
      {
        title: "Dashboards and alerts that matter",
        body:
          "A good dashboard answers an operational question: are users affected, where is the bottleneck, and what changed? For services use RED: Rate, Errors, Duration. For infrastructure use USE: Utilization, Saturation, Errors. Alerts should be actionable and tied to SLO burn or hard saturation, not every noisy symptom. In interviews, explain why paging on CPU 80% is weak while paging on 'checkout SLO burns 14x for 5 minutes' is strong: it maps to user impact and urgency.",
        code: `# Prometheus-style alert shape:
# page when the 5m error-budget burn is severe
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
> 0.014

# Ticket, not page: slow burn over hours.
# Page: fast burn over minutes.`,
        lang: "promql",
      },
      {
        title: "OpenTelemetry and the Grafana/Prometheus stack",
        body:
          "OpenTelemetry is instrumentation and transport: it standardizes traces, metrics and logs at the application boundary. Prometheus scrapes metrics; Thanos stores and queries Prometheus data across clusters and long retention; Tempo stores traces cheaply; Loki indexes log labels and keeps log text compressed. The point is correlation: an alert fires on a metric, you open a trace for the slow request, then jump to logs with the same trace ID.",
        code: `// Interview answer structure:
// 1. Instrument with OpenTelemetry SDK/collector.
// 2. Expose RED metrics for Prometheus.
// 3. Ship traces to Tempo, logs to Loki.
// 4. Put trace_id in logs so metric -> trace -> log is one workflow.
// 5. Keep labels bounded: route="/transfers/{id}", never raw user IDs.`,
        lang: "go",
      },
      {
        title: "On-call and incident command",
        body:
          "Structured on-call is a process, not a person heroically fixing production at 3 AM. A good incident has roles: incident commander coordinates, operations lead mitigates, communications lead updates stakeholders, scribe captures timeline. The first goal is mitigation, not perfect root cause. After the system is stable, run a blameless postmortem: impact, timeline, contributing factors, what detected it, what delayed response, and concrete follow-up actions with owners.",
        code: `Incident note template:
Impact: which users / SLO / duration
Detection: alert, customer report, synthetic check
Timeline: UTC events, decisions, mitigations
Root cause: technical + contributing process factors
Action items: owner, due date, measurable outcome`,
        lang: "text",
      },
      {
        title: "Toil automation",
        body:
          "Toil is manual, repetitive, automatable work that grows with the service: restarting stuck pods, collecting the same diagnostics, resizing the same queues, running a checklist by hand. SRE does not automate for style; it automates to reduce operational load and variance. The best candidates can name a toil source, quantify it, write a small script or controller, add guardrails, and prove the automation reduced incidents or minutes spent.",
        code: `// Good toil story:
// Before: on-call manually collected pods/logs/events for every incident.
// Automation: one command captures kubectl describe, previous logs,
// node pressure, recent deploys and SLO burn into an incident bundle.
// Result: triage starts with evidence, not copy-paste archaeology.`,
        lang: "go",
      },
      {
        title: "Kubernetes/OpenShift reliability review",
        body:
          "For Kubernetes or OpenShift, reliability review means looking at probes, resource requests/limits, HPA signals, pod disruption budgets, rollout strategy, network policies, service/load balancer behavior, storage classes, database dependencies and secret handling. OpenShift adds platform conventions: Routes, SecurityContextConstraints, integrated registry/builds and stricter defaults. Interview answers should connect these knobs to failure modes: bad readiness sends traffic to cold pods; missing PDB turns node drain into downtime; wrong limits create throttling.",
        code: `# Review checklist:
# readinessProbe: protects users during startup and rollout
# livenessProbe: restarts truly wedged processes, not slow ones
# requests/limits: scheduling and throttling behavior
# PDB + rollingUpdate: how many replicas can disappear safely
# HPA metric: scale on saturation, not vanity CPU alone
# NetworkPolicy/SCC/secrets: safety boundary in multi-tenant clusters`,
        lang: "yaml",
      },
      {
        title: "Linux and networking troubleshooting",
        body:
          "SRE interviews often test systematic debugging. Start from symptoms and move down the stack: DNS resolution, TCP connection, TLS handshake, HTTP status, load balancer, pod endpoints, app logs, database latency, node pressure. On Linux know the basic evidence: `ss` for sockets, `dig` for DNS, `curl -v` for HTTP/TLS, `journalctl` for system logs, `top`/`pidstat` for CPU, `iostat` for disk, `tcpdump` when you need packets. The skill is forming and eliminating hypotheses quickly.",
        code: `# Fast path for "service is down":
dig api.internal
curl -vk https://api.internal/healthz
ss -tnp | grep 443
kubectl get endpoints,po -l app=ledger
kubectl logs deploy/ledger --previous
kubectl describe pod <pod> | grep -A5 -E "Events|Limits|Requests"`,
        lang: "sh",
      },
    ],
    ai: {
      title: "AI-Workflow Integration",
      body:
        "Use an assistant as an SRE interview coach: feed it a job description and ask it to generate SLO, alerting, incident and Kubernetes troubleshooting scenarios, then grade your answers against concrete signals.",
      prompt:
        "Act as a senior SRE interviewer. Ask me one scenario at a time based on this vacancy: SLI/SLO, Prometheus/Thanos, OpenTelemetry, Tempo/Loki, Kubernetes/OpenShift, Linux networking, on-call, RCA and toil automation. After each answer, grade it on correctness, operational judgment and communication, then show the stronger answer.",
    },
    capstone: {
      title: "Ledger Capstone",
      body:
        "Add the SRE operating layer to the ledger: SLOs and burn-rate alerts, Grafana dashboards, OpenTelemetry correlation, an on-call runbook, a postmortem template, toil automation and Kubernetes/OpenShift readiness review.",
    },
    pitfalls: [
      "Defining SLOs from infrastructure symptoms instead of user-visible behavior.",
      "Paging on noisy metrics that have no action or user impact.",
      "Letting traces, logs and metrics use different IDs so correlation is manual.",
      "Treating postmortems as blame documents instead of reliability learning tools.",
      "Automating toil without guardrails, audit logs or rollback paths.",
      "Ignoring Kubernetes basics: readiness, requests/limits, PDBs, rollout settings and endpoint health.",
    ],
    takeaways: [
      "SRE starts with user-visible reliability: SLI, SLO and error budget.",
      "Metrics page you, traces locate the slow hop, logs explain the event - correlate all three.",
      "Incidents need roles, mitigation first, then blameless RCA and owned follow-ups.",
      "Toil automation is production engineering: reduce repeat work and make response consistent.",
      "Strong interview answers connect tools to reliability outcomes, not tool names to buzzwords.",
    ],
    checklist: [
      "Can design SLIs/SLOs and calculate error-budget burn for a microservice.",
      "Can build a RED/USE dashboard and separate page-worthy alerts from tickets.",
      "Can explain OpenTelemetry, Prometheus/Thanos, Tempo and Loki in one request-debugging workflow.",
      "Can run an incident from alert to mitigation, RCA and action items.",
      "Can review Kubernetes/OpenShift deployment reliability and debug Linux/network symptoms.",
      "Can identify toil and propose safe automation with measurable benefit.",
    ],
  },

  /* ============================================================ F4 (m19) */
  {
    id: "m19",
    code: "F4",
    num: 4,
    part: "part-0",
    title: "Interview Data Structures & Algorithms in Go",
    short: "Interview DS & Algorithms",
    level: "Beginner → Mid",
    duration: "3 hrs",
    icon: "layers",
    summary:
      "The structures every coding interview probes - slices, maps, heaps, trees and graphs - explained the way Go actually implements them: growth rules, bucket layout, sift operations, BFS/DFS mechanics and when to reach for which.",
    plain:
      "Interviews keep asking the same handful of questions: how does a hashmap actually work, why is append sometimes slow, walk this tree, find the shortest path. The honest answers are not memorized trivia - they come from knowing what the machine does. A slice is a tiny header pointing at an array. A map is buckets of eight slots picked by hash bits. A heap is a tree flattened into a slice. BFS is just a queue; DFS is just a stack. This module builds each of those pictures, in Go, so the interview answer is a description of something you have seen move.",
    animation: {
      id: "bfs-wave",
      title: "BFS: The Wave and the Queue",
      blurb:
        "Watch breadth-first search spread through a graph level by level - nodes enter the queue, get visited exactly once, and the first time you reach the target IS the shortest path.",
    },
    // Interview prep leans on pictures: four visualizations, one per core
    // structure family, ordered from graphs (the most-asked) to memory layout.
    animations: [
      {
        id: "bfs-wave",
        title: "BFS: The Wave and the Queue",
        blurb:
          "Watch breadth-first search spread through a graph level by level - nodes enter the queue, get visited exactly once, and the first time you reach the target IS the shortest path.",
      },
      {
        id: "lru-cache",
        title: "LRU Cache: Map + Linked List",
        blurb:
          "Get and Put move nodes to the front of a doubly-linked list while a map jumps straight to them - and when capacity runs out, the tail is evicted in O(1).",
      },
      {
        id: "hashmap-internals",
        title: "Inside a Go Map: Buckets & Growth",
        blurb:
          "Follow a key through hashing: low bits pick the bucket, tophash bytes shortcut the scan, and when buckets fill up the whole table grows and evacuates.",
      },
      {
        id: "slice-heap",
        title: "Slice Growth & the Heap in a Slice",
        blurb:
          "See append run out of capacity and reallocate, then watch a binary heap live inside a plain slice - parent and child are just index arithmetic, sift-up and sift-down restore order.",
      },
    ],
    concepts: [
      {
        title: "Slices: a header over an array",
        body:
          "A slice is three words: a pointer into a backing array, a length, and a capacity. append is O(1) amortized because growth doubles (then ~1.25×) the backing array - but any append past cap copies everything and ABANDONS the old array, which is why two slices sharing a backing array stop seeing each other's writes after one of them grows. Interviewers love this question because it separates people who used slices from people who understand them.",
        code: `s := make([]int, 0, 2)
a := append(s, 1)      // len 1, cap 2 - same backing array as s
b := append(a, 2, 3)   // exceeds cap -> NEW array, copies 1,2
a[0] = 99              // writes the OLD array
fmt.Println(b[0])      // still 1 - b no longer sees a's writes
// The three-word header is why slices are passed by value cheaply:
// copying a slice never copies the elements.`,
        lang: "go",
      },
      {
        title: "Maps: hash, bucket, tophash",
        body:
          "A Go map hashes the key, uses the LOW bits of the hash to pick one of 2^B buckets, and each bucket holds up to eight key/value pairs plus eight one-byte 'tophash' values (the hash's HIGH bits). A lookup scans the eight tophash bytes first - one cache line - and only compares full keys on a tophash match. When average load passes ~6.5 pairs per bucket the table doubles and entries evacuate incrementally. That evacuation is also why iteration order is deliberately randomized: code must never depend on it.",
        code: `m := map[string]int{"a": 1, "b": 2, "c": 3}
for k := range m {
    fmt.Println(k) // order differs run to run - BY DESIGN
}
// Interview answer sketch for "how does a map work?":
// hash(key) -> low bits pick bucket -> tophash scan (8 slots)
// -> full key compare on match -> overflow bucket if full
// -> grow at ~6.5 load factor, evacuate incrementally.`,
        lang: "go",
      },
      {
        title: "Heaps: a tree flattened into a slice",
        body:
          "A binary heap is a complete tree stored in a slice with pure index math: children of i live at 2i+1 and 2i+2, the parent at (i-1)/2. Push appends and sifts up; Pop takes index 0, moves the last element to the root and sifts down. Both are O(log n), and the top is always the minimum (or maximum). This is THE structure for 'k largest', 'merge k sorted lists' and every priority queue - and container/heap just asks you for the same five methods over your own slice.",
        code: `// A min-heap is index arithmetic on a slice:
func siftUp(h []int, i int) {
    for i > 0 {
        p := (i - 1) / 2
        if h[p] <= h[i] { break }
        h[p], h[i] = h[i], h[p]
        i = p
    }
}
// push: h = append(h, x); siftUp(h, len(h)-1)
// peek min: h[0]  -  always the smallest, in O(1)`,
        lang: "go",
      },
      {
        title: "Tree walks: BFS is a queue, DFS is a stack",
        body:
          "Every tree/graph traversal question reduces to one choice: queue or stack. Breadth-first uses a queue and visits nodes level by level - which is why the FIRST time BFS reaches a node is via a shortest path (in unweighted graphs). Depth-first uses a stack - usually the call stack via recursion - and dives to the bottom before backtracking; it is the skeleton for 'does a path exist', tree recursion and topological sort. If the interviewer says 'shortest' or 'nearest', that word means BFS.",
        code: `func bfs(root *Node) {
    queue := []*Node{root}
    for len(queue) > 0 {
        n := queue[0]
        queue = queue[1:] // dequeue
        visit(n)
        queue = append(queue, n.Children...) // enqueue next level
    }
}
func dfs(n *Node) { // the call stack IS the stack
    if n == nil { return }
    visit(n)
    for _, c := range n.Children { dfs(c) }
}`,
        lang: "go",
      },
      {
        title: "Graphs: adjacency list, visited set, and when which",
        body:
          "Represent a graph as map[node][]node (adjacency list) unless it is genuinely dense - the list costs O(V+E) memory and lets BFS/DFS run in O(V+E) time, while a matrix costs O(V²) no matter how sparse. The one mistake that fails graph interviews is forgetting the visited set: with it every node is processed once; without it any cycle loops forever. Say the complexity out loud when you code it - that is usually the follow-up question anyway.",
        code: `graph := map[int][]int{1: {2, 3}, 2: {4}, 3: {4}, 4: {1}}
visited := map[int]bool{}
var stack []int
stack = append(stack, 1)
for len(stack) > 0 {
    n := stack[len(stack)-1]
    stack = stack[:len(stack)-1] // pop - LIFO makes this DFS
    if visited[n] { continue }   // the line that prevents ∞ loops
    visited[n] = true
    stack = append(stack, graph[n]...)
}
// swap the pop for queue[0]/queue[1:] and it becomes BFS.`,
        lang: "go",
      },
    ],
    ai: {
      title: "Learn faster with an AI tutor",
      body:
        "Rehearse the interview loop itself: have an LLM play the interviewer, drill the follow-up questions (complexity, trade-offs, what breaks at scale), and grade your spoken explanation of a structure against what Go really does.",
      prompt:
        "Act as a Go coding interviewer. Ask me to implement an LRU cache without container/list. After my solution, drill me with follow-ups: complexity of each operation, what changes with concurrent access, how Go's map behaves under growth, and when I would use a heap instead. Point out any claim I make about Go internals that is wrong.",
    },
    practice: {
      title: "Try it yourself",
      body: "Interview muscles grow by re-implementing, not re-reading.",
      steps: [
        "Re-implement the LRU cache from the worked example from memory, then diff against the lesson version.",
        "Write BFS shortest-path over map[int][]int and verify the distance to every node on a small graph you draw on paper.",
        "Implement siftUp/siftDown on a plain []int and heap-sort 20 random numbers with them.",
        "Predict the output of the slice-aliasing snippet in concept 1 before running it - then run it.",
      ],
    },
    pitfalls: [
      "Forgetting the visited set in graph traversal - the classic infinite loop the moment the graph has a cycle.",
      "Assuming append never moves data: two slices share a backing array only until one append exceeds cap, then writes silently diverge.",
      "Relying on map iteration order (it is randomized on purpose) or reading a map from multiple goroutines without synchronization - both are real production bugs, not just interview trivia.",
    ],
    takeaways: [
      "Slice = pointer+len+cap header; growth copies and abandons the old array.",
      "Map = hash → bucket via low bits → tophash scan; grows at ~6.5 load factor; iteration order is random by design.",
      "Heap = complete tree in a slice, O(log n) sift operations, O(1) peek of the extreme.",
      "BFS(queue) finds shortest paths in unweighted graphs; DFS(stack) answers reachability and structure questions.",
    ],
    checklist: [
      "Can explain slice growth and the aliasing trap with a concrete code example.",
      "Can walk a key through a Go map lookup: hash bits, bucket, tophash, growth.",
      "Can implement a min-heap's siftUp/siftDown on a plain slice from memory.",
      "Can write BFS and DFS over an adjacency list and state their O(V+E) complexity.",
      "Can build an O(1) LRU cache from a map plus a hand-rolled doubly-linked list.",
    ],
  },
];

/* ------------------------ Extra depth concepts (merged into modules) */
const MORE_CONCEPTS = {
  m3: [{
    title: "Weak pointers for caches (the weak package)",
    body: "Go 1.24's weak package gives you a reference that does NOT keep its target alive. It's ideal for a cache or canonical map that should let entries be collected under memory pressure - the weak handle simply reads back nil once the object is gone.",
    code: `import "weak"

// A cache whose values never prevent garbage collection.
var cache sync.Map // key -> weak.Pointer[Big]

func get(k string) *Big {
    if v, ok := cache.Load(k); ok {
        if p := v.(weak.Pointer[Big]).Value(); p != nil {
            return p // still alive - reuse it
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
    body: "A bonus of synctest: if every goroutine in the bubble becomes durably blocked and no timer can fire, that's a deadlock - and the bubble fails the test immediately instead of hanging your CI. You catch 'everyone is waiting on everyone' bugs deterministically.",
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
    body: "For multi-statement atomicity, begin a transaction, defer a Rollback, and Commit at the end. The deferred Rollback is a no-op after a successful Commit, so this pattern is always safe - any early return undoes the partial work.",
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
  m17: [{
    title: "Partial indexes for operational queues",
    body: "Not every index should cover the whole table. The outbox worker only scans unpublished rows, so a partial index keeps the hot working set small while old published events stay out of the btree.",
    code: `CREATE INDEX CONCURRENTLY outbox_unpublished_idx
    ON outbox_events (id)
    WHERE published_at IS NULL;

SELECT id, transfer_id, kind
  FROM outbox_events
 WHERE published_at IS NULL
 ORDER BY id
 LIMIT 100
 FOR UPDATE SKIP LOCKED;`,
    lang: "sql",
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
    body: "A FlightRecorder dump is a runtime/trace file - open it with `go tool trace` for a timeline of every goroutine, GC cycle, syscall and scheduler event. It's the microscope for 'why did this 50 ms request actually take 50 ms'.",
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
    ["Stop-the-world", "The brief pauses where all goroutines halt - sub-millisecond in Go."],
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
  m19: [
    ["Slice header", "The three words - pointer, length, capacity - a slice really is."],
    ["Bucket / tophash", "A map's 8-slot cell; tophash bytes shortcut key comparison."],
    ["Load factor", "Average entries per bucket; Go maps grow past ~6.5."],
    ["Binary heap", "A complete tree in a slice; children of i at 2i+1 and 2i+2."],
    ["BFS / DFS", "Traversal by queue (level order, shortest paths) vs by stack (depth first)."],
    ["Adjacency list", "Graph as node → neighbors map; O(V+E) space and traversal."],
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
    ["Reflection", "Runtime type inspection - flexible but comparatively slow."],
    ["jsontext", "The low-level streaming JSON token API in encoding/json/v2."],
    ["Swiss Table", "A cache-friendly map layout that checks 8 slots' tags at once."],
    ["Control byte", "A 1-byte per-slot tag a Swiss Table compares SIMD-style."],
    ["Escape analysis", "The compiler deciding whether a value lives on the stack or heap."],
  ],
  m3: [
    ["Finalizer", "Legacy, unreliable pre-collection callback - avoid it."],
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
    ["Row-level lock", "SELECT … FOR UPDATE - locks specific rows, not the whole table."],
    ["Double-entry", "Every transfer debits one account and credits another by the same amount."],
    ["SQLSTATE", "Postgres's 5-character error code (e.g. 23505 = unique_violation)."],
    ["40001", "serialization_failure - a concurrency conflict that should be retried."],
  ],
  m17: [
    ["MVCC", "Postgres's snapshot model: writers create new row versions while readers keep seeing an older consistent view."],
    ["Bloat", "Dead row versions that vacuum has not yet reclaimed, increasing table and index size."],
    ["EXPLAIN ANALYZE BUFFERS", "Runs the query and shows actual timing plus shared/local/temp buffer usage."],
    ["Composite index", "A multi-column index ordered to match a query's filters, sorting, and pagination."],
    ["CREATE INDEX CONCURRENTLY", "Builds an index without blocking normal reads/writes, at the cost of more time and restrictions."],
    ["Outbox pattern", "Write the business row and a publishable event in the same transaction, then relay asynchronously."],
  ],
  m6: [
    ["gRPC", "An RPC framework over HTTP/2 that carries Protobuf messages."],
    ["Protobuf", "Compact, schema-defined binary serialization."],
    ["ML-KEM", "NIST's post-quantum key-encapsulation mechanism (lattice-based)."],
    ["Hybrid KEM", "Classical + post-quantum combined; secure unless BOTH break."],
    ["Harvest-now-decrypt-later", "Recording ciphertext today to decrypt with a future quantum computer."],
    ["Field number", "A Protobuf tag identifying a field - never reuse a retired one."],
  ],
  m7: [
    ["FlightRecorder", "An always-on, bounded in-memory buffer of recent trace events."],
    ["Execution trace", "A timeline of goroutines, GC, syscalls and scheduling (go tool trace)."],
    ["Goroutine dump", "A snapshot of every goroutine's current stack."],
    ["p99 latency", "The latency 99% of requests beat - the slow tail."],
    ["Goroutine leak", "A goroutine stuck forever and never reclaimed."],
    ["Wait reason", "The parked-state label in a goroutine dump (chan receive, select, IO wait) plus how long it has waited."],
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
    ["ADR", "Architecture Decision Record - a short note on why a choice was made."],
    ["Readiness probe", "A health check telling the load balancer a pod can take traffic."],
  ],
  m10: [
    ["Cache line", "The 64-byte (128 on Apple silicon) block moved between RAM and cache as one unit."],
    ["L1 / L2 / L3", "Progressively bigger, slower on-chip caches sitting between registers and RAM."],
    ["Temporal locality", "Data used recently is likely to be used again soon - so caches keep it."],
    ["Spatial locality", "Data near what you just used is likely needed soon - prefetchers exploit this."],
    ["False sharing", "Independent variables on one cache line forcing needless cross-core invalidation."],
    ["Struct padding", "Compiler-inserted filler bytes that align each field to its natural boundary."],
  ],
  m11: [
    ["Pipeline", "Overlapping instruction stages (fetch/decode/execute/…) so ~1 instruction retires per cycle."],
    ["Branch predictor", "Hardware that guesses a branch's outcome so the pipeline never has to stall."],
    ["Misprediction penalty", "The ~15–20 wasted cycles spent flushing and refilling after a wrong guess."],
    ["Speculative execution", "Running instructions down a predicted path before the branch is actually resolved."],
    ["Out-of-order execution / ILP", "Running independent instructions ahead while one waits on a slow result."],
    ["Branchless code", "Replacing a data-dependent if with arithmetic so there is no branch to mispredict."],
  ],
  m12: [
    ["G-M-P", "Go's scheduling model: Goroutine, (OS thread) Machine, (logical) Processor."],
    ["Work stealing", "An idle P takes half the goroutines from a busy P's local run queue."],
    ["Netpoller", "The OS event mechanism (epoll/kqueue/IOCP) that parks goroutines on blocking I/O for free."],
    ["Syscall handoff", "Detaching a blocked M's P and giving it to another M so other goroutines keep running."],
    ["Async preemption", "sysmon interrupting a goroutine that has run too long via signal, since Go 1.14."],
    ["sysmon", "The runtime's background monitor thread that has no P of its own."],
  ],
  m13: [
    ["Data race", "Concurrent unsynchronized access to memory with at least one write - undefined behavior."],
    ["happens-before", "The ordering guarantee the Go memory model gives between synchronized operations."],
    ["CAS (compare-and-swap)", "Atomic 'set X to new only if it still equals old', looped until it succeeds."],
    ["Critical section", "Code guarded by a mutex so only one goroutine executes it at a time."],
    ["RWMutex", "A lock allowing many concurrent readers, or one writer, never both."],
    ["Ownership transfer", "Passing a value through a channel so only one goroutine owns it at a time."],
  ],
  m14: [
    ["Structured logging", "Key/value log records (e.g. via slog) instead of interpolated text strings."],
    ["RED metrics", "Rate, Errors, Duration - the framing for instrumenting a request-driven service."],
    ["USE metrics", "Utilization, Saturation, Errors - the framing for instrumenting a resource."],
    ["Span", "One timed operation in a trace, with a start, duration, and attributes."],
    ["Context propagation", "Carrying the trace/span ID through context.Context and outgoing request headers."],
    ["Cardinality", "The number of distinct label combinations a metric produces; unbounded labels explode it."],
  ],
  m15: [
    ["Deadline", "A context.WithTimeout-bound limit on how long a call is allowed to run."],
    ["Exponential backoff", "Increasing the wait time between successive retries."],
    ["Jitter", "Randomizing retry delays so many clients don't retry in lockstep."],
    ["Circuit breaker", "A closed/open/half-open state machine that fails fast against a known-down dependency."],
    ["Load shedding", "Rejecting excess requests under saturation instead of queueing them forever."],
    ["Backpressure", "Propagating slowness back to the producer via a bounded queue instead of buffering without limit."],
  ],
  m16: [
    ["Cache-aside", "Check the cache first; on a miss, read the real source of truth and populate the cache before returning."],
    ["TTL", "Time-to-live - how long a key survives before Redis automatically expires it."],
    ["redis.Nil", "The sentinel error go-redis returns for a GET on a key that does not exist - a cache miss, not a failure."],
    ["SETNX", "'Set if Not eXists' - an atomic create-only write, the building block of a distributed lock."],
    ["INCR", "An atomic increment-and-return, the building block of a race-free counter or rate limiter."],
    ["Cache stampede", "A burst of simultaneous misses (from mass expiry or one hot key) hitting the real database all at once."],
  ],
  m18: [
    ["SLI", "A measured indicator of user-visible reliability, such as successful requests or latency under a threshold."],
    ["SLO", "A target for an SLI over a window, e.g. 99.9% successful transfers over 30 days."],
    ["Error budget", "The allowed failure implied by an SLO; spending it too fast triggers operational action."],
    ["Burn rate", "How quickly the service is consuming its error budget compared with the allowed pace."],
    ["Toil", "Manual, repetitive, automatable operational work that scales with the service."],
    ["Postmortem / RCA", "A blameless analysis of impact, timeline, contributing factors and owned follow-up actions."],
  ],
};

/* ----------------------------------------------------- Verification grid */
const VERIFICATION = [
  ["Go Environment Target", "go 1.26 - strictly enforced via CI checks"],
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
     mcq    - multiple choice (answer = index)
     blank  - fill in the blank (accept = list of accepted answers, case-insensitive)
     predict- predict the printed output (accept = list)
     code   - write code, graded by structural rules:
                { has: "substr" } must contain
                { not: "substr" } must NOT contain
                { re:  "regex"  } must match
   ------------------------------------------------------------------- */
const ASSIGNMENTS = {
  m19: [
    { type: "mcq", prompt: "b := append(a, x) exceeded a's capacity. What is now true?",
      options: ["a and b share a backing array", "b points at a new array; writes to a no longer affect b", "a is invalidated and must not be used", "append always copies, capacity or not"],
      answer: 1, explain: "Growth allocates a NEW backing array and copies - the old array (and a) is untouched but disconnected. Within capacity they would still share." },
    { type: "blank", prompt: "In a binary heap stored in a slice, the parent of index i is at index ____ (integer division):",
      code: `p := (i - 1) / ____`, accept: ["2"],
      explain: "(i-1)/2 - the mirror of children at 2i+1 and 2i+2. This index math is the whole trick of storing a tree in a slice." },
    { type: "predict", prompt: "BFS runs from node A in an UNWEIGHTED graph and reaches node T for the first time at depth 3. Can any shorter A→T path exist? (yes/no)",
      accept: ["no"],
      explain: "BFS explores strictly by level: all depth-1 and depth-2 nodes were visited before any depth-3 node, so a shorter path would have found T earlier." },
  ],
  f1: [
    { type: "mcq", prompt: "At the end of the mark phase, what does a WHITE object represent?",
      options: ["Reachable and fully scanned", "Reachable but not yet scanned", "Unreachable - it will be swept", "Pinned in memory forever"],
      answer: 2, explain: "White = never reached from the roots, so it is garbage and gets swept. Grey = reachable but not yet scanned; black = scanned." },
    { type: "blank", prompt: "Set a 512 MiB soft memory limit at runtime. Fill the blank:",
      code: `debug.____(512 << 20)`, accept: ["SetMemoryLimit"],
      explain: "debug.SetMemoryLimit(512<<20) sets GOMEMLIMIT in code; the GC gets more aggressive as the heap approaches it." },
    { type: "code", prompt: "Write one line (using runtime/debug) that lets the heap grow ~2× before each GC - i.e. double the default GOGC.",
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
      explain: "go tool pprof -http=:8080 cpu.out - the fastest way to see the flame graph." },
  ],
  f3: [
    { type: "mcq", prompt: "Which method reports a failure but lets the rest of the test keep running?",
      options: ["t.Fatal", "t.Error", "t.Skip", "t.Log"], answer: 1,
      explain: "t.Error/t.Errorf record a failure and continue; t.Fatal/t.Fatalf stop the current test immediately." },
    { type: "blank", prompt: "Run each table case as a named, isolated subtest. Fill the blank:",
      code: `t.____(c.name, func(t *testing.T) { /* ... */ })`, accept: ["Run"],
      explain: "t.Run(name, fn) creates a subtest - failures point at the exact case name." },
    { type: "code", prompt: "Write the everyday command to run all tests with the race detector and coverage.",
      starter: ``, checks: [{ has: "go test", msg: "Use go test" }, { has: "-race", msg: "Enable the race detector with -race" }, { has: "-cover", msg: "Enable coverage with -cover" }],
      explain: "go test -race -cover ./... - run it constantly." },
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
      explain: "for w := 0; w < 3; w++ { go func() { for j := range jobs { process(j) } }() } - the classic fan-out." },
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
      explain: "defer cancel() releases the timer and signals children - required even if the timeout never fires." },
  ],
  m1: [
    { type: "mcq", prompt: "When two patterns could match, Go 1.22+ ServeMux picks:",
      options: ["the first one registered", "the longest (most specific) matching pattern", "alphabetical order", "a random one"], answer: 1,
      explain: "Precedence is most-specific-wins, so /ledger/{id}/audit beats /ledger/{id}." },
    { type: "blank", prompt: "Read the {id} wildcard captured by the pattern. Fill the blank:",
      code: `id := r.____("id")`, accept: ["PathValue"],
      explain: "r.PathValue(\"id\") returns the wildcard segment - no regexp, no allocations." },
    { type: "code", prompt: "Register getEntry for GET /api/v1/ledger/{id} on mux - no third-party router.",
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
      explain: "new(int64(25)) allocates and returns a *int64 inline - handy for optional fields." },
    { type: "code", prompt: "Write the `go build` command that prints the compiler's escape-analysis decisions.",
      starter: ``, checks: [{ has: "go build", msg: "Use go build" }, { has: "-gcflags", msg: "Pass compiler flags with -gcflags" }, { has: "-m", msg: "Enable escape analysis output with -m" }],
      explain: "go build -gcflags='-m' ./... - look for 'does not escape'." },
  ],
  m3: [
    { type: "mcq", prompt: "Why must a runtime.AddCleanup closure NOT capture the object it cleans?",
      options: ["it would run too early", "it keeps the object reachable forever - the exact leak you wanted to avoid", "cleanups can't take arguments", "it panics at compile time"], answer: 1,
      explain: "Capturing the object makes it reachable, so it's never collected and the cleanup never runs. Capture the raw handle (fd) by value instead." },
    { type: "blank", prompt: "Intern a repeated string to a shared, comparable handle. Fill the blank:",
      code: `usd := unique.____("USD")`, accept: ["Make"],
      explain: "unique.Make(\"USD\") returns a Handle[string]; equal values share one copy and compare by pointer." },
    { type: "mcq", prompt: "Compared to runtime.SetFinalizer, runtime.AddCleanup:",
      options: ["can resurrect the object", "runs once and never resurrects the object", "delays collection by a full GC cycle", "is deprecated"], answer: 1,
      explain: "AddCleanup runs exactly once after the object is truly unreachable, with no resurrection - strictly better than finalizers." },
  ],
  m4: [
    { type: "mcq", prompt: "Inside a synctest bubble, time.Sleep(5 * time.Second):",
      options: ["really blocks for 5 seconds", "advances the fake clock instantly once all goroutines are blocked", "is ignored entirely", "panics"], answer: 1,
      explain: "The bubble clock is virtual: when every goroutine is blocked, time jumps to the next timer instantly and deterministically." },
    { type: "blank", prompt: "Block the test until every other goroutine in the bubble is parked. Fill the blank:",
      code: `synctest.____()`, accept: ["Wait"],
      explain: "synctest.Wait() is a precise 'everyone is durably blocked' barrier - replaces 'sleep and hope'." },
    { type: "code", prompt: "Write the header line of a modern benchmark loop (no b.N bookkeeping).",
      starter: `func BenchmarkValidate(b *testing.B) {\n    // your loop here\n}`,
      checks: [{ has: "b.Loop()", msg: "Use for b.Loop()" }],
      explain: "for b.Loop() { ... } - keeps values alive and runs setup once." },
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
  m17: [
    { type: "mcq", prompt: "On a hot table, the safer default for adding an index used by production traffic is:",
      options: ["CREATE INDEX CONCURRENTLY after validating the query shape", "CREATE INDEX inside a long transaction during peak traffic", "add three unrelated single-column indexes", "skip EXPLAIN because indexes are always used"], answer: 0,
      explain: "CONCURRENTLY avoids blocking normal writes while the index is built. You still validate the query shape and confirm with EXPLAIN." },
    { type: "mcq", prompt: "For `WHERE account_id = $1 ORDER BY posted_at DESC LIMIT 50`, the best matching index is usually:",
      options: ["(posted_at)", "(account_id, posted_at DESC)", "(amount_cents)", "(direction, amount_cents)"], answer: 1,
      explain: "The equality filter comes first, then the sort/pagination key. That lets Postgres jump to one account's recent rows in index order." },
    { type: "blank", prompt: "Fill the Postgres option that shows real execution plus buffer activity:",
      code: `EXPLAIN (ANALYZE, ____) SELECT ...`, accept: ["BUFFERS"],
      explain: "BUFFERS shows how much work came from shared/local/temp buffers, which is often the difference between a good plan and a hidden IO problem." },
    { type: "code", prompt: "Add SQL that makes transfer retries idempotent with a unique key.",
      starter: `CREATE TABLE transfers (\n    id uuid PRIMARY KEY,\n    idempotency_key text NOT NULL\n);\n`,
      checks: [{ has: "UNIQUE", msg: "Make the idempotency key unique" }, { has: "idempotency_key", msg: "Use the idempotency_key column" }],
      explain: "A UNIQUE constraint on idempotency_key lets a retry return the original result instead of creating a duplicate transfer." },
    { type: "mcq", prompt: "A long session left `idle in transaction` is dangerous mainly because it:",
      options: ["pins old row versions and can prevent vacuum cleanup", "makes SELECT impossible", "turns off WAL", "automatically drops indexes"], answer: 0,
      explain: "MVCC snapshots held by old transactions can keep dead tuples visible, so vacuum cannot reclaim them and bloat grows." },
  ],
  m6: [
    { type: "mcq", prompt: "'Harvest now, decrypt later' attacks are defeated by:",
      options: ["bigger RSA keys", "a hybrid classical + ML-KEM key exchange", "turning off TLS", "faster CPUs"], answer: 1,
      explain: "Hybrid key exchange stays secure unless BOTH X25519 and ML-KEM are broken - so recorded traffic resists a future quantum computer." },
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
      explain: "Other goroutines keep running, but this one never exits and its memory is never freed - a leak the analyzer can trace." },
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
      explain: "GOEXPERIMENT=greenteagc enables the span-based collector - no code changes." },
  ],
  m9: [
    { type: "mcq", prompt: "On a pod limited to 4 CPUs, Go 1.25 sets GOMAXPROCS to:",
      options: ["the host's total core count", "4 - the cgroup CPU quota", "1", "128"], answer: 1,
      explain: "Go 1.25 reads the cgroup limit so GOMAXPROCS matches the real quota, avoiding CFS throttling." },
    { type: "mcq", prompt: "Shipping a distroless / scratch final image gives you:",
      options: ["a full shell for debugging", "smaller size and a much smaller attack surface", "faster compiles", "more CVEs"], answer: 1,
      explain: "A static Go binary needs no OS - no shell, no package manager, minimal CVE surface, a few MB." },
    { type: "blank", prompt: "Auto-rewrite deprecated call sites flagged by //go:fix across the repo. Fill the blank:",
      code: `go ____ ./...`, accept: ["fix"],
      explain: "go fix ./... applies machine-applicable migrations declared with //go:fix." },
  ],
  m10: [
    { type: "mcq", prompt: "Reading from L1 cache vs main memory (RAM) is roughly:",
      options: ["~2× faster", "~10× faster", "~100× faster", "~10,000× faster"], answer: 2,
      explain: "L1 is ~1 ns, RAM is ~100 ns - about two orders of magnitude apart, the central fact behind cache-aware code." },
    { type: "mcq", prompt: "False sharing happens when:",
      options: ["two goroutines share a mutex", "two independently-written variables happen to sit on the same cache line", "a slice exceeds the L3 cache size", "the GC runs concurrently with your code"], answer: 1,
      explain: "Even though the variables are logically unrelated, the line ping-pongs between cores' caches every time either is written, killing parallel throughput." },
    { type: "blank", prompt: "Measure a struct's in-memory size, including padding. Fill the blank:",
      code: `unsafe.____(Bad{})`, accept: ["Sizeof"],
      explain: "unsafe.Sizeof reports the byte size including compiler-inserted alignment padding." },
  ],
  m11: [
    { type: "mcq", prompt: "A branch misprediction on a modern core costs roughly:",
      options: ["0 cycles - it's free", "~1 cycle", "~15–20 cycles to flush and refill the pipeline", "~10,000 cycles"], answer: 2,
      explain: "Every speculatively-executed instruction down the wrong path is discarded and the pipeline must refill from the correct target." },
    { type: "mcq", prompt: "Why does summing only values above a threshold run faster on SORTED data than on the same data shuffled?",
      options: ["sorted data compresses better in cache", "the branch predictor nails the long predictable runs of true/false", "the CPU clocks up automatically", "shuffled data causes more cache misses, unrelated to branching"], answer: 1,
      explain: "Sorted data turns the if into long runs the predictor learns instantly; shuffled data flips unpredictably and mispredicts constantly - same instructions, very different wall time." },
    { type: "blank", prompt: "Inspect which bounds checks the compiler eliminated. Fill the blank:",
      code: `go build -gcflags='-d=ssa/check_bce/debug=____'`, accept: ["1"],
      explain: "Setting debug=1 makes the compiler print which bounds checks it proved safe and removed." },
  ],
  m12: [
    { type: "mcq", prompt: "The invariant that caps real parallelism in the G-M-P model is:",
      options: ["#G must be ≤ GOMAXPROCS", "an M must hold a P to run Go code", "#M always equals #P", "GOMAXPROCS only counts physical cores, never logical ones"], answer: 1,
      explain: "Since an M needs a P to execute Go code, at most GOMAXPROCS goroutines run truly in parallel no matter how many Gs or Ms exist." },
    { type: "mcq", prompt: "When a goroutine blocks on a netpoller-backed socket read with no data ready:",
      options: ["its OS thread blocks too, wasting an M", "the goroutine parks and its M is freed to run other goroutines", "the program panics", "GOMAXPROCS increases by one automatically"], answer: 1,
      explain: "The netpoller registers the socket with the OS event system and parks the G; the M goes on to run other ready goroutines instead of blocking." },
    { type: "blank", prompt: "Print per-second scheduler stats (Ps, Ms, run-queue lengths, steals). Fill the blank:",
      code: `GODEBUG=____=1000 ./app`, accept: ["schedtrace"],
      explain: "GODEBUG=schedtrace=1000 logs scheduler internals every 1000 ms, useful for diagnosing starvation or contention." },
  ],
  m13: [
    { type: "mcq", prompt: "An atomic.Int64 is insufficient (you need a mutex instead) when:",
      options: ["you just need a single counter", "an invariant spans two or more related fields that must stay consistent together", "you need lock-free updates", "you're swapping a single pointer"], answer: 1,
      explain: "Atomics protect exactly one word; the moment correctness depends on two fields agreeing, you need a mutex around both." },
    { type: "mcq", prompt: "Channels are the right tool primarily for:",
      options: ["replacing every mutex for raw speed", "transferring ownership of data and coordinating goroutines", "avoiding the need to run -race", "protecting a single shared counter"], answer: 1,
      explain: "Channels shine at handing data (and its ownership) between goroutines - pipelines, fan-out/fan-in, signalling - not as a faster lock for simple state." },
    { type: "blank", prompt: "Run tests with the data-race detector enabled. Fill the blank:",
      code: `go test -____ ./...`, accept: ["race"],
      explain: "go test -race instruments memory accesses and reports any unsynchronized concurrent access." },
  ],
  m14: [
    { type: "mcq", prompt: "Which pillar tells you WHERE in a multi-service request the time or error happened?",
      options: ["logs", "metrics", "traces", "none of them - you need a debugger"], answer: 2,
      explain: "A trace's nested spans show exactly which hop in the call chain the time went to, across service boundaries." },
    { type: "mcq", prompt: "A metric cardinality explosion is most often caused by:",
      options: ["using too many counters", "labeling a metric with an unbounded value like a user ID or raw URL", "using histograms instead of counters", "exporting metrics to Prometheus"], answer: 1,
      explain: "Each distinct label combination becomes its own time series; an unbounded label (user_id, request path with IDs) can generate millions of series and crash the backend." },
    { type: "blank", prompt: "Import Go's standard structured-logging package. Fill the blank:",
      code: `import "log/____"`, accept: ["slog"],
      explain: "log/slog (standard since Go 1.21) emits structured key/value records instead of interpolated strings." },
  ],
  m15: [
    { type: "mcq", prompt: "Why add jitter to exponential backoff between retries?",
      options: ["to make log output more readable", "to avoid a synchronized 'thundering herd' of retries hitting the service at once", "to slow down the CPU clock", "to satisfy the race detector"], answer: 1,
      explain: "Without jitter, many clients that failed at the same moment retry in lockstep, creating synchronized spikes that knock a recovering service back down." },
    { type: "mcq", prompt: "While a circuit breaker is OPEN, calls to the wrapped dependency:",
      options: ["go through normally", "fail instantly without waiting on a timeout, giving the dependency room to recover", "always succeed using a cache", "double their timeout and retry"], answer: 1,
      explain: "Failing fast during the cooldown is the whole point: it stops wasting time and load on a dependency that is already known to be down." },
    { type: "blank", prompt: "Import the package providing a token-bucket rate limiter. Fill the blank:",
      code: `import "golang.org/x/time/____"`, accept: ["rate"],
      explain: "golang.org/x/time/rate provides rate.NewLimiter, a token-bucket limiter used to cap requests per second." },
  ],
  m16: [
    { type: "mcq", prompt: "A GET for a key that does not exist in go-redis returns:",
      options: ["a nil *redis.Client", "an empty string with a nil error", "the sentinel error redis.Nil", "a panic"], answer: 2,
      explain: "go-redis surfaces a missing key as the sentinel error redis.Nil, which you check with errors.Is(err, redis.Nil) - that IS the cache-miss signal, not a failure to handle specially." },
    { type: "mcq", prompt: "Why is `SET key val NX` safe as a distributed lock across many concurrent callers, with no extra locking on top?",
      options: ["Redis retries the command until it succeeds", "Redis executes commands one at a time on a single thread, so the check-and-write is one indivisible step", "the Go client adds its own mutex before sending the command", "NX makes the command run twice as fast"], answer: 1,
      explain: "Because Redis processes one command at a time, there is no window between 'is the key free' and 'write it' for a second caller to slip into - the whole operation is atomic for free." },
    { type: "blank", prompt: "Fill in the atomic command that increments a counter and returns its new value in one round trip:",
      code: `count, err := rdb.____(ctx, "ratelimit:ip:1.2.3.4").Result()`, accept: ["Incr"],
      explain: "rdb.Incr atomically adds 1 and returns the new total - two concurrent callers can never both read the old value and overwrite each other's increment." },
  ],
  m18: [
    { type: "mcq", prompt: "A good SLI should primarily measure:",
      options: ["CPU usage on one node", "user-visible service behavior such as success rate or request latency", "how many dashboards exist", "how many alerts fire per day"], answer: 1,
      explain: "SLIs should reflect the user experience. CPU can explain a problem, but success rate and latency tell whether users are being hurt." },
    { type: "mcq", prompt: "A fast-burn alert is useful because it:",
      options: ["pages on every small error", "shows the service is consuming its error budget much faster than allowed", "replaces incident review", "proves Kubernetes is broken"], answer: 1,
      explain: "Burn rate connects alert urgency to SLO risk. A high burn over a short window means the budget will be exhausted quickly if nothing changes." },
    { type: "blank", prompt: "The standard telemetry framework preferred in this vacancy is Open____.",
      code: `Open____`, accept: ["Telemetry"],
      explain: "OpenTelemetry standardizes instrumentation and export of traces, metrics and logs." },
    { type: "mcq", prompt: "Which tool is primarily used for traces in the listed Grafana stack?",
      options: ["Prometheus", "Thanos", "Tempo", "Loki"], answer: 2,
      explain: "Tempo stores traces. Prometheus/Thanos handle metrics, and Loki handles logs." },
    { type: "code", prompt: "Write a tiny on-call postmortem action item with owner and measurable outcome.",
      starter: `Action item:\n`,
      checks: [{ has: "owner", msg: "Name an owner" }, { has: "due", msg: "Include a due date or deadline" }, { re: "SLO|alert|dashboard|runbook|automation|toil", msg: "Tie it to a reliability outcome" }],
      explain: "A useful postmortem action has an owner, deadline and measurable reliability outcome - not just 'investigate more'." },
  ],
};

window.COURSE_EN = { COURSE_META, PARTS, MODULES, VERIFICATION, ASSIGNMENTS, GLOSSARY };

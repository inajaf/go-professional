/* =====================================================================
   INTERACTIVE ANIMATIONS  (canvas 2D, no dependencies)
   A deterministic, scrubbable timeline engine with explicit STEPS, plus
   14 visualizations. Each animation renders its full state as a pure
   function of time t, so play / pause / step / scrub / step-jump all work.
   Each def declares `phases: [{t, title, desc}]` so the UI can show a
   numbered, narrated walkthrough synced to the visual.
   ===================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------- palette */
  function theme() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n, f) => (cs.getPropertyValue(n) || "").trim() || f;
    return {
      bg: v("--anim-bg", "#0b1220"),
      panel: v("--anim-panel", "#121b2e"),
      line: v("--anim-line", "#2a3a55"),
      text: v("--anim-text", "#cdd9ec"),
      dim: v("--anim-dim", "#6b7c99"),
      go: v("--go", "#00add8"),
      goSoft: v("--go-soft", "#5dc9e2"),
      accent: v("--accent", "#ce3262"),
      good: v("--good", "#3ad29f"),
      warn: v("--warn", "#f5b14c"),
      bad: v("--bad", "#ff6b6b"),
      purple: v("--purple", "#a98bff"),
    };
  }

  /* --------------------------------------------------- i18n (canvas text)
     Every label/badge/caption drawn on the canvas is looked up here by its
     exact English string when the page language is Russian — the 20
     animations' draw() functions never change, they just keep calling
     u.text(ctx, "some string", ...) and the translation happens centrally.
     Dynamic (interpolated) strings are translated at their call sites
     instead, since a fixed dictionary can't match a string with a number
     baked into it. */
  const CANVAS_RU = {
    // stepRender chrome
    "STEP ": "ШАГ ",
    "  ·  ": "  ·  ",
    // animation headers
    "garbage collector · tri-color mark & sweep": "сборщик мусора · трёхцветная пометка и сборка",
    "go tool pprof · CPU flame graph": "go tool pprof · flame-граф CPU",
    "go test · table-driven subtests": "go test · табличные подтесты",
    "concurrency · worker pool (fan-out / fan-in)": "конкурентность · пул воркеров (fan-out / fan-in)",
    "context · cancellation propagates down the tree": "context · отмена распространяется по дереву",
    "net/http ServeMux · radix trie + os.Root IO sandbox": "net/http ServeMux · radix-дерево + песочница os.Root",
    'm["USD"] · legacy map vs Swiss Table lookup': 'm["USD"] · старая map против поиска в Swiss Table',
    "runtime.AddCleanup · deterministic lifecycle": "runtime.AddCleanup · детерминированный жизненный цикл",
    "testing/synctest · virtual time bubble": "testing/synctest · пузырь виртуального времени",
    "pgxpool · row-level locking · double-entry": "pgxpool · блокировка на уровне строк · двойная запись",
    "harvest-now-decrypt-later · hybrid post-quantum TLS": "harvest-now-decrypt-later · гибридный постквантовый TLS",
    "runtime/pprof · goroutine-leak analyzer": "runtime/pprof · анализатор утечек горутин",
    "simd/archsimd · Green Tea GC": "simd/archsimd · Green Tea GC",
    "Kubernetes · rolling update · readiness probes": "Kubernetes · плавающее обновление · readiness-проверки",
    "memory hierarchy · why the next read is suddenly free": "иерархия памяти · почему следующее чтение внезапно бесплатно",
    "pipeline · how a branch misprediction costs cycles": "конвейер · как неверное предсказание перехода стоит тактов",
    "G-M-P scheduler · work stealing & syscall handoff": "планировщик G-M-P · кража работы и передача при syscall",
    "atomic vs mutex vs channel · same correctness, different shape": "atomic против mutex против channel · та же корректность, другая форма",
    "the three pillars · one request, end to end": "три столпа · один запрос, от начала до конца",
    "circuit breaker · fail fast, recover automatically": "circuit breaker · быстрый отказ, автоматическое восстановление",
    // gc-mark-sweep
    "root": "корень",
    "white = unreached": "белый = не достигнут",
    "grey = reachable": "серый = достижим",
    "black = live": "чёрный = жив",
    // pprof-flame
    "sampler": "сэмплер",
    "samples captured: ": "собрано сэмплов: ",
    "width = share of samples in that function": "ширина = доля сэмплов в этой функции",
    "▲ reflectWalk ≈ 40% of CPU — optimize here first": "▲ reflectWalk ≈ 40% CPU — оптимизировать в первую очередь",
    // test-runner
    "got ": "получено ",
    " == want ": " == ожидалось ",
    "✓ PASS": "✓ ПРОЙДЕНО",
    "ok   4/4 passed   ·   coverage 100%": "ok   4/4 пройдено   ·   покрытие 100%",
    // worker-pool
    "jobs channel": "канал задач",
    "worker ": "воркер ",
    "busy…": "занят…",
    "results channel": "канал результатов",
    "processed: 6 / 6": "обработано: 6 / 6",
    "no locks · no shared mutable state": "без блокировок · без общего изменяемого состояния",
    "running ●": "выполняется ●",
    // error-context
    "ctx.Done() ✓": "ctx.Done() ✓",
    "✓ every goroutine returned — no leaks": "✓ все горутины завершились — утечек нет",
    // mux-trie
    "✓ ok": "✓ ок",
    "✗ blocked at the boundary": "✗ заблокировано на границе",
    // swiss-table
    "cache miss ✗": "промах кэша ✗",
    "match ✓": "совпадение ✓",
    "separate cache lines touched so far: ": "отдельных кэш-линий затронуто: ",
    "control bytes — one cache line:": "контрольные байты — одна кэш-линия:",
    "↓ one instruction, all 8 lanes compared in parallel": "↓ одна инструкция, все 8 ячеек сравниваются параллельно",
    // cleanup-seq
    "stack root": "корень стека",
    "parent span": "родительский span",
    "ref": "ссылка",
    "ref dropped": "ссылка сброшена",
    "unreachable": "недостижим",
    "GC mark sweep": "GC: пометка и сборка",
    "✓ fd closed · parent span freed": "✓ fd закрыт · родительский span освобождён",
    // synctest-bubble
    "wall clock": "настенные часы",
    "bubble clock": "часы пузыря",
    "⏸ blocked": "⏸ заблокирован",
    "⏸ blocked +": "⏸ заблокирован +",
    "synctest.Wait → all parked ✓": "synctest.Wait → все припаркованы ✓",
    "⏩ fake clock advances 5s instantly": "⏩ фальшивые часы мгновенно переводятся на 5с",
    "✓ deterministic — no time.Sleep, no CI flake": "✓ детерминировано — без time.Sleep, без нестабильности CI",
    // sql-txn
    "PostgreSQL · accounts": "PostgreSQL · счета",
    "acct ": "счёт ",
    "$": "$",
    "LOCK": "БЛОКИРОВКА",
    "T1  transfer": "T1  перевод",
    "T2  transfer": "T2  перевод",
    "both need: acct A": "обоим нужен: счёт A",
    "waiting on lock…": "ожидание блокировки…",
    "A: −$": "A: −$",
    "B: +$": "B: +$",
    "COMMIT ✓": "COMMIT ✓",
    "Σ = $800  ✓ invariant held": "Σ = $800  ✓ инвариант сохранён",
    // pqc-lattice
    "Alice": "Алиса",
    "Bob": "Боб",
    "harvester — recording ciphertext from both channels": "перехватчик — записывает шифротекст с обоих каналов",
    "ct": "шт",
    "stored, waiting for a future quantum computer": "сохранено, в ожидании будущего квантового компьютера",
    "quantum computer online": "квантовый компьютер запущен",
    "→ attacking both recorded sessions": "→ атака на обе записанные сессии",
    "X25519 classical key": "классический ключ X25519",
    "broken by Shor's algorithm": "взломан алгоритмом Шора",
    "still classically secure": "всё ещё классически защищён",
    "ML-KEM-768 lattice key": "решёточный ключ ML-KEM-768",
    "quantum-resistant — stays secret": "квантовоустойчив — остаётся секретным",
    // leak-graph
    "blocked": "заблокирован",
    "missing": "отсутствует",
    "⏸ blocked on <-results": "⏸ заблокирован на <-results",
    "ROOT CAUSE": "КОРНЕВАЯ ПРИЧИНА",
    "G2 dispatch never sends on results ch — context had no deadline.": "G2 dispatch никогда не отправляет в канал results — у контекста не было дедлайна.",
    // simd-gc
    "scalar loop": "скалярный цикл",
    "SIMD loop": "цикл SIMD",
    "vs": "против",
    "SIMD vector loop": "векторный цикл SIMD",
    "scalar — 1 element / cycle": "скаляр — 1 элемент / такт",
    "cycles: ": "тактов: ",
    "SIMD — 16 elements / cycle": "SIMD — 16 элементов / такт",
    "↓ each lane loads + processes 16 elements together": "↓ каждая дорожка загружает и обрабатывает 16 элементов разом",
    "32 cycles": "32 такта",
    "2 cycles": "2 такта",
    "parallel span sweep →": "параллельная сборка по спанам →",
    "✓ contiguous spans → cache-friendly, parallel sweep": "✓ непрерывные спаны → дружелюбно к кэшу, параллельная сборка",
    "vs scattered object-by-object marking in the legacy GC": "против разрозненной пометки объект-за-объектом в старом GC",
    // container-rollout
    "load balancer": "балансировщик нагрузки",
    "pod ": "под ",
    "● Ready": "● Готов",
    "◌ Starting": "◌ Запускается",
    "◍ Draining": "◍ Дренаж",
    "probe ✗": "проба ✗",
    "probe ✓": "проба ✓",
    "finishing in-flight requests…": "завершение запросов в полёте…",
    "rollout ": "раскатка ",
    // cache-hierarchy
    "↓ bigger and slower": "↓ больше и медленнее",
    "checking…": "проверка…",
    "→ not in any on-chip cache. Falling through to RAM.": "→ нет ни в одном кэше на чипе. Падаем в RAM.",
    "HIT ✓": "ПОПАДАНИЕ ✓",
    "↑ the 64-byte line travels back up, filling each cache as it passes": "↑ 64-байтная линия идёт обратно вверх, заполняя каждый кэш по пути",
    "the 64-byte line, now resident in L1:": "64-байтная линия, теперь в L1:",
    "asked": "запрошен",
    "free": "бесплатно",
    "latency per read:": "задержка на чтение:",
    "1st read · ~100 ns (RAM)": "1-е чтение · ~100 нс (RAM)",
    "next 7 · ~1 ns each (L1) — ~100× faster": "следующие 7 · ~1 нс каждое (L1) — ~в 100× быстрее",
    // cpu-pipeline
    "Fetch": "Fetch (выборка)",
    "Decode": "Decode (декодирование)",
    "Execute": "Execute (выполнение)",
    "Memory": "Memory (память)",
    "Write-back": "Write-back (запись)",
    "currently in: ": "сейчас в стадии: ",
    "outcome unknown until Execute": "исход неизвестен до стадии Execute",
    "predictor guesses: “taken” → speculatively fetching I6, I7": "предсказатель угадывает: «переход» → спекулятивная выборка I6, I7",
    "wrong guess → I6, I7 must be discarded": "неверная догадка → I6, I7 нужно отбросить",
    "bubble — refetching the correct path": "пузырь — повторная выборка верного пути",
    "back to full speed": "снова на полной скорости",
    "pipe full — overlapping instructions": "конвейер полон — инструкции перекрываются",
    "✓ retiring this cycle": "✓ завершается в этом такте",
    // gmp-scheduler
    "G — goroutine: cheap work to run": "G — горутина: дешёвая работа для выполнения",
    "P — processor: a queue + the right to run Go code": "P — процессор: очередь + право выполнять Go-код",
    "M — OS thread: what the kernel actually schedules": "M — поток ОС: то, что реально планирует ядро",
    "→ running on M1": "→ выполняется на M1",
    " queued on P1": " в очереди на P1",
    " queued": " в очереди",
    "P2 is empty — P1 still has work": "P2 пуст — у P1 ещё есть работа",
    "stealing half of P1's queue →": "кража половины очереди P1 →",
    "4 queued — going nowhere while M3 is stuck": "4 в очереди — никуда не движутся, пока M3 застрял",
    "M3 — blocked in syscall": "M3 — заблокирован в syscall",
    "M3": "M3",
    "P3's other goroutines are stuck behind it": "остальные горутины P3 застряли позади",
    "M3 — still blocked": "M3 — всё ещё заблокирован",
    "M4 (fresh)": "M4 (новый)",
    "P3's goroutines resume on M4": "горутины P3 продолжают на M4",
    // sync-primitives
    "goroutine A": "горутина A",
    "goroutine B": "горутина B",
    "both read n, both compute n+1, both write — one increment vanishes": "обе читают n, обе вычисляют n+1, обе пишут — один инкремент пропадает",
    "compute n+1…": "вычисление n+1…",
    "CAS ✓ — swapped in": "CAS ✓ — подменено",
    "atomic.Int64 — every update is one CPU instruction, never a wait": "atomic.Int64 — каждое обновление — одна инструкция CPU, без ожидания",
    "waiting goroutines queue up; only the lock holder touches shared state": "ожидающие горутины встают в очередь; только держатель блокировки трогает общее состояние",
    "producer": "производитель",
    "consumer": "потребитель",
    "value (and ownership) in transit →": "значение (и владение) в пути →",
    "consumer now owns it exclusively": "теперь потребитель владеет им единолично",
    "Just one counter, flag, or pointer swap?": "Всего лишь счётчик, флаг или подмена указателя?",
    "An invariant spans several fields?": "Инвариант охватывает несколько полей?",
    "Handing work or a value to another goroutine?": "Передача работы или значения другой горутине?",
    "→ atomic": "→ atomic",
    "→ mutex": "→ mutex",
    "→ channel": "→ channel",
    // three-pillars
    "Service ": "Сервис ",
    "Service A — root span": "Сервис A — корневой span",
    "Service B — child span": "Сервис B — дочерний span",
    "request_duration_seconds  p99 ≈ 0.21s": "request_duration_seconds  p99 ≈ 0.21с",
    "metric": "метрика",
    "trace": "трейс",
    "log": "лог",
    "requests_total{...} ⏤ p99 0.21s": "requests_total{...} ⏤ p99 0.21с",
    "Service A → B → C (3 spans)": "Сервис A → B → C (3 span'а)",
    // circuit-breaker
    "client": "клиент",
    "service": "сервис",
    "breaker": "автомат",
    "failures: 0 / 5": "сбоев: 0 / 5",
    "failures: ": "сбоев: ",
    "threshold reached →": "порог достигнут →",
    "OPEN — bounced at the breaker": "OPEN — отбито автоматом",
    "cooldown: ": "охлаждение: ",
    "s remaining": "с осталось",
    "all calls still fail instantly": "все вызовы по-прежнему мгновенно проваливаются",
    "HALF-OPEN — one probe call": "HALF-OPEN — один пробный вызов",
    "trip on failures": "срабатывание по сбоям",
    "cooldown elapses": "охлаждение истекло",
    "probe succeeds ✓": "проба успешна ✓",
    "CLOSED": "CLOSED",
    "OPEN": "OPEN",
    "HALF-OPEN": "HALF-OPEN",

    /* -------------------------------------------------------------------
       Per-step captions (title/desc/why), shown in HTML below the canvas
       and in the step-dot tooltips. Reused by app.js via window.CANVAS_RU,
       same exact-string lookup as the canvas text above. */

    // gc-mark-sweep
    "The heap is a graph of objects": "Куча — это граф объектов",
    "Two roots (global variables / goroutine stacks) point into a web of objects. Some objects (right side) aren't pointed to by anything reachable from a root.": "Два корня (глобальные переменные / стеки горутин) указывают на сеть объектов. На некоторые объекты (справа) не ссылается ничего, достижимое из корня.",
    "The collector's whole job is to tell live objects apart from dead ones — and 'reachable from a root' is the only definition of 'live' it needs.": "Вся работа сборщика — отличить живые объекты от мёртвых, а «достижим из корня» — единственное определение «живого», которое ему нужно.",
    "Start at the roots, mark them black": "Начинаем с корней, помечаем их чёрным",
    "Marking begins at the roots — they're live by definition. Whatever they directly point to turns grey: 'reachable, but not yet scanned.'": "Пометка начинается с корней — они живы по определению. Всё, на что они указывают напрямую, становится серым: «достижимо, но пока не просканировано».",
    "Starting only from roots guarantees you never mark something live unless there's an actual chain of pointers reaching it.": "Старт только от корней гарантирует, что вы никогда не помечаете что-то живым, если к нему нет реальной цепочки указателей.",
    "Scan grey → black, level by level": "Сканируем серые → чёрные, уровень за уровнем",
    "Each grey object gets scanned: it turns black ('done'), and anything IT points to turns grey in turn. The reachable wave spreads outward through the graph.": "Каждый серый объект сканируется: он становится чёрным («готово»), а всё, на что ОН указывает, в свою очередь становится серым. Волна достижимости расходится по графу.",
    "This is why it's called tri-color: grey is the 'in-progress' frontier that guarantees every reachable object eventually gets scanned exactly once.": "Поэтому это называется трёхцветной пометкой: серый — это фронт «в процессе», который гарантирует, что каждый достижимый объект будет просканирован ровно один раз.",
    "White = dead": "Белый = мёртв",
    "Once no grey objects remain, the wave is finished. Everything still white — including the cluster on the right — was never touched, because nothing live points to it.": "Когда серых объектов не остаётся, волна завершена. Всё, что осталось белым — включая кластер справа — не было тронуто вовсе, потому что на него не указывает ничего живого.",
    "This is the proof of garbage: not 'looks unused', but 'provably unreachable from any root.'": "Это и есть доказательство мусора: не «выглядит неиспользуемым», а «доказуемо недостижим из любого корня».",
    "Sweep: reclaim the white objects": "Сборка: освобождаем белые объекты",
    "The collector walks the heap one more time and frees every object still marked white. Black (live) objects are never touched.": "Сборщик проходит по куче ещё раз и освобождает каждый объект, всё ещё помеченный белым. Чёрные (живые) объекты не трогаются.",
    "Marking and sweeping are kept as separate passes so the collector never frees something while it might still be mid-scan — correctness over speed.": "Пометка и сборка — раздельные проходы, чтобы сборщик никогда не освобождал то, что ещё может быть в процессе сканирования — корректность важнее скорости.",

    // pprof-flame
    "The program runs — a call tree": "Программа выполняется — дерево вызовов",
    "A request flows main → handleRequest → a handful of child functions. Some of those calls are cheap, some are expensive — but just reading the code, you can't tell which.": "Запрос идёт main → handleRequest → несколько дочерних функций. Некоторые вызовы дешёвые, некоторые дорогие — но просто читая код, не понять, какие именно.",
    "Without measurement, optimization is guessing. Profiling replaces guessing with evidence.": "Без измерений оптимизация — это гадание. Профилирование заменяет гадание доказательствами.",
    "The sampler ticks ~100×/second": "Сэмплер срабатывает ~100 раз/секунду",
    "Rather than instrument every call, pprof just peeks at whatever stack is CURRENTLY running, many times a second, and records it.": "Вместо инструментирования каждого вызова pprof просто подсматривает, какой стек ВЫПОЛНЯЕТСЯ прямо сейчас, много раз в секунду, и записывает это.",
    "Sampling is statistical, not exhaustive — that's exactly what makes it cheap enough to run in production without slowing the program down.": "Сэмплирование статистическое, а не исчерпывающее — именно это делает его достаточно дешёвым, чтобы работать в продакшене без замедления программы.",
    "Samples aggregate into a flame graph": "Сэмплы складываются в flame-граф",
    "Every captured stack stacks its frames into bars — a box sits inside its caller, and the more samples landed in a function, the WIDER its box grows.": "Каждый захваченный стек складывает свои фреймы в полосы — блок лежит внутри вызвавшего его блока, и чем больше сэмплов попало в функцию, тем ШИРЕ становится её блок.",
    "Width directly encodes time spent, so the visual shape of the graph IS the measurement — no separate legend to decode.": "Ширина напрямую кодирует затраченное время, поэтому визуальная форма графа И ЕСТЬ измерение — не нужна отдельная легенда для расшифровки.",
    "Find the widest box — that's the hotspot": "Найдите самый широкий блок — это и есть горячая точка",
    "reflectWalk is the widest leaf frame: roughly 40% of all CPU samples landed inside it. The tall, narrow stacks next to it barely register.": "reflectWalk — самый широкий листовой фрейм: примерно 40% всех сэмплов CPU попали именно в него. Высокие узкие стеки рядом почти незаметны.",
    "Optimizing the widest box gives the biggest win for the least effort — optimizing a narrow box can't help much even if you make it instant.": "Оптимизация самого широкого блока даёт наибольший выигрыш при наименьших усилиях — оптимизация узкого блока не поможет много, даже если сделать его мгновенным.",

    // test-runner
    "A table of cases": "Таблица случаев",
    "Each row is one input pair plus the expected (want) result for the SAME function, Add(a, b).": "Каждая строка — это одна пара входных данных плюс ожидаемый (want) результат для ОДНОЙ и той же функции Add(a, b).",
    "Separating 'what to test' (the table) from 'how to test it' (one shared piece of logic) means adding a new case is just adding a row — no new code.": "Разделение «что тестировать» (таблица) и «как тестировать» (одна общая логика) означает, что добавление нового случая — это просто новая строка, без нового кода.",
    "go test runs each case as an isolated subtest": "go test запускает каждый случай как изолированный подтест",
    "t.Run wraps each row as its own named subtest — go test -run TestAdd/negatives can target just one, and one failing case never stops the others from running.": "t.Run оборачивает каждую строку в собственный именованный подтест — go test -run TestAdd/negatives может нацелиться на один из них, и один провалившийся случай никогда не останавливает выполнение остальных.",
    "Isolation means a single bad case gives you a precise failure (\"TestAdd/negatives\"), not a vague \"something in TestAdd broke.\"": "Изоляция означает, что один плохой случай даёт точный отказ («TestAdd/negatives»), а не смутное «что-то в TestAdd сломалось».",
    "Inputs flow into the function": "Входные данные попадают в функцию",
    "For the active case, a(=2) and b(=3) are passed into Add(a, b), which computes a+b.": "Для активного случая a(=2) и b(=3) передаются в Add(a, b), которая вычисляет a+b.",
    "The function under test never knows it's being tested through a table — it just gets called like normal code, which is why this pattern adds no production complexity.": "Тестируемая функция никогда не знает, что её тестируют через таблицу — её просто вызывают как обычный код, поэтому этот паттерн не добавляет сложности в продакшен-код.",
    "Compare got vs want": "Сравниваем got и want",
    "The function returns got = 5. The test compares it to want = 5 from the table row. Equal → the case passes.": "Функция возвращает got = 5. Тест сравнивает его с want = 5 из строки таблицы. Равны → случай пройден.",
    "The comparison — not the function — is what decides pass/fail. A mismatch fails loudly with both values printed, so you see exactly what diverged.": "Именно сравнение — а не функция — решает пройден тест или нет. Несовпадение громко проваливает тест с выводом обоих значений, так что видно, что именно разошлось.",
    "The same flow runs for every case": "Тот же процесс повторяется для каждого случая",
    "go test repeats exactly this input → function → compare flow for each remaining row, fully independently.": "go test повторяет ровно этот процесс вход → функция → сравнение для каждой оставшейся строки, полностью независимо.",
    "This is the payoff: one test function plus N table rows covers N scenarios — no copy-pasted test functions to maintain.": "Вот и выигрыш: одна тестовая функция плюс N строк таблицы покрывают N сценариев — не нужно поддерживать скопипащенные тестовые функции.",
    "Summary": "Итог",
    "go test reports one line: how many passed, and coverage. Run it constantly — `go test -race -cover ./...` — so a regression is caught the moment it's introduced.": "go test выводит одну строку: сколько пройдено и покрытие. Запускайте его постоянно — `go test -race -cover ./...` — чтобы регрессия ловилась в момент появления.",
    "A fast, table-driven suite is cheap enough to run on every save, which is what makes 'catch it immediately' realistic instead of aspirational.": "Быстрый табличный набор тестов достаточно дёшев, чтобы запускать его при каждом сохранении — именно это делает «поймать сразу» реальностью, а не мечтой.",

    // worker-pool
    "Six jobs wait on a buffered channel": "Шесть задач ждут в буферизованном канале",
    "Work items sit in a channel, ready to be picked up. Nothing is processing yet — this is just a queue.": "Единицы работы лежат в канале, готовые быть подхваченными. Пока ничего не обрабатывается — это просто очередь.",
    "A channel decouples producing work from consuming it: the producer doesn't need to know or care how many workers exist.": "Канал разделяет производство работы и её потребление: производителю не нужно знать или заботиться о том, сколько воркеров существует.",
    "Three workers pull from the SAME channel": "Три воркера читают из ОДНОГО канала",
    "Each worker goroutine independently calls `job := <-jobs` in a loop. The channel itself decides which worker gets which job — no coordination code needed.": "Каждая горутина-воркер независимо вызывает `job := <-jobs` в цикле. Сам канал решает, какому воркеру какая задача достанется — код координации не нужен.",
    "This is fan-out: identical workers competing for jobs on one channel is enough to spread work across goroutines safely.": "Это fan-out: одинаковые воркеры, конкурирующие за задачи в одном канале — этого достаточно, чтобы безопасно распределить работу между горутинами.",
    "Up to three jobs process at once": "До трёх задач обрабатываются одновременно",
    "Each busy worker is running its own job concurrently — never more than 3 in flight, because there are only 3 workers.": "Каждый занятый воркер конкурентно выполняет свою задачу — никогда больше 3 одновременно, потому что воркеров всего 3.",
    "The number of workers is a deliberate dial: it caps concurrency so you don't overwhelm downstream resources, while still getting real parallelism.": "Количество воркеров — это осознанная настройка: она ограничивает конкурентность, чтобы не перегрузить внешние ресурсы, но при этом даёт реальный параллелизм.",
    "Fan-in: every worker sends to ONE results channel": "Fan-in: каждый воркер пишет в ОДИН канал результатов",
    "When a worker finishes, it sends its result to a shared results channel — the same channel every other worker also writes to.": "Когда воркер заканчивает, он отправляет результат в общий канал результатов — тот же канал, в который пишут и все остальные воркеры.",
    "The collector reading results doesn't need to know which worker produced what, or even how many workers there are — fan-in merges them for free.": "Сборщику, читающему результаты, не нужно знать, какой воркер что произвёл, или даже сколько воркеров существует — fan-in объединяет их бесплатно.",
    "Drained: every job ran exactly once": "Опустошено: каждая задача выполнена ровно один раз",
    "All six jobs were processed, never more than three at a time, and the results all merged onto one channel for the collector.": "Все шесть задач обработаны, никогда больше трёх одновременно, и все результаты слились в один канал для сборщика.",
    "No locks, no shared mutable state, no manual bookkeeping — the channel's blocking send/receive IS the synchronization.": "Без блокировок, без общего изменяемого состояния, без ручного учёта — блокирующая отправка/приём канала И ЕСТЬ синхронизация.",

    // error-context
    "A request creates a root context": "Запрос создаёт корневой контекст",
    "Every cancellation tree starts from one context at the top — typically derived from the incoming request.": "Каждое дерево отмены начинается с одного контекста на вершине — обычно производного от входящего запроса.",
    "Having ONE source of truth for 'should this request keep going' is what makes it possible to cancel an entire call tree with a single action later.": "Наличие ОДНОГО источника истины для «должен ли этот запрос продолжаться» — вот что позже позволяет отменить всё дерево вызовов одним действием.",
    "Children derive their own contexts": "Дети создают собственные производные контексты",
    "Each branch derives a child context — WithCancel, WithTimeout — rather than creating an unrelated one from scratch.": "Каждая ветвь создаёт производный дочерний контекст — WithCancel, WithTimeout — а не создаёт несвязанный с нуля.",
    "Deriving (not creating fresh) is what wires the child to the parent: cancel the parent, and every derived child is automatically cancelled too.": "Именно наследование (а не создание с нуля) связывает потомка с родителем: отмените родителя — и каждый производный потомок автоматически тоже отменится.",
    "Goroutines attach at the leaves": "Горутины прикрепляются на листьях",
    "Worker goroutines hold the leaf contexts and do real work — an HTTP call, a DB query — while watching ctx.Done() for a cancellation signal.": "Горутины-воркеры держат листовые контексты и выполняют реальную работу — HTTP-вызов, запрос к БД — при этом следя за ctx.Done() на сигнал отмены.",
    "This is the realistic shape of a Go service: a deep tree of derived contexts with actual work happening only at the edges.": "Это реалистичная форма Go-сервиса: глубокое дерево производных контекстов, где реальная работа происходит только на краях.",
    "The deadline fires at the root": "Дедлайн срабатывает в корне",
    "2 seconds elapse (or someone calls the root's cancel() function) — the root's Done() channel closes.": "Проходит 2 секунды (или кто-то вызывает функцию cancel() корня) — канал Done() корня закрывается.",
    "Only the root needs to know WHY the request is ending (timeout, client disconnect, explicit cancel) — everything below just reacts to one signal.": "Только корню нужно знать, ПОЧЕМУ запрос завершается (таймаут, отключение клиента, явная отмена) — всё, что ниже, просто реагирует на один сигнал.",
    "Cancellation propagates down every edge": "Отмена распространяется по каждому ребру",
    "The signal flows from root to children to grandchildren — each derived context's Done() closes in turn, depth by depth.": "Сигнал идёт от корня к детям, затем к внукам — Done() каждого производного контекста закрывается по очереди, уровень за уровнем.",
    "This is automatic precisely BECAUSE children were derived, not created independently — there's no manual fan-out code that has to remember every goroutine.": "Это происходит автоматически именно ПОТОМУ, что дети были производными, а не созданными независимо — нет ручного кода fan-out, который должен помнить каждую горутину.",
    "Clean shutdown — no goroutine leak": "Чистое завершение — утечек горутин нет",
    "Cancellation reached every descendant. Every worker observed ctx.Done() closing and returned.": "Отмена достигла каждого потомка. Каждый воркер увидел закрытие ctx.Done() и завершился.",
    "This is the payoff this whole module (and M7's leak detector) cares about: a goroutine that never learns its work is unwanted is a goroutine that never exits.": "Вот в чём выигрыш всего этого модуля (и детектора утечек из M7): горутина, которая никогда не узнаёт, что её работа не нужна — это горутина, которая никогда не завершится.",

    // mux-trie
    "A request arrives": "Приходит запрос",
    "GET /api/v1/ledger/42 enters Go's native net/http router.": "GET /api/v1/ledger/42 попадает во встроенный роутер net/http.",
    "The router's only job is mapping this one string to the right handler, fast — everything in this module is about how it does that without regular expressions.": "Единственная задача роутера — быстро сопоставить эту строку с нужным хендлером. Весь этот модуль о том, как он делает это без регулярных выражений.",
    "The router walks a trie, segment by segment": "Роутер идёт по trie, сегмент за сегментом",
    "ServeMux matches each path segment against the trie one node at a time — /api, then /v1, then /ledger — until it can't go any deeper.": "ServeMux сопоставляет каждый сегмент пути с trie по одному узлу за раз — /api, затем /v1, затем /ledger — пока не сможет идти глубже.",
    "A trie turns routing into a fixed number of cheap segment comparisons instead of testing the path against every registered pattern in turn.": "Trie превращает маршрутизацию в фиксированное число дешёвых сравнений сегментов вместо проверки пути по очереди против каждого зарегистрированного шаблона.",
    "{id} captures the wildcard segment": "{id} захватывает произвольный сегмент",
    'The trie\'s last node is a wildcard — it matches ANY segment and captures it as "42", readable in the handler via r.PathValue("id").': 'Последний узел trie — это wildcard: он совпадает с ЛЮБЫМ сегментом и захватывает его как "42", доступное в хендлере через r.PathValue("id").',
    "A typed wildcard node is what lets one route handle /ledger/42, /ledger/99, /ledger/anything — without falling back to slower regexp matching.": "Именно типизированный wildcard-узел позволяет одному маршруту обрабатывать /ledger/42, /ledger/99, /ledger/что-угодно — без отката к более медленному сопоставлению по regexp.",
    "Handler resolves → 200 OK": "Хендлер срабатывает → 200 OK",
    "Once both the method (GET) and the full path match, the registered handler runs and returns a response.": "Когда совпадают и метод (GET), и весь путь, зарегистрированный хендлер выполняется и возвращает ответ.",
    "Matching method AND path together (not just path) is what lets GET /ledger/42 and DELETE /ledger/42 route to two completely different handlers.": "Именно совпадение метода И пути вместе (а не только пути) позволяет GET /ledger/42 и DELETE /ledger/42 направляться в два совершенно разных хендлера.",
    "os.Root: a directory you can't escape": "os.Root: каталог, из которого не выйти",
    'A handler that reads files opens them through os.Root("data") instead of the raw filesystem — every path it resolves is forced to stay inside data/.': 'Хендлер, читающий файлы, открывает их через os.Root("data") вместо прямого доступа к файловой системе — любой путь, который он резолвит, обязан оставаться внутри data/.',
    "Path traversal (`../../etc/passwd`) is a classic vulnerability — os.Root makes 'escaping the jail' a type error, not a runtime check you might forget.": "Обход пути (`../../etc/passwd`) — классическая уязвимость. os.Root превращает «выход из песочницы» в ошибку типов, а не в проверку в рантайме, которую можно забыть.",
    "An escape attempt is blocked": "Попытка выхода блокируется",
    "A read of ../../etc/passwd tries to walk OUT of data/ using relative path tricks.": "Чтение ../../etc/passwd пытается выйти ЗА пределы data/, используя трюки с относительными путями.",
    "If this succeeded, any handler taking a user-supplied filename could be tricked into reading arbitrary files on the host.": "Если бы это удалось, любой хендлер, принимающий имя файла от пользователя, можно было бы обмануть и заставить читать произвольные файлы на хосте.",
    "Legitimate reads still succeed": "Легитимные чтения всё равно работают",
    'root.Open("config.json") resolves inside the jail and works exactly like a normal file read — no extra code in the handler.': 'root.Open("config.json") резолвится внутри песочницы и работает точно как обычное чтение файла — без дополнительного кода в хендлере.',
    "The safety is structural: code that only ever has an *os.Root, never a raw path, cannot accidentally escape the jail — there's no boundary check to forget.": "Безопасность структурная: код, у которого есть только *os.Root, но никогда сырой путь, не может случайно выйти из песочницы — тут нет проверки границы, которую можно забыть.",

    // swiss-table
    'The same lookup: m["USD"]': 'Один и тот же поиск: m["USD"]',
    "We'll trace this one lookup through two implementations: Go's legacy map, and the new Swiss Table design.": "Мы проследим этот один поиск через две реализации: старую map в Go и новую конструкцию Swiss Table.",
    "The map TYPE never changes in your code — only the internal layout does. Seeing both traces side by side (in time, not space) shows exactly what that internal change buys you.": "ТИП map в вашем коде никогда не меняется — меняется только внутреннее устройство. Просмотр обоих трейсов рядом (во времени, не в пространстве) показывает, что именно даёт это внутреннее изменение.",
    "Legacy map: probe slot by slot": "Старая map: проверяем слот за слотом",
    "The old map walks its bucket one entry at a time, comparing keys, until it finds USD or runs out of entries.": "Старая map проходит свой bucket по одной записи, сравнивая ключи, пока не найдёт USD или не закончатся записи.",
    "Each entry lives at a different memory address, so each check that misses is very likely its OWN separate cache miss — the cost adds up linearly.": "Каждая запись живёт по своему адресу памяти, поэтому каждая неудачная проверка — это, скорее всего, СВОЙ отдельный промах кэша — стоимость растёт линейно.",
    "Swiss Table: jump straight to one group of 8": "Swiss Table: сразу переходим к одной группе из 8",
    "The hash picks a single 8-slot group, and its 8 one-byte 'control bytes' — a tiny fingerprint per slot — all live together in ONE cache line.": "Хэш выбирает одну группу из 8 слотов, и её 8 однобайтовых «контрольных байтов» — крошечный отпечаток на слот — все живут вместе в ОДНОЙ кэш-линии.",
    "Loading 8 slots' worth of metadata costs the same one cache-line fetch as loading just one — the layout was designed around that fact.": "Загрузка метаданных для 8 слотов стоит ровно одну загрузку кэш-линии, как и загрузка одного — устройство было спроектировано именно под этот факт.",
    "SIMD compares all 8 tags in one operation": "SIMD сравнивает все 8 тегов за одну операцию",
    "Instead of checking slot 0, then slot 1, then slot 2…, one SIMD-style instruction compares the target's fingerprint against all 8 control bytes simultaneously.": "Вместо проверки слота 0, затем слота 1, затем слота 2…, одна SIMD-инструкция сравнивает отпечаток цели со всеми 8 контрольными байтами одновременно.",
    "This is the structural win: legacy map cost scales with HOW MANY entries you check; Swiss Table cost is closer to constant — one fetch, one compare, almost always.": "Вот структурный выигрыш: стоимость старой map растёт с ТЕМ, сколько записей вы проверяете; стоимость Swiss Table почти константна — одна загрузка, одно сравнение, почти всегда.",
    "Match found — one cache line touched, total": "Совпадение найдено — всего одна затронутая кэш-линия",
    'USD sits in slot 2 of the group — found immediately. The whole lookup cost ONE cache-line fetch, versus up to 5 for the legacy map.': 'USD находится в слоте 2 группы — найдено сразу. Весь поиск стоил ОДНУ загрузку кэш-линии против до 5 у старой map.',
    "This is why the Swiss Table redesign matters in practice: hot map lookups in a request path get measurably faster purely from this layout change — no code changes required.": "Вот почему редизайн Swiss Table важен на практике: горячие поиски в map на пути запроса измеримо ускоряются просто за счёт изменения устройства — без изменений в коде.",

    // cleanup-seq
    "The object is alive": "Объект жив",
    "A *Conn lives inside a parent span. The stack holds a reference to it, so the garbage collector considers it reachable — alive.": "*Conn живёт внутри родительского span. Стек держит на него ссылку, поэтому сборщик мусора считает его достижимым — живым.",
    "Reachability from a root is the ONLY thing that keeps an object alive in Go — not how recently it was used, not its size, just 'can a root still get to it.'": "Достижимость из корня — ЕДИНСТВЕННОЕ, что держит объект живым в Go — не то, как недавно он использовался, не его размер, а только «может ли корень до него добраться».",
    "The last reference drops": "Последняя ссылка исчезает",
    "Whatever held that reference returns or goes out of scope. The *Conn is now unreachable from any root — eligible for collection, but not yet collected.": "То, что держало эту ссылку, возвращается или выходит из области видимости. *Conn теперь недостижим из любого корня — годен для сборки, но пока не собран.",
    "'Unreachable' and 'freed' are NOT the same moment in Go — there's a gap, and that gap is exactly what the next two steps are about.": "«Недостижим» и «освобождён» — это НЕ один и тот же момент в Go, между ними есть промежуток, и следующие два шага именно об этом промежутке.",
    "The GC's next mark pass finds it dead": "Следующий проход пометки GC находит его мёртвым",
    "The concurrent collector sweeps through live memory tracing from the roots. The *Conn is never reached this time — it's now PROVABLY garbage, not just assumed.": "Конкурентный сборщик проходит по живой памяти, трассируя от корней. *Conn на этот раз не достигается — теперь это ДОКАЗАННЫЙ мусор, а не просто предположение.",
    "Go won't free an object the instant it looks unused — it waits for the mark pass to confirm it, which is what makes collection safe even with concurrent mutation.": "Go не освобождает объект в момент, когда он ВЫГЛЯДИТ неиспользуемым — он ждёт подтверждения от прохода пометки, что и делает сборку безопасной даже при конкурентных изменениях.",
    "The registered cleanup runs exactly once": "Зарегистрированная очистка выполняется ровно один раз",
    "runtime.AddCleanup fires: syscall.Close(7). It captured the file descriptor by VALUE when registered — not the object itself, so it can run safely even though *Conn is gone.": "runtime.AddCleanup срабатывает: syscall.Close(7). Он захватил файловый дескриптор ПО ЗНАЧЕНИЮ при регистрации — не сам объект, поэтому может безопасно выполниться, даже когда *Conn уже нет.",
    "Unlike the legacy SetFinalizer, AddCleanup never resurrects the object and never silently skips a cycle — it's a plain function call guaranteed to run once, on a dead object.": "В отличие от старого SetFinalizer, AddCleanup никогда не воскрешает объект и никогда молча не пропускает цикл — это обычный вызов функции, гарантированно выполняемый один раз, на мёртвом объекте.",
    "Memory freed, no extra delay": "Память освобождена, без лишней задержки",
    "The parent span is reclaimed in the SAME cycle that proved the object dead — no resurrection pass, no waiting an extra GC cycle.": "Родительский span освобождается в ТОМ ЖЕ цикле, который доказал смерть объекта — без прохода воскрешения, без ожидания лишнего цикла GC.",
    "This is the practical reason AddCleanup replaced finalizers for resource cleanup: deterministic, single-cycle reclamation means file descriptors and connections don't linger.": "Это практическая причина, по которой AddCleanup заменил финализаторы для очистки ресурсов: детерминированное освобождение за один цикл означает, что файловые дескрипторы и соединения не задерживаются.",

    // synctest-bubble
    "Goroutines start inside an isolated bubble": "Горутины стартуют внутри изолированного пузыря",
    "Three goroutines run inside a synctest bubble — a sandbox with its OWN fake clock, separate from real wall-clock time.": "Три горутины выполняются внутри пузыря synctest — песочницы со СВОИМИ фальшивыми часами, отдельными от настенного времени.",
    "Isolating both the goroutines AND time itself is what will let the test fast-forward through delays instead of actually waiting for them.": "Именно изоляция и горутин, И самого времени позволит тесту промотать задержки вперёд, а не реально их ждать.",
    "Each one runs, then blocks": "Каждая выполняется, затем блокируется",
    "G1 sleeps for 0.5s, G2 for 0.8s, G3 for 1.0s (or waits on a channel) — each parks the moment it has nothing left to do.": "G1 спит 0.5с, G2 — 0.8с, G3 — 1.0с (или ждёт на канале) — каждая паркуется в момент, когда ей больше нечего делать.",
    "A real test would have to actually wait out the slowest of these — that's the time cost synctest is about to eliminate.": "Настоящему тесту пришлось бы реально дождаться самой медленной из них — именно эти временные затраты synctest сейчас устранит.",
    "synctest.Wait: a precise barrier": "synctest.Wait: точный барьер",
    "The test calls synctest.Wait, which blocks until EVERY goroutine in the bubble is durably parked — not 'probably done', but provably done.": "Тест вызывает synctest.Wait, который блокируется, пока КАЖДАЯ горутина в пузыре не устойчиво припаркована — не «вероятно готова», а доказуемо готова.",
    "This replaces a guessed time.Sleep(100*time.Millisecond) 'hope it's enough' with an exact, race-free synchronization point.": "Это заменяет угаданный time.Sleep(100*time.Millisecond) «надеюсь, хватит» точной, свободной от гонок точкой синхронизации.",
    "The fake clock jumps to the next timer": "Фальшивые часы перескакивают к следующему таймеру",
    "With every goroutine confirmed blocked, the bubble's clock fast-forwards directly to whenever the next timer fires — instantly, no real waiting.": "Когда подтверждено, что каждая горутина блокирована, часы пузыря мгновенно перематываются прямо к моменту срабатывания следующего таймера — без реального ожидания.",
    "Real time and bubble time are decoupled: the test can simulate 5 real-world seconds of timers in microseconds of actual CPU time.": "Реальное время и время пузыря разделены: тест может симулировать 5 реальных секунд таймеров за микросекунды настоящего процессорного времени.",
    "Goroutines wake and finish": "Горутины пробуждаются и завершаются",
    "Now that their timers/channels are ready, all three goroutines resume, complete their work, and the test's assertions run against a fully settled state.": "Теперь, когда их таймеры/каналы готовы, все три горутины продолжают работу, завершают её, и проверки теста выполняются на полностью устоявшемся состоянии.",
    "Because everything is driven by the deterministic bubble clock, there's no window where the assertions could race against a goroutine that's still finishing.": "Поскольку всё управляется детерминированными часами пузыря, нет окна, где проверки могли бы гоняться с горутиной, которая ещё завершается.",
    "No flakes: wall ≈ 0s, bubble = 5s": "Без нестабильности: настенное время ≈ 0с, время пузыря = 5с",
    "The whole test simulated 5 seconds of timers while real wall-clock time barely moved — fully deterministic, every run, every machine.": "Весь тест симулировал 5 секунд таймеров, пока настенное время почти не двигалось — полностью детерминировано, при каждом запуске, на любой машине.",
    "No time.Sleep means no 'flaky on a slow CI box' — the test's correctness no longer depends on how fast the test runner happens to be today.": "Отсутствие time.Sleep означает отсутствие «нестабильности на медленном CI» — корректность теста больше не зависит от того, насколько быстрой машине сегодня довелось его запускать.",

    // sql-txn
    "Two transfers want the same account": "Два перевода хотят один и тот же счёт",
    "T1 and T2 are both transactions trying to move money — and both need to touch account A at the same moment.": "T1 и T2 — обе транзакции пытаются перевести деньги, и обеим нужно тронуть счёт A в один и тот же момент.",
    "This exact scenario — concurrent writers, shared row — is what row-level locking exists to make safe.": "Именно этот сценарий — конкурентные писатели, общая строка — блокировка на уровне строк и существует, чтобы сделать безопасным.",
    "T1 locks account A": "T1 блокирует счёт A",
    "T1 runs SELECT … FOR UPDATE, which takes a lock on just that one row — not the whole table.": "T1 выполняет SELECT … FOR UPDATE, который берёт блокировку только на эту одну строку — не на всю таблицу.",
    "Locking only the specific row means transfers touching DIFFERENT accounts can still run fully in parallel — the lock's scope is as narrow as correctness allows.": "Блокировка только конкретной строки означает, что переводы, затрагивающие ДРУГИЕ счета, могут выполняться полностью параллельно — область блокировки настолько узкая, насколько позволяет корректность.",
    "T2 blocks behind the lock": "T2 блокируется за блокировкой",
    "T2 also needs account A, so it simply waits — Postgres won't let it read until T1's transaction finishes.": "T2 тоже нужен счёт A, поэтому он просто ждёт — Postgres не даст ему прочитать, пока транзакция T1 не завершится.",
    "If T2 read A mid-transfer, it could see a half-finished state (debited but not yet credited) — blocking prevents that entirely.": "Если бы T2 прочитал A в середине перевода, он мог бы увидеть наполовину завершённое состояние (списано, но ещё не зачислено) — блокировка полностью это предотвращает.",
    "Inside the transaction: debit and credit together": "Внутри транзакции: списание и зачисление вместе",
    "T1 subtracts $100 from A and adds $100 to B — both statements run inside the SAME transaction, so they can never land separately.": "T1 вычитает $100 из A и добавляет $100 к B — оба выражения выполняются внутри ОДНОЙ транзакции, поэтому они никогда не могут применяться отдельно.",
    "This is double-entry: if the process crashed between the two writes, the whole transaction rolls back — you never end up with money debited from A but never credited to B.": "Это двойная запись: если процесс упадёт между двумя записями, вся транзакция откатывается — вы никогда не получите деньги, списанные с A, но так и не зачисленные на B.",
    "COMMIT releases the lock": "COMMIT освобождает блокировку",
    "T1 commits — its changes become permanent, and the row lock on account A is released immediately.": "T1 коммитится — его изменения становятся постоянными, и блокировка строки счёта A немедленно освобождается.",
    "The lock is held for the shortest time that's still correct: exactly as long as T1's transaction is open, no longer.": "Блокировка держится минимально возможное время, при котором всё ещё корректно: ровно столько, сколько открыта транзакция T1, не дольше.",
    "T2 proceeds — the invariant held": "T2 продолжает — инвариант сохранён",
    "T2 now reads fresh, consistent balances and runs its own transfer. Through all of this, the total money in the system never changed.": "T2 теперь читает свежие, согласованные балансы и выполняет свой перевод. За всё это время общая сумма денег в системе не изменилась.",
    "This is the proof the pattern works: concurrent access was serialized just enough to keep Σ(balances) constant, without serializing the WHOLE database.": "Это доказательство того, что паттерн работает: конкурентный доступ был сериализован ровно настолько, чтобы Σ(балансов) оставалась постоянной, без сериализации ВСЕЙ базы данных.",

    // pqc-lattice
    "Two handshakes, same shape, different math": "Два handshake, одна форма, разная математика",
    "Channel A negotiates a classical X25519 key. Channel B negotiates a hybrid key — classical X25519 PLUS a lattice-based ML-KEM-768 key, combined.": "Канал A договаривается о классическом ключе X25519. Канал B договаривается о гибридном ключе — классический X25519 ПЛЮС решёточный ключ ML-KEM-768, объединённые.",
    "Both look identical at the protocol level — a normal TLS handshake. The difference that matters is invisible: what hard math problem the key relies on.": "На уровне протокола оба выглядят одинаково — обычный TLS handshake. Значимая разница невидима: на какую сложную математическую задачу опирается ключ.",
    "An attacker harvests today's ciphertext": "Атакующий собирает сегодняшний шифротекст",
    "A passive adversary doesn't try to break the key right now — it just records both encrypted sessions and stores them.": "Пассивный атакующий не пытается взломать ключ прямо сейчас — он просто записывает обе зашифрованные сессии и сохраняет их.",
    "This is 'harvest now, decrypt later': the attack doesn't need to be feasible TODAY, only by the time a quantum computer exists.": "Это «собери сейчас, расшифруй позже»: атаке не нужно быть реализуемой СЕГОДНЯ, только к моменту, когда появится квантовый компьютер.",
    "Years later: a quantum computer arrives": "Годы спустя: появляется квантовый компьютер",
    "A cryptographically-relevant quantum computer comes online and is pointed at both stored recordings.": "Криптографически значимый квантовый компьютер запускается и направляется на обе сохранённые записи.",
    "This is the whole premise of post-quantum cryptography: defend data today against a computer that doesn't exist yet, because the recording already happened.": "В этом вся суть постквантовой криптографии: защищать данные сегодня от компьютера, которого ещё не существует, потому что запись уже произошла.",
    "Channel A's classical key falls": "Классический ключ канала A падает",
    "Shor's algorithm efficiently solves the discrete-log problem that X25519's security rests on — the recorded session decrypts.": "Алгоритм Шора эффективно решает задачу дискретного логарифма, на которой держится безопасность X25519 — записанная сессия расшифровывается.",
    "This is exactly why 'classical-only' key exchange is a liability for any data that needs to stay secret for years: today's strong key becomes tomorrow's broken one.": "Именно поэтому «только классический» обмен ключами — это риск для любых данных, которые должны храниться в секрете годами: сегодняшний сильный ключ становится завтрашним взломанным.",
    "Channel B's hybrid key holds": "Гибридный ключ канала B держится",
    "The ML-KEM-768 lattice key has no known efficient quantum attack — so even though the ciphertext was recorded, it stays unreadable.": "У решёточного ключа ML-KEM-768 нет известной эффективной квантовой атаки — поэтому, хотя шифротекст и был записан, он остаётся нечитаемым.",
    "Hybrid means EITHER half failing is survivable: it's only broken if BOTH the classical AND the lattice problem fall — a much higher bar than relying on one algorithm alone.": "Гибрид означает, что провал ЛЮБОЙ из половин переживаем: взлом происходит только если падают И классическая, И решёточная задача — гораздо более высокая планка, чем опора на один алгоритм.",

    // leak-graph
    "A live goroutine graph": "Граф живых горутин",
    "Goroutines are nodes; the channels and contexts connecting them are the edges. This is the shape the leak analyzer reasons about.": "Горутины — это узлы; каналы и контексты, соединяющие их — это рёбра. Именно с этой формой рассуждает анализатор утечек.",
    "Most goroutine leaks aren't a mystery once you can SEE the dependency graph — they're usually one missing edge.": "Большинство утечек горутин — не загадка, если вы можете УВИДЕТЬ граф зависимостей — обычно это одно недостающее ребро.",
    "G4 is stuck forever": "G4 застряла навсегда",
    "G4 is parked on <-results — and tracing the graph, NOTHING will ever send on that channel. It will wait until the process dies.": "G4 припаркована на <-results — и, трассируя граф, видно, что НИЧТО никогда не отправит в этот канал. Она будет ждать до самой смерти процесса.",
    "A blocked goroutine isn't automatically a leak — other goroutines block briefly all the time. It's a leak specifically because nothing can ever wake it.": "Блокированная горутина не является утечкой автоматически — другие горутины блокируются на короткое время постоянно. Это утечка именно потому, что ничто никогда не может её разбудить.",
    "The analyzer traces backward": "Анализатор трассирует назад",
    "Starting from the blocked goroutine, the analyzer walks the channel graph backward — G4 ← G3 — hunting for whoever was supposed to send.": "Начиная с блокированной горутины, анализатор идёт по графу каналов назад — G4 ← G3 — в поисках того, кто должен был отправить.",
    "Walking the graph backward from the symptom is exactly how you'd debug this by hand — the analyzer just does it instantly and exhaustively.": "Проход по графу назад от симптома — именно так вы бы дебажили это руками — анализатор просто делает это мгновенно и исчерпывающе.",
    "Root cause found": "Корневая причина найдена",
    "G2 dispatch is the actual problem: it never sends on results, and its context had no deadline to force it to give up and move on.": "G2 dispatch — вот настоящая проблема: она никогда не отправляет в results, а у её контекста не было дедлайна, чтобы заставить её сдаться и продолжить.",
    "Localizing to ONE goroutine and ONE missing send turns 'the program hangs sometimes' into a fix you can make in one line.": "Локализация до ОДНОЙ горутины и ОДНОЙ недостающей отправки превращает «программа иногда виснет» в исправление одной строкой.",

    // simd-gc
    "Same work, two engines": "Одна работа, два движка",
    "We'll process the same 32-element array two ways: a plain scalar loop, one element at a time, and a SIMD vector loop.": "Мы обработаем один и тот же массив из 32 элементов двумя способами: обычным скалярным циклом, по одному элементу за раз, и векторным циклом SIMD.",
    "Comparing them on identical work isolates exactly what the vector hardware buys you — nothing about the task itself changes.": "Сравнение их на одинаковой работе изолирует именно то, что даёт векторное железо — сама задача при этом не меняется.",
    "Scalar: one element per cycle": "Скаляр: один элемент за такт",
    "The plain loop touches a single array element each iteration — the pointer crawls along one cell at a time.": "Обычный цикл трогает один элемент массива за итерацию — указатель ползёт по одной ячейке за раз.",
    "This is the baseline: N elements means N cycles of work, no matter how simple each individual step is.": "Это базовая линия: N элементов означает N тактов работы, независимо от того, насколько прост каждый отдельный шаг.",
    "SIMD: sixteen elements per cycle": "SIMD: шестнадцать элементов за такт",
    "One vector instruction loads and processes a whole 16-element lane at once — the same array, far fewer trips through the loop.": "Одна векторная инструкция загружает и обрабатывает целую дорожку из 16 элементов за раз — тот же массив, гораздо меньше проходов через цикл.",
    "The CPU has dedicated wide registers and circuits for this — it's not 'doing 16 things fast', it's doing them in the SAME instruction.": "У CPU есть выделенные широкие регистры и схемы именно для этого — это не «делать 16 вещей быстро», это делать их за ОДНУ инструкцию.",
    "Same result, ~16× fewer cycles": "Тот же результат, ~в 16× меньше тактов",
    "Both loops produce the identical output — only the number of cycles spent getting there differs.": "Оба цикла производят идентичный результат — различается только число тактов, потраченных на его получение.",
    "This is why hot numeric loops (hashing, checksums, image/byte processing) are worth vectorizing: the speedup is structural, not a micro-optimization.": "Вот почему горячие числовые циклы (хеширование, контрольные суммы, обработка изображений/байтов) стоит векторизовать: ускорение структурное, а не микрооптимизация.",
    "Green Tea GC sweeps contiguous spans": "Green Tea GC собирает мусор по непрерывным спанам",
    "Switching topics: the new collector marks memory in contiguous 8 KiB spans in parallel, instead of chasing one scattered object at a time.": "Меняем тему: новый сборщик помечает память непрерывными спанами по 8 КиБ параллельно, вместо погони за одним разрозненным объектом за раз.",
    "Spans are physically contiguous in memory — exactly the layout that lets a sweep be both vectorizable AND cache-friendly, the same idea as the SIMD loop above.": "Спаны физически непрерывны в памяти — именно такое устройство позволяет сборке быть и векторизуемой, И дружелюбной к кэшу — та же идея, что и в SIMD-цикле выше.",
    "Cache-friendly and scales with cores": "Дружелюбно к кэшу и масштабируется по ядрам",
    "Sequential span scanning avoids the scattered cache misses of object-by-object marking, and multiple cores can sweep different spans in parallel.": "Последовательное сканирование спанов избегает разрозненных промахов кэша при пометке объект-за-объектом, и несколько ядер могут собирать разные спаны параллельно.",
    "This connects directly back to M10: contiguous memory is what makes both a SIMD loop AND a GC sweep fast — the hardware always rewards sequential access.": "Это напрямую связано с M10: именно непрерывная память делает быстрыми и SIMD-цикл, И сборку GC — железо всегда вознаграждает последовательный доступ.",

    // container-rollout
    "Three healthy v1 pods serve traffic": "Три здоровых пода v1 обслуживают трафик",
    "The load balancer spreads incoming requests across every Ready pod. This is the steady state before a rollout begins.": "Балансировщик нагрузки распределяет входящие запросы по всем подам в состоянии Ready. Это устойчивое состояние перед началом раскатки.",
    "A rollout always starts from a known-good baseline — that's what makes it safe to compare against as the upgrade proceeds.": "Раскатка всегда начинается с заведомо исправной базовой линии — именно это делает безопасным сравнение с ней по ходу обновления.",
    "A new v2 pod starts — but gets no traffic yet": "Новый под v2 запускается — но пока не получает трафика",
    "A 4th pod boots running v2. Its readiness probe hasn't passed, so the load balancer deliberately routes it nothing.": "4-й под загружается с v2. Его readiness-проверка ещё не пройдена, поэтому балансировщик намеренно не направляет ему ничего.",
    "Sending live traffic to a pod that isn't ready (still loading config, warming caches) would mean real users hitting errors.": "Отправка живого трафика поду, который не готов (ещё загружает конфиг, разогревает кэши), означала бы, что настоящие пользователи получают ошибки.",
    "Readiness probe passes → pod joins rotation": "Readiness-проверка проходит → под входит в ротацию",
    "Once the probe succeeds, the load balancer adds the v2 pod to rotation immediately — it starts receiving its share of traffic.": "Как только проверка успешна, балансировщик немедленно добавляет под v2 в ротацию — он начинает получать свою долю трафика.",
    "This is the gate that makes rollouts safe: 'started' and 'ready to serve' are different states, and only the second one earns traffic.": "Это тот шлюз, который делает раскатки безопасными: «запущен» и «готов обслуживать» — разные состояния, и только второе заслуживает трафик.",
    "An old v1 pod drains": "Старый под v1 дренируется",
    "Now that v2 is carrying load, one v1 pod stops receiving NEW requests but keeps running until its in-flight requests finish.": "Теперь, когда v2 несёт нагрузку, один под v1 перестаёт получать НОВЫЕ запросы, но продолжает работать, пока не завершатся его запросы в полёте.",
    "Draining (not killing) is what guarantees zero dropped requests — a request that's already in progress always gets to complete.": "Именно дренаж (а не убийство) гарантирует ноль потерянных запросов — запрос, который уже в процессе, всегда получает возможность завершиться.",
    "The slot comes back as v2": "Слот возвращается как v2",
    "Once drained, the old pod terminates and a fresh v2 pod boots in its place — going through the same starting → ready sequence.": "После дренажа старый под завершается, и на его месте загружается новый под v2 — проходя через ту же последовательность запуск → готовность.",
    "Replacing pods ONE AT A TIME (not all at once) means the fleet never drops below enough healthy capacity to serve current load.": "Замена подов ПО ОДНОМУ (не все сразу) означает, что флот никогда не опускается ниже достаточной здоровой мощности для обслуживания текущей нагрузки.",
    "Repeat until the whole fleet is upgraded": "Повторяем, пока весь флот не обновится",
    "The same start → probe → join → drain → replace cycle repeats pod by pod until every pod runs v2.": "Тот же цикл запуск → проверка → вход → дренаж → замена повторяется под за подом, пока каждый под не будет работать на v2.",
    "Zero dropped requests, throughout an entire version upgrade, with no maintenance window — that's the payoff of doing it incrementally.": "Ноль потерянных запросов на протяжении всего обновления версии, без окна обслуживания — вот выигрыш от инкрементального подхода.",

    // cache-hierarchy
    "Small & fast, down to big & slow": "От маленького и быстрого до большого и медленного",
    "Memory is a pyramid: L1 is tiny but ~1 ns, RAM is huge but ~100 ns. Each step down is roughly 10× bigger and 10× slower.": "Память — это пирамида: L1 крошечный, но ~1 нс, RAM огромный, но ~100 нс. Каждый шаг вниз — примерно в 10× больше и в 10× медленнее.",
    "On-chip caches are small because fast memory is expensive to build — so the CPU keeps only the hottest data there and falls back to slower, bigger memory for the rest.": "Кэши на чипе маленькие, потому что быструю память дорого строить — поэтому CPU держит там только самые горячие данные, а для остального откатывается к более медленной, большей памяти.",
    "A miss escalates one level at a time": "Промах поднимается на уровень выше, шаг за шагом",
    "The CPU asks L1 first. Not there? Ask L2. Not there? Ask L3. Each 'no' costs a little more time before moving down.": "CPU сначала спрашивает L1. Нет там? Спрашивает L2. Нет там? Спрашивает L3. Каждое «нет» стоит немного больше времени перед переходом вниз.",
    "Each cache only stores a recent subset of memory — checking the small, fast one first is cheap insurance before paying for a slower lookup.": "Каждый кэш хранит только недавнее подмножество памяти — проверка маленького, быстрого кэша первым — это дешёвая страховка перед платой за более медленный поиск.",
    "RAM answers with a whole 64-byte line": "RAM отвечает целой 64-байтной линией",
    "RAM never hands back a single value — it returns the full 64-byte block containing it, and that block fills L3, then L2, then L1 on the way back up.": "RAM никогда не возвращает одно значение — она возвращает весь 64-байтный блок, содержащий его, и этот блок заполняет L3, затем L2, затем L1 на пути обратно вверх.",
    "Fetching one extra value is almost free once the bus is already moving data, so hardware always moves in line-sized chunks — betting that nearby bytes will be used soon too.": "Получить одно дополнительное значение почти бесплатно, когда шина уже передаёт данные, поэтому железо всегда двигается блоками размером в линию — делая ставку, что соседние байты тоже скоро понадобятся.",
    "The next 7 reads are now nearly free": "Следующие 7 чтений теперь почти бесплатны",
    "Those values were strangers a moment ago; now they live in L1 with the one we asked for. Reading them costs ~1 ns each instead of ~100 ns.": "Эти значения были чужими секунду назад; теперь они живут в L1 вместе с тем, что мы запросили. Их чтение стоит ~1 нс каждое вместо ~100 нс.",
    "This is why sequential, contiguous access (slices) is so much faster than scattered access (linked lists, pointer-chasing) — it cashes in on a line you already paid to fetch.": "Вот почему последовательный, непрерывный доступ (слайсы) настолько быстрее разрозненного доступа (связные списки, погоня за указателями) — он использует линию, за загрузку которой вы уже заплатили.",

    // cpu-pipeline
    "One instruction, five stages": "Одна инструкция, пять стадий",
    "Every instruction passes through 5 fixed stations: Fetch the instruction, Decode it, Execute it, access Memory, Write the result back.": "Каждая инструкция проходит через 5 фиксированных станций: Fetch (выборка), Decode (декодирование), Execute (выполнение), доступ к Memory (памяти), Write-back (запись результата).",
    "Splitting the work into small fixed stages is what lets the next instruction start before this one finishes — that's the whole trick of pipelining.": "Именно разбиение работы на маленькие фиксированные стадии позволяет следующей инструкции начаться до завершения этой — в этом весь фокус конвейеризации.",
    "The next instruction starts one cycle later": "Следующая инструкция начинается на такт позже",
    "While I1 moves to Decode, I2 enters Fetch right behind it — they're in different stages of the SAME pipe at the same time.": "Пока I1 переходит в Decode, I2 входит в Fetch прямо позади неё — они находятся в разных стадиях ОДНОГО конвейера одновременно.",
    "If the core waited for I1 to fully finish before starting I2, four of the five stages would sit idle the whole time. Overlap keeps every stage busy.": "Если бы ядро ждало полного завершения I1 перед началом I2, четыре из пяти стадий простаивали бы всё это время. Перекрытие держит каждую стадию занятой.",
    "Steady state: ~1 instruction retires per cycle": "Устойчивое состояние: ~1 инструкция завершается за такт",
    "Once the pipe is full, a NEW instruction finishes Write-back almost every cycle — even though any single one still takes 5 cycles start to finish.": "Когда конвейер заполнен, НОВАЯ инструкция завершает Write-back почти каждый такт — хотя каждая отдельная инструкция всё ещё занимает 5 тактов от начала до конца.",
    "This is the payoff: pipelining doesn't make one instruction faster, it overlaps many so the average THROUGHPUT approaches one per cycle.": "Вот и выигрыш: конвейеризация не делает одну инструкцию быстрее, она перекрывает многие, так что средняя ПРОПУСКНАЯ СПОСОБНОСТЬ приближается к одной за такт.",
    "A branch enters the pipe": "Переход входит в конвейер",
    "I5 is a conditional branch (an `if`). Its true outcome — which way execution should go next — isn't known until it reaches Execute.": "I5 — это условный переход (`if`). Его истинный исход — куда пойдёт выполнение далее — не известен, пока он не достигнет Execute.",
    "But Fetch can't just sit idle waiting 2 stages for that answer — every idle stage is wasted throughput.": "Но Fetch не может просто простаивать, ожидая этого ответа 2 стадии — каждая простаивающая стадия — это потерянная пропускная способность.",
    "Speculate: guess, and keep going": "Спекуляция: угадай и продолжай",
    "A branch predictor guesses the outcome (e.g. 'taken', based on history) and the pipeline fetches the NEXT instructions down that guessed path — before the branch is actually resolved.": "Предсказатель переходов угадывает исход (например, «переход выполнится», на основе истории), и конвейер выбирает СЛЕДУЮЩИЕ инструкции по этому предполагаемому пути — до того, как переход реально разрешится.",
    "A good predictor is right >95% of the time on real code, so guessing and running ahead wins far more cycles than it costs when wrong.": "Хороший предсказатель прав >95% времени на реальном коде, поэтому угадывание и забег вперёд выигрывают гораздо больше тактов, чем стоят при ошибке.",
    "Misprediction: the guess was wrong": "Ошибка предсказания: догадка была неверной",
    "I5 resolves in Execute — and it went the OTHER way. Everything fetched on the guessed path (I6, I7) was working on instructions that should never have run.": "I5 разрешается в Execute — и пошла ДРУГИМ путём. Всё, что было выбрано по предполагаемому пути (I6, I7), работало над инструкциями, которые никогда не должны были выполняться.",
    "Correctness comes first: the CPU cannot let wrong-path work touch real registers or memory, so it must be found and discarded immediately.": "Корректность превыше всего: CPU не может позволить работе с неверного пути тронуть настоящие регистры или память, поэтому она должна быть найдена и отброшена немедленно.",
    "Flush, refetch, and refill": "Сброс, повторная выборка и заполнение",
    "The wrong-path instructions are flushed out, Fetch restarts at the CORRECT target address, and the pipeline gradually fills back up — a short bubble of idle stages, then back to full speed.": "Инструкции с неверного пути сбрасываются, Fetch перезапускается с ПРАВИЛЬНОГО целевого адреса, и конвейер постепенно заполняется снова — короткий пузырь простаивающих стадий, затем снова полная скорость.",
    "The cost of a misprediction is only this refill delay (~15–20 cycles on real hardware) — far cheaper than stalling on every single branch and never speculating at all.": "Стоимость ошибки предсказания — это только эта задержка заполнения (~15–20 тактов на реальном железе) — гораздо дешевле, чем останавливаться на каждом переходе и вообще никогда не спекулировать.",

    // gmp-scheduler
    "Three roles: G, M and P": "Три роли: G, M и P",
    "G is a goroutine — a tiny, cheap unit of work (~2 KB stack). M is an OS thread — the thing the kernel actually runs. P is a processor — a scheduling slot with its own queue; the number of Ps equals GOMAXPROCS.": "G — это горутина: крошечная, дешёвая единица работы (стек ~2 КБ). M — это поток ОС: то, что реально выполняет ядро. P — это процессор: слот планирования со своей очередью; число P равно GOMAXPROCS.",
    "Separating 'work' (G) from 'who runs it' (M) from 'how many run at once' (P) is what lets Go run a million goroutines on a handful of threads.": "Разделение «работы» (G), «кто её выполняет» (M) и «сколько выполняется одновременно» (P) — вот что позволяет Go запускать миллион горутин на горстке потоков.",
    "Each P drains its own queue — no shared lock": "Каждый P опустошает свою очередь — без общей блокировки",
    "A P pulls goroutines one at a time from its OWN local queue and hands each to its M to run. Other Ps never need to touch this queue.": "P забирает горутины по одной из своей СОБСТВЕННОЙ локальной очереди и передаёт каждую своему M для выполнения. Другим P никогда не нужно трогать эту очередь.",
    "A private queue per P means most scheduling needs zero synchronization with other Ps — that's what keeps the hot path fast.": "Приватная очередь на каждый P означает, что большинству планирования не нужна синхронизация с другими P — именно это делает горячий путь быстрым.",
    "An idle P steals work instead of waiting": "Простаивающий P крадёт работу вместо ожидания",
    "P2's queue runs dry while P1 still has plenty queued. Rather than sit idle, P2 steals half of P1's remaining goroutines.": "Очередь P2 опустела, пока у P1 ещё много в очереди. Вместо простоя P2 крадёт половину оставшихся горутин P1.",
    "No central scheduler decides this — each idle P independently grabs work from a busy neighbor, so load balances itself without a bottleneck.": "Никакой центральный планировщик это не решает — каждый простаивающий P независимо забирает работу у занятого соседа, так что нагрузка балансируется сама, без узкого места.",
    "A blocking syscall can't be allowed to block the P": "Блокирующему syscall нельзя позволить заблокировать P",
    "M3 makes a slow syscall (e.g. reading a file) and the OS genuinely blocks that thread for its duration.": "M3 выполняет медленный syscall (например, чтение файла), и ОС реально блокирует этот поток на всё его время.",
    "If P3 stayed attached to the blocked M3, every OTHER goroutine queued on P3 would starve until the syscall returns — possibly milliseconds of wasted parallelism.": "Если бы P3 оставался прикреплён к блокированному M3, каждая ДРУГАЯ горутина в очереди P3 голодала бы, пока syscall не вернётся — возможно, миллисекунды потерянного параллелизма.",
    "The runtime detaches P3 and hands it to a fresh M": "Runtime отсоединяет P3 и передаёт его новому M",
    "P3 lets go of the blocked M3 and attaches to a new thread, M4, so its queued goroutines keep running immediately. M3 stays behind, still stuck in the kernel.": "P3 отпускает блокированный M3 и прикрепляется к новому потоку, M4, чтобы его горутины в очереди немедленно продолжили выполняться. M3 остаётся позади, всё ещё застряв в ядре.",
    "This is exactly why a Go process can have MORE OS threads than GOMAXPROCS: extra Ms exist only to cover threads parked in blocking syscalls.": "Именно поэтому у Go-процесса может быть БОЛЬШЕ потоков ОС, чем GOMAXPROCS: лишние M существуют только для того, чтобы прикрыть потоки, застрявшие в блокирующих syscall.",

    // sync-primitives
    "The problem: a data race": "Проблема: гонка данных",
    "Two goroutines run `n++` on the same variable with no coordination at all. Both read the old value, both compute +1, both write — one update is silently lost.": "Две горутины выполняют `n++` на одной переменной без какой-либо координации. Обе читают старое значение, обе вычисляют +1, обе пишут — одно обновление молча теряется.",
    "This isn't just 'sometimes wrong' — the Go memory model calls it undefined behavior, because the compiler and CPU are free to reorder these operations however they like.": "Это не просто «иногда неверно» — модель памяти Go называет это неопределённым поведением, потому что компилятор и CPU вольны переупорядочивать эти операции как угодно.",
    "Atomic: a lock-free compare-and-swap": "Atomic: lock-free compare-and-swap",
    "A goroutine reads the current value, computes the new one, then asks the CPU to swap it in 'only if nobody changed it since I read it.' If it lost the race, it just retries.": "Горутина читает текущее значение, вычисляет новое, затем просит CPU подменить его «только если никто не менял его с момента моего чтения». Если она проиграла гонку, она просто повторяет попытку.",
    "No goroutine ever blocks or sleeps — the whole update is one indivisible CPU instruction. It's the cheapest tool, but it only protects a single word.": "Ни одна горутина никогда не блокируется и не спит — всё обновление — это одна неделимая инструкция CPU. Это самый дешёвый инструмент, но он защищает только одно машинное слово.",
    "Mutex: one goroutine in the critical section at a time": "Mutex: одна горутина в критической секции за раз",
    "A goroutine must acquire the lock before touching shared state, and release it when done. Anyone else who wants in simply waits their turn.": "Горутина должна получить блокировку перед тем, как трогать общее состояние, и отпустить её по завершении. Любой другой, кто хочет войти, просто ждёт своей очереди.",
    "Use this when an INVARIANT spans more than one field (e.g. a balance and a log entry that must change together) — something a single atomic can never guarantee.": "Используйте это, когда ИНВАРИАНТ охватывает больше одного поля (например, баланс и запись в журнале, которые должны меняться вместе) — то, что один atomic никогда не может гарантировать.",
    "Channel: ownership moves with the value": "Channel: владение перемещается вместе со значением",
    "Instead of two goroutines sharing one variable, the producer sends the value down a channel — the consumer is now the only one who can touch it.": "Вместо того чтобы две горутины делили одну переменную, производитель отправляет значение в канал — теперь только потребитель может его трогать.",
    "'Don't communicate by sharing memory; share memory by communicating.' There's no shared state left to race on, because only one goroutine ever owns the value at a time.": "«Не общайтесь, разделяя память; разделяйте память, общаясь». Не остаётся общего состояния для гонки, потому что значением в любой момент владеет только одна горутина.",
    "Pick by the shape of the problem": "Выбирайте по форме задачи",
    "All three are race-free — the right choice depends on what you're protecting, not on habit.": "Все три варианта свободны от гонок — правильный выбор зависит от того, что вы защищаете, а не от привычки.",
    "Reaching for the wrong tool still 'works' but costs clarity or performance: an atomic-per-field can't keep two fields consistent; a mutex around a single counter is needless overhead; a channel as a lock is heavier than either.": "Выбор неверного инструмента всё равно «работает», но стоит ясности или производительности: atomic на каждое поле не может сохранить согласованность двух полей; mutex вокруг одного счётчика — лишние затраты; channel как блокировка тяжелее обоих вариантов.",

    // three-pillars
    "One request, three services": "Один запрос, три сервиса",
    "A request enters Service A, which calls Service B, which calls Service C — a normal cross-service call chain.": "Запрос входит в Сервис A, который вызывает Сервис B, который вызывает Сервис C — обычная цепочка межсервисных вызовов.",
    "Once a request crosses service boundaries, no single process can see the whole picture anymore — that's the gap observability exists to close.": "Как только запрос пересекает границы сервисов, ни один процесс больше не видит полной картины — именно этот разрыв и призвана закрыть observability.",
    "Each hop opens a child span": "Каждый переход открывает дочерний span",
    "Service A's span covers the whole request. When it calls B, B opens its OWN span nested inside A's. The nesting mirrors the call stack across services.": "Span Сервиса A покрывает весь запрос. Когда он вызывает B, B открывает СВОЙ собственный span, вложенный внутрь span'а A. Вложенность отражает стек вызовов между сервисами.",
    "A trace is just this tree of spans — it's how you see exactly which hop the time went to, instead of one opaque total latency number.": "Трейс — это просто дерево таких span'ов — так вы видите, на какой именно переход ушло время, вместо одного непрозрачного числа общей задержки.",
    "Metrics: cheap aggregates that answer 'is it broken?'": "Метрики: дешёвые агрегаты, отвечающие «всё ли сломано?»",
    "Every request bumps a counter and records its duration in a histogram — tiny, constant-cost numbers no matter how much traffic flows through.": "Каждый запрос увеличивает счётчик и записывает свою длительность в гистограмму — крошечные числа с постоянной стоимостью независимо от объёма трафика.",
    "Metrics are cheap enough to keep forever and alert on continuously — they're the first signal that something is wrong, even before anyone looks at a trace.": "Метрики достаточно дёшевы, чтобы хранить их вечно и непрерывно проверять на алерты — это первый сигнал о том, что что-то не так, ещё до того, как кто-то посмотрит на трейс.",
    "Logs: structured detail for one specific event": "Логи: структурированные детали для одного конкретного события",
    "Each service emits a key/value log line for what it actually did — not a sentence to parse, but searchable fields.": "Каждый сервис выпускает строку лога в формате ключ/значение о том, что он реально сделал — не предложение для разбора, а поля для поиска.",
    "Metrics tell you something's wrong; logs are where you read exactly what happened in the one request you're debugging.": "Метрики говорят вам, что что-то не так; логи — это то место, где вы читаете, что именно произошло в том одном запросе, который вы дебажите.",
    "Correlated by one trace_id": "Связаны одним trace_id",
    "The same trace_id is stamped on the span, the log lines, and (as a label) the metric for this request — so you can jump from a metric alert, to the slow trace, to the exact log line that explains it.": "Один и тот же trace_id проставлен на span, строках лога и (как метка) на метрике этого запроса — так вы можете прыгнуть от алерта по метрике к медленному трейсу и к точной строке лога, которая всё объясняет.",
    "Without a shared ID, the three pillars are three disconnected views. With it, they become one investigation: alert → trace → root cause.": "Без общего ID три столпа — это три несвязанных представления. С ним они становятся одним расследованием: алерт → трейс → корневая причина.",

    // circuit-breaker
    "Closed: calls flow normally": "Closed: вызовы идут нормально",
    "In the default CLOSED state, every call passes straight through to the service. The breaker just quietly counts failures in the background.": "В состоянии CLOSED по умолчанию каждый вызов проходит прямо к сервису. Автомат просто тихо считает сбои в фоне.",
    "Most of the time the dependency is healthy, so the breaker should add zero overhead — just watch, don't interfere.": "Большую часть времени зависимость здорова, поэтому автомат должен добавлять нулевые затраты — просто наблюдать, не мешать.",
    "Failures climb toward the trip threshold": "Сбои растут к порогу срабатывания",
    "The downstream service starts erroring. Each failed call still goes all the way out and back — the breaker just increments its counter.": "Нижестоящий сервис начинает выдавать ошибки. Каждый неудачный вызов всё равно идёт туда и обратно целиком — автомат просто увеличивает свой счётчик.",
    "The breaker needs real evidence the dependency is unhealthy (not one blip) before it changes behavior — that's what the threshold is for.": "Автомату нужны реальные доказательства нездоровья зависимости (не один всплеск), прежде чем менять поведение — именно для этого и существует порог.",
    "Trip → OPEN: fail fast, don't even ask": "Срабатывание → OPEN: быстрый отказ, даже не спрашивая",
    "The breaker trips OPEN. Calls now fail INSTANTLY at the breaker itself — they never even reach the struggling service.": "Автомат переходит в OPEN. Теперь вызовы отказывают МГНОВЕННО прямо на автомате — они даже не достигают проблемного сервиса.",
    "Waiting on a timeout from a service you already know is down just wastes time and adds more load to it. Failing fast is strictly better once you're sure it's unhealthy.": "Ожидание таймаута от сервиса, о котором вы уже знаете, что он лежит, просто тратит время и добавляет ему нагрузки. Быстрый отказ строго лучше, когда вы уверены в его нездоровье.",
    "Cooldown: giving the dependency room to breathe": "Охлаждение: даём зависимости пространство для восстановления",
    "For a fixed window, every call keeps failing fast — no traffic reaches the service at all.": "В течение фиксированного окна каждый вызов продолжает быстро отказывать — трафик вообще не доходит до сервиса.",
    "A struggling service often just needs time (to restart, drain a queue, recover from a spike) — sending it zero traffic for a bit is what lets it actually recover.": "Проблемному сервису часто просто нужно время (перезапуститься, опустошить очередь, восстановиться после всплеска) — отправка ему нулевого трафика на время и позволяет ему реально восстановиться.",
    "Half-Open: let exactly one probe through": "Half-Open: пропускаем ровно один пробный вызов",
    "Once the cooldown ends, the breaker allows a single real call through to test the water — everything else still waits.": "Когда охлаждение заканчивается, автомат пропускает один настоящий вызов, чтобы прощупать воду — всё остальное всё ещё ждёт.",
    "This answers 'has it recovered?' with minimal risk: if the service is still down, only one call pays the price, not a full flood.": "Это отвечает на вопрос «восстановился ли он?» с минимальным риском: если сервис всё ещё лежит, платит только один вызов, а не целый поток.",
    "Probe succeeds → back to Closed": "Проба успешна → назад в Closed",
    "The probe comes back healthy, so the breaker closes again and lets traffic flow normally. (Had it failed, the breaker would re-open and wait another cooldown.)": "Проба возвращается здоровой, поэтому автомат снова закрывается и пропускает трафик нормально. (Если бы она провалилась, автомат снова открылся бы и подождал ещё одно охлаждение.)",
    "This Closed → Open → Half-Open → Closed cycle is the whole pattern: protect the dependency when it's down, and self-heal automatically once it recovers — no human required.": "Этот цикл Closed → Open → Half-Open → Closed — весь паттерн целиком: защищать зависимость, когда она лежит, и автоматически самовосстанавливаться, когда она оживает — без участия человека.",
  };

  function lang() { return (typeof window !== "undefined" && window.__LANG__) || "en"; }
  function tr(s) {
    if (lang() !== "ru") return s;
    return CANVAS_RU[s] || s;
  }

  /* --------------------------------------------------------- math utils */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const seg = (t, a, b, ease) => {
    const p = clamp((t - a) / (b - a), 0, 1);
    return ease ? ease(p) : p;
  };
  const within = (t, a, b) => t >= a && t <= b;

  /* ------------------------------------------------------ draw helpers */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillRR(ctx, x, y, w, h, r, fill, stroke, lw) {
    rr(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }
  function text(ctx, str, x, y, opts = {}) {
    ctx.fillStyle = opts.color || "#fff";
    ctx.font = `${opts.weight || 500} ${opts.size || 13}px ${opts.mono ? "ui-monospace, 'JetBrains Mono', monospace" : "Inter, system-ui, sans-serif"}`;
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.baseline || "alphabetic";
    if (opts.alpha != null) { ctx.globalAlpha = opts.alpha; }
    ctx.fillText(tr(str), x, y);
    ctx.globalAlpha = 1;
  }
  function line(ctx, x1, y1, x2, y2, color, lw, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw || 1.5;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color, lw) {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
    line(ctx, x1, y1, x2, y2, color, lw);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4));
    ctx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  }
  function dot(ctx, x, y, r, color, glow) {
    if (glow) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, glow); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
    }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  function badge(ctx, x, y, str, fill, fg) {
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const w = ctx.measureText(tr(str)).width + 16;
    fillRR(ctx, x, y, w, 20, 10, fill);
    text(ctx, str, x + 8, y + 14, { color: fg || "#06101f", size: 11, weight: 700 });
    return w;
  }
  // a soft legend chip row, bottom-left
  function legend(ctx, x, y, items) {
    let cx = x;
    items.forEach((it) => {
      ctx.fillStyle = it[1]; rr(ctx, cx, y - 9, 11, 11, 3); ctx.fill();
      text(ctx, it[0], cx + 16, y, { color: it[2] || "#9fb0cc", size: 10.5, weight: 500 });
      cx += 16 + ctx.measureText(it[0]).width + 18;
    });
  }

  /* ----------------------------------------------- step-by-step render
     Turns an array of STEPS (each its own isolated draw(ctx,p,w,h,c,u,info))
     into a single render(ctx,t,w,h,c,u) for makeTimeline: exactly one step's
     visual is on screen at a time (p = 0..1 progress through THAT step),
     so every phase is a focused, self-contained mini-scene. */
  function stepRender(steps, duration, header) {
    return function (ctx, t, w, h, c, u) {
      if (header) text(ctx, header, 24, 28, { color: c.text, size: 13.5, weight: 700, mono: true });
      let i = 0;
      for (let k = 0; k < steps.length; k++) if (steps[k].t <= t + 1e-6) i = k;
      const startT = steps[i].t;
      const endT = i + 1 < steps.length ? steps[i + 1].t : duration;
      const p = clamp((t - startT) / Math.max(0.0001, endT - startT), 0, 1);
      text(ctx, tr("STEP ") + (i + 1) + "/" + steps.length + tr("  ·  ") + tr(steps[i].title), 24, 50,
        { color: c.purple, size: 11.5, weight: 700, mono: true });
      steps[i].draw(ctx, p, w, h, c, u, { index: i, total: steps.length, title: steps[i].title });
    };
  }

  /* --------------------------------------------------- timeline engine */
  function makeTimeline(canvas, def) {
    const ctx = canvas.getContext("2d");
    let raf = 0, playing = false, t = 0, last = 0, speed = 0.75;
    const dur = def.duration;
    const phases = def.phases || [{ t: 0, title: "", desc: "" }];
    let frameCb = null;

    function phaseAt(time) {
      let idx = 0;
      for (let i = 0; i < phases.length; i++) if (phases[i].t <= time + 1e-6) idx = i;
      return idx;
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      const w = Math.max(320, r.width), h = Math.max(220, r.height || 380);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas._w = w; canvas._h = h;
      render();
    }
    function render() {
      const w = canvas._w, h = canvas._h, th = theme();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = th.bg; ctx.fillRect(0, 0, w, h);
      def.render(ctx, t, w, h, th, {
        seg, within, lerp, clamp, easeInOut, easeOut,
        rr, fillRR, text, line, arrow, dot, badge, legend,
      });
      if (frameCb) {
        const i = phaseAt(t);
        frameCb(t / dur, { index: i, total: phases.length, title: phases[i].title, desc: phases[i].desc, why: phases[i].why });
      }
    }
    function tick(now) {
      if (!playing) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      t += dt * speed;
      if (t >= dur) { t = def.loop === false ? dur : t % dur; if (def.loop === false) playing = false; }
      render();
      if (playing) raf = requestAnimationFrame(tick);
    }
    const api = {
      duration: dur,
      play() { if (playing) return; if (t >= dur && def.loop === false) t = 0; playing = true; last = performance.now(); raf = requestAnimationFrame(tick); },
      pause() { playing = false; cancelAnimationFrame(raf); },
      toggle() { playing ? api.pause() : api.play(); return playing; },
      isPlaying: () => playing,
      reset() { api.pause(); t = 0; render(); },
      step(d) { api.pause(); t = clamp(t + (d || 0.4), 0, dur); render(); },
      seek(p) { api.pause(); t = clamp(p, 0, 1) * dur; render(); },
      seekPhase(i) { api.pause(); t = clamp(phases[clamp(i, 0, phases.length - 1)].t + 0.001, 0, dur); render(); },
      getPhases: () => phases,
      setSpeed(s) { speed = s; },
      getSpeed: () => speed,
      progress: () => t / dur,
      onFrame(cb) { frameCb = cb; render(); },
      resize, render,
      destroy() { api.pause(); },
    };
    resize();
    return api;
  }

  const ANIM = {};

  /* =================================================================== */
  /* F1. GC TRI-COLOR MARK & SWEEP                                       */
  /* =================================================================== */
  ANIM["gc-mark-sweep"] = (canvas) => {
    const nodes = {
      r1: { x: .04, y: .30, lvl: -1, root: true }, r2: { x: .04, y: .66, lvl: -1, root: true },
      A: { x: .26, y: .18, lvl: 1 }, F: { x: .26, y: .70, lvl: 1 },
      B: { x: .46, y: .07, lvl: 2 }, C: { x: .46, y: .33, lvl: 2 }, G: { x: .46, y: .72, lvl: 2 },
      D: { x: .66, y: .05, lvl: 3 }, E: { x: .66, y: .30, lvl: 3 },
      X: { x: .80, y: .60, g: true }, Y: { x: .94, y: .60, g: true }, Z: { x: .87, y: .85, g: true },
    };
    const edges = [["r1", "A"], ["r2", "F"], ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"], ["F", "G"], ["X", "Y"]];

    function drawHeap(ctx, c, u, w, h, frontier, marking, sweepA) {
      const N = (fx) => 24 + fx * (w - 48), M = (fy) => 100 + fy * (h - 180);
      function color(k) {
        const n = nodes[k];
        if (n.g) return "white";
        if (!marking) return "white";
        if (n.root) return "black";
        if (frontier < n.lvl) return "white";
        if (frontier < n.lvl + 1) return "grey";
        return "black";
      }
      edges.forEach((e) => {
        const a = nodes[e[0]], b = nodes[e[1]];
        const live = color(e[0]) !== "white" && !a.g;
        u.line(ctx, N(a.x), M(a.y), N(b.x), M(b.y), a.g ? c.line : live ? c.goSoft : c.line, a.g ? 1.3 : live ? 2 : 1.4, a.g ? [4, 4] : null);
      });
      Object.keys(nodes).forEach((k) => {
        const n = nodes[k], col = color(k), gone = n.g && sweepA > 0;
        const x = N(n.x), y = M(n.y), R = n.root ? 17 : 15;
        let fill = c.panel, stroke = c.line, fg = c.dim;
        if (col === "grey") { fill = "rgba(245,177,76,.85)"; stroke = c.warn; fg = "#1c1406"; }
        if (col === "black") { fill = "rgba(0,173,216,.9)"; stroke = c.go; fg = "#04121c"; }
        if (n.g && sweepA === 0 && marking && frontier >= 4) stroke = c.bad;
        ctx.globalAlpha = gone ? 1 - sweepA : 1;
        if (n.root) {
          u.fillRR(ctx, x - 26, y - 13, 52, 26, 7, fill === c.panel ? "rgba(0,173,216,.9)" : fill, c.go, 2);
          u.text(ctx, "root", x, y + 4, { align: "center", color: "#04121c", size: 11, weight: 700, mono: true });
        } else {
          ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fillStyle = fill; ctx.fill();
          ctx.lineWidth = (n.g && sweepA === 0 && marking && frontier >= 4) ? 2.2 : 1.6; ctx.strokeStyle = stroke; ctx.stroke();
          u.text(ctx, k, x, y + 4, { align: "center", color: fg, size: 11, weight: 700, mono: true });
        }
        ctx.globalAlpha = 1;
      });
      u.legend(ctx, 24, h - 14, [["white = unreached", c.panel, c.dim], ["grey = reachable", c.warn], ["black = live", c.go]]);
    }

    const STEPS = [
      {
        t: 0,
        title: "The heap is a graph of objects",
        desc: "Two roots (global variables / goroutine stacks) point into a web of objects. Some objects (right side) aren't pointed to by anything reachable from a root.",
        why: "The collector's whole job is to tell live objects apart from dead ones — and 'reachable from a root' is the only definition of 'live' it needs.",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, 0, false, 0); },
      },
      {
        t: 2.0,
        title: "Start at the roots, mark them black",
        desc: "Marking begins at the roots — they're live by definition. Whatever they directly point to turns grey: 'reachable, but not yet scanned.'",
        why: "Starting only from roots guarantees you never mark something live unless there's an actual chain of pointers reaching it.",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, u.clamp(p, 0, 1) * 0.9, true, 0); },
      },
      {
        t: 4.4,
        title: "Scan grey → black, level by level",
        desc: "Each grey object gets scanned: it turns black ('done'), and anything IT points to turns grey in turn. The reachable wave spreads outward through the graph.",
        why: "This is why it's called tri-color: grey is the 'in-progress' frontier that guarantees every reachable object eventually gets scanned exactly once.",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, 0.9 + u.clamp(p, 0, 1) * 3.1, true, 0); },
      },
      {
        t: 7.0,
        title: "White = dead",
        desc: "Once no grey objects remain, the wave is finished. Everything still white — including the cluster on the right — was never touched, because nothing live points to it.",
        why: "This is the proof of garbage: not 'looks unused', but 'provably unreachable from any root.'",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, 4, true, 0); },
      },
      {
        t: 9.4,
        title: "Sweep: reclaim the white objects",
        desc: "The collector walks the heap one more time and frees every object still marked white. Black (live) objects are never touched.",
        why: "Marking and sweeping are kept as separate passes so the collector never frees something while it might still be mid-scan — correctness over speed.",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, 4, true, u.clamp(p, 0, 1)); },
      },
    ];

    return makeTimeline(canvas, {
      duration: 11.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 11.4, "garbage collector · tri-color mark & sweep"),
    });
  };

  /* =================================================================== */
  /* F2. CPU SAMPLING → FLAME GRAPH                                      */
  /* =================================================================== */
  ANIM["pprof-flame"] = (canvas) => {
    const frames = [
      { n: "main", x: 0, w: 1, lvl: 0 },
      { n: "handleRequest", x: 0, w: 1, lvl: 1 },
      { n: "parseJSON", x: 0, w: .5, lvl: 2 },
      { n: "validate", x: .5, w: .3, lvl: 2 },
      { n: "writeLog", x: .8, w: .2, lvl: 2 },
      { n: "reflectWalk", x: 0, w: .4, lvl: 3, hot: true },
      { n: "jsonAlloc", x: .4, w: .1, lvl: 3 },
    ];
    const paths = [["main", "handleRequest", "parseJSON", "reflectWalk"], ["main", "handleRequest", "parseJSON", "reflectWalk"], ["main", "handleRequest", "validate"], ["main", "handleRequest", "parseJSON", "jsonAlloc"], ["main", "handleRequest", "writeLog"]];

    function drawFlame(ctx, c, u, w, h, grow, hotOn) {
      const x0 = 24, plotW = w - 48, rowH = 34, bottomY = h - 50;
      const cols = [c.go, c.goSoft, c.warn, c.accent];
      frames.forEach((f) => {
        const fw = f.w * plotW * grow, fx = x0 + f.x * plotW * grow;
        const y = bottomY - f.lvl * (rowH + 5);
        const hot = f.hot && hotOn;
        const base = cols[f.lvl % cols.length];
        u.fillRR(ctx, fx, y, Math.max(fw - 2, 1), rowH, 5, hot ? "rgba(255,107,107,.85)" : base, hot ? c.bad : "rgba(0,0,0,.15)", hot ? 2.5 : 1);
        if (fw > 50) u.text(ctx, f.n, fx + 7, y + rowH / 2 + 4, { color: f.lvl === 0 ? "#04121c" : "#06121f", size: 11.5, weight: 600, mono: true });
      });
      return { x0, plotW, rowH, bottomY };
    }

    const STEPS = [
      {
        t: 0,
        title: "The program runs — a call tree",
        desc: "A request flows main → handleRequest → a handful of child functions. Some of those calls are cheap, some are expensive — but just reading the code, you can't tell which.",
        why: "Without measurement, optimization is guessing. Profiling replaces guessing with evidence.",
        draw(ctx, p, w, h, c, u) {
          const tree = [["main", 0, 0], ["handleRequest", 1, 0], ["parseJSON", 2, -1], ["validate", 2, 0], ["writeLog", 2, 1], ["reflectWalk", 3, -1.3], ["jsonAlloc", 3, -0.5]];
          const cx0 = w / 2, rowH = 56;
          tree.forEach(([name, lvl, off], i) => {
            const a = u.clamp((p - lvl * 0.18) / 0.3, 0, 1);
            if (a <= 0) return;
            const x = cx0 + off * 130, y = 50 + lvl * rowH;
            u.fillRR(ctx, x - 64, y, 128, 30, 7, c.panel, c.line, 1.4);
            u.text(ctx, name, x, y + 20, { align: "center", color: c.text, size: 11.5, weight: 600, mono: true, alpha: a });
          });
          const edges = [["main", "handleRequest"], ["handleRequest", "parseJSON"], ["handleRequest", "validate"], ["handleRequest", "writeLog"], ["parseJSON", "reflectWalk"], ["parseJSON", "jsonAlloc"]];
          const pos = {}; tree.forEach(([name, lvl, off]) => { pos[name] = [cx0 + off * 130, 50 + lvl * rowH]; });
          edges.forEach(([a0, b0]) => {
            const A = pos[a0], B = pos[b0];
            if (!A || !B) return;
            const alpha = u.clamp((p - (B[1] - 50) / rowH * 0.18) / 0.3, 0, 1);
            if (alpha <= 0) return;
            ctx.globalAlpha = alpha; u.line(ctx, A[0], A[1] + 30, B[0], B[1], c.line, 1.4); ctx.globalAlpha = 1;
          });
        },
      },
      {
        t: 2.4,
        title: "The sampler ticks ~100×/second",
        desc: "Rather than instrument every call, pprof just peeks at whatever stack is CURRENTLY running, many times a second, and records it.",
        why: "Sampling is statistical, not exhaustive — that's exactly what makes it cheap enough to run in production without slowing the program down.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          u.text(ctx, "sampler", cx0, h * 0.18, { align: "center", color: c.warn, size: 13, weight: 700 });
          const blink = Math.sin(p * 40) > 0;
          u.dot(ctx, cx0 + 60, h * 0.18 - 5, 6, blink ? c.warn : c.dim, blink ? "rgba(245,177,76,.5)" : null);
          const pathI = Math.floor(p * 12) % paths.length;
          const path = paths[pathI];
          path.forEach((name, i) => {
            const y = h * 0.32 + i * 46;
            u.fillRR(ctx, cx0 - 90, y, 180, 32, 7, "rgba(245,177,76,0.18)", c.warn, 1.8);
            u.text(ctx, name, cx0, y + 21, { align: "center", color: c.text, size: 12, weight: 600, mono: true });
            if (i > 0) u.line(ctx, cx0, y - 14, cx0, y, c.warn, 1.4);
          });
          const samples = Math.floor(p * 312);
          u.text(ctx, tr("samples captured: ") + samples, cx0, h * 0.32 + path.length * 46 + 16, { align: "center", color: c.dim, size: 12, mono: true });
        },
      },
      {
        t: 5.4,
        title: "Samples aggregate into a flame graph",
        desc: "Every captured stack stacks its frames into bars — a box sits inside its caller, and the more samples landed in a function, the WIDER its box grows.",
        why: "Width directly encodes time spent, so the visual shape of the graph IS the measurement — no separate legend to decode.",
        draw(ctx, p, w, h, c, u) {
          drawFlame(ctx, c, u, w, h, u.easeOut(u.clamp(p, 0, 1)), false);
          u.text(ctx, "width = share of samples in that function", 24, h - 18, { color: c.dim, size: 11.5 });
        },
      },
      {
        t: 7.8,
        title: "Find the widest box — that's the hotspot",
        desc: "reflectWalk is the widest leaf frame: roughly 40% of all CPU samples landed inside it. The tall, narrow stacks next to it barely register.",
        why: "Optimizing the widest box gives the biggest win for the least effort — optimizing a narrow box can't help much even if you make it instant.",
        draw(ctx, p, w, h, c, u) {
          const { x0 } = drawFlame(ctx, c, u, w, h, 1, true);
          const a = u.clamp(p / 0.4, 0, 1);
          u.fillRR(ctx, x0, 32, 320, 32, 8, "rgba(255,107,107,.12)", c.bad, 1.6);
          u.text(ctx, "▲ reflectWalk ≈ 40% of CPU — optimize here first", x0 + 12, 53, { color: c.bad, size: 12, weight: 700, alpha: a });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.4, "go tool pprof · CPU flame graph"),
    });
  };

  /* =================================================================== */
  /* F3. TABLE-DRIVEN TEST RUNNER                                        */
  /* =================================================================== */
  ANIM["test-runner"] = (canvas) => {
    const cases = [
      { n: "positives", a: 2, b: 3, want: 5 },
      { n: "with_zero", a: 0, b: 0, want: 0 },
      { n: "negatives", a: -2, b: 2, want: 0 },
      { n: "bigger", a: 10, b: 5, want: 15 },
    ];
    function caseRow(ctx, c, u, x, y, rw, cs, state) {
      let stroke = c.line, fill = c.panel;
      if (state === "active") { stroke = c.warn; fill = "rgba(245,177,76,.08)"; }
      if (state === "done") { stroke = c.good; fill = "rgba(58,210,159,.08)"; }
      u.fillRR(ctx, x, y, rw, 36, 9, fill, stroke, state === "active" ? 2 : 1.4);
      u.text(ctx, 't.Run("' + cs.n + '")', x + 10, y + 15, { color: c.text, size: 10.5, mono: true, weight: 600 });
      u.text(ctx, "Add(" + cs.a + "," + cs.b + ") want " + cs.want, x + 10, y + 29, { color: c.dim, size: 10.5, mono: true });
    }

    const STEPS = [
      {
        t: 0,
        title: "A table of cases",
        desc: "Each row is one input pair plus the expected (want) result for the SAME function, Add(a, b).",
        why: "Separating 'what to test' (the table) from 'how to test it' (one shared piece of logic) means adding a new case is just adding a row — no new code.",
        draw(ctx, p, w, h, c, u) {
          const top = h * 0.2, rowH = 56, lx = w * 0.18, rw = w * 0.64;
          cases.forEach((cs, i) => {
            const a = u.clamp((p - i * 0.18) / 0.3, 0, 1);
            if (a <= 0) return;
            ctx.globalAlpha = a; caseRow(ctx, c, u, lx, top + i * rowH, rw, cs, "queued"); ctx.globalAlpha = 1;
          });
        },
      },
      {
        t: 2.2,
        title: "go test runs each case as an isolated subtest",
        desc: "t.Run wraps each row as its own named subtest — go test -run TestAdd/negatives can target just one, and one failing case never stops the others from running.",
        why: "Isolation means a single bad case gives you a precise failure (\"TestAdd/negatives\"), not a vague \"something in TestAdd broke.\"",
        draw(ctx, p, w, h, c, u) {
          const top = h * 0.22, rowH = 56, lx = w * 0.18, rw = w * 0.64;
          const active = Math.min(cases.length - 1, Math.floor(p * cases.length));
          cases.forEach((cs, i) => caseRow(ctx, c, u, lx, top + i * rowH, rw, cs, i === active ? "active" : i < active ? "done" : "queued"));
        },
      },
      {
        t: 4.4,
        title: "Inputs flow into the function",
        desc: "For the active case, a(=2) and b(=3) are passed into Add(a, b), which computes a+b.",
        why: "The function under test never knows it's being tested through a table — it just gets called like normal code, which is why this pattern adds no production complexity.",
        draw(ctx, p, w, h, c, u) {
          const cs = cases[0];
          const lx = w * 0.1, rowY = h * 0.25, fx = w / 2 - 75, fy = h * 0.55, fw = 150, fh = 56;
          caseRow(ctx, c, u, lx, rowY, w * 0.3, cs, "active");
          const busy = u.clamp(p / 0.7, 0, 1) >= 1;
          u.fillRR(ctx, fx, fy, fw, fh, 11, busy ? "rgba(0,173,216,.14)" : c.panel, c.go, busy ? 2.2 : 1.6);
          u.text(ctx, "Add(a, b)", fx + fw / 2, fy + 24, { align: "center", color: c.go, size: 14, weight: 700, mono: true });
          u.text(ctx, "return a + b", fx + fw / 2, fy + 44, { align: "center", color: c.dim, size: 11.5, mono: true });
          const pp = u.clamp(p / 0.8, 0, 1);
          u.dot(ctx, u.lerp(lx + w * 0.3, fx, u.easeInOut(pp)), u.lerp(rowY + 18, fy + fh / 2, pp), 6, c.warn, "rgba(245,177,76,.5)");
        },
      },
      {
        t: 6.6,
        title: "Compare got vs want",
        desc: "The function returns got = 5. The test compares it to want = 5 from the table row. Equal → the case passes.",
        why: "The comparison — not the function — is what decides pass/fail. A mismatch fails loudly with both values printed, so you see exactly what diverged.",
        draw(ctx, p, w, h, c, u) {
          const cs = cases[0];
          const lx = w * 0.1, rowY = h * 0.25, fx = w / 2 - 75, fy = h * 0.55, fw = 150, fh = 56, rx = w * 0.62;
          caseRow(ctx, c, u, lx, rowY, w * 0.3, cs, "active");
          u.fillRR(ctx, fx, fy, fw, fh, 11, c.panel, c.go, 1.6);
          u.text(ctx, "Add(a, b)", fx + fw / 2, fy + 24, { align: "center", color: c.go, size: 14, weight: 700, mono: true });
          const pp = u.clamp(p / 0.6, 0, 1);
          u.dot(ctx, u.lerp(fx + fw, rx, u.easeInOut(pp)), u.lerp(fy + fh / 2, rowY + 18, pp), 6, c.good, "rgba(58,210,159,.5)");
          if (p > 0.6) {
            u.fillRR(ctx, rx, rowY, w * 0.3, 36, 9, "rgba(58,210,159,.1)", c.good, 1.8);
            u.text(ctx, tr("got ") + (cs.a + cs.b) + tr(" == want ") + cs.want, rx + 10, rowY + 16, { color: c.text, size: 11, mono: true });
            u.text(ctx, "✓ PASS", rx + w * 0.3 - 14, rowY + 28, { align: "right", color: c.good, size: 12.5, weight: 700 });
          }
        },
      },
      {
        t: 8.6,
        title: "The same flow runs for every case",
        desc: "go test repeats exactly this input → function → compare flow for each remaining row, fully independently.",
        why: "This is the payoff: one test function plus N table rows covers N scenarios — no copy-pasted test functions to maintain.",
        draw(ctx, p, w, h, c, u) {
          const top = h * 0.22, rowH = 56, lx = w * 0.18, rw = w * 0.64;
          const done = Math.min(cases.length, Math.floor(p * (cases.length + 1)));
          cases.forEach((cs, i) => {
            const state = i < done ? "done" : i === done ? "active" : "queued";
            caseRow(ctx, c, u, lx, top + i * rowH, rw, cs, state);
            if (state === "done") u.text(ctx, "✓", lx + rw - 22, top + i * rowH + 23, { color: c.good, size: 16, weight: 700 });
          });
        },
      },
      {
        t: 10.4,
        title: "Summary",
        desc: "go test reports one line: how many passed, and coverage. Run it constantly — `go test -race -cover ./...` — so a regression is caught the moment it's introduced.",
        why: "A fast, table-driven suite is cheap enough to run on every save, which is what makes 'catch it immediately' realistic instead of aspirational.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          u.fillRR(ctx, w / 2 - 180, h * 0.4, 360, 40, 10, "rgba(58,210,159,.1)", c.good, 1.8);
          u.text(ctx, "ok   4/4 passed   ·   coverage 100%", w / 2, h * 0.4 + 26, { align: "center", color: c.good, size: 14, weight: 700, mono: true, alpha: a });
          u.text(ctx, "go test -race -cover ./...", w / 2, h * 0.4 + 70, { align: "center", color: c.dim, size: 12, mono: true, alpha: a });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.6, "go test · table-driven subtests"),
    });
  };

  /* =================================================================== */
  /* F4. WORKER POOL — FAN-OUT / FAN-IN                                  */
  /* =================================================================== */
  ANIM["worker-pool"] = (canvas) => {
    function jobDot(ctx, c, u, x, y, label, color, ring) {
      u.dot(ctx, x, y, 11, color, "rgba(0,173,216,.3)");
      u.text(ctx, label, x, y + 4, { align: "center", color: "#04121c", size: 10.5, weight: 800, mono: true });
      if (ring != null) { ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, 15, -1.57, -1.57 + ring * 6.28); ctx.stroke(); }
    }

    const STEPS = [
      {
        t: 0,
        title: "Six jobs wait on a buffered channel",
        desc: "Work items sit in a channel, ready to be picked up. Nothing is processing yet — this is just a queue.",
        why: "A channel decouples producing work from consuming it: the producer doesn't need to know or care how many workers exist.",
        draw(ctx, p, w, h, c, u) {
          const qx = w * 0.16, top = h * 0.26, sp = 44;
          u.text(ctx, "jobs channel", qx, top - 22, { color: c.dim, size: 12.5, weight: 600 });
          for (let i = 0; i < 6; i++) {
            const a = u.clamp((p - i * 0.1) / 0.3, 0, 1);
            if (a <= 0) continue;
            ctx.globalAlpha = a; jobDot(ctx, c, u, qx, top + i * sp, "J" + (i + 1), c.goSoft); ctx.globalAlpha = 1;
          }
        },
      },
      {
        t: 2.0,
        title: "Three workers pull from the SAME channel",
        desc: "Each worker goroutine independently calls `job := <-jobs` in a loop. The channel itself decides which worker gets which job — no coordination code needed.",
        why: "This is fan-out: identical workers competing for jobs on one channel is enough to spread work across goroutines safely.",
        draw(ctx, p, w, h, c, u) {
          const qx = w * 0.16, top = h * 0.22, sp = 44;
          for (let i = 0; i < 6; i++) jobDot(ctx, c, u, qx, top + i * sp, "J" + (i + 1), c.goSoft);
          const wx = w * 0.55, wTop = h * 0.2, wSp = 90, wW = 150, wH = 56;
          for (let k = 0; k < 3; k++) {
            u.fillRR(ctx, wx, wTop + k * wSp, wW, wH, 11, c.panel, c.line, 1.5);
            u.text(ctx, tr("worker ") + (k + 1), wx + wW / 2, wTop + k * wSp + 24, { align: "center", color: c.dim, size: 12.5, weight: 700, mono: true });
            u.text(ctx, "job := <-jobs", wx + wW / 2, wTop + k * wSp + 42, { align: "center", color: c.dim, size: 11, mono: true });
          }
          const pp = u.clamp(p / 0.8, 0, 1);
          jobDot(ctx, c, u, u.lerp(qx, wx + wW / 2, pp), u.lerp(top, wTop + wH / 2, pp), "J1", c.go);
        },
      },
      {
        t: 4.4,
        title: "Up to three jobs process at once",
        desc: "Each busy worker is running its own job concurrently — never more than 3 in flight, because there are only 3 workers.",
        why: "The number of workers is a deliberate dial: it caps concurrency so you don't overwhelm downstream resources, while still getting real parallelism.",
        draw(ctx, p, w, h, c, u) {
          const wx = w / 2 - 75, wTop = h * 0.18, wSp = 90, wW = 150, wH = 56;
          for (let k = 0; k < 3; k++) {
            const prog = u.clamp((p - k * 0.08) / 0.7, 0, 1);
            u.fillRR(ctx, wx, wTop + k * wSp, wW, wH, 11, "rgba(0,173,216,.14)", c.go, 2.2);
            u.text(ctx, tr("worker ") + (k + 1), wx + wW / 2, wTop + k * wSp + 24, { align: "center", color: c.go, size: 12.5, weight: 700, mono: true });
            u.text(ctx, "busy…", wx + wW / 2, wTop + k * wSp + 42, { align: "center", color: c.go, size: 11, mono: true });
            jobDot(ctx, c, u, wx + wW + 30, wTop + k * wSp + wH / 2, "J" + (k + 1), c.go, prog % 1);
          }
        },
      },
      {
        t: 6.6,
        title: "Fan-in: every worker sends to ONE results channel",
        desc: "When a worker finishes, it sends its result to a shared results channel — the same channel every other worker also writes to.",
        why: "The collector reading results doesn't need to know which worker produced what, or even how many workers there are — fan-in merges them for free.",
        draw(ctx, p, w, h, c, u) {
          const wx = w * 0.14, wTop = h * 0.2, wSp = 90, wW = 150, wH = 56;
          const rx = w * 0.82, rTop = h * 0.24, rSp = 40;
          for (let k = 0; k < 3; k++) {
            u.fillRR(ctx, wx, wTop + k * wSp, wW, wH, 11, c.panel, c.go, 1.6);
            u.text(ctx, tr("worker ") + (k + 1), wx + wW / 2, wTop + k * wSp + 32, { align: "center", color: c.go, size: 12.5, weight: 700, mono: true });
            const pp = u.clamp((p - k * 0.15) / 0.6, 0, 1);
            if (pp > 0 && pp < 1) jobDot(ctx, c, u, u.lerp(wx + wW, rx, pp), u.lerp(wTop + k * wSp + wH / 2, rTop + k * rSp, pp), "R" + (k + 1), c.good);
            else if (pp >= 1) jobDot(ctx, c, u, rx, rTop + k * rSp, "R" + (k + 1), c.good);
          }
          u.text(ctx, "results channel", rx, rTop - 26, { align: "center", color: c.dim, size: 12.5, weight: 600 });
        },
      },
      {
        t: 9.0,
        title: "Drained: every job ran exactly once",
        desc: "All six jobs were processed, never more than three at a time, and the results all merged onto one channel for the collector.",
        why: "No locks, no shared mutable state, no manual bookkeeping — the channel's blocking send/receive IS the synchronization.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          u.fillRR(ctx, w / 2 - 170, h * 0.36, 340, 44, 10, "rgba(58,210,159,.1)", c.good, 1.8);
          u.text(ctx, "processed: 6 / 6", w / 2, h * 0.36 + 28, { align: "center", color: c.good, size: 15, weight: 700, mono: true, alpha: a });
          u.text(ctx, "no locks · no shared mutable state", w / 2, h * 0.36 + 70, { align: "center", color: c.dim, size: 12.5, alpha: a });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 11,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 11, "concurrency · worker pool (fan-out / fan-in)"),
    });
  };

  /* =================================================================== */
  /* F5. CONTEXT CANCELLATION TREE                                       */
  /* =================================================================== */
  ANIM["error-context"] = (canvas) => {
    const nodes = {
      root: { x: .5, y: .08, d: 0, label: "ctx (root)" },
      c1: { x: .26, y: .46, d: 1, label: "WithCancel" },
      c2: { x: .74, y: .46, d: 1, label: "WithTimeout 2s" },
      g1: { x: .12, y: .86, d: 2, label: "worker" },
      g2: { x: .38, y: .86, d: 2, label: "worker" },
      g3: { x: .62, y: .86, d: 2, label: "worker" },
      g4: { x: .88, y: .86, d: 2, label: "worker" },
    };
    const edges = [["root", "c1"], ["root", "c2"], ["c1", "g1"], ["c1", "g2"], ["c2", "g3"], ["c2", "g4"]];

    function drawTree(ctx, c, u, w, h, maxDepth, cancelledFn) {
      const N = (fx) => 24 + fx * (w - 48), M = (fy) => 64 + fy * (h - 120);
      edges.forEach((e) => {
        const a = nodes[e[0]], b = nodes[e[1]];
        if (a.d > maxDepth || b.d > maxDepth) return;
        const dead = cancelledFn && cancelledFn(b);
        u.line(ctx, N(a.x), M(a.y) + 16, N(b.x), M(b.y) - 16, dead ? c.bad : c.good, dead ? 2.2 : 1.8);
      });
      Object.keys(nodes).forEach((k) => {
        const n = nodes[k];
        if (n.d > maxDepth) return;
        const dead = cancelledFn && cancelledFn(n);
        const fill = dead ? "rgba(255,107,107,.12)" : "rgba(58,210,159,.10)";
        const stroke = dead ? c.bad : c.good;
        const x = N(n.x), y = M(n.y), bw = 116, bh = 44;
        u.fillRR(ctx, x - bw / 2, y - bh / 2, bw, bh, 11, fill, stroke, dead ? 2 : 1.7);
        u.text(ctx, n.label, x, y - 2, { align: "center", color: dead ? c.bad : c.text, size: 11.5, weight: 700, mono: true });
        u.text(ctx, dead ? "ctx.Done() ✓" : "running ●", x, y + 14, { align: "center", color: dead ? c.bad : c.good, size: 10, weight: 600, mono: true });
      });
    }

    const STEPS = [
      {
        t: 0,
        title: "A request creates a root context",
        desc: "Every cancellation tree starts from one context at the top — typically derived from the incoming request.",
        why: "Having ONE source of truth for 'should this request keep going' is what makes it possible to cancel an entire call tree with a single action later.",
        draw(ctx, p, w, h, c, u) { drawTree(ctx, c, u, w, h, 0, () => false); },
      },
      {
        t: 2.0,
        title: "Children derive their own contexts",
        desc: "Each branch derives a child context — WithCancel, WithTimeout — rather than creating an unrelated one from scratch.",
        why: "Deriving (not creating fresh) is what wires the child to the parent: cancel the parent, and every derived child is automatically cancelled too.",
        draw(ctx, p, w, h, c, u) { drawTree(ctx, c, u, w, h, 1, () => false); },
      },
      {
        t: 4.0,
        title: "Goroutines attach at the leaves",
        desc: "Worker goroutines hold the leaf contexts and do real work — an HTTP call, a DB query — while watching ctx.Done() for a cancellation signal.",
        why: "This is the realistic shape of a Go service: a deep tree of derived contexts with actual work happening only at the edges.",
        draw(ctx, p, w, h, c, u) { drawTree(ctx, c, u, w, h, 2, () => false); },
      },
      {
        t: 6.0,
        title: "The deadline fires at the root",
        desc: "2 seconds elapse (or someone calls the root's cancel() function) — the root's Done() channel closes.",
        why: "Only the root needs to know WHY the request is ending (timeout, client disconnect, explicit cancel) — everything below just reacts to one signal.",
        draw(ctx, p, w, h, c, u) {
          drawTree(ctx, c, u, w, h, 2, (n) => n.d === 0);
          const f = 0.5 + 0.5 * Math.sin(p * 26);
          const N = (fx) => 24 + fx * (w - 48), M = (fy) => 64 + fy * (h - 120);
          const x = N(nodes.root.x), y = M(nodes.root.y);
          ctx.strokeStyle = "rgba(255,107,107," + f + ")"; ctx.lineWidth = 3;
          u.rr(ctx, x - 61, y - 25, 122, 50, 12); ctx.stroke();
        },
      },
      {
        t: 7.6,
        title: "Cancellation propagates down every edge",
        desc: "The signal flows from root to children to grandchildren — each derived context's Done() closes in turn, depth by depth.",
        why: "This is automatic precisely BECAUSE children were derived, not created independently — there's no manual fan-out code that has to remember every goroutine.",
        draw(ctx, p, w, h, c, u) {
          const wave = u.clamp(p, 0, 1) * 2;
          drawTree(ctx, c, u, w, h, 2, (n) => wave >= n.d);
          const N = (fx) => 24 + fx * (w - 48), M = (fy) => 64 + fy * (h - 120);
          edges.forEach((e) => {
            const a = nodes[e[0]], b = nodes[e[1]];
            const localp = u.clamp(wave - (b.d - 1), 0, 1);
            if (wave >= a.d && localp > 0 && localp < 1) u.dot(ctx, u.lerp(N(a.x), N(b.x), localp), u.lerp(M(a.y) + 16, M(b.y) - 16, localp), 5, c.bad, "rgba(255,107,107,.5)");
          });
        },
      },
      {
        t: 9.6,
        title: "Clean shutdown — no goroutine leak",
        desc: "Cancellation reached every descendant. Every worker observed ctx.Done() closing and returned.",
        why: "This is the payoff this whole module (and M7's leak detector) cares about: a goroutine that never learns its work is unwanted is a goroutine that never exits.",
        draw(ctx, p, w, h, c, u) {
          drawTree(ctx, c, u, w, h, 2, () => true);
          u.text(ctx, "✓ every goroutine returned — no leaks", w / 2, h - 16, { align: "center", color: c.good, size: 13, weight: 700, alpha: u.clamp(p / 0.3, 0, 1) });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 11.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 11.6, "context · cancellation propagates down the tree"),
    });
  };

  /* =================================================================== */
  /* M1. THE MUX TRIE & IO SANDBOX                                       */
  /* =================================================================== */
  ANIM["mux-trie"] = (canvas) => {
    const nodes = ["/", "api", "v1", "ledger", "{id}"];
    const labels = ["/", "/api", "/v1", "/ledger", "{id}"];

    function drawTrie(ctx, c, u, w, h, active, y) {
      const n = nodes.length, x0 = w * 0.08, x1 = w * 0.78, step = (x1 - x0) / (n - 1);
      for (let i = 0; i < n - 1; i++) u.line(ctx, x0 + step * i + 18, y, x0 + step * (i + 1) - 18, y, i < active ? c.go : c.line, i < active ? 2.5 : 1.5);
      for (let i = 0; i < n; i++) {
        const nx = x0 + step * i, on = i <= active, wild = nodes[i] === "{id}";
        u.fillRR(ctx, nx - 18, y - 18, 36, 36, 9, on ? (wild ? c.warn : c.go) : c.panel, on ? (wild ? c.warn : c.go) : c.line, on ? 2.2 : 1.5);
        u.text(ctx, nodes[i], nx, y + 5, { align: "center", color: on ? "#06101f" : c.dim, size: 11.5, weight: 700, mono: true });
        u.text(ctx, labels[i], nx, y + 38, { align: "center", color: on ? c.text : c.dim, size: 11, mono: true, alpha: on ? 1 : 0.5 });
      }
      return { x0, x1, step, n };
    }

    const STEPS = [
      {
        t: 0,
        title: "A request arrives",
        desc: "GET /api/v1/ledger/42 enters Go's native net/http router.",
        why: "The router's only job is mapping this one string to the right handler, fast — everything in this module is about how it does that without regular expressions.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.5, 0, 1);
          u.fillRR(ctx, w / 2 - 160, h * 0.4, 320, 40, 9, c.panel, c.go, 1.8);
          u.text(ctx, "GET /api/v1/ledger/42", w / 2, h * 0.4 + 26, { align: "center", color: c.goSoft, mono: true, size: 14, weight: 700, alpha: a });
        },
      },
      {
        t: 2.0,
        title: "The router walks a trie, segment by segment",
        desc: "ServeMux matches each path segment against the trie one node at a time — /api, then /v1, then /ledger — until it can't go any deeper.",
        why: "A trie turns routing into a fixed number of cheap segment comparisons instead of testing the path against every registered pattern in turn.",
        draw(ctx, p, w, h, c, u) {
          const active = Math.floor(u.clamp(p, 0, 1) * 3.999);
          drawTrie(ctx, c, u, w, h, active, h * 0.36);
        },
      },
      {
        t: 4.4,
        title: "{id} captures the wildcard segment",
        desc: 'The trie\'s last node is a wildcard — it matches ANY segment and captures it as "42", readable in the handler via r.PathValue("id").',
        why: "A typed wildcard node is what lets one route handle /ledger/42, /ledger/99, /ledger/anything — without falling back to slower regexp matching.",
        draw(ctx, p, w, h, c, u) {
          drawTrie(ctx, c, u, w, h, 4, h * 0.32);
          const a = u.clamp(p / 0.5, 0, 1);
          u.fillRR(ctx, w / 2 - 90, h * 0.62, 180, 50, 9, c.panel, c.warn, 1.8);
          u.text(ctx, 'id := r.PathValue("id")', w / 2, h * 0.62 + 22, { align: "center", color: c.dim, size: 11, mono: true, alpha: a });
          u.text(ctx, '→ "42"', w / 2, h * 0.62 + 40, { align: "center", color: c.warn, size: 14, mono: true, weight: 700, alpha: a });
        },
      },
      {
        t: 6.4,
        title: "Handler resolves → 200 OK",
        desc: "Once both the method (GET) and the full path match, the registered handler runs and returns a response.",
        why: "Matching method AND path together (not just path) is what lets GET /ledger/42 and DELETE /ledger/42 route to two completely different handlers.",
        draw(ctx, p, w, h, c, u) {
          drawTrie(ctx, c, u, w, h, 4, h * 0.32);
          const a = u.clamp(p / 0.4, 0, 1);
          u.badge(ctx, w / 2 - 36, h * 0.62, "200 OK", c.good, "#06101f");
        },
      },
      {
        t: 8.4,
        title: "os.Root: a directory you can't escape",
        desc: 'A handler that reads files opens them through os.Root("data") instead of the raw filesystem — every path it resolves is forced to stay inside data/.',
        why: "Path traversal (`../../etc/passwd`) is a classic vulnerability — os.Root makes 'escaping the jail' a type error, not a runtime check you might forget.",
        draw(ctx, p, w, h, c, u) {
          const jx = w * 0.2, jy = h * 0.22, jw = w * 0.6, jh = h * 0.5;
          const a = u.clamp(p / 0.5, 0, 1);
          u.text(ctx, 'os.Root("data")  ·  IO jail', jx, jy - 14, { color: c.accent, size: 13, weight: 700, mono: true, alpha: a });
          u.fillRR(ctx, jx, jy, jw, jh, 12, "rgba(206,50,98,0.06)", c.accent, 2);
          ["config.json", "ledger.db"].forEach((f, i) => {
            u.fillRR(ctx, jx + 24, jy + 28 + i * 40, jw - 48, 30, 7, c.panel, c.line, 1.3);
            u.text(ctx, "data/" + f, jx + 36, jy + 48 + i * 40, { color: c.text, size: 12, mono: true, alpha: a });
          });
        },
      },
      {
        t: 10.4,
        title: "An escape attempt is blocked",
        desc: "A read of ../../etc/passwd tries to walk OUT of data/ using relative path tricks.",
        why: "If this succeeded, any handler taking a user-supplied filename could be tricked into reading arbitrary files on the host.",
        draw(ctx, p, w, h, c, u) {
          const jx = w * 0.5, jy = h * 0.22, jw = w * 0.3, jh = h * 0.5;
          u.fillRR(ctx, jx, jy, jw, jh, 12, "rgba(206,50,98,0.06)", c.accent, 2);
          u.text(ctx, "data/", jx + 16, jy - 14, { color: c.accent, size: 13, weight: 700, mono: true });
          const bounce = p > 0.55 ? u.clamp((p - 0.55) / 0.35, 0, 1) : 0;
          const px = u.lerp(jx - 170, jx + 70, u.clamp(p / 0.55, 0, 1)) - bounce * 110;
          u.dot(ctx, px, jy + jh / 2, 7, c.bad, "rgba(255,107,107,.5)");
          u.text(ctx, "../../etc/passwd", px, jy + jh / 2 - 22, { align: "center", color: c.bad, size: 12, mono: true });
          if (p > 0.6) {
            u.line(ctx, jx, jy + 8, jx, jy + jh - 8, c.bad, 3 + Math.sin(p * 60) * 1.2);
            u.text(ctx, "✗ blocked at the boundary", jx + jw / 2, jy + jh + 28, { align: "center", color: c.bad, size: 12.5, weight: 700 });
          }
        },
      },
      {
        t: 12.4,
        title: "Legitimate reads still succeed",
        desc: 'root.Open("config.json") resolves inside the jail and works exactly like a normal file read — no extra code in the handler.',
        why: "The safety is structural: code that only ever has an *os.Root, never a raw path, cannot accidentally escape the jail — there's no boundary check to forget.",
        draw(ctx, p, w, h, c, u) {
          const jx = w * 0.5, jy = h * 0.22, jw = w * 0.3, jh = h * 0.5;
          u.fillRR(ctx, jx, jy, jw, jh, 12, "rgba(58,210,159,0.06)", c.good, 2);
          u.text(ctx, "data/", jx + 16, jy - 14, { color: c.good, size: 13, weight: 700, mono: true });
          u.fillRR(ctx, jx + 20, jy + 24, jw - 40, 28, 7, c.panel, c.line, 1.3);
          u.text(ctx, "config.json", jx + 32, jy + 43, { color: c.text, size: 11.5, mono: true });
          const px = u.lerp(jx - 170, jx + jw / 2, u.clamp(p / 0.6, 0, 1));
          u.dot(ctx, px, jy + jh / 2 + 20, 7, c.good, "rgba(58,210,159,.5)");
          u.text(ctx, 'root.Open("config.json")', px, jy + jh / 2 + 20 - 22, { align: "center", color: c.good, size: 11.5, mono: true });
          if (p > 0.65) u.text(ctx, "✓ ok", jx + jw / 2, jy + jh + 28, { align: "center", color: c.good, size: 13, weight: 700 });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 14.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 14.4, "net/http ServeMux · radix trie + os.Root IO sandbox"),
    });
  };

  /* =================================================================== */
  /* M2. SWISS TABLE vs LEGACY MAP                                       */
  /* =================================================================== */
  ANIM["swiss-table"] = (canvas) => {
    const slots = ["EUR", "GBP", "JPY", "CHF", "USD", "—"];
    const ctrl = ["h0", "h1", "USD", "h3", "h4", "h5", "—", "—"];

    const STEPS = [
      {
        t: 0,
        title: 'The same lookup: m["USD"]',
        desc: "We'll trace this one lookup through two implementations: Go's legacy map, and the new Swiss Table design.",
        why: "The map TYPE never changes in your code — only the internal layout does. Seeing both traces side by side (in time, not space) shows exactly what that internal change buys you.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.5, 0, 1);
          u.fillRR(ctx, w / 2 - 110, h * 0.4, 220, 44, 10, c.panel, c.go, 1.8);
          u.text(ctx, 'm["USD"]', w / 2, h * 0.4 + 28, { align: "center", color: c.goSoft, size: 18, weight: 700, mono: true, alpha: a });
        },
      },
      {
        t: 2.0,
        title: "Legacy map: probe slot by slot",
        desc: "The old map walks its bucket one entry at a time, comparing keys, until it finds USD or runs out of entries.",
        why: "Each entry lives at a different memory address, so each check that misses is very likely its OWN separate cache miss — the cost adds up linearly.",
        draw(ctx, p, w, h, c, u) {
          const x0 = w * 0.3, top = h * 0.14, rowH = 36;
          const probe = Math.floor(u.clamp(p, 0, 1) * slots.length);
          for (let i = 0; i < slots.length; i++) {
            const y = top + i * rowH, visited = i < probe, cur = i === probe && probe < slots.length, hit = slots[i] === "USD" && i <= probe;
            let fill = c.panel, stroke = c.line;
            if (visited && !hit) { fill = "rgba(255,107,107,0.14)"; stroke = c.bad; }
            if (cur) { fill = "rgba(245,177,76,0.16)"; stroke = c.warn; }
            if (hit) { fill = "rgba(58,210,159,0.18)"; stroke = c.good; }
            u.fillRR(ctx, x0, y, w * 0.4, 28, 7, fill, stroke, 1.6);
            u.text(ctx, slots[i], x0 + 14, y + 19, { color: c.text, size: 13, mono: true, weight: 600 });
            if (visited && !hit) u.text(ctx, "cache miss ✗", x0 + w * 0.4 - 16, y + 19, { align: "right", color: c.bad, size: 11, weight: 600 });
            if (hit) u.text(ctx, "match ✓", x0 + w * 0.4 - 16, y + 19, { align: "right", color: c.good, size: 11, weight: 700 });
          }
          const probes = Math.min(probe + 1, 5);
          u.text(ctx, tr("separate cache lines touched so far: ") + Math.min(probe, 5), x0, top + slots.length * rowH + 22, { color: c.bad, size: 13, weight: 700, mono: true });
        },
      },
      {
        t: 5.2,
        title: "Swiss Table: jump straight to one group of 8",
        desc: "The hash picks a single 8-slot group, and its 8 one-byte 'control bytes' — a tiny fingerprint per slot — all live together in ONE cache line.",
        why: "Loading 8 slots' worth of metadata costs the same one cache-line fetch as loading just one — the layout was designed around that fact.",
        draw(ctx, p, w, h, c, u) {
          const cellW = Math.min(90, (w * 0.8) / 8), sx = (w - cellW * 8) / 2, cy = h * 0.32;
          const reveal = u.clamp(p / 0.7, 0, 1);
          u.text(ctx, "control bytes — one cache line:", sx, cy - 16, { color: c.dim, size: 12.5 });
          for (let i = 0; i < 8; i++) {
            const a = u.clamp((reveal - i * 0.08) / 0.3, 0, 1);
            if (a <= 0) continue;
            const x = sx + i * cellW;
            u.fillRR(ctx, x, cy, cellW - 6, 40, 6, "rgba(0,173,216,0.16)", c.go, 1.8);
            u.text(ctx, ctrl[i], x + (cellW - 6) / 2, cy + 26, { align: "center", color: c.text, size: 12, mono: true, weight: 600, alpha: a });
          }
        },
      },
      {
        t: 7.8,
        title: "SIMD compares all 8 tags in one operation",
        desc: "Instead of checking slot 0, then slot 1, then slot 2…, one SIMD-style instruction compares the target's fingerprint against all 8 control bytes simultaneously.",
        why: "This is the structural win: legacy map cost scales with HOW MANY entries you check; Swiss Table cost is closer to constant — one fetch, one compare, almost always.",
        draw(ctx, p, w, h, c, u) {
          const cellW = Math.min(90, (w * 0.8) / 8), sx = (w - cellW * 8) / 2, cy = h * 0.28;
          for (let i = 0; i < 8; i++) {
            const isHit = ctrl[i] === "USD", x = sx + i * cellW;
            const matched = isHit && p > 0.6;
            u.fillRR(ctx, x, cy, cellW - 6, 40, 6, matched ? "rgba(58,210,159,0.22)" : "rgba(0,173,216,0.16)", matched ? c.good : c.go, 1.8);
            u.text(ctx, ctrl[i], x + (cellW - 6) / 2, cy + 26, { align: "center", color: c.text, size: 12, mono: true, weight: 600 });
          }
          const by = cy + 64;
          const sweep = u.clamp(p / 0.55, 0, 1);
          u.line(ctx, sx, by, sx + (cellW * 8 - 6) * sweep, by, c.go, 2.4);
          u.text(ctx, "↓ one instruction, all 8 lanes compared in parallel", sx, by + 24, { color: c.go, size: 12, weight: 600 });
        },
      },
      {
        t: 10.0,
        title: "Match found — one cache line touched, total",
        desc: 'USD sits in slot 2 of the group — found immediately. The whole lookup cost ONE cache-line fetch, versus up to 5 for the legacy map.',
        why: "This is why the Swiss Table redesign matters in practice: hot map lookups in a request path get measurably faster purely from this layout change — no code changes required.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.4, 0, 1);
          u.fillRR(ctx, w / 2 - 140, h * 0.3, 280, 40, 9, "rgba(58,210,159,0.16)", c.good, 1.8);
          u.text(ctx, '"USD" → match ✓', w / 2, h * 0.3 + 26, { align: "center", color: c.good, size: 14, weight: 700, mono: true, alpha: a });
          const rows = [["legacy map", "up to 5 cache lines", c.bad], ["Swiss Table", "1 cache line", c.good]];
          rows.forEach((r, i) => {
            const ra = u.clamp((p - 0.3 - i * 0.2) / 0.3, 0, 1);
            if (ra <= 0) return;
            const y = h * 0.55 + i * 50;
            u.text(ctx, r[0], w / 2 - 140, y, { color: c.text, size: 13, alpha: ra });
            u.text(ctx, r[1], w / 2 + 140, y, { align: "right", color: r[2], size: 13, weight: 700, mono: true, alpha: ra });
          });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.4, 'm["USD"] · legacy map vs Swiss Table lookup'),
    });
  };

  /* =================================================================== */
  /* M3. THE CLEANUP SEQUENCE  (runtime.AddCleanup)                      */
  /* =================================================================== */
  ANIM["cleanup-seq"] = (canvas) => {
    function scene(ctx, c, u, w, h, objAlpha, objFill, objStroke, spanAlpha) {
      const cx = w / 2, midY = h * 0.46;
      u.fillRR(ctx, w * 0.06, midY - 22, 120, 44, 9, c.panel, c.line, 1.5);
      u.text(ctx, "stack root", w * 0.06 + 60, midY + 4, { align: "center", color: c.dim, size: 11.5, weight: 600 });
      const sx = cx - 120, sy = midY - 80, sw = 240, sh = 160;
      ctx.globalAlpha = u.clamp(spanAlpha, 0.15, 1);
      u.fillRR(ctx, sx, sy, sw, sh, 12, "rgba(169,139,255,0.06)", c.purple, 1.8);
      u.text(ctx, "parent span", sx + 14, sy + 22, { color: c.purple, size: 12, weight: 700 });
      ctx.globalAlpha = 1;
      const ox = cx - 55, oy = midY - 26, ow = 110, oh = 56;
      if (objAlpha > 0.04) {
        ctx.globalAlpha = objAlpha;
        u.fillRR(ctx, ox, oy, ow, oh, 9, objFill, objStroke, 2);
        u.text(ctx, "*Conn", cx, oy + 24, { align: "center", color: objStroke, size: 14, weight: 700, mono: true });
        u.text(ctx, "fd: 7", cx, oy + 42, { align: "center", color: c.dim, size: 11.5, mono: true });
        ctx.globalAlpha = 1;
      }
      return { cx, midY, sx, sy, sw, sh, ox, oy, ow, oh };
    }

    const STEPS = [
      {
        t: 0,
        title: "The object is alive",
        desc: "A *Conn lives inside a parent span. The stack holds a reference to it, so the garbage collector considers it reachable — alive.",
        why: "Reachability from a root is the ONLY thing that keeps an object alive in Go — not how recently it was used, not its size, just 'can a root still get to it.'",
        draw(ctx, p, w, h, c, u) {
          const { cx, midY, ox } = scene(ctx, c, u, w, h, 1, "rgba(0,173,216,0.14)", c.go, 1);
          const a = u.clamp(p / 0.5, 0, 1);
          ctx.globalAlpha = a; u.arrow(ctx, w * 0.06 + 110, midY, ox - 6, midY, c.go, 2.2); ctx.globalAlpha = 1;
          u.text(ctx, "ref", w * 0.06 + 110 + (ox - w * 0.06 - 110) / 2, midY - 10, { align: "center", color: c.go, size: 11, weight: 600, alpha: a });
        },
      },
      {
        t: 2.0,
        title: "The last reference drops",
        desc: "Whatever held that reference returns or goes out of scope. The *Conn is now unreachable from any root — eligible for collection, but not yet collected.",
        why: "'Unreachable' and 'freed' are NOT the same moment in Go — there's a gap, and that gap is exactly what the next two steps are about.",
        draw(ctx, p, w, h, c, u) {
          const { midY, ox } = scene(ctx, c, u, w, h, 1, "rgba(107,124,153,0.15)", c.dim, 1);
          u.line(ctx, w * 0.06 + 110, midY, w * 0.06 + 136, midY, c.line, 1.5, [3, 4]);
          const a = u.clamp(p / 0.4, 0, 1);
          u.text(ctx, "ref dropped", w * 0.06 + 160, midY - 10, { color: c.dim, size: 11.5, alpha: a });
          if (p > 0.3) u.badge(ctx, ox + 10, midY - 56, "unreachable", c.dim, "#fff");
        },
      },
      {
        t: 4.0,
        title: "The GC's next mark pass finds it dead",
        desc: "The concurrent collector sweeps through live memory tracing from the roots. The *Conn is never reached this time — it's now PROVABLY garbage, not just assumed.",
        why: "Go won't free an object the instant it looks unused — it waits for the mark pass to confirm it, which is what makes collection safe even with concurrent mutation.",
        draw(ctx, p, w, h, c, u) {
          const { sy, sh } = scene(ctx, c, u, w, h, 1, "rgba(107,124,153,0.15)", c.dim, 1);
          const gx = u.lerp(w * 0.08, w * 0.92, u.clamp(p, 0, 1));
          const grad = ctx.createLinearGradient(gx - 60, 0, gx + 10, 0);
          grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(58,210,159,0.35)");
          ctx.fillStyle = grad; ctx.fillRect(gx - 60, sy - 30, 70, sh + 60);
          u.line(ctx, gx, sy - 30, gx, sy + sh + 30, c.good, 2.2);
          u.text(ctx, "GC mark sweep", gx, sy - 38, { align: "center", color: c.good, size: 12, weight: 700 });
        },
      },
      {
        t: 6.4,
        title: "The registered cleanup runs exactly once",
        desc: "runtime.AddCleanup fires: syscall.Close(7). It captured the file descriptor by VALUE when registered — not the object itself, so it can run safely even though *Conn is gone.",
        why: "Unlike the legacy SetFinalizer, AddCleanup never resurrects the object and never silently skips a cycle — it's a plain function call guaranteed to run once, on a dead object.",
        draw(ctx, p, w, h, c, u) {
          const { cx, midY } = scene(ctx, c, u, w, h, 1, "rgba(107,124,153,0.15)", c.dim, 1);
          const flash = 0.5 + 0.5 * Math.sin(p * 24);
          u.fillRR(ctx, cx - 110, midY + 56, 220, 32, 8, "rgba(58,210,159," + (0.12 + 0.14 * flash) + ")", c.good, 2);
          u.text(ctx, "AddCleanup ▶ syscall.Close(7)", cx, midY + 77, { align: "center", color: c.good, size: 13, weight: 700, mono: true });
        },
      },
      {
        t: 8.4,
        title: "Memory freed, no extra delay",
        desc: "The parent span is reclaimed in the SAME cycle that proved the object dead — no resurrection pass, no waiting an extra GC cycle.",
        why: "This is the practical reason AddCleanup replaced finalizers for resource cleanup: deterministic, single-cycle reclamation means file descriptors and connections don't linger.",
        draw(ctx, p, w, h, c, u) {
          const fade = 1 - u.clamp(p / 0.5, 0, 1);
          scene(ctx, c, u, w, h, fade, "rgba(107,124,153,0.15)", c.dim, Math.max(0.15, fade));
          if (p > 0.45) u.text(ctx, "✓ fd closed · parent span freed", w / 2, h * 0.46 + 80, { align: "center", color: c.good, size: 13.5, weight: 700, alpha: u.clamp((p - 0.45) / 0.3, 0, 1) });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.4, "runtime.AddCleanup · deterministic lifecycle"),
    });
  };

  /* =================================================================== */
  /* M4. THE SYNCTEST CLOCK BUBBLE                                       */
  /* =================================================================== */
  ANIM["synctest-bubble"] = (canvas) => {
    const lanes = [{ name: "G1 fetch", sleep: 0.5, color: c0 => c0.goSoft }, { name: "G2 worker", sleep: 0.8, color: c0 => c0.warn }, { name: "G3 timeout", sleep: 1.0, color: c0 => c0.purple }];

    function clocks(ctx, c, u, w, wallVal, bubbleVal) {
      u.fillRR(ctx, w - 250, 36, 100, 50, 9, c.panel, c.line, 1.4);
      u.text(ctx, "wall clock", w - 200, 54, { align: "center", color: c.dim, size: 10.5 });
      u.text(ctx, wallVal + "s", w - 200, 76, { align: "center", color: c.text, size: 15, weight: 700, mono: true });
      u.fillRR(ctx, w - 140, 36, 100, 50, 9, "rgba(0,173,216,0.10)", c.go, 1.6);
      u.text(ctx, "bubble clock", w - 90, 54, { align: "center", color: c.go, size: 10.5, weight: 600 });
      u.text(ctx, bubbleVal + "s", w - 90, 76, { align: "center", color: c.go, size: 15, weight: 700, mono: true });
    }
    function bubbleBox(ctx, c, u, w, h) {
      const bx = w * 0.06, by = h * 0.28, bw = w * 0.62, bh = h * 0.6;
      u.fillRR(ctx, bx, by, bw, bh, 16, "rgba(0,173,216,0.05)", c.go, 2);
      u.text(ctx, "synctest.Run( … )", bx + 16, by + 24, { color: c.go, size: 12, weight: 700, mono: true });
      return { bx, by, bw, bh, tlx: bx + 30, tlw: bw - 60, baseY: by + 56 };
    }

    const STEPS = [
      {
        t: 0,
        title: "Goroutines start inside an isolated bubble",
        desc: "Three goroutines run inside a synctest bubble — a sandbox with its OWN fake clock, separate from real wall-clock time.",
        why: "Isolating both the goroutines AND time itself is what will let the test fast-forward through delays instead of actually waiting for them.",
        draw(ctx, p, w, h, c, u) {
          clocks(ctx, c, u, w, "0.000", "0.000");
          const { tlx, tlw, baseY, bh } = bubbleBox(ctx, c, u, w, h);
          lanes.forEach((g, i) => {
            const a = u.clamp((p - i * 0.15) / 0.3, 0, 1);
            if (a <= 0) return;
            const ly = baseY + i * ((bh - 90) / 3) + 20;
            ctx.globalAlpha = a;
            u.text(ctx, g.name, tlx - 16, ly + 4, { color: g.color(c), size: 11.5, weight: 600, mono: true, align: "left" });
            u.line(ctx, tlx, ly, tlx + tlw, ly, c.line, 1.4);
            u.dot(ctx, tlx, ly, 5, g.color(c));
            ctx.globalAlpha = 1;
          });
        },
      },
      {
        t: 2.0,
        title: "Each one runs, then blocks",
        desc: "G1 sleeps for 0.5s, G2 for 0.8s, G3 for 1.0s (or waits on a channel) — each parks the moment it has nothing left to do.",
        why: "A real test would have to actually wait out the slowest of these — that's the time cost synctest is about to eliminate.",
        draw(ctx, p, w, h, c, u) {
          clocks(ctx, c, u, w, "0.000", "0.000");
          const { tlx, tlw, baseY, bh } = bubbleBox(ctx, c, u, w, h);
          const blockX = tlx + tlw * 0.4;
          lanes.forEach((g, i) => {
            const ly = baseY + i * ((bh - 90) / 3) + 20;
            u.text(ctx, g.name, tlx - 16, ly + 4, { color: g.color(c), size: 11.5, weight: 600, mono: true });
            u.line(ctx, tlx, ly, tlx + tlw, ly, c.line, 1.4);
            const runP = u.clamp(p / 0.7, 0, 1), dx = u.lerp(tlx, blockX, u.easeInOut(runP));
            u.line(ctx, tlx, ly, dx, ly, g.color(c), 3);
            u.dot(ctx, dx, ly, 5, g.color(c), g.color(c) + "66");
            if (runP >= 1) { u.line(ctx, blockX, ly - 10, blockX, ly + 10, c.dim, 1.3, [2, 3]); u.text(ctx, tr("⏸ blocked +") + g.sleep + (lang() === "ru" ? "с" : "s"), blockX + 8, ly - 14, { color: c.dim, size: 10 }); }
          });
        },
      },
      {
        t: 4.4,
        title: "synctest.Wait: a precise barrier",
        desc: "The test calls synctest.Wait, which blocks until EVERY goroutine in the bubble is durably parked — not 'probably done', but provably done.",
        why: "This replaces a guessed time.Sleep(100*time.Millisecond) 'hope it's enough' with an exact, race-free synchronization point.",
        draw(ctx, p, w, h, c, u) {
          clocks(ctx, c, u, w, "0.000", "0.000");
          const { tlx, tlw, baseY, bh } = bubbleBox(ctx, c, u, w, h);
          const blockX = tlx + tlw * 0.4;
          lanes.forEach((g, i) => {
            const ly = baseY + i * ((bh - 90) / 3) + 20;
            u.text(ctx, g.name, tlx - 16, ly + 4, { color: g.color(c), size: 11.5, weight: 600, mono: true });
            u.line(ctx, tlx, ly, tlx + tlw, ly, c.line, 1.4);
            u.line(ctx, tlx, ly, blockX, ly, g.color(c), 3);
            u.line(ctx, blockX, ly - 10, blockX, ly + 10, c.dim, 1.3, [2, 3]);
            u.dot(ctx, blockX, ly, 5, c.dim);
            u.text(ctx, "⏸ blocked", blockX + 8, ly - 14, { color: c.dim, size: 10 });
          });
          const a = u.clamp(p / 0.5, 0, 1);
          u.line(ctx, blockX, baseY - 4, blockX, baseY + bh - 110, c.good, 2.2, [5, 4]);
          u.text(ctx, "synctest.Wait → all parked ✓", blockX, baseY - 14, { align: "center", color: c.good, size: 12, weight: 700, alpha: a });
        },
      },
      {
        t: 6.4,
        title: "The fake clock jumps to the next timer",
        desc: "With every goroutine confirmed blocked, the bubble's clock fast-forwards directly to whenever the next timer fires — instantly, no real waiting.",
        why: "Real time and bubble time are decoupled: the test can simulate 5 real-world seconds of timers in microseconds of actual CPU time.",
        draw(ctx, p, w, h, c, u) {
          const bubbleVal = u.lerp(0, 5, u.clamp(p / 0.6, 0, 1)).toFixed(3);
          clocks(ctx, c, u, w, "0.002", bubbleVal);
          const { bx, by, bw, bh } = bubbleBox(ctx, c, u, w, h);
          const a = 0.5 + 0.5 * Math.sin(p * 26);
          u.text(ctx, "⏩ fake clock advances 5s instantly", bx + bw / 2, by + bh - 16, { align: "center", color: c.go, size: 13, weight: 700, alpha: 0.6 + 0.4 * a });
        },
      },
      {
        t: 8.0,
        title: "Goroutines wake and finish",
        desc: "Now that their timers/channels are ready, all three goroutines resume, complete their work, and the test's assertions run against a fully settled state.",
        why: "Because everything is driven by the deterministic bubble clock, there's no window where the assertions could race against a goroutine that's still finishing.",
        draw(ctx, p, w, h, c, u) {
          clocks(ctx, c, u, w, "0.002", "5.000");
          const { tlx, tlw, baseY, bh } = bubbleBox(ctx, c, u, w, h);
          const blockX = tlx + tlw * 0.4;
          lanes.forEach((g, i) => {
            const ly = baseY + i * ((bh - 90) / 3) + 20;
            u.text(ctx, g.name, tlx - 16, ly + 4, { color: g.color(c), size: 11.5, weight: 600, mono: true });
            u.line(ctx, tlx, ly, tlx + tlw, ly, c.line, 1.4);
            const dx = u.lerp(blockX, tlx + tlw, u.easeOut(u.clamp(p, 0, 1)));
            u.line(ctx, tlx, ly, dx, ly, g.color(c), 3);
            u.dot(ctx, dx, ly, 5, g.color(c), g.color(c) + "66");
          });
        },
      },
      {
        t: 9.4,
        title: "No flakes: wall ≈ 0s, bubble = 5s",
        desc: "The whole test simulated 5 seconds of timers while real wall-clock time barely moved — fully deterministic, every run, every machine.",
        why: "No time.Sleep means no 'flaky on a slow CI box' — the test's correctness no longer depends on how fast the test runner happens to be today.",
        draw(ctx, p, w, h, c, u) {
          clocks(ctx, c, u, w, "0.002", "5.000");
          const { bx, by, bw, bh } = bubbleBox(ctx, c, u, w, h);
          u.text(ctx, "✓ deterministic — no time.Sleep, no CI flake", bx + bw / 2, by + bh - 16, { align: "center", color: c.good, size: 13, weight: 700, alpha: u.clamp(p / 0.3, 0, 1) });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.8,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.8, "testing/synctest · virtual time bubble"),
    });
  };

  /* =================================================================== */
  /* M5. THE SQL TRANSACTION CYCLE  (row-level locks)                    */
  /* =================================================================== */
  ANIM["sql-txn"] = (canvas) => {
    function accounts(ctx, c, u, w, h, balA, balB, lockedA) {
      const tx = w / 2 - 130, ty = h * 0.5, tw = 260;
      u.fillRR(ctx, tx, ty, tw, 130, 12, c.panel, c.line, 1.6);
      u.text(ctx, "PostgreSQL · accounts", tx + 16, ty + 24, { color: c.goSoft, size: 12.5, weight: 700 });
      [{ id: "A", bal: balA, locked: lockedA }, { id: "B", bal: balB, locked: false }].forEach((r, i) => {
        const ry = ty + 42 + i * 42, lk = r.locked;
        u.fillRR(ctx, tx + 16, ry, tw - 32, 34, 8, lk ? "rgba(0,173,216,0.12)" : c.bg, lk ? c.go : c.line, lk ? 2 : 1.3);
        u.text(ctx, tr("acct ") + r.id, tx + 28, ry + 22, { color: c.text, size: 12.5, mono: true, weight: 600 });
        u.text(ctx, "$" + r.bal, tx + tw - 70, ry + 22, { color: c.text, size: 13.5, mono: true, weight: 700 });
        if (lk) u.text(ctx, "LOCK", tx + tw - 56, ry + 22, { color: c.go, size: 10, weight: 700 });
      });
      return { tx, ty, tw };
    }

    const STEPS = [
      {
        t: 0,
        title: "Two transfers want the same account",
        desc: "T1 and T2 are both transactions trying to move money — and both need to touch account A at the same moment.",
        why: "This exact scenario — concurrent writers, shared row — is what row-level locking exists to make safe.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.5, 0, 1);
          u.fillRR(ctx, w * 0.16, h * 0.3, 180, 46, 9, c.panel, c.go, 1.6);
          u.text(ctx, "T1  transfer", w * 0.16 + 20, h * 0.3 + 29, { color: c.go, size: 13, weight: 700, mono: true, alpha: a });
          u.fillRR(ctx, w * 0.16, h * 0.46, 180, 46, 9, c.panel, c.warn, 1.6);
          u.text(ctx, "T2  transfer", w * 0.16 + 20, h * 0.46 + 29, { color: c.warn, size: 13, weight: 700, mono: true, alpha: a });
          u.text(ctx, "both need: acct A", w * 0.16, h * 0.46 + 76, { color: c.dim, size: 12, alpha: a });
        },
      },
      {
        t: 2.0,
        title: "T1 locks account A",
        desc: "T1 runs SELECT … FOR UPDATE, which takes a lock on just that one row — not the whole table.",
        why: "Locking only the specific row means transfers touching DIFFERENT accounts can still run fully in parallel — the lock's scope is as narrow as correctness allows.",
        draw(ctx, p, w, h, c, u) {
          u.fillRR(ctx, w * 0.1, h * 0.32, 170, 44, 9, "rgba(0,173,216,0.12)", c.go, 1.6);
          u.text(ctx, "T1  transfer", w * 0.1 + 18, h * 0.32 + 28, { color: c.go, size: 12.5, weight: 700, mono: true });
          accounts(ctx, c, u, w, h, "500", "300", u.clamp(p / 0.5, 0, 1) >= 1);
          const a = u.clamp(p / 0.5, 0, 1);
          ctx.globalAlpha = a; u.arrow(ctx, w * 0.1 + 170, h * 0.32 + 22, w / 2 - 130, h * 0.5 + 50, c.go, 2.2); ctx.globalAlpha = 1;
          if (a >= 1) u.text(ctx, "SELECT … FOR UPDATE", w * 0.1, h * 0.32 + 70, { color: c.go, size: 11.5, mono: true });
        },
      },
      {
        t: 4.2,
        title: "T2 blocks behind the lock",
        desc: "T2 also needs account A, so it simply waits — Postgres won't let it read until T1's transaction finishes.",
        why: "If T2 read A mid-transfer, it could see a half-finished state (debited but not yet credited) — blocking prevents that entirely.",
        draw(ctx, p, w, h, c, u) {
          u.fillRR(ctx, w * 0.1, h * 0.32, 170, 44, 9, "rgba(245,177,76,0.14)", c.warn, 1.6);
          u.text(ctx, "T2  transfer", w * 0.1 + 18, h * 0.32 + 28, { color: c.warn, size: 12.5, weight: 700, mono: true });
          accounts(ctx, c, u, w, h, "500", "300", true);
          u.line(ctx, w * 0.1 + 170, h * 0.32 + 22, w / 2 - 130, h * 0.5 + 60, c.warn, 1.8, [4, 4]);
          if (p > 0.3) u.badge(ctx, w * 0.1, h * 0.32 + 60, "waiting on lock…", c.warn);
        },
      },
      {
        t: 6.4,
        title: "Inside the transaction: debit and credit together",
        desc: "T1 subtracts $100 from A and adds $100 to B — both statements run inside the SAME transaction, so they can never land separately.",
        why: "This is double-entry: if the process crashed between the two writes, the whole transaction rolls back — you never end up with money debited from A but never credited to B.",
        draw(ctx, p, w, h, c, u) {
          const debit = u.lerp(0, 100, u.clamp(p, 0, 1));
          accounts(ctx, c, u, w, h, (500 - debit).toFixed(0), (300 + debit).toFixed(0), true);
          const ly = h * 0.86;
          u.text(ctx, "A: −$" + debit.toFixed(0), w / 2 - 110, ly, { color: c.bad, size: 14, mono: true, weight: 700 });
          u.text(ctx, "B: +$" + debit.toFixed(0), w / 2 + 50, ly, { color: c.good, size: 14, mono: true, weight: 700 });
        },
      },
      {
        t: 8.6,
        title: "COMMIT releases the lock",
        desc: "T1 commits — its changes become permanent, and the row lock on account A is released immediately.",
        why: "The lock is held for the shortest time that's still correct: exactly as long as T1's transaction is open, no longer.",
        draw(ctx, p, w, h, c, u) {
          accounts(ctx, c, u, w, h, "400", "400", u.clamp(p / 0.4, 0, 1) < 1);
          if (p > 0.15) u.badge(ctx, w / 2 - 36, h * 0.4, "COMMIT ✓", c.good);
        },
      },
      {
        t: 10.4,
        title: "T2 proceeds — the invariant held",
        desc: "T2 now reads fresh, consistent balances and runs its own transfer. Through all of this, the total money in the system never changed.",
        why: "This is the proof the pattern works: concurrent access was serialized just enough to keep Σ(balances) constant, without serializing the WHOLE database.",
        draw(ctx, p, w, h, c, u) {
          accounts(ctx, c, u, w, h, "400", "400", false);
          const a = u.clamp(p / 0.4, 0, 1);
          u.text(ctx, "Σ = $800  ✓ invariant held", w / 2, h * 0.86, { align: "center", color: c.good, size: 14, weight: 700, mono: true, alpha: a });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.6, "pgxpool · row-level locking · double-entry"),
    });
  };

  /* =================================================================== */
  /* M6. THE CRYPTOGRAPHIC LATTICE  (hybrid ML-KEM)                      */
  /* =================================================================== */
  ANIM["pqc-lattice"] = (canvas) => {
    function channelHead(ctx, c, u, x, colW, label, color) {
      u.text(ctx, label, x, h0, { color, size: 13, weight: 700 });
      u.fillRR(ctx, x, h0 + 18, 60, 32, 8, c.panel, c.line, 1.4);
      u.text(ctx, "Alice", x + 30, h0 + 39, { align: "center", color: c.text, size: 11.5 });
      u.fillRR(ctx, x + colW - 90, h0 + 18, 60, 32, 8, c.panel, c.line, 1.4);
      u.text(ctx, "Bob", x + colW - 60, h0 + 39, { align: "center", color: c.text, size: 11.5 });
      u.line(ctx, x + 60, h0 + 34, x + colW - 90, h0 + 34, c.line, 1.5);
    }
    const h0 = 60;

    const STEPS = [
      {
        t: 0,
        title: "Two handshakes, same shape, different math",
        desc: "Channel A negotiates a classical X25519 key. Channel B negotiates a hybrid key — classical X25519 PLUS a lattice-based ML-KEM-768 key, combined.",
        why: "Both look identical at the protocol level — a normal TLS handshake. The difference that matters is invisible: what hard math problem the key relies on.",
        draw(ctx, p, w, h, c, u) {
          const colW = (w - 80) / 2;
          channelHead(ctx, c, u, 40, colW, "Channel A · Classic (X25519)", c.accent);
          channelHead(ctx, c, u, 40 + colW + 20, colW, "Channel B · Hybrid (+ML-KEM-768)", c.go);
          u.line(ctx, w / 2, h0 - 10, w / 2, h * 0.7, c.line, 1.5, [4, 6]);
          const kp = u.easeInOut(u.clamp(p / 0.7, 0, 1));
          [[40, c.accent], [40 + colW + 20, c.go]].forEach(([x, col]) => {
            u.dot(ctx, u.lerp(x + 64, x + colW - 94, kp), h0 + 34, 6, col, col + "55");
          });
        },
      },
      {
        t: 2.4,
        title: "An attacker harvests today's ciphertext",
        desc: "A passive adversary doesn't try to break the key right now — it just records both encrypted sessions and stores them.",
        why: "This is 'harvest now, decrypt later': the attack doesn't need to be feasible TODAY, only by the time a quantum computer exists.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          u.text(ctx, "harvester — recording ciphertext from both channels", w / 2, h * 0.3, { align: "center", color: c.warn, size: 13, weight: 600, alpha: a });
          for (let i = 0; i < 8; i++) {
            const ia = u.clamp((p - i * 0.08) / 0.3, 0, 1);
            if (ia <= 0) continue;
            const x = w / 2 - 8 * 27 + i * 54;
            u.fillRR(ctx, x, h * 0.42, 40, 36, 6, "rgba(245,177,76,0.18)", c.warn, 1.4);
            u.text(ctx, "ct", x + 20, h * 0.42 + 23, { align: "center", color: c.warn, size: 12, weight: 700, mono: true, alpha: ia });
          }
          u.text(ctx, "stored, waiting for a future quantum computer", w / 2, h * 0.58, { align: "center", color: c.dim, size: 12, alpha: a });
        },
      },
      {
        t: 5.0,
        title: "Years later: a quantum computer arrives",
        desc: "A cryptographically-relevant quantum computer comes online and is pointed at both stored recordings.",
        why: "This is the whole premise of post-quantum cryptography: defend data today against a computer that doesn't exist yet, because the recording already happened.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.4, 0, 1);
          u.text(ctx, "quantum computer online", w / 2, h * 0.4, { align: "center", color: c.purple, size: 16, weight: 700, alpha: a });
          u.text(ctx, "→ attacking both recorded sessions", w / 2, h * 0.4 + 30, { align: "center", color: c.dim, size: 13, alpha: a });
        },
      },
      {
        t: 7.0,
        title: "Channel A's classical key falls",
        desc: "Shor's algorithm efficiently solves the discrete-log problem that X25519's security rests on — the recorded session decrypts.",
        why: "This is exactly why 'classical-only' key exchange is a liability for any data that needs to stay secret for years: today's strong key becomes tomorrow's broken one.",
        draw(ctx, p, w, h, c, u) {
          const colW = w * 0.6, x = w / 2 - colW / 2;
          const cracked = p > 0.5;
          u.text(ctx, "X25519 classical key", x, h * 0.26, { color: c.dim, size: 12 });
          for (let i = 0; i < 30; i++) { const ang = i * 0.6, r2 = 30 + (i % 4) * 7; u.dot(ctx, x + colW * 0.3 + Math.cos(ang) * r2, h * 0.42 + Math.sin(ang) * r2 * 0.6, 2.4, cracked ? c.bad : c.accent); }
          drawLock(ctx, x + colW * 0.75, h * 0.42, cracked ? c.bad : c.warn, !cracked, u);
          u.text(ctx, cracked ? "broken by Shor's algorithm" : "still classically secure", x + colW * 0.75, h * 0.42 + 56, { align: "center", color: cracked ? c.bad : c.warn, size: 12.5, weight: 700 });
        },
      },
      {
        t: 9.0,
        title: "Channel B's hybrid key holds",
        desc: "The ML-KEM-768 lattice key has no known efficient quantum attack — so even though the ciphertext was recorded, it stays unreadable.",
        why: "Hybrid means EITHER half failing is survivable: it's only broken if BOTH the classical AND the lattice problem fall — a much higher bar than relying on one algorithm alone.",
        draw(ctx, p, w, h, c, u) {
          const colW = w * 0.6, x = w / 2 - colW / 2;
          u.text(ctx, "ML-KEM-768 lattice key", x, h * 0.26, { color: c.dim, size: 12 });
          const cols = 11, rows = 6, sp = 20, gx = x + 10, gy = h * 0.32;
          const reveal = u.clamp(p / 0.5, 0, 1);
          for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
            if ((i * rows + j) / (cols * rows) > reveal) continue;
            u.dot(ctx, gx + i * sp + (j % 2) * 6, gy + j * sp, 2.4, c.go);
          }
          drawLock(ctx, x + colW * 0.78, h * 0.42, c.good, true, u);
          u.text(ctx, "quantum-resistant — stays secret", x + colW * 0.78, h * 0.42 + 56, { align: "center", color: c.good, size: 12.5, weight: 700, alpha: u.clamp(p / 0.6, 0, 1) });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 11,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 11, "harvest-now-decrypt-later · hybrid post-quantum TLS"),
    });
  };
  function drawLock(ctx, x, y, color, shut, u) {
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath();
    if (shut) ctx.arc(x, y - 2, 9, Math.PI, 0); else ctx.arc(x + 6, y - 2, 9, Math.PI, Math.PI * 1.9);
    ctx.stroke();
    u.fillRR(ctx, x - 12, y + 4, 24, 20, 4, "rgba(0,0,0,0.25)", color, 2);
  }

  /* =================================================================== */
  /* M7. THE LEAK FORENSIC GRAPH  (goroutine leak)                       */
  /* =================================================================== */
  ANIM["leak-graph"] = (canvas) => {
    const nodes = {
      main: { x: 0, y: 76, label: "main", state: "ok" },
      g1: { x: -180, y: 166, label: "G1 producer", state: "ok" },
      g2: { x: 0, y: 166, label: "G2 dispatch", state: "missing" },
      g3: { x: 180, y: 166, label: "G3 worker", state: "ok" },
      g4: { x: 0, y: 276, label: "G4 collector", state: "blocked" },
    };
    const edges = [["main", "g1", "jobs ch"], ["main", "g3", "ctx"], ["g1", "g2", "tasks ch"], ["g3", "g4", "results ch"]];

    function drawGraph(ctx, c, u, w, opts) {
      const cx = w / 2;
      const N = (k) => ({ x: cx + nodes[k].x, y: nodes[k].y });
      edges.forEach((e) => {
        const a = N(e[0]), b = N(e[1]), isLeakEdge = e[1] === "g4" && opts.leakEdge;
        u.line(ctx, a.x, a.y + 18, b.x, b.y - 18, isLeakEdge ? c.bad : c.line, isLeakEdge ? 2.4 : 1.5, isLeakEdge ? [6, 4] : null);
        u.text(ctx, e[2], (a.x + b.x) / 2 + 8, (a.y + b.y) / 2, { color: c.dim, size: 10.5, mono: true });
      });
      Object.keys(nodes).forEach((k) => {
        const nd = nodes[k], pos = N(k);
        let stroke = c.line, fill = c.panel, fg = c.text;
        if (nd.state === "blocked" && opts.blocked) { stroke = c.bad; fill = "rgba(255,107,107,0.14)"; fg = c.bad; }
        if (nd.state === "missing" && opts.rootFound) { stroke = c.accent; fill = "rgba(206,50,98,0.14)"; }
        if (nd.state === "blocked" && opts.blocked) {
          const pr = 26 + 6 * (0.5 + 0.5 * Math.sin(opts.pulseT * 6));
          ctx.strokeStyle = "rgba(255,107,107,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pos.x, pos.y, pr, 0, 7); ctx.stroke();
        }
        u.fillRR(ctx, pos.x - 56, pos.y - 18, 112, 36, 10, fill, stroke, 1.8);
        u.text(ctx, nd.label, pos.x, pos.y + 4, { align: "center", color: fg, size: 11.5, weight: 600, mono: true });
      });
      return N;
    }

    const STEPS = [
      {
        t: 0,
        title: "A live goroutine graph",
        desc: "Goroutines are nodes; the channels and contexts connecting them are the edges. This is the shape the leak analyzer reasons about.",
        why: "Most goroutine leaks aren't a mystery once you can SEE the dependency graph — they're usually one missing edge.",
        draw(ctx, p, w, h, c, u) { drawGraph(ctx, c, u, w, { leakEdge: false, blocked: false, rootFound: false, pulseT: 0 }); },
      },
      {
        t: 2.4,
        title: "G4 is stuck forever",
        desc: "G4 is parked on <-results — and tracing the graph, NOTHING will ever send on that channel. It will wait until the process dies.",
        why: "A blocked goroutine isn't automatically a leak — other goroutines block briefly all the time. It's a leak specifically because nothing can ever wake it.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { leakEdge: true, blocked: true, rootFound: false, pulseT: p * 10 });
          u.badge(ctx, w / 2 - 70, 276 + 26, "⏸ blocked on <-results", c.bad, "#fff");
        },
      },
      {
        t: 4.6,
        title: "The analyzer traces backward",
        desc: "Starting from the blocked goroutine, the analyzer walks the channel graph backward — G4 ← G3 — hunting for whoever was supposed to send.",
        why: "Walking the graph backward from the symptom is exactly how you'd debug this by hand — the analyzer just does it instantly and exhaustively.",
        draw(ctx, p, w, h, c, u) {
          const N = drawGraph(ctx, c, u, w, { leakEdge: true, blocked: true, rootFound: false, pulseT: p * 10 });
          const seg1 = u.clamp(p * 1.6, 0, 1), a = N("g4"), b = N("g3");
          u.dot(ctx, u.lerp(a.x, b.x, seg1), u.lerp(a.y - 18, b.y + 18, seg1), 6, c.warn, "rgba(245,177,76,.6)");
        },
      },
      {
        t: 6.8,
        title: "Root cause found",
        desc: "G2 dispatch is the actual problem: it never sends on results, and its context had no deadline to force it to give up and move on.",
        why: "Localizing to ONE goroutine and ONE missing send turns 'the program hangs sometimes' into a fix you can make in one line.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { leakEdge: true, blocked: true, rootFound: true, pulseT: p * 10 });
          const a = u.clamp(p / 0.3, 0, 1);
          u.fillRR(ctx, w * 0.1, h * 0.78, w * 0.8, 70, 12, "rgba(206,50,98,0.08)", c.accent, 1.8);
          u.text(ctx, "ROOT CAUSE", w * 0.1 + 18, h * 0.78 + 22, { color: c.accent, size: 12, weight: 800, alpha: a });
          u.text(ctx, "G2 dispatch never sends on results ch — context had no deadline.", w * 0.1 + 18, h * 0.78 + 42, { color: c.text, size: 12.5, alpha: a });
          u.text(ctx, "fix: ctx, cancel := context.WithTimeout(...) ; defer cancel()", w * 0.1 + 18, h * 0.78 + 60, { color: c.good, size: 11.5, mono: true, alpha: a });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 9.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 9.4, "runtime/pprof · goroutine-leak analyzer"),
    });
  };

  /* =================================================================== */
  /* M8. SIMD vs GREEN TEA GC                                            */
  /* =================================================================== */
  ANIM["simd-gc"] = (canvas) => {
    function cellRow(ctx, c, u, w, y, n, done, color) {
      const cell = (w - 80) / n, gx = 40;
      for (let i = 0; i < n; i++) {
        const x = gx + i * cell, on = i < done;
        u.fillRR(ctx, x, y, cell - 3, 28, 5, on ? color + "55" : c.panel, on ? color : c.line, 1.3);
      }
      return { gx, cell };
    }

    const STEPS = [
      {
        t: 0,
        title: "Same work, two engines",
        desc: "We'll process the same 32-element array two ways: a plain scalar loop, one element at a time, and a SIMD vector loop.",
        why: "Comparing them on identical work isolates exactly what the vector hardware buys you — nothing about the task itself changes.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.5, 0, 1);
          u.text(ctx, "scalar loop", w / 2, h * 0.4, { align: "center", color: c.warn, size: 16, weight: 700, alpha: a });
          u.text(ctx, "vs", w / 2, h * 0.4 + 30, { align: "center", color: c.dim, size: 13, alpha: a });
          u.text(ctx, "SIMD vector loop", w / 2, h * 0.4 + 60, { align: "center", color: c.go, size: 16, weight: 700, alpha: a });
        },
      },
      {
        t: 2.0,
        title: "Scalar: one element per cycle",
        desc: "The plain loop touches a single array element each iteration — the pointer crawls along one cell at a time.",
        why: "This is the baseline: N elements means N cycles of work, no matter how simple each individual step is.",
        draw(ctx, p, w, h, c, u) {
          const N = 32, done = Math.floor(u.clamp(p, 0, 1) * N);
          u.text(ctx, "scalar — 1 element / cycle", 40, h * 0.3, { color: c.warn, size: 13, weight: 600 });
          const { gx, cell } = cellRow(ctx, c, u, w, h * 0.36, N, done, c.warn);
          if (done < N) { const px = gx + done * cell; u.line(ctx, px, h * 0.32, px, h * 0.36 + 32, c.warn, 2.2); }
          u.text(ctx, tr("cycles: ") + done, w - 40, h * 0.3, { align: "right", color: c.warn, size: 12.5, mono: true, weight: 700 });
        },
      },
      {
        t: 4.4,
        title: "SIMD: sixteen elements per cycle",
        desc: "One vector instruction loads and processes a whole 16-element lane at once — the same array, far fewer trips through the loop.",
        why: "The CPU has dedicated wide registers and circuits for this — it's not 'doing 16 things fast', it's doing them in the SAME instruction.",
        draw(ctx, p, w, h, c, u) {
          const N = 32, done = Math.floor(u.clamp(p, 0, 1) * N);
          u.text(ctx, "SIMD — 16 elements / cycle", 40, h * 0.3, { color: c.go, size: 13, weight: 700 });
          cellRow(ctx, c, u, w, h * 0.36, N, done, c.go);
          if (p < 0.55) {
            const cell = (w - 80) / N;
            for (let l = 0; l < 2; l++) { const lx = 40 + l * 16 * cell; u.fillRR(ctx, lx, h * 0.36 - 4, 16 * cell - 3, 36, 6, "rgba(0,173,216,0.12)", c.go, 1.5); }
            u.text(ctx, "↓ each lane loads + processes 16 elements together", 40, h * 0.36 + 56, { color: c.go, size: 11.5 });
          }
          u.text(ctx, tr("cycles: ") + Math.max(1, Math.ceil(done / 16)), w - 40, h * 0.3, { align: "right", color: c.go, size: 12.5, mono: true, weight: 700 });
        },
      },
      {
        t: 6.8,
        title: "Same result, ~16× fewer cycles",
        desc: "Both loops produce the identical output — only the number of cycles spent getting there differs.",
        why: "This is why hot numeric loops (hashing, checksums, image/byte processing) are worth vectorizing: the speedup is structural, not a micro-optimization.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          const rows = [["scalar loop", "32 cycles", c.warn], ["SIMD loop", "2 cycles", c.go]];
          rows.forEach((r, i) => {
            const ra = u.clamp((p - i * 0.2) / 0.3, 0, 1);
            if (ra <= 0) return;
            const y = h * 0.36 + i * 56;
            u.fillRR(ctx, w * 0.2, y, w * 0.6, 42, 9, c.panel, r[2], 1.6);
            u.text(ctx, r[0], w * 0.2 + 18, y + 27, { color: c.text, size: 13, alpha: ra });
            u.text(ctx, r[1], w * 0.8 - 18, y + 27, { align: "right", color: r[2], size: 14, weight: 700, mono: true, alpha: ra });
          });
        },
      },
      {
        t: 9.2,
        title: "Green Tea GC sweeps contiguous spans",
        desc: "Switching topics: the new collector marks memory in contiguous 8 KiB spans in parallel, instead of chasing one scattered object at a time.",
        why: "Spans are physically contiguous in memory — exactly the layout that lets a sweep be both vectorizable AND cache-friendly, the same idea as the SIMD loop above.",
        draw(ctx, p, w, h, c, u) {
          const cols = 16, rows = 4, sp = (w - 80) / cols, sw = sp - 5, gx = 40, gy = h * 0.32;
          const swept = Math.floor(u.clamp(p, 0, 1) * cols * rows);
          for (let r = 0; r < rows; r++) for (let cI = 0; cI < cols; cI++) {
            const idx = r * cols + cI, x = gx + cI * sp, y = gy + r * (sw + 5), done = idx < swept, front = idx === swept - 1;
            u.fillRR(ctx, x, y, sw, sw, 4, done ? "rgba(58,210,159,0.45)" : c.panel, front ? "#fff" : done ? c.good : c.line, front ? 2 : 1);
          }
          u.text(ctx, "parallel span sweep →", gx, gy + rows * (sw + 5) + 22, { color: c.good, size: 12.5, weight: 600 });
        },
      },
      {
        t: 11.4,
        title: "Cache-friendly and scales with cores",
        desc: "Sequential span scanning avoids the scattered cache misses of object-by-object marking, and multiple cores can sweep different spans in parallel.",
        why: "This connects directly back to M10: contiguous memory is what makes both a SIMD loop AND a GC sweep fast — the hardware always rewards sequential access.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.4, 0, 1);
          u.text(ctx, "✓ contiguous spans → cache-friendly, parallel sweep", w / 2, h * 0.42, { align: "center", color: c.good, size: 14, weight: 700, alpha: a });
          u.text(ctx, "vs scattered object-by-object marking in the legacy GC", w / 2, h * 0.42 + 32, { align: "center", color: c.dim, size: 12.5, alpha: a });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 13.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 13.4, "simd/archsimd · Green Tea GC"),
    });
  };

  /* =================================================================== */
  /* M9. THE CONTAINER ROLLOUT                                           */
  /* =================================================================== */
  ANIM["container-rollout"] = (canvas) => {
    const colors = (c) => ({ ready: c.good, starting: c.warn, draining: c.accent, empty: c.line });
    function lb(ctx, c, u, w) {
      const lbx = w / 2 - 70, lby = h0;
      u.fillRR(ctx, lbx, lby, 140, 38, 10, "rgba(0,173,216,0.12)", c.go, 1.8);
      u.text(ctx, "load balancer", lbx + 70, lby + 24, { align: "center", color: c.go, size: 12.5, weight: 700 });
      return { lbx, lby };
    }
    const h0 = 56;
    function pods(ctx, c, u, w, states, traffic, animT) {
      const { lbx, lby } = lb(ctx, c, u, w);
      const slotY = h0 + 130, podW = Math.min(120, (w - 80) / 4 - 14), gap = (w - 80 - podW * states.length) / Math.max(1, states.length - 1);
      const col = colors(c);
      states.forEach((st, i) => {
        const x = 40 + i * (podW + gap), pc = col[st.status] || c.line, isReady = st.status === "ready";
        if (st.status === "empty") { u.fillRR(ctx, x, slotY, podW, 64, 12, "transparent", c.line, 1.2); u.text(ctx, "—", x + podW / 2, slotY + 38, { align: "center", color: c.dim, size: 16 }); }
        else {
          u.fillRR(ctx, x, slotY, podW, 64, 12, "rgba(255,255,255,0.02)", pc, isReady ? 2.2 : 1.6);
          u.text(ctx, tr("pod ") + st.ver, x + podW / 2, slotY + 26, { align: "center", color: c.text, size: 13, weight: 700, mono: true });
          const pillTxt = st.status === "ready" ? "● Ready" : st.status === "starting" ? "◌ Starting" : "◍ Draining";
          u.text(ctx, pillTxt, x + podW / 2, slotY + 46, { align: "center", color: pc, size: 11, weight: 600 });
        }
        if (traffic) {
          const fromX = lbx + 70, fromY = lby + 38, toX = x + podW / 2, toY = slotY;
          if (isReady) {
            u.line(ctx, fromX, fromY, toX, toY, "rgba(58,210,159,0.25)", 1.4);
            for (let d = 0; d < 3; d++) { const phase = (animT * 0.6 + d / 3 + i * 0.13) % 1; u.dot(ctx, u.lerp(fromX, toX, phase), u.lerp(fromY, toY, phase), 3, c.good); }
          } else if (st.status !== "empty") u.line(ctx, fromX, fromY, toX, toY, c.line, 1, [3, 4]);
        }
      });
    }

    const STEPS = [
      {
        t: 0,
        title: "Three healthy v1 pods serve traffic",
        desc: "The load balancer spreads incoming requests across every Ready pod. This is the steady state before a rollout begins.",
        why: "A rollout always starts from a known-good baseline — that's what makes it safe to compare against as the upgrade proceeds.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }], true, p * 10);
        },
      },
      {
        t: 2.4,
        title: "A new v2 pod starts — but gets no traffic yet",
        desc: "A 4th pod boots running v2. Its readiness probe hasn't passed, so the load balancer deliberately routes it nothing.",
        why: "Sending live traffic to a pod that isn't ready (still loading config, warming caches) would mean real users hitting errors.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "starting" }], true, p * 10);
          const blink = Math.sin(p * 16) > 0;
          u.text(ctx, blink ? "probe ✗" : "probe …", w - 90, h0 + 130 + 80, { align: "center", color: c.warn, size: 11, mono: true });
        },
      },
      {
        t: 4.6,
        title: "Readiness probe passes → pod joins rotation",
        desc: "Once the probe succeeds, the load balancer adds the v2 pod to rotation immediately — it starts receiving its share of traffic.",
        why: "This is the gate that makes rollouts safe: 'started' and 'ready to serve' are different states, and only the second one earns traffic.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
          if (p > 0.3) u.text(ctx, "probe ✓", w - 90, h0 + 130 + 80, { align: "center", color: c.good, size: 11, mono: true, weight: 600 });
        },
      },
      {
        t: 6.6,
        title: "An old v1 pod drains",
        desc: "Now that v2 is carrying load, one v1 pod stops receiving NEW requests but keeps running until its in-flight requests finish.",
        why: "Draining (not killing) is what guarantees zero dropped requests — a request that's already in progress always gets to complete.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "draining" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
          u.text(ctx, "finishing in-flight requests…", 40 + 60, h0 + 130 + 80, { align: "center", color: c.accent, size: 11, mono: true });
        },
      },
      {
        t: 8.6,
        title: "The slot comes back as v2",
        desc: "Once drained, the old pod terminates and a fresh v2 pod boots in its place — going through the same starting → ready sequence.",
        why: "Replacing pods ONE AT A TIME (not all at once) means the fleet never drops below enough healthy capacity to serve current load.",
        draw(ctx, p, w, h, c, u) {
          const startingDone = p > 0.5;
          pods(ctx, c, u, w, [{ ver: "v2", status: startingDone ? "ready" : "starting" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
        },
      },
      {
        t: 10.6,
        title: "Repeat until the whole fleet is upgraded",
        desc: "The same start → probe → join → drain → replace cycle repeats pod by pod until every pod runs v2.",
        why: "Zero dropped requests, throughout an entire version upgrade, with no maintenance window — that's the payoff of doing it incrementally.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v2", status: "ready" }, { ver: "v2", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
          const pct = Math.round(u.clamp(p / 0.6, 0, 1) * 100);
          u.text(ctx, tr("rollout ") + Math.min(100, 75 + pct / 4) + "%", w - 60, h0 + 130 + 100, { align: "right", color: c.go, size: 13, weight: 700, mono: true });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.6, "Kubernetes · rolling update · readiness probes"),
    });
  };

  /* =================================================================== */
  /* M10. THE CACHE HIERARCHY & A LINE FILL                              */
  /* =================================================================== */
  ANIM["cache-hierarchy"] = (canvas) => {
    const levels = [
      { name: "L1", lat: "~1 ns", wf: 0.22 },
      { name: "L2", lat: "~4 ns", wf: 0.40 },
      { name: "L3", lat: "~10–40 ns", wf: 0.62 },
      { name: "RAM", lat: "~100 ns", wf: 0.94 },
    ];
    const top = 96, rowH = 46, gap = 16, leftX = 50, maxW0 = (w) => w - 230;
    const rowY = (i) => top + i * (rowH + gap);

    function drawLevels(ctx, c, u, w, lit) {
      const maxW = maxW0(w);
      levels.forEach((lv, i) => {
        const y = rowY(i), bw = maxW * lv.wf;
        const on = lit && lit[i];
        u.fillRR(ctx, leftX, y, bw, rowH, 10, on ? "rgba(58,210,159,0.14)" : c.panel, on ? c.good : c.line, on ? 2 : 1.4);
        u.text(ctx, lv.name, leftX + 16, y + rowH / 2 + 5, { color: c.text, size: 14, weight: 700, mono: true });
        u.text(ctx, lv.lat, leftX + bw - 14, y + rowH / 2 + 5, { align: "right", color: c.dim, size: 12, mono: true });
      });
    }

    const STEPS = [
      {
        t: 0,
        title: "Small & fast, down to big & slow",
        desc: "Memory is a pyramid: L1 is tiny but ~1 ns, RAM is huge but ~100 ns. Each step down is roughly 10× bigger and 10× slower.",
        why: "On-chip caches are small because fast memory is expensive to build — so the CPU keeps only the hottest data there and falls back to slower, bigger memory for the rest.",
        draw(ctx, p, w, h, c, u) {
          const maxW = maxW0(w);
          const shown = Math.min(levels.length, Math.ceil(p * levels.length + 0.001));
          for (let i = 0; i < shown; i++) {
            const grow = u.clamp((p - i * 0.2) / 0.35, 0, 1);
            const y = rowY(i), bw = Math.max(10, maxW * levels[i].wf * u.easeOut(grow));
            u.fillRR(ctx, leftX, y, bw, rowH, 10, c.panel, c.line, 1.4);
            if (grow > 0.5) {
              u.text(ctx, levels[i].name, leftX + 16, y + rowH / 2 + 5, { color: c.text, size: 14, weight: 700, mono: true, alpha: grow });
              u.text(ctx, levels[i].lat, leftX + bw - 14, y + rowH / 2 + 5, { align: "right", color: c.dim, size: 12, mono: true, alpha: grow });
            }
          }
          u.text(ctx, "↓ bigger and slower", leftX, rowY(levels.length - 1) + rowH + 28, { color: c.dim, size: 12 });
        },
      },
      {
        t: 2.6,
        title: "A miss escalates one level at a time",
        desc: "The CPU asks L1 first. Not there? Ask L2. Not there? Ask L3. Each 'no' costs a little more time before moving down.",
        why: "Each cache only stores a recent subset of memory — checking the small, fast one first is cheap insurance before paying for a slower lookup.",
        draw(ctx, p, w, h, c, u) {
          drawLevels(ctx, c, u, w, null);
          const wins = [[0, 0.30], [0.36, 0.62], [0.68, 0.94]];
          let dotRow = 0, checking = true;
          for (let i = 0; i < 3; i++) {
            if (p >= wins[i][0]) { dotRow = i; checking = p < wins[i][1]; }
            if (i < 2 && p >= wins[i][1]) { dotRow = i + (p < wins[i + 1][0] ? 0.999 : 0); }
          }
          // smooth descent between windows
          let dotY = rowY(0);
          if (p < wins[0][1]) dotY = rowY(0);
          else if (p < wins[1][0]) dotY = u.lerp(rowY(0), rowY(1), u.seg(p, wins[0][1], wins[1][0]));
          else if (p < wins[1][1]) dotY = rowY(1);
          else if (p < wins[2][0]) dotY = u.lerp(rowY(1), rowY(2), u.seg(p, wins[1][1], wins[2][0]));
          else dotY = rowY(2);
          const maxW = maxW0(w), dotX = leftX + 26;
          u.dot(ctx, dotX, dotY, 7, c.accent, "rgba(206,50,98,0.4)");
          [0, 1, 2].forEach((i) => {
            if (p >= wins[i][0]) {
              const mid = wins[i][0] + (wins[i][1] - wins[i][0]) * 0.5;
              const label = p < mid ? "checking…" : "MISS";
              u.badge(ctx, leftX + maxW * levels[i].wf + 16, rowY(i) + rowH / 2 - 10, label, p < mid ? c.panel : c.bad, p < mid ? c.dim : "#fff");
            }
          });
          if (p >= 0.94) u.text(ctx, "→ not in any on-chip cache. Falling through to RAM.", leftX, rowY(3) - 14, { color: c.bad, size: 12, weight: 600 });
        },
      },
      {
        t: 5.0,
        title: "RAM answers with a whole 64-byte line",
        desc: "RAM never hands back a single value — it returns the full 64-byte block containing it, and that block fills L3, then L2, then L1 on the way back up.",
        why: "Fetching one extra value is almost free once the bus is already moving data, so hardware always moves in line-sized chunks — betting that nearby bytes will be used soon too.",
        draw(ctx, p, w, h, c, u) {
          const ascendP = u.seg(p, 0.05, 0.85, u.easeInOut);
          const filled = [ascendP >= 1, ascendP >= 2 / 3, ascendP >= 1 / 3];
          drawLevels(ctx, c, u, w, filled);
          const dotY = u.lerp(rowY(3), rowY(0), ascendP);
          u.dot(ctx, leftX + 26, dotY, 7, c.good, "rgba(58,210,159,0.4)");
          u.badge(ctx, leftX + maxW0(w) * 0.94 + 16, rowY(3) + rowH / 2 - 10, "HIT ✓", c.good, "#06101f");
          u.text(ctx, "↑ the 64-byte line travels back up, filling each cache as it passes", leftX, rowY(0) - 18, { color: c.good, size: 12, weight: 600, alpha: u.clamp(ascendP * 2, 0, 1) });
        },
      },
      {
        t: 7.6,
        title: "The next 7 reads are now nearly free",
        desc: "Those values were strangers a moment ago; now they live in L1 with the one we asked for. Reading them costs ~1 ns each instead of ~100 ns.",
        why: "This is why sequential, contiguous access (slices) is so much faster than scattered access (linked lists, pointer-chasing) — it cashes in on a line you already paid to fetch.",
        draw(ctx, p, w, h, c, u) {
          const fx = leftX, fy = h * 0.32;
          u.text(ctx, "the 64-byte line, now resident in L1:", fx, fy, { color: c.text, size: 13.5, weight: 600 });
          const cells = 8, cw = Math.min(64, (w - fx * 2 - 7 * 10) / cells), ch2 = 46;
          const filledN = Math.floor(u.clamp(p / 0.7, 0, 1) * cells);
          for (let i = 0; i < cells; i++) {
            const x = fx + i * (cw + 10), y = fy + 22, on = i < filledN, isFirst = i === 0;
            u.fillRR(ctx, x, y, cw, ch2, 7, on ? (isFirst ? "rgba(206,50,98,0.30)" : "rgba(0,173,216,0.30)") : c.panel, on ? (isFirst ? c.accent : c.go) : c.line, 1.6);
            if (on) u.text(ctx, isFirst ? "asked" : "free", x + cw / 2, y + ch2 / 2 + 4, { align: "center", color: c.text, size: 10.5, weight: 600 });
          }
          if (filledN >= cells) {
            const by = fy + 22 + ch2 + 50;
            u.text(ctx, "latency per read:", fx, by, { color: c.dim, size: 12 });
            const barY = by + 14, barMaxW = w - fx - 80;
            u.fillRR(ctx, fx, barY, barMaxW, 22, 5, "rgba(206,50,98,0.25)", c.accent, 1.4);
            u.text(ctx, "1st read · ~100 ns (RAM)", fx + 10, barY + 15, { color: c.text, size: 11.5, mono: true });
            u.fillRR(ctx, fx, barY + 34, Math.max(6, barMaxW * 0.01), 22, 5, "rgba(0,173,216,0.35)", c.go, 1.4);
            u.text(ctx, "next 7 · ~1 ns each (L1) — ~100× faster", fx + Math.max(6, barMaxW * 0.01) + 10, barY + 34 + 15, { color: c.go, size: 11.5, weight: 600, mono: true });
          }
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10, "memory hierarchy · why the next read is suddenly free"),
    });
  };

  /* =================================================================== */
  /* M11. THE PIPELINE & A BRANCH MISPREDICTION                          */
  /* =================================================================== */
  ANIM["cpu-pipeline"] = (canvas) => {
    const stageNames = ["Fetch", "Decode", "Execute", "Memory", "Write-back"];
    const x0 = 50, trackTop = 120, slotH = 50, gap = 10;
    function slotW(w) { return Math.min(120, (w - x0 - 40 - 4 * gap) / 5); }
    function drawTrack(ctx, c, u, w, y0) {
      const sw = slotW(w);
      for (let s = 0; s < 5; s++) {
        const x = x0 + s * (sw + gap);
        u.fillRR(ctx, x, y0, sw, slotH, 8, c.panel, c.line, 1.4);
        u.text(ctx, stageNames[s], x + sw / 2, y0 + slotH + 20, { align: "center", color: c.dim, size: 11.5 });
      }
      return sw;
    }
    function chip(ctx, c, u, w, y0, pos, label, fill, stroke, fg, alpha) {
      const sw = slotW(w), cp = Math.max(-0.3, Math.min(5.3, pos));
      const x = x0 + cp * (sw + gap);
      u.fillRR(ctx, x, y0, sw, slotH, 8, fill, stroke, 2);
      u.text(ctx, label, x + sw / 2, y0 + slotH / 2 + 5, { align: "center", color: fg || "#06101f", size: 12.5, weight: 700, mono: true, alpha: alpha == null ? 1 : alpha });
    }

    const STEPS = [
      {
        t: 0,
        title: "One instruction, five stages",
        desc: "Every instruction passes through 5 fixed stations: Fetch the instruction, Decode it, Execute it, access Memory, Write the result back.",
        why: "Splitting the work into small fixed stages is what lets the next instruction start before this one finishes — that's the whole trick of pipelining.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          const pos = u.clamp(p, 0, 1) * 4.6;
          chip(ctx, c, u, w, trackTop, pos, "I1", "rgba(0,173,216,0.35)", c.go, c.text);
          const stage = Math.min(4, Math.floor(pos + 0.001));
          u.text(ctx, tr("currently in: ") + tr(stageNames[stage]), x0, trackTop - 26, { color: c.go, size: 13, weight: 600 });
        },
      },
      {
        t: 2.2,
        title: "The next instruction starts one cycle later",
        desc: "While I1 moves to Decode, I2 enters Fetch right behind it — they're in different stages of the SAME pipe at the same time.",
        why: "If the core waited for I1 to fully finish before starting I2, four of the five stages would sit idle the whole time. Overlap keeps every stage busy.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          const base = u.clamp(p, 0, 1) * 5.4;
          chip(ctx, c, u, w, trackTop, base, "I1", "rgba(0,173,216,0.35)", c.go, c.text);
          if (base > 1) chip(ctx, c, u, w, trackTop, base - 1, "I2", "rgba(169,139,255,0.35)", c.purple, c.text);
        },
      },
      {
        t: 4.6,
        title: "Steady state: ~1 instruction retires per cycle",
        desc: "Once the pipe is full, a NEW instruction finishes Write-back almost every cycle — even though any single one still takes 5 cycles start to finish.",
        why: "This is the payoff: pipelining doesn't make one instruction faster, it overlaps many so the average THROUGHPUT approaches one per cycle.",
        draw(ctx, p, w, h, c, u) {
          const sw = drawTrack(ctx, c, u, w, trackTop);
          const labels = ["I1", "I2", "I3", "I4"];
          let retiring = false;
          for (let i = 0; i < 4; i++) {
            const pos = u.clamp(p, 0, 1) * 8 - i * 1.4;
            if (pos < -0.3 || pos > 5.3) continue;
            chip(ctx, c, u, w, trackTop, pos, labels[i], "rgba(0,173,216,0.30)", c.go, c.text);
            if (pos >= 4 && pos < 4.6) retiring = true;
          }
          u.text(ctx, retiring ? "✓ retiring this cycle" : "pipe full — overlapping instructions", x0, trackTop - 26, { color: retiring ? c.good : c.dim, size: 13, weight: 600 });
        },
      },
      {
        t: 7.2,
        title: "A branch enters the pipe",
        desc: "I5 is a conditional branch (an `if`). Its true outcome — which way execution should go next — isn't known until it reaches Execute.",
        why: "But Fetch can't just sit idle waiting 2 stages for that answer — every idle stage is wasted throughput.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          const pos = u.clamp(p, 0, 1) * 2.0;
          chip(ctx, c, u, w, trackTop, pos, "I5?", "rgba(245,177,76,0.30)", c.warn, c.text);
          if (pos > 1.3) u.text(ctx, "outcome unknown until Execute", x0, trackTop - 26, { color: c.warn, size: 13, weight: 600 });
        },
      },
      {
        t: 9.0,
        title: "Speculate: guess, and keep going",
        desc: "A branch predictor guesses the outcome (e.g. 'taken', based on history) and the pipeline fetches the NEXT instructions down that guessed path — before the branch is actually resolved.",
        why: "A good predictor is right >95% of the time on real code, so guessing and running ahead wins far more cycles than it costs when wrong.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          chip(ctx, c, u, w, trackTop, 2, "I5?", "rgba(245,177,76,0.30)", c.warn, c.text);
          const pos = u.clamp(p, 0, 1) * 1.6;
          if (pos > 0.1) chip(ctx, c, u, w, trackTop, pos - 0.4, "I6", "rgba(245,177,76,0.18)", c.warn, c.warn);
          if (pos > 1.0) chip(ctx, c, u, w, trackTop, pos - 1.5, "I7", "rgba(245,177,76,0.18)", c.warn, c.warn);
          u.text(ctx, "predictor guesses: “taken” → speculatively fetching I6, I7", x0, trackTop - 26, { color: c.warn, size: 13, weight: 600 });
        },
      },
      {
        t: 11.0,
        title: "Misprediction: the guess was wrong",
        desc: "I5 resolves in Execute — and it went the OTHER way. Everything fetched on the guessed path (I6, I7) was working on instructions that should never have run.",
        why: "Correctness comes first: the CPU cannot let wrong-path work touch real registers or memory, so it must be found and discarded immediately.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          chip(ctx, c, u, w, trackTop, 2, "I5 ✗", "rgba(255,107,107,0.30)", c.bad, c.bad);
          const fade = 1 - u.clamp(p, 0, 1) * 0.85;
          chip(ctx, c, u, w, trackTop, 1.6, "I6", "rgba(255,107,107,0.22)", c.bad, c.bad, fade);
          chip(ctx, c, u, w, trackTop, 1.0, "I7", "rgba(255,107,107,0.22)", c.bad, c.bad, fade);
          u.text(ctx, "wrong guess → I6, I7 must be discarded", x0, trackTop - 26, { color: c.bad, size: 13, weight: 600 });
        },
      },
      {
        t: 12.8,
        title: "Flush, refetch, and refill",
        desc: "The wrong-path instructions are flushed out, Fetch restarts at the CORRECT target address, and the pipeline gradually fills back up — a short bubble of idle stages, then back to full speed.",
        why: "The cost of a misprediction is only this refill delay (~15–20 cycles on real hardware) — far cheaper than stalling on every single branch and never speculating at all.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          const pos = u.clamp(p, 0, 1) * 4.8;
          chip(ctx, c, u, w, trackTop, pos, "I6′", "rgba(58,210,159,0.30)", c.good, c.text);
          if (pos > 1) chip(ctx, c, u, w, trackTop, pos - 1, "I7′", "rgba(58,210,159,0.30)", c.good, c.text);
          u.text(ctx, pos < 1 ? "bubble — refetching the correct path" : "back to full speed", x0, trackTop - 26, { color: pos < 1 ? c.warn : c.good, size: 13, weight: 600 });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 14.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 14.6, "pipeline · how a branch misprediction costs cycles"),
    });
  };

  /* =================================================================== */
  /* M12. G-M-P SCHEDULING & WORK STEALING                               */
  /* =================================================================== */
  ANIM["gmp-scheduler"] = (canvas) => {
    function gChip(ctx, c, u, x, y, alpha) { u.fillRR(ctx, x, y, 22, 22, 5, "rgba(169,139,255,0.35)", c.purple, 1.4); ctx.globalAlpha = 1; }
    function pBox(ctx, c, u, x, y, label, fill, stroke) {
      u.fillRR(ctx, x, y, 100, 40, 10, fill || "rgba(0,173,216,0.10)", stroke || c.go, 1.8);
      u.text(ctx, label, x + 50, y + 26, { align: "center", color: stroke || c.go, size: 13, weight: 700, mono: true });
    }
    function mBox(ctx, c, u, x, y, label, fill, stroke) {
      u.fillRR(ctx, x, y, 110, 36, 10, fill || "rgba(58,210,159,0.14)", stroke || c.good, 1.8);
      u.text(ctx, label, x + 55, y + 23, { align: "center", color: c.text, size: 11.5, weight: 700, mono: true });
    }
    function queueRow(ctx, c, u, cx, y, count, maxShown) {
      const n = Math.min(count, maxShown || 8);
      const startX = cx - (n * 28) / 2;
      for (let k = 0; k < n; k++) gChip(ctx, c, u, startX + k * 28, y);
    }

    const STEPS = [
      {
        t: 0,
        title: "Three roles: G, M and P",
        desc: "G is a goroutine — a tiny, cheap unit of work (~2 KB stack). M is an OS thread — the thing the kernel actually runs. P is a processor — a scheduling slot with its own queue; the number of Ps equals GOMAXPROCS.",
        why: "Separating 'work' (G) from 'who runs it' (M) from 'how many run at once' (P) is what lets Go run a million goroutines on a handful of threads.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, gy = h * 0.30, py = h * 0.5, my = h * 0.7;
          const a1 = u.clamp(p / 0.3, 0, 1), a2 = u.clamp((p - 0.3) / 0.3, 0, 1), a3 = u.clamp((p - 0.6) / 0.3, 0, 1);
          ctx.globalAlpha = a1; gChip(ctx, c, u, cx0 - 11, gy - 11); u.text(ctx, "G — goroutine: cheap work to run", cx0, gy + 30, { align: "center", color: c.purple, size: 12.5 }); ctx.globalAlpha = 1;
          ctx.globalAlpha = a2; pBox(ctx, c, u, cx0 - 50, py - 20, "P"); u.text(ctx, "P — processor: a queue + the right to run Go code", cx0, py + 36, { align: "center", color: c.go, size: 12.5 }); ctx.globalAlpha = 1;
          ctx.globalAlpha = a3; mBox(ctx, c, u, cx0 - 55, my - 18, "M"); u.text(ctx, "M — OS thread: what the kernel actually schedules", cx0, my + 34, { align: "center", color: c.good, size: 12.5 }); ctx.globalAlpha = 1;
        },
      },
      {
        t: 2.6,
        title: "Each P drains its own queue — no shared lock",
        desc: "A P pulls goroutines one at a time from its OWN local queue and hands each to its M to run. Other Ps never need to touch this queue.",
        why: "A private queue per P means most scheduling needs zero synchronization with other Ps — that's what keeps the hot path fast.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          pBox(ctx, c, u, cx0 - 50, 110, "P1");
          mBox(ctx, c, u, cx0 - 55, 190, "M1");
          u.line(ctx, cx0, 150, cx0, 190, c.line, 1.4, [3, 4]);
          const total = 6, drained = Math.min(total, Math.floor(p * (total + 1)));
          queueRow(ctx, c, u, cx0, 70, total - drained, 8);
          if (drained > 0 && drained <= total) u.text(ctx, "→ running on M1", cx0 + 90, 208, { color: c.good, size: 12, weight: 600 });
          u.text(ctx, (total - drained) + tr(" queued on P1"), cx0, 100, { align: "center", color: c.dim, size: 11.5 });
        },
      },
      {
        t: 5.0,
        title: "An idle P steals work instead of waiting",
        desc: "P2's queue runs dry while P1 still has plenty queued. Rather than sit idle, P2 steals half of P1's remaining goroutines.",
        why: "No central scheduler decides this — each idle P independently grabs work from a busy neighbor, so load balances itself without a bottleneck.",
        draw(ctx, p, w, h, c, u) {
          const x1 = w * 0.28, x2 = w * 0.72;
          pBox(ctx, c, u, x1 - 50, 110, "P1"); pBox(ctx, c, u, x2 - 50, 110, "P2");
          const stealP = u.clamp((p - 0.45) / 0.45, 0, 1);
          const p1Count = stealP > 0 ? 6 - Math.round(3 * u.easeOut(stealP)) : 6;
          const p2Count = stealP > 0 ? Math.round(3 * u.easeOut(stealP)) : 0;
          queueRow(ctx, c, u, x1, 70, p1Count, 8);
          queueRow(ctx, c, u, x2, 70, p2Count, 8);
          u.text(ctx, p1Count + tr(" queued"), x1, 100, { align: "center", color: c.dim, size: 11.5 });
          u.text(ctx, p2Count + tr(" queued"), x2, 100, { align: "center", color: c.dim, size: 11.5 });
          if (p < 0.45) u.text(ctx, "P2 is empty — P1 still has work", w / 2, 168, { align: "center", color: c.warn, size: 13, weight: 600 });
          else {
            u.text(ctx, "stealing half of P1's queue →", w / 2, 168, { align: "center", color: c.purple, size: 13, weight: 600 });
            for (let k = 0; k < 3; k++) {
              const fp = u.clamp(stealP * 1.3 - k * 0.12, 0, 1);
              if (fp <= 0 || fp >= 1) continue;
              u.dot(ctx, u.lerp(x1 + 40, x2 - 40, fp), u.lerp(82, 82, fp), 5, c.purple, "rgba(169,139,255,0.4)");
            }
          }
        },
      },
      {
        t: 8.0,
        title: "A blocking syscall can't be allowed to block the P",
        desc: "M3 makes a slow syscall (e.g. reading a file) and the OS genuinely blocks that thread for its duration.",
        why: "If P3 stayed attached to the blocked M3, every OTHER goroutine queued on P3 would starve until the syscall returns — possibly milliseconds of wasted parallelism.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          pBox(ctx, c, u, cx0 - 50, 110, "P3");
          queueRow(ctx, c, u, cx0, 70, 4, 8);
          u.text(ctx, "4 queued — going nowhere while M3 is stuck", cx0, 100, { align: "center", color: c.dim, size: 11.5 });
          const blockedP = u.clamp(p / 0.5, 0, 1);
          const fill = blockedP > 0 ? "rgba(255,107,107,0.18)" : "rgba(58,210,159,0.14)";
          const stroke = blockedP > 0 ? c.bad : c.good;
          mBox(ctx, c, u, cx0 - 55, 190, blockedP > 0 ? "M3 — blocked in syscall" : "M3", fill, stroke);
          u.line(ctx, cx0, 150, cx0, 190, c.line, 1.4, [3, 4]);
          if (blockedP > 0.5) u.text(ctx, "P3's other goroutines are stuck behind it", cx0, 240, { align: "center", color: c.bad, size: 13, weight: 600 });
        },
      },
      {
        t: 10.6,
        title: "The runtime detaches P3 and hands it to a fresh M",
        desc: "P3 lets go of the blocked M3 and attaches to a new thread, M4, so its queued goroutines keep running immediately. M3 stays behind, still stuck in the kernel.",
        why: "This is exactly why a Go process can have MORE OS threads than GOMAXPROCS: extra Ms exist only to cover threads parked in blocking syscalls.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          const moveP = u.clamp(p / 0.5, 0, 1);
          const px = u.lerp(cx0, cx0 + 70, moveP);
          pBox(ctx, c, u, px - 50, 110, "P3");
          mBox(ctx, c, u, cx0 - 175, 190, "M3 — still blocked", "rgba(255,107,107,0.14)", c.bad);
          if (moveP > 0.5) {
            const a = u.clamp((moveP - 0.5) * 2, 0, 1);
            ctx.globalAlpha = a; mBox(ctx, c, u, px - 55, 190, "M4 (fresh)", "rgba(169,139,255,0.18)", c.purple); ctx.globalAlpha = 1;
            u.line(ctx, px, 150, px, 190, c.line, 1.4, [3, 4]);
            const drained = Math.min(4, Math.floor(a * 5));
            queueRow(ctx, c, u, px, 70, 4 - drained, 8);
            if (a > 0.6) u.text(ctx, "P3's goroutines resume on M4", px, 240, { align: "center", color: c.good, size: 13, weight: 600 });
          } else {
            queueRow(ctx, c, u, px, 70, 4, 8);
          }
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 13,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 13, "G-M-P scheduler · work stealing & syscall handoff"),
    });
  };

  /* =================================================================== */
  /* M13. ATOMIC CAS vs MUTEX vs CHANNEL HANDOFF                         */
  /* =================================================================== */
  ANIM["sync-primitives"] = (canvas) => {
    const STEPS = [
      {
        t: 0,
        title: "The problem: a data race",
        desc: "Two goroutines run `n++` on the same variable with no coordination at all. Both read the old value, both compute +1, both write — one update is silently lost.",
        why: "This isn't just 'sometimes wrong' — the Go memory model calls it undefined behavior, because the compiler and CPU are free to reorder these operations however they like.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, valY = h * 0.3;
          u.fillRR(ctx, cx0 - 40, valY - 22, 80, 44, 10, "rgba(255,107,107,0.16)", c.bad, 2);
          u.text(ctx, "n", cx0, valY + 7, { align: "center", color: c.bad, size: 18, weight: 700, mono: true });
          const gy = h * 0.62, g1x = cx0 - 160, g2x = cx0 + 160;
          const pp = u.clamp(p / 0.8, 0, 1);
          u.fillRR(ctx, g1x - 50, gy - 18, 100, 36, 8, c.panel, c.bad, 1.6);
          u.text(ctx, "goroutine A", g1x, gy + 5, { align: "center", color: c.text, size: 11.5 });
          u.fillRR(ctx, g2x - 50, gy - 18, 100, 36, 8, c.panel, c.bad, 1.6);
          u.text(ctx, "goroutine B", g2x, gy + 5, { align: "center", color: c.text, size: 11.5 });
          u.line(ctx, g1x, gy - 18, cx0 - 30, valY + 10, c.bad, 1.4, [3, 4]);
          u.line(ctx, g2x, gy - 18, cx0 + 30, valY + 10, c.bad, 1.4, [3, 4]);
          if (pp > 0.4) u.text(ctx, "both read n, both compute n+1, both write — one increment vanishes", cx0, h * 0.85, { align: "center", color: c.bad, size: 13, weight: 600, alpha: u.clamp((pp - 0.4) / 0.4, 0, 1) });
        },
      },
      {
        t: 2.6,
        title: "Atomic: a lock-free compare-and-swap",
        desc: "A goroutine reads the current value, computes the new one, then asks the CPU to swap it in 'only if nobody changed it since I read it.' If it lost the race, it just retries.",
        why: "No goroutine ever blocks or sleeps — the whole update is one indivisible CPU instruction. It's the cheapest tool, but it only protects a single word.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, valY = h * 0.32;
          u.fillRR(ctx, cx0 - 40, valY - 22, 80, 44, 10, "rgba(0,173,216,0.18)", c.go, 2);
          u.text(ctx, "n", cx0, valY + 7, { align: "center", color: c.go, size: 18, weight: 700, mono: true });
          const cyc = p % 0.5, half = 0.35;
          const gx = cyc < half ? u.lerp(cx0 + 170, cx0 + 60, cyc / half) : cx0 + 60;
          u.dot(ctx, gx, valY, 8, cyc >= half ? c.good : c.warn, "rgba(0,173,216,0.3)");
          u.text(ctx, cyc >= half ? "CAS ✓ — swapped in" : "compute n+1…", gx, valY - 26, { align: "center", color: cyc >= half ? c.good : c.warn, size: 12, weight: 700 });
          u.text(ctx, "atomic.Int64 — every update is one CPU instruction, never a wait", cx0, h * 0.7, { align: "center", color: c.dim, size: 12.5 });
        },
      },
      {
        t: 5.2,
        title: "Mutex: one goroutine in the critical section at a time",
        desc: "A goroutine must acquire the lock before touching shared state, and release it when done. Anyone else who wants in simply waits their turn.",
        why: "Use this when an INVARIANT spans more than one field (e.g. a balance and a log entry that must change together) — something a single atomic can never guarantee.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, lockY = h * 0.34;
          u.fillRR(ctx, cx0 - 36, lockY - 20, 72, 40, 10, "rgba(245,177,76,0.18)", c.warn, 2);
          u.text(ctx, "LOCK", cx0, lockY + 6, { align: "center", color: c.warn, size: 13, weight: 700 });
          const slot = Math.floor((p % 1) / (1 / 3));
          const labels = ["A", "B", "C"];
          for (let k = 0; k < 3; k++) {
            const inside = k === slot;
            const qx = inside ? cx0 : cx0 + 130 + ((k - slot + 3) % 3) * 46;
            u.dot(ctx, qx, lockY + 80, 9, inside ? c.warn : c.dim, inside ? "rgba(245,177,76,0.4)" : null);
            u.text(ctx, labels[k], qx, lockY + 60, { align: "center", color: inside ? c.warn : c.dim, size: 11 });
          }
          u.text(ctx, "waiting goroutines queue up; only the lock holder touches shared state", cx0, h * 0.78, { align: "center", color: c.dim, size: 12.5 });
        },
      },
      {
        t: 7.8,
        title: "Channel: ownership moves with the value",
        desc: "Instead of two goroutines sharing one variable, the producer sends the value down a channel — the consumer is now the only one who can touch it.",
        why: "'Don't communicate by sharing memory; share memory by communicating.' There's no shared state left to race on, because only one goroutine ever owns the value at a time.",
        draw(ctx, p, w, h, c, u) {
          const py = h * 0.34, prodX = w * 0.22, consX = w * 0.78;
          u.fillRR(ctx, prodX - 50, py - 20, 100, 40, 10, c.panel, c.purple, 1.8);
          u.text(ctx, "producer", prodX, py + 6, { align: "center", color: c.text, size: 12.5 });
          u.fillRR(ctx, consX - 50, py - 20, 100, 40, 10, c.panel, c.purple, 1.8);
          u.text(ctx, "consumer", consX, py + 6, { align: "center", color: c.text, size: 12.5 });
          u.line(ctx, prodX + 50, py, consX - 50, py, c.line, 1.6);
          const cyc = p % 0.9, frac = u.clamp(cyc / 0.65, 0, 1);
          u.dot(ctx, u.lerp(prodX + 56, consX - 56, frac), py, 8, c.purple, "rgba(169,139,255,0.4)");
          u.text(ctx, frac < 1 ? "value (and ownership) in transit →" : "consumer now owns it exclusively", w / 2, py + 60, { align: "center", color: c.purple, size: 12.5, weight: 600 });
        },
      },
      {
        t: 10.0,
        title: "Pick by the shape of the problem",
        desc: "All three are race-free — the right choice depends on what you're protecting, not on habit.",
        why: "Reaching for the wrong tool still 'works' but costs clarity or performance: an atomic-per-field can't keep two fields consistent; a mutex around a single counter is needless overhead; a channel as a lock is heavier than either.",
        draw(ctx, p, w, h, c, u) {
          const rows = [
            ["Just one counter, flag, or pointer swap?", "→ atomic", c.go],
            ["An invariant spans several fields?", "→ mutex", c.warn],
            ["Handing work or a value to another goroutine?", "→ channel", c.purple],
          ];
          const top = h * 0.28, rh = 64;
          rows.forEach((r, i) => {
            const a = u.clamp((p - i * 0.25) / 0.3, 0, 1);
            if (a <= 0) return;
            const y = top + i * rh;
            u.fillRR(ctx, w * 0.12, y, w * 0.76, rh - 14, 10, c.panel, r[2], 1.6);
            u.text(ctx, r[0], w * 0.12 + 18, y + (rh - 14) / 2 + 5, { color: c.text, size: 13, alpha: a });
            u.text(ctx, r[1], w * 0.88 - 18, y + (rh - 14) / 2 + 5, { align: "right", color: r[2], size: 14, weight: 700, mono: true, alpha: a });
          });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.5,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.5, "atomic vs mutex vs channel · same correctness, different shape"),
    });
  };

  /* =================================================================== */
  /* M14. ONE REQUEST ACROSS THE THREE PILLARS                          */
  /* =================================================================== */
  ANIM["three-pillars"] = (canvas) => {
    function services(ctx, c, u, w, svcY) {
      const svcW = 100, svcH = 40;
      const ax = w * 0.16, bx = w / 2, cx2 = w * 0.84;
      ["A", "B", "C"].forEach((name, i) => {
        const x = [ax, bx, cx2][i];
        u.fillRR(ctx, x - svcW / 2, svcY, svcW, svcH, 10, c.panel, c.go, 1.6);
        u.text(ctx, tr("Service ") + name, x, svcY + 26, { align: "center", color: c.text, size: 12.5, weight: 700 });
      });
      u.line(ctx, ax + svcW / 2, svcY + svcH / 2, bx - svcW / 2, svcY + svcH / 2, c.line, 1.4);
      u.line(ctx, bx + svcW / 2, svcY + svcH / 2, cx2 - svcW / 2, svcY + svcH / 2, c.line, 1.4);
      return { ax, bx, cx2, svcY, svcH };
    }

    const STEPS = [
      {
        t: 0,
        title: "One request, three services",
        desc: "A request enters Service A, which calls Service B, which calls Service C — a normal cross-service call chain.",
        why: "Once a request crosses service boundaries, no single process can see the whole picture anymore — that's the gap observability exists to close.",
        draw(ctx, p, w, h, c, u) {
          const { ax, bx, cx2, svcY, svcH } = services(ctx, c, u, w, h * 0.18);
          const legs = [[0, 0.34, ax, bx], [0.34, 0.66, bx, cx2], [0.66, 1, cx2, bx]];
          let x = ax;
          legs.forEach(([a, b, x1, x2]) => { if (p >= a) x = p < b ? u.lerp(x1, x2, u.seg(p, a, b)) : x2; });
          u.dot(ctx, x, svcY + svcH / 2, 7, c.accent, "rgba(206,50,98,0.4)");
        },
      },
      {
        t: 2.4,
        title: "Each hop opens a child span",
        desc: "Service A's span covers the whole request. When it calls B, B opens its OWN span nested inside A's. The nesting mirrors the call stack across services.",
        why: "A trace is just this tree of spans — it's how you see exactly which hop the time went to, instead of one opaque total latency number.",
        draw(ctx, p, w, h, c, u) {
          const gx0 = w * 0.14, gy0 = h * 0.28, barH = 28, barGap = 18, scale = (w * 0.72) / 3;
          const spans = [
            { label: "Service A — root span", row: 0, color: c.go, len: 1 },
            { label: "Service B — child span", row: 1, color: c.purple, len: 0.62 },
          ];
          const reveal = u.clamp(p / 0.85, 0, 1);
          spans.forEach((sp, i) => {
            const segStart = i * 0.4;
            const a = u.clamp((reveal - segStart) / 0.4, 0, 1);
            if (a <= 0) return;
            const y = gy0 + sp.row * (barH + barGap), x = gx0 + sp.row * 26;
            u.fillRR(ctx, x, y, Math.max(2, scale * 3 * sp.len * a), barH, 6, sp.color + "33", sp.color, 1.6);
            u.text(ctx, sp.label, x, y - 8, { color: sp.color, size: 12, weight: 600 });
          });
        },
      },
      {
        t: 5.0,
        title: "Metrics: cheap aggregates that answer 'is it broken?'",
        desc: "Every request bumps a counter and records its duration in a histogram — tiny, constant-cost numbers no matter how much traffic flows through.",
        why: "Metrics are cheap enough to keep forever and alert on continuously — they're the first signal that something is wrong, even before anyone looks at a trace.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, top = h * 0.3;
          const n = Math.floor(u.clamp(p / 0.5, 0, 1) * 247);
          u.text(ctx, "requests_total{route=\"/checkout\"}", cx0, top, { align: "center", color: c.dim, size: 13 });
          u.text(ctx, String(n), cx0, top + 50, { align: "center", color: c.go, size: 38, weight: 700, mono: true });
          if (p > 0.55) {
            const a = u.clamp((p - 0.55) / 0.4, 0, 1);
            u.text(ctx, "request_duration_seconds  p99 ≈ 0.21s", cx0, top + 96, { align: "center", color: c.go, size: 13.5, weight: 600, alpha: a });
          }
        },
      },
      {
        t: 7.6,
        title: "Logs: structured detail for one specific event",
        desc: "Each service emits a key/value log line for what it actually did — not a sentence to parse, but searchable fields.",
        why: "Metrics tell you something's wrong; logs are where you read exactly what happened in the one request you're debugging.",
        draw(ctx, p, w, h, c, u) {
          const x0 = w * 0.12, top = h * 0.26, lh = 26;
          const lines = [
            'level=INFO service=A msg="accepted request"',
            'level=INFO service=B msg="handling call"',
            'level=INFO service=C msg="query done" duration_ms=12',
          ];
          lines.forEach((l, i) => {
            const a = u.clamp((p - i * 0.28) / 0.3, 0, 1);
            if (a <= 0) return;
            u.text(ctx, l, x0, top + i * lh, { color: c.text, size: 12.5, mono: true, alpha: a });
          });
        },
      },
      {
        t: 10.0,
        title: "Correlated by one trace_id",
        desc: "The same trace_id is stamped on the span, the log lines, and (as a label) the metric for this request — so you can jump from a metric alert, to the slow trace, to the exact log line that explains it.",
        why: "Without a shared ID, the three pillars are three disconnected views. With it, they become one investigation: alert → trace → root cause.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          u.badge(ctx, cx0 - 70, h * 0.18, "trace_id=7f3a91", "rgba(206,50,98,0.18)", c.accent);
          const items = [
            ["metric", "requests_total{...} ⏤ p99 0.21s", c.go],
            ["trace", "Service A → B → C (3 spans)", c.purple],
            ["log", 'service=C msg="query done"', c.warn],
          ];
          items.forEach((it, i) => {
            const a = u.clamp((p - i * 0.22) / 0.35, 0, 1);
            if (a <= 0) return;
            const y = h * 0.36 + i * 64;
            u.fillRR(ctx, cx0 - w * 0.34, y, w * 0.68, 46, 10, c.panel, it[2], 1.6);
            u.text(ctx, it[0], cx0 - w * 0.34 + 16, y + 28, { color: it[2], size: 12, weight: 700 });
            u.text(ctx, it[1], cx0 + w * 0.34 - 16, y + 28, { align: "right", color: c.text, size: 12, mono: true });
          });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.5,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.5, "the three pillars · one request, end to end"),
    });
  };

  /* =================================================================== */
  /* M15. THE CIRCUIT BREAKER STATE MACHINE                              */
  /* =================================================================== */
  ANIM["circuit-breaker"] = (canvas) => {
    function scene(ctx, c, u, w, h) {
      const clientX = w * 0.14, breakerX = w / 2, serviceX = w * 0.86, callY = h * 0.26;
      u.fillRR(ctx, clientX - 44, callY - 20, 88, 40, 9, c.panel, c.line, 1.4);
      u.text(ctx, "client", clientX, callY + 6, { align: "center", color: c.text, size: 12.5 });
      u.fillRR(ctx, serviceX - 48, callY - 20, 96, 40, 9, c.panel, c.line, 1.4);
      u.text(ctx, "service", serviceX, callY + 6, { align: "center", color: c.text, size: 12.5 });
      u.line(ctx, clientX + 44, callY, serviceX - 48, callY, c.line, 1.4, [3, 4]);
      u.fillRR(ctx, breakerX - 40, callY - 18, 80, 36, 9, "rgba(245,177,76,0.10)", c.warn, 1.6);
      u.text(ctx, "breaker", breakerX, callY + 5, { align: "center", color: c.warn, size: 12, weight: 700 });
      return { clientX, breakerX, serviceX, callY };
    }
    function call(ctx, u, x, y, color, good) { u.dot(ctx, x, y, 7, color, good ? "rgba(58,210,159,0.35)" : "rgba(255,107,107,0.35)"); }

    const STEPS = [
      {
        t: 0,
        title: "Closed: calls flow normally",
        desc: "In the default CLOSED state, every call passes straight through to the service. The breaker just quietly counts failures in the background.",
        why: "Most of the time the dependency is healthy, so the breaker should add zero overhead — just watch, don't interfere.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, breakerX, serviceX, callY } = scene(ctx, c, u, w, h);
          const cyc = p % 0.45, half = 0.22;
          const x = cyc < half ? u.lerp(clientX, serviceX, cyc / half) : u.lerp(serviceX, clientX, (cyc - half) / half);
          call(ctx, u, x, callY, c.good, true);
          u.text(ctx, "failures: 0 / 5", breakerX, h * 0.5, { align: "center", color: c.dim, size: 13 });
        },
      },
      {
        t: 2.6,
        title: "Failures climb toward the trip threshold",
        desc: "The downstream service starts erroring. Each failed call still goes all the way out and back — the breaker just increments its counter.",
        why: "The breaker needs real evidence the dependency is unhealthy (not one blip) before it changes behavior — that's what the threshold is for.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, breakerX, serviceX, callY } = scene(ctx, c, u, w, h);
          const cyc = p % 0.32, half = 0.16;
          const x = cyc < half ? u.lerp(clientX, serviceX, cyc / half) : u.lerp(serviceX, clientX, (cyc - half) / half);
          call(ctx, u, x, callY, c.bad, false);
          const fails = Math.min(5, Math.floor(p * 5) + 1);
          u.text(ctx, tr("failures: ") + fails + " / 5", breakerX, h * 0.5, { align: "center", color: c.bad, size: 14, weight: 700 });
          if (fails >= 5) u.text(ctx, "threshold reached →", breakerX, h * 0.5 + 28, { align: "center", color: c.bad, size: 12.5 });
        },
      },
      {
        t: 5.2,
        title: "Trip → OPEN: fail fast, don't even ask",
        desc: "The breaker trips OPEN. Calls now fail INSTANTLY at the breaker itself — they never even reach the struggling service.",
        why: "Waiting on a timeout from a service you already know is down just wastes time and adds more load to it. Failing fast is strictly better once you're sure it's unhealthy.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, breakerX, callY } = scene(ctx, c, u, w, h);
          const cyc = p % 0.4, half = 0.18;
          const x = cyc < half ? u.lerp(clientX, breakerX, cyc / half) : u.lerp(breakerX, clientX, (cyc - half) / half);
          call(ctx, u, x, callY, c.bad, false);
          u.text(ctx, "OPEN — bounced at the breaker", breakerX, h * 0.5, { align: "center", color: c.bad, size: 14, weight: 700 });
        },
      },
      {
        t: 7.6,
        title: "Cooldown: giving the dependency room to breathe",
        desc: "For a fixed window, every call keeps failing fast — no traffic reaches the service at all.",
        why: "A struggling service often just needs time (to restart, drain a queue, recover from a spike) — sending it zero traffic for a bit is what lets it actually recover.",
        draw(ctx, p, w, h, c, u) {
          const { breakerX, callY } = scene(ctx, c, u, w, h);
          const remain = Math.max(0, Math.ceil((1 - p) * 5));
          u.text(ctx, tr("cooldown: ") + remain + (lang() === "ru" ? "с осталось" : "s remaining"), breakerX, h * 0.5, { align: "center", color: c.bad, size: 16, weight: 700, mono: true });
          u.text(ctx, "all calls still fail instantly", breakerX, h * 0.5 + 28, { align: "center", color: c.dim, size: 12.5 });
        },
      },
      {
        t: 9.6,
        title: "Half-Open: let exactly one probe through",
        desc: "Once the cooldown ends, the breaker allows a single real call through to test the water — everything else still waits.",
        why: "This answers 'has it recovered?' with minimal risk: if the service is still down, only one call pays the price, not a full flood.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, breakerX, serviceX, callY } = scene(ctx, c, u, w, h);
          const half = 0.5;
          const x = p < half ? u.lerp(clientX, serviceX, p / half) : u.lerp(serviceX, clientX, (p - half) / half);
          call(ctx, u, x, callY, c.warn, false);
          u.text(ctx, "HALF-OPEN — one probe call", breakerX, h * 0.5, { align: "center", color: c.warn, size: 14, weight: 700 });
        },
      },
      {
        t: 11.4,
        title: "Probe succeeds → back to Closed",
        desc: "The probe comes back healthy, so the breaker closes again and lets traffic flow normally. (Had it failed, the breaker would re-open and wait another cooldown.)",
        why: "This Closed → Open → Half-Open → Closed cycle is the whole pattern: protect the dependency when it's down, and self-heal automatically once it recovers — no human required.",
        draw(ctx, p, w, h, c, u) {
          const nodes = [
            { name: "CLOSED", x: w * 0.22, y: h * 0.42, on: true },
            { name: "OPEN", x: w * 0.5, y: h * 0.42, on: false },
            { name: "HALF-OPEN", x: w * 0.78, y: h * 0.42, on: false },
          ];
          const a = u.clamp(p / 0.6, 0, 1);
          u.arrow(ctx, nodes[0].x + 56, nodes[0].y, nodes[1].x - 56, nodes[1].y, c.line, 1.4);
          u.arrow(ctx, nodes[1].x + 50, nodes[1].y, nodes[2].x - 70, nodes[2].y, c.line, 1.4);
          u.arrow(ctx, nodes[2].x - 50, nodes[2].y + 36, nodes[0].x + 40, nodes[0].y + 36, c.good, 1.8 * a);
          u.text(ctx, "trip on failures", (nodes[0].x + nodes[1].x) / 2, nodes[0].y - 16, { align: "center", color: c.dim, size: 10.5 });
          u.text(ctx, "cooldown elapses", (nodes[1].x + nodes[2].x) / 2, nodes[1].y - 16, { align: "center", color: c.dim, size: 10.5 });
          u.text(ctx, "probe succeeds ✓", (nodes[0].x + nodes[2].x) / 2, nodes[0].y + 54, { align: "center", color: c.good, size: 11, weight: 700, alpha: a });
          nodes.forEach((n) => {
            const on = n.name === "CLOSED";
            u.fillRR(ctx, n.x - 58, n.y - 20, 116, 40, 10, on ? "rgba(58,210,159,0.20)" : c.panel, on ? c.good : c.line, on ? 2.2 : 1.4);
            u.text(ctx, n.name, n.x, n.y + 5, { align: "center", color: on ? c.good : c.dim, size: 12, weight: 700, mono: true });
          });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 13.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 13.4, "circuit breaker · fail fast, recover automatically"),
    });
  };

  /* ------------------------------------------------------------ export */
  window.ANIMATIONS = ANIM;
  window.CANVAS_RU = CANVAS_RU; // reused by app.js to translate step title/desc/why captions
  window.addEventListener("resize", () => {
    if (window.__activeAnim && window.__activeAnim.resize) window.__activeAnim.resize();
  });
})();

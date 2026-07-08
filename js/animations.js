/* =====================================================================
   INTERACTIVE ANIMATIONS  (canvas 2D, no dependencies)
   A deterministic, scrubbable timeline engine with explicit STEPS, plus
   31 visualizations. Each animation renders its full state as a pure
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
     exact English string when the page language is Russian - the
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
    "PostgreSQL · schema constraints · idempotency/outbox": "PostgreSQL · ограничения схемы · идемпотентность/outbox",
    "PostgreSQL · planner · composite index path": "PostgreSQL · планировщик · путь составного индекса",
    "PostgreSQL · locks · migrations · vacuum": "PostgreSQL · блокировки · миграции · vacuum",
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
    "SRE · SLO / error budget / burn rate": "SRE · SLO / error budget / burn rate",
    "SRE · telemetry correlation stack": "SRE · telemetry correlation stack",
    "SRE · incident response and toil loop": "SRE · incident response и toil loop",
    "Pick a user-visible SLI": "Шаг 1: выберите SLI по действию пользователя",
    "Start from user experience: successful transfers divided by total transfer attempts.": "Начните с простого вопроса: сколько переводов успешно завершилось из всех попыток.",
    "Infrastructure metrics explain causes; SLIs define whether users are hurt.": "CPU и память объяснят причину позже; SLI сначала показывает, страдают ли пользователи.",
    "Set the SLO target": "Шаг 2: задайте цель SLO",
    "A 99.9% SLO leaves 0.1% of requests as the error budget.": "SLO 99.9% означает, что 0.1% запросов можно потерять без нарушения цели.",
    "The target turns reliability into a release and alerting control, not a vibe.": "Теперь надёжность стала числом, а не ощущением.",
    "Spend the budget": "Шаг 3: смотрим, как тратится budget",
    "Small bursts are allowed while the long-window budget is healthy.": "Маленькие всплески ошибок допустимы, если общий budget ещё здоров.",
    "An error budget lets teams move fast without pretending production must be perfect.": "Error budget разрешает двигаться быстро, но показывает границу риска.",
    "Alert on burn rate": "Шаг 4: alert строим по burn rate",
    "A fast burn pages now; a slow burn opens a ticket and closer review.": "Быстрое сгорание будит on-call, медленное создаёт ticket и требует анализа.",
    "Burn-rate alerting maps urgency to user-visible reliability risk.": "Так срочность alert связана с реальным риском для пользователя.",
    "Use budget for release decisions": "Шаг 5: используем budget для решения о релизах",
    "Healthy budget allows change; exhausted budget shifts work toward reliability.": "Если budget здоров, деплоим осторожно; если исчерпан, сначала чиним надёжность.",
    "That is the SRE bargain: product velocity is earned by staying inside the SLO.": "Так SRE балансирует скорость разработки и надёжность.",
    "Instrument once with OpenTelemetry": "Шаг 1: добавляем OpenTelemetry в приложение",
    "The SDK and collector create one telemetry contract at the application boundary.": "SDK и collector дают единый способ отправлять metrics, traces и logs.",
    "Instrumentation is not the backend; it is how the app describes itself consistently.": "OpenTelemetry не заменяет backend, а одинаково описывает работу приложения.",
    "Metrics go to Prometheus": "Шаг 2: metrics идут в Prometheus",
    "Prometheus scrapes RED/USE metrics and evaluates SLO burn alerts.": "Prometheus собирает метрики и считает burn-rate alerts.",
    "Metrics are the paging signal because they are cheap, aggregated and fast to query.": "Метрики удобны для page, потому что быстро показывают масштаб проблемы.",
    "Thanos keeps long-retention metrics": "Шаг 3: Thanos хранит длинную историю",
    "Thanos lets you query Prometheus data across clusters and longer windows.": "Thanos помогает смотреть данные Prometheus по кластерам и длинным окнам.",
    "Long windows catch slow burns that short dashboards miss.": "Длинные окна ловят медленное сгорание budget.",
    "Traces go to Tempo": "Шаг 4: traces идут в Tempo",
    "A trace explains which hop made one request slow or wrong.": "Trace показывает, на каком шаге конкретный request стал медленным или ошибочным.",
    "Traces are for localization after the metric told you users are hurt.": "Сначала metric показывает impact, затем trace локализует место проблемы.",
    "Logs go to Loki": "Шаг 5: logs идут в Loki",
    "Logs carry the concrete event, keyed by bounded labels and trace_id.": "Logs объясняют конкретное событие и ищутся по trace_id.",
    "Logs are expensive, so make them searchable and tied to the same request identity.": "Logs дорогие, поэтому они должны быть searchable и связаны с request.",
    "Grafana correlates by trace_id": "Шаг 6: Grafana связывает всё по trace_id",
    "One incident workflow jumps metric -> trace -> logs without manual guessing.": "Расследование идёт прямо: metric -> trace -> logs.",
    "Correlation is what reduces mean time to understand.": "Correlation сокращает время до понимания причины.",
    "Alert fires from SLO burn": "Шаг 1: alert сработал из-за SLO burn",
    "The page starts from user impact, not from a random noisy symptom.": "Page начинается с user impact, а не со случайного шумного симптома.",
    "Good alerts already contain the reason this wake-up is worth it.": "Хороший alert сразу объясняет, почему он стоит пробуждения.",
    "Triage assigns incident roles": "Шаг 2: triage назначает роли",
    "Incident commander, operations lead, communications and scribe separate the work.": "IC, operations, communications и scribe делят работу между собой.",
    "Roles prevent the on-call engineer from being debugger, manager and reporter at once.": "Роли не дают одному инженеру делать всё сразу.",
    "Mitigate before perfect root cause": "Шаг 3: сначала mitigation, потом root cause",
    "Stop the bleeding first: rollback, shed load, fail over, disable a bad path.": "Сначала уменьшаем impact: rollback, shed load, failover или отключение плохого пути.",
    "RCA is valuable after users are safe; during impact, mitigation wins.": "RCA полезен после стабилизации; во время impact важнее mitigation.",
    "Write blameless RCA": "Шаг 4: пишем blameless RCA",
    "Record impact, timeline, detection gaps and contributing factors.": "Фиксируем impact, timeline, detection gaps и contributing factors.",
    "Blameless does not mean vague; it means precise without personal blame.": "Blameless не значит расплывчато; это точность без поиска виноватого.",
    "Automate recurring toil": "Шаг 5: автоматизируем повторяющийся toil",
    "Turn repeat manual steps into runbooks, scripts or guarded controllers.": "Повторяющиеся ручные шаги превращаем в runbook, script или безопасный controller.",
    "The incident loop closes only when action items reduce the next incident.": "Цикл закрыт только тогда, когда action items уменьшают следующий incident.",
    "user requests": "запросы пользователей",
    "SLI = success / total": "SLI = success / total",
    "SLO 99.9%": "SLO 99.9%",
    "budget 0.1%": "budget 0.1%",
    "slow burn": "медленное сгорание",
    "fast burn": "быстрое сгорание",
    "ticket": "ticket",
    "page now": "page now",
    "freeze risky releases": "заморозить рискованные релизы",
    "ship carefully": "деплоить осторожно",
    "OpenTelemetry SDK": "OpenTelemetry SDK",
    "Collector": "Collector",
    "Prometheus": "Prometheus",
    "Thanos": "Thanos",
    "Tempo": "Tempo",
    "Loki": "Loki",
    "Grafana": "Grafana",
    "metrics": "метрики",
    "traces": "трассы",
    "logs": "логи",
    "trace_id": "trace_id",
    "alert": "alert",
    "triage": "triage",
    "mitigate": "mitigation",
    "RCA": "RCA",
    "action items": "action items",
    "automation": "автоматизация",
    "runbook": "runbook",
    "less manual work": "меньше ручной работы",
    "users hurt?": "пользователи страдают?",
    "error budget decides": "error budget решает",
    "export": "export",
    "span": "span",
    "30d / 90d / multi-cluster": "30d / 90d / multi-cluster",
    "service=ledger": "service=ledger",
    "route=/transfer/{id}": "route=/transfer/{id}",
    "SLO burn": "SLO burn",
    "IC": "IC",
    "ops": "ops",
    "comms": "comms",
    "scribe": "scribe",
    "impact": "impact",
    "stable": "стабильно",
    "timeline": "timeline",
    "detection gap": "gap обнаружения",
    "contributing factors": "contributing factors",
    // gc-mark-sweep
    "root": "корень",
    "white = unreached": "белый = не достигнут",
    "grey = reachable": "серый = достижим",
    "black = live": "чёрный = жив",
    // pprof-flame
    "sampler": "сэмплер",
    "samples captured: ": "собрано сэмплов: ",
    "width = share of samples in that function": "ширина = доля сэмплов в этой функции",
    "▲ reflectWalk ≈ 40% of CPU - optimize here first": "▲ reflectWalk ≈ 40% CPU - оптимизировать в первую очередь",
    "go tool pprof · choosing the right profile": "go tool pprof · выбор правильного профиля",
    "go tool pprof · profile picker": "go tool pprof · выбор профиля",
    "symptom": "симптом",
    "profile": "профиль",
    "question answered": "какой вопрос закрывает",
    "CPU hot path": "горячий CPU-путь",
    "heap pressure": "давление на кучу",
    "goroutine leak": "утечка горутин",
    "sync waiting": "ожидание sync",
    "cpu": "cpu",
    "heap": "heap",
    "goroutine": "goroutine",
    "block / mutex": "block / mutex",
    "where is CPU time spent?": "где тратится CPU-время?",
    "what allocates or stays live?": "что аллоцирует или остаётся живым?",
    "where are goroutines stuck?": "где застряли горутины?",
    "where do goroutines wait?": "где горутины ждут?",
    "30s CPU sample": "30-секундный CPU-сэмпл",
    "inuse_space / alloc_space": "inuse_space / alloc_space",
    "stack dump": "дамп стеков",
    "contention time": "время конкуренции",
    "pick the profile that answers the question": "выберите профиль, отвечающий на вопрос",
    "go tool pprof · measure, change one thing, measure again": "go tool pprof · измерить, изменить одно, измерить снова",
    "go tool pprof · optimize loop": "go tool pprof · цикл оптимизации",
    "benchmark/load test": "бенчмарк/нагрузочный тест",
    "cpu.out": "cpu.out",
    "go tool pprof": "go tool pprof",
    "top": "top",
    "list": "list",
    "flame": "flame",
    "top · list · flame": "top · list · flame",
    "hotspot": "горячая точка",
    "one code change": "одно изменение в коде",
    "before": "до",
    "after": "после",
    "measure": "измерить",
    "fix": "исправить",
    "re-profile": "профилировать снова",
    "prove the win": "доказать выигрыш",
    "flat enough - stop": "достаточно ровно - стоп",
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
    "ctx (root)": "ctx (корень)",
    "worker": "воркер",
    "ctx.Done() ✓": "ctx.Done() ✓",
    "✓ every goroutine returned - no leaks": "✓ все горутины завершились - утечек нет",
    // mux-trie
    "✓ ok": "✓ ок",
    "✗ blocked at the boundary": "✗ заблокировано на границе",
    // swiss-table
    "cache miss ✗": "промах кэша ✗",
    "match ✓": "совпадение ✓",
    "separate cache lines touched so far: ": "отдельных кэш-линий затронуто: ",
    "control bytes - one cache line:": "контрольные байты - одна кэш-линия:",
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
    "✓ deterministic - no time.Sleep, no CI flake": "✓ детерминировано - без time.Sleep, без нестабильности CI",
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
    // postgres-deep
    "HTTP transfer": "HTTP-перевод",
    "Go service": "Go-сервис",
    "accounts": "accounts",
    "transfers": "transfers",
    "ledger_entries": "ledger_entries",
    "outbox_events": "outbox_events",
    "CHECK balance >= 0": "CHECK balance >= 0",
    "CHECK amount > 0": "CHECK amount > 0",
    "UNIQUE idempotency_key": "UNIQUE idempotency_key",
    "duplicate blocked": "дубликат заблокирован",
    "event committed": "event закоммичен",
    "schema is the final guardrail": "схема - последний guardrail",
    "rejected": "отклонено",
    "BEGIN": "BEGIN",
    "COMMIT": "COMMIT",
    "query": "запрос",
    "planner": "планировщик",
    "seq scan": "seq scan",
    "composite index": "составной индекс",
    "covering INCLUDE": "покрывающий INCLUDE",
    "EXPLAIN verifies": "EXPLAIN проверяет",
    "buffers read": "buffers read",
    "heap fetches": "heap fetches",
    "latest 50": "последние 50",
    "table heap": "table heap",
    "heap fetches avoided": "heap fetches избегнуты",
    "Index Only Scan using ledger_entries_account_time_idx": "Index Only Scan using ledger_entries_account_time_idx",
    "hot table": "горячая таблица",
    "writers": "писатели",
    "DDL migration": "DDL-миграция",
    "ACCESS EXCLUSIVE": "ACCESS EXCLUSIVE",
    "blocked": "заблокировано",
    "CREATE INDEX CONCURRENTLY": "CREATE INDEX CONCURRENTLY",
    "writes continue": "записи продолжаются",
    "long xact": "длинная транзакция",
    "dead tuples": "dead tuples",
    "VACUUM waits": "VACUUM ждёт",
    "batch backfill": "batch backfill",
    "pressure released": "давление снято",
    "bloat grows": "bloat растёт",
    "small batches · short transactions": "малые батчи · короткие транзакции",
    // pqc-lattice
    "Alice": "Алиса",
    "Bob": "Боб",
    "Channel A · Classic (X25519)": "Канал A · классика (X25519)",
    "Channel B · Hybrid (+ML-KEM-768)": "Канал B · гибрид (+ML-KEM-768)",
    "harvester - recording ciphertext from both channels": "перехватчик - записывает шифротекст с обоих каналов",
    "ct": "шт",
    "stored, waiting for a future quantum computer": "сохранено, в ожидании будущего квантового компьютера",
    "quantum computer online": "квантовый компьютер запущен",
    "→ attacking both recorded sessions": "→ атака на обе записанные сессии",
    "X25519 classical key": "классический ключ X25519",
    "broken by Shor's algorithm": "взломан алгоритмом Шора",
    "still classically secure": "всё ещё классически защищён",
    "ML-KEM-768 lattice key": "решёточный ключ ML-KEM-768",
    "quantum-resistant - stays secret": "квантовоустойчив - остаётся секретным",
    // leak-graph
    "blocked": "заблокирован",
    "missing": "отсутствует",
    "⏸ blocked on <-results": "⏸ заблокирован на <-results",
    "ROOT CAUSE": "КОРНЕВАЯ ПРИЧИНА",
    "G2 dispatch never sends on results ch - context had no deadline.": "G2 dispatch никогда не отправляет в канал results - у контекста не было дедлайна.",
    // simd-gc
    "scalar loop": "скалярный цикл",
    "SIMD loop": "цикл SIMD",
    "vs": "против",
    "SIMD vector loop": "векторный цикл SIMD",
    "scalar - 1 element / cycle": "скаляр - 1 элемент / такт",
    "cycles: ": "тактов: ",
    "SIMD - 16 elements / cycle": "SIMD - 16 элементов / такт",
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
    "next 7 · ~1 ns each (L1) - ~100× faster": "следующие 7 · ~1 нс каждое (L1) - ~в 100× быстрее",
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
    "bubble - refetching the correct path": "пузырь - повторная выборка верного пути",
    "back to full speed": "снова на полной скорости",
    "pipe full - overlapping instructions": "конвейер полон - инструкции перекрываются",
    "✓ retiring this cycle": "✓ завершается в этом такте",
    // gmp-scheduler
    "G - goroutine: cheap work to run": "G - горутина: дешёвая работа для выполнения",
    "P - processor: a queue + the right to run Go code": "P - процессор: очередь + право выполнять Go-код",
    "M - OS thread: what the kernel actually schedules": "M - поток ОС: то, что реально планирует ядро",
    "→ running on M1": "→ выполняется на M1",
    " queued on P1": " в очереди на P1",
    " queued": " в очереди",
    "P2 is empty - P1 still has work": "P2 пуст - у P1 ещё есть работа",
    "stealing half of P1's queue →": "кража половины очереди P1 →",
    "4 queued - going nowhere while M3 is stuck": "4 в очереди - никуда не движутся, пока M3 застрял",
    "M3 - blocked in syscall": "M3 - заблокирован в syscall",
    "M3": "M3",
    "P3's other goroutines are stuck behind it": "остальные горутины P3 застряли позади",
    "M3 - still blocked": "M3 - всё ещё заблокирован",
    "M4 (fresh)": "M4 (новый)",
    "P3's goroutines resume on M4": "горутины P3 продолжают на M4",
    // sync-primitives
    "goroutine A": "горутина A",
    "goroutine B": "горутина B",
    "both read n, both compute n+1, both write - one increment vanishes": "обе читают n, обе вычисляют n+1, обе пишут - один инкремент пропадает",
    "compute n+1…": "вычисление n+1…",
    "CAS ✓ - swapped in": "CAS ✓ - подменено",
    "atomic.Int64 - every update is one CPU instruction, never a wait": "atomic.Int64 - каждое обновление - одна инструкция CPU, без ожидания",
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
    "Service A - root span": "Сервис A - корневой span",
    "Service B - child span": "Сервис B - дочерний span",
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
    "OPEN - bounced at the breaker": "OPEN - отбито автоматом",
    "cooldown: ": "охлаждение: ",
    "s remaining": "с осталось",
    "all calls still fail instantly": "все вызовы по-прежнему мгновенно проваливаются",
    "HALF-OPEN - one probe call": "HALF-OPEN - один пробный вызов",
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
    "The heap is a graph of objects": "Куча - это граф объектов",
    "Two roots (global variables / goroutine stacks) point into a web of objects. Some objects (right side) aren't pointed to by anything reachable from a root.": "Два корня (глобальные переменные / стеки горутин) указывают на сеть объектов. На некоторые объекты (справа) не ссылается ничего, достижимое из корня.",
    "The collector's whole job is to tell live objects apart from dead ones - and 'reachable from a root' is the only definition of 'live' it needs.": "Вся работа сборщика - отличить живые объекты от мёртвых, а «достижим из корня» - единственное определение «живого», которое ему нужно.",
    "Start at the roots, mark them black": "Начинаем с корней, помечаем их чёрным",
    "Marking begins at the roots - they're live by definition. Whatever they directly point to turns grey: 'reachable, but not yet scanned.'": "Пометка начинается с корней - они живы по определению. Всё, на что они указывают напрямую, становится серым: «достижимо, но пока не просканировано».",
    "Starting only from roots guarantees you never mark something live unless there's an actual chain of pointers reaching it.": "Старт только от корней гарантирует, что вы никогда не помечаете что-то живым, если к нему нет реальной цепочки указателей.",
    "Scan grey → black, level by level": "Сканируем серые → чёрные, уровень за уровнем",
    "Each grey object gets scanned: it turns black ('done'), and anything IT points to turns grey in turn. The reachable wave spreads outward through the graph.": "Каждый серый объект сканируется: он становится чёрным («готово»), а всё, на что ОН указывает, в свою очередь становится серым. Волна достижимости расходится по графу.",
    "This is why it's called tri-color: grey is the 'in-progress' frontier that guarantees every reachable object eventually gets scanned exactly once.": "Поэтому это называется трёхцветной пометкой: серый - это фронт «в процессе», который гарантирует, что каждый достижимый объект будет просканирован ровно один раз.",
    "White = dead": "Белый = мёртв",
    "Once no grey objects remain, the wave is finished. Everything still white - including the cluster on the right - was never touched, because nothing live points to it.": "Когда серых объектов не остаётся, волна завершена. Всё, что осталось белым - включая кластер справа - не было тронуто вовсе, потому что на него не указывает ничего живого.",
    "This is the proof of garbage: not 'looks unused', but 'provably unreachable from any root.'": "Это и есть доказательство мусора: не «выглядит неиспользуемым», а «доказуемо недостижим из любого корня».",
    "Sweep: reclaim the white objects": "Сборка: освобождаем белые объекты",
    "The collector walks the heap one more time and frees every object still marked white. Black (live) objects are never touched.": "Сборщик проходит по куче ещё раз и освобождает каждый объект, всё ещё помеченный белым. Чёрные (живые) объекты не трогаются.",
    "Marking and sweeping are kept as separate passes so the collector never frees something while it might still be mid-scan - correctness over speed.": "Пометка и сборка - раздельные проходы, чтобы сборщик никогда не освобождал то, что ещё может быть в процессе сканирования - корректность важнее скорости.",

    // pprof-flame
    "The program runs - a call tree": "Программа выполняется - дерево вызовов",
    "A request flows main → handleRequest → a handful of child functions. Some of those calls are cheap, some are expensive - but just reading the code, you can't tell which.": "Запрос идёт main → handleRequest → несколько дочерних функций. Некоторые вызовы дешёвые, некоторые дорогие - но просто читая код, не понять, какие именно.",
    "Without measurement, optimization is guessing. Profiling replaces guessing with evidence.": "Без измерений оптимизация - это гадание. Профилирование заменяет гадание доказательствами.",
    "The sampler ticks ~100×/second": "Сэмплер срабатывает ~100 раз/секунду",
    "Rather than instrument every call, pprof just peeks at whatever stack is CURRENTLY running, many times a second, and records it.": "Вместо инструментирования каждого вызова pprof просто подсматривает, какой стек ВЫПОЛНЯЕТСЯ прямо сейчас, много раз в секунду, и записывает это.",
    "Sampling is statistical, not exhaustive - that's exactly what makes it cheap enough to run in production without slowing the program down.": "Сэмплирование статистическое, а не исчерпывающее - именно это делает его достаточно дешёвым, чтобы работать в продакшене без замедления программы.",
    "Samples aggregate into a flame graph": "Сэмплы складываются в flame-граф",
    "Every captured stack stacks its frames into bars - a box sits inside its caller, and the more samples landed in a function, the WIDER its box grows.": "Каждый захваченный стек складывает свои фреймы в полосы - блок лежит внутри вызвавшего его блока, и чем больше сэмплов попало в функцию, тем ШИРЕ становится её блок.",
    "Width directly encodes time spent, so the visual shape of the graph IS the measurement - no separate legend to decode.": "Ширина напрямую кодирует затраченное время, поэтому визуальная форма графа И ЕСТЬ измерение - не нужна отдельная легенда для расшифровки.",
    "Find the widest box - that's the hotspot": "Найдите самый широкий блок - это и есть горячая точка",
    "reflectWalk is the widest leaf frame: roughly 40% of all CPU samples landed inside it. The tall, narrow stacks next to it barely register.": "reflectWalk - самый широкий листовой фрейм: примерно 40% всех сэмплов CPU попали именно в него. Высокие узкие стеки рядом почти незаметны.",
    "Optimizing the widest box gives the biggest win for the least effort - optimizing a narrow box can't help much even if you make it instant.": "Оптимизация самого широкого блока даёт наибольший выигрыш при наименьших усилиях - оптимизация узкого блока не поможет много, даже если сделать его мгновенным.",
    "Start from the symptom": "Начните с симптома",
    "The symptom is your first filter. A service can be slow because it is burning CPU, allocating too much, leaking goroutines, or waiting on locks/channels.": "Симптом - ваш первый фильтр. Сервис может тормозить из-за сжигания CPU, лишних аллокаций, утечки горутин или ожидания на lock/channel.",
    "Choosing the profile by symptom prevents you from staring at the wrong evidence.": "Выбор профиля по симптому не даёт вам часами смотреть на неправильные факты.",
    "CPU profile answers: where is time spent?": "CPU-профиль отвечает: где тратится время?",
    "For a hot request path, collect a CPU profile. pprof samples the currently running stack and ranks functions by how often they were on-CPU.": "Для горячего пути запроса снимите CPU-профиль. pprof сэмплирует текущий выполняющийся стек и ранжирует функции по тому, как часто они были на CPU.",
    "This is the profile for throughput work: algorithms, reflection, parsing, serialization, hashing, and tight loops.": "Это профиль для работы над пропускной способностью: алгоритмы, reflection, парсинг, сериализация, хеширование и горячие циклы.",
    "Heap profile answers: what owns memory?": "Heap-профиль отвечает: кто владеет памятью?",
    "If RSS climbs or GC burns CPU, switch to heap. inuse_space shows what is live now; alloc_space shows allocation churn that feeds the GC.": "Если RSS растёт или GC сжигает CPU, переключайтесь на heap. inuse_space показывает, что живо сейчас; alloc_space показывает поток аллокаций, который кормит GC.",
    "Memory problems need ownership evidence - a CPU flame graph can hide the allocation site that actually creates pressure.": "Проблемам памяти нужны факты о владении - CPU flame-граф может скрыть место аллокации, которое реально создаёт давление.",
    "Goroutine profile answers: who is stuck?": "Goroutine-профиль отвечает: кто застрял?",
    "When goroutine count keeps rising, dump the goroutine profile. It shows every stack, so leaked workers and forgotten receives become visible.": "Когда число горутин растёт, снимите goroutine-профиль. Он показывает каждый стек, поэтому утёкшие воркеры и забытые receive становятся видны.",
    "A leak is usually a lifetime bug, not a CPU bug - you need the parked stack, not a timing aggregate.": "Утечка обычно проблема времени жизни, а не CPU - нужен припаркованный стек, а не агрегат времени.",
    "Block and mutex profiles answer: who waits?": "Block и mutex-профили отвечают: кто ждёт?",
    "If CPU is low but latency is high, enable block or mutex profiling. The profile points at channel sends, receives, selects, and locks that consume wait time.": "Если CPU низкий, а задержка высокая, включите block или mutex-профилирование. Профиль указывает на channel send/receive/select и lock, где тратится время ожидания.",
    "Waiting time is invisible in a normal CPU profile because blocked goroutines are not on-CPU.": "Время ожидания невидимо в обычном CPU-профиле, потому что заблокированные горутины не находятся на CPU.",
    "Reproduce the slow path": "Воспроизведите медленный путь",
    "Start with a benchmark or representative load test. The profile is only useful if the workload exercises the behavior you actually need to improve.": "Начните с бенчмарка или репрезентативного нагрузочного теста. Профиль полезен только если нагрузка воспроизводит поведение, которое вам реально нужно улучшить.",
    "A clean reproduction turns performance work from folklore into an experiment you can repeat.": "Чистое воспроизведение превращает работу над производительностью из фольклора в повторяемый эксперимент.",
    "Collect evidence, then inspect it": "Соберите факты, затем изучите их",
    "Write cpu.out, open it with go tool pprof, and move between top, list, and the flame graph until one hotspot is concrete.": "Запишите cpu.out, откройте его через go tool pprof и переключайтесь между top, list и flame-графом, пока одна горячая точка не станет конкретной.",
    "The toolchain gives you several views of the same samples: table for ranking, source listing for the line, flame graph for shape.": "Инструменты дают несколько видов одних и тех же сэмплов: таблицу для ранжирования, исходник для строки, flame-граф для формы.",
    "Change one hotspot": "Измените одну горячую точку",
    "Make one targeted change where the profile is widest: swap an algorithm, remove reflection, preallocate, cache, or move work out of the loop.": "Сделайте одно точное изменение там, где профиль шире всего: смените алгоритм, уберите reflection, заранее выделите память, закэшируйте или вынесите работу из цикла.",
    "One change at a time keeps causality intact - if the profile improves, you know what did it.": "Одно изменение за раз сохраняет причинность - если профиль улучшился, вы знаете почему.",
    "Re-profile and compare shapes": "Снимите профиль снова и сравните форму",
    "Run the same workload again. The before graph had one dominant box; the after graph should be flatter or expose the next real bottleneck.": "Запустите ту же нагрузку снова. На графе до был один доминирующий блок; после граф должен стать ровнее или показать следующий реальный узкий участок.",
    "The only optimization that counts is the one that survives a second measurement.": "Засчитывается только та оптимизация, которая пережила второе измерение.",

    // test-runner
    "A table of cases": "Таблица случаев",
    "Each row is one input pair plus the expected (want) result for the SAME function, Add(a, b).": "Каждая строка - это одна пара входных данных плюс ожидаемый (want) результат для ОДНОЙ и той же функции Add(a, b).",
    "Separating 'what to test' (the table) from 'how to test it' (one shared piece of logic) means adding a new case is just adding a row - no new code.": "Разделение «что тестировать» (таблица) и «как тестировать» (одна общая логика) означает, что добавление нового случая - это просто новая строка, без нового кода.",
    "go test runs each case as an isolated subtest": "go test запускает каждый случай как изолированный подтест",
    "t.Run wraps each row as its own named subtest - go test -run TestAdd/negatives can target just one, and one failing case never stops the others from running.": "t.Run оборачивает каждую строку в собственный именованный подтест - go test -run TestAdd/negatives может нацелиться на один из них, и один провалившийся случай никогда не останавливает выполнение остальных.",
    "Isolation means a single bad case gives you a precise failure (\"TestAdd/negatives\"), not a vague \"something in TestAdd broke.\"": "Изоляция означает, что один плохой случай даёт точный отказ («TestAdd/negatives»), а не смутное «что-то в TestAdd сломалось».",
    "Inputs flow into the function": "Входные данные попадают в функцию",
    "For the active case, a(=2) and b(=3) are passed into Add(a, b), which computes a+b.": "Для активного случая a(=2) и b(=3) передаются в Add(a, b), которая вычисляет a+b.",
    "The function under test never knows it's being tested through a table - it just gets called like normal code, which is why this pattern adds no production complexity.": "Тестируемая функция никогда не знает, что её тестируют через таблицу - её просто вызывают как обычный код, поэтому этот паттерн не добавляет сложности в продакшен-код.",
    "Compare got vs want": "Сравниваем got и want",
    "The function returns got = 5. The test compares it to want = 5 from the table row. Equal → the case passes.": "Функция возвращает got = 5. Тест сравнивает его с want = 5 из строки таблицы. Равны → случай пройден.",
    "The comparison - not the function - is what decides pass/fail. A mismatch fails loudly with both values printed, so you see exactly what diverged.": "Именно сравнение - а не функция - решает пройден тест или нет. Несовпадение громко проваливает тест с выводом обоих значений, так что видно, что именно разошлось.",
    "The same flow runs for every case": "Тот же процесс повторяется для каждого случая",
    "go test repeats exactly this input → function → compare flow for each remaining row, fully independently.": "go test повторяет ровно этот процесс вход → функция → сравнение для каждой оставшейся строки, полностью независимо.",
    "This is the payoff: one test function plus N table rows covers N scenarios - no copy-pasted test functions to maintain.": "Вот и выигрыш: одна тестовая функция плюс N строк таблицы покрывают N сценариев - не нужно поддерживать скопипащенные тестовые функции.",
    "Summary": "Итог",
    "go test reports one line: how many passed, and coverage. Run it constantly - `go test -race -cover ./...` - so a regression is caught the moment it's introduced.": "go test выводит одну строку: сколько пройдено и покрытие. Запускайте его постоянно - `go test -race -cover ./...` - чтобы регрессия ловилась в момент появления.",
    "A fast, table-driven suite is cheap enough to run on every save, which is what makes 'catch it immediately' realistic instead of aspirational.": "Быстрый табличный набор тестов достаточно дёшев, чтобы запускать его при каждом сохранении - именно это делает «поймать сразу» реальностью, а не мечтой.",

    // worker-pool
    "Six jobs wait on a buffered channel": "Шесть задач ждут в буферизованном канале",
    "Work items sit in a channel, ready to be picked up. Nothing is processing yet - this is just a queue.": "Единицы работы лежат в канале, готовые быть подхваченными. Пока ничего не обрабатывается - это просто очередь.",
    "A channel decouples producing work from consuming it: the producer doesn't need to know or care how many workers exist.": "Канал разделяет производство работы и её потребление: производителю не нужно знать или заботиться о том, сколько воркеров существует.",
    "Three workers pull from the SAME channel": "Три воркера читают из ОДНОГО канала",
    "Each worker goroutine independently calls `job := <-jobs` in a loop. The channel itself decides which worker gets which job - no coordination code needed.": "Каждая горутина-воркер независимо вызывает `job := <-jobs` в цикле. Сам канал решает, какому воркеру какая задача достанется - код координации не нужен.",
    "This is fan-out: identical workers competing for jobs on one channel is enough to spread work across goroutines safely.": "Это fan-out: одинаковые воркеры, конкурирующие за задачи в одном канале - этого достаточно, чтобы безопасно распределить работу между горутинами.",
    "Up to three jobs process at once": "До трёх задач обрабатываются одновременно",
    "Each busy worker is running its own job concurrently - never more than 3 in flight, because there are only 3 workers.": "Каждый занятый воркер конкурентно выполняет свою задачу - никогда больше 3 одновременно, потому что воркеров всего 3.",
    "The number of workers is a deliberate dial: it caps concurrency so you don't overwhelm downstream resources, while still getting real parallelism.": "Количество воркеров - это осознанная настройка: она ограничивает конкурентность, чтобы не перегрузить внешние ресурсы, но при этом даёт реальный параллелизм.",
    "Fan-in: every worker sends to ONE results channel": "Fan-in: каждый воркер пишет в ОДИН канал результатов",
    "When a worker finishes, it sends its result to a shared results channel - the same channel every other worker also writes to.": "Когда воркер заканчивает, он отправляет результат в общий канал результатов - тот же канал, в который пишут и все остальные воркеры.",
    "The collector reading results doesn't need to know which worker produced what, or even how many workers there are - fan-in merges them for free.": "Сборщику, читающему результаты, не нужно знать, какой воркер что произвёл, или даже сколько воркеров существует - fan-in объединяет их бесплатно.",
    "Drained: every job ran exactly once": "Опустошено: каждая задача выполнена ровно один раз",
    "All six jobs were processed, never more than three at a time, and the results all merged onto one channel for the collector.": "Все шесть задач обработаны, никогда больше трёх одновременно, и все результаты слились в один канал для сборщика.",
    "No locks, no shared mutable state, no manual bookkeeping - the channel's blocking send/receive IS the synchronization.": "Без блокировок, без общего изменяемого состояния, без ручного учёта - блокирующая отправка/приём канала И ЕСТЬ синхронизация.",

    // error-context
    "A request creates a root context": "Запрос создаёт корневой контекст",
    "Every cancellation tree starts from one context at the top - typically derived from the incoming request.": "Каждое дерево отмены начинается с одного контекста на вершине - обычно производного от входящего запроса.",
    "Having ONE source of truth for 'should this request keep going' is what makes it possible to cancel an entire call tree with a single action later.": "Наличие ОДНОГО источника истины для «должен ли этот запрос продолжаться» - вот что позже позволяет отменить всё дерево вызовов одним действием.",
    "Children derive their own contexts": "Дети создают собственные производные контексты",
    "Each branch derives a child context - WithCancel, WithTimeout - rather than creating an unrelated one from scratch.": "Каждая ветвь создаёт производный дочерний контекст - WithCancel, WithTimeout - а не создаёт несвязанный с нуля.",
    "Deriving (not creating fresh) is what wires the child to the parent: cancel the parent, and every derived child is automatically cancelled too.": "Именно наследование (а не создание с нуля) связывает потомка с родителем: отмените родителя - и каждый производный потомок автоматически тоже отменится.",
    "Goroutines attach at the leaves": "Горутины прикрепляются на листьях",
    "Worker goroutines hold the leaf contexts and do real work - an HTTP call, a DB query - while watching ctx.Done() for a cancellation signal.": "Горутины-воркеры держат листовые контексты и выполняют реальную работу - HTTP-вызов, запрос к БД - при этом следя за ctx.Done() на сигнал отмены.",
    "This is the realistic shape of a Go service: a deep tree of derived contexts with actual work happening only at the edges.": "Это реалистичная форма Go-сервиса: глубокое дерево производных контекстов, где реальная работа происходит только на краях.",
    "The deadline fires at the root": "Дедлайн срабатывает в корне",
    "2 seconds elapse (or someone calls the root's cancel() function) - the root's Done() channel closes.": "Проходит 2 секунды (или кто-то вызывает функцию cancel() корня) - канал Done() корня закрывается.",
    "Only the root needs to know WHY the request is ending (timeout, client disconnect, explicit cancel) - everything below just reacts to one signal.": "Только корню нужно знать, ПОЧЕМУ запрос завершается (таймаут, отключение клиента, явная отмена) - всё, что ниже, просто реагирует на один сигнал.",
    "Cancellation propagates down every edge": "Отмена распространяется по каждому ребру",
    "The signal flows from root to children to grandchildren - each derived context's Done() closes in turn, depth by depth.": "Сигнал идёт от корня к детям, затем к внукам - Done() каждого производного контекста закрывается по очереди, уровень за уровнем.",
    "This is automatic precisely BECAUSE children were derived, not created independently - there's no manual fan-out code that has to remember every goroutine.": "Это происходит автоматически именно ПОТОМУ, что дети были производными, а не созданными независимо - нет ручного кода fan-out, который должен помнить каждую горутину.",
    "Clean shutdown - no goroutine leak": "Чистое завершение - утечек горутин нет",
    "Cancellation reached every descendant. Every worker observed ctx.Done() closing and returned.": "Отмена достигла каждого потомка. Каждый воркер увидел закрытие ctx.Done() и завершился.",
    "This is the payoff this whole module (and M7's leak detector) cares about: a goroutine that never learns its work is unwanted is a goroutine that never exits.": "Вот в чём выигрыш всего этого модуля (и детектора утечек из M7): горутина, которая никогда не узнаёт, что её работа не нужна - это горутина, которая никогда не завершится.",

    // mux-trie
    "A request arrives": "Приходит запрос",
    "GET /api/v1/ledger/42 enters Go's native net/http router.": "GET /api/v1/ledger/42 попадает во встроенный роутер net/http.",
    "The router's only job is mapping this one string to the right handler, fast - everything in this module is about how it does that without regular expressions.": "Единственная задача роутера - быстро сопоставить эту строку с нужным хендлером. Весь этот модуль о том, как он делает это без регулярных выражений.",
    "The router walks a trie, segment by segment": "Роутер идёт по trie, сегмент за сегментом",
    "ServeMux matches each path segment against the trie one node at a time - /api, then /v1, then /ledger - until it can't go any deeper.": "ServeMux сопоставляет каждый сегмент пути с trie по одному узлу за раз - /api, затем /v1, затем /ledger - пока не сможет идти глубже.",
    "A trie turns routing into a fixed number of cheap segment comparisons instead of testing the path against every registered pattern in turn.": "Trie превращает маршрутизацию в фиксированное число дешёвых сравнений сегментов вместо проверки пути по очереди против каждого зарегистрированного шаблона.",
    "{id} captures the wildcard segment": "{id} захватывает произвольный сегмент",
    'The trie\'s last node is a wildcard - it matches ANY segment and captures it as "42", readable in the handler via r.PathValue("id").': 'Последний узел trie - это wildcard: он совпадает с ЛЮБЫМ сегментом и захватывает его как "42", доступное в хендлере через r.PathValue("id").',
    "A typed wildcard node is what lets one route handle /ledger/42, /ledger/99, /ledger/anything - without falling back to slower regexp matching.": "Именно типизированный wildcard-узел позволяет одному маршруту обрабатывать /ledger/42, /ledger/99, /ledger/что-угодно - без отката к более медленному сопоставлению по regexp.",
    "Handler resolves → 200 OK": "Хендлер срабатывает → 200 OK",
    "Once both the method (GET) and the full path match, the registered handler runs and returns a response.": "Когда совпадают и метод (GET), и весь путь, зарегистрированный хендлер выполняется и возвращает ответ.",
    "Matching method AND path together (not just path) is what lets GET /ledger/42 and DELETE /ledger/42 route to two completely different handlers.": "Именно совпадение метода И пути вместе (а не только пути) позволяет GET /ledger/42 и DELETE /ledger/42 направляться в два совершенно разных хендлера.",
    "os.Root: a directory you can't escape": "os.Root: каталог, из которого не выйти",
    'A handler that reads files opens them through os.Root("data") instead of the raw filesystem - every path it resolves is forced to stay inside data/.': 'Хендлер, читающий файлы, открывает их через os.Root("data") вместо прямого доступа к файловой системе - любой путь, который он резолвит, обязан оставаться внутри data/.',
    "Path traversal (`../../etc/passwd`) is a classic vulnerability - os.Root makes 'escaping the jail' a type error, not a runtime check you might forget.": "Обход пути (`../../etc/passwd`) - классическая уязвимость. os.Root превращает «выход из песочницы» в ошибку типов, а не в проверку в рантайме, которую можно забыть.",
    "An escape attempt is blocked": "Попытка выхода блокируется",
    "A read of ../../etc/passwd tries to walk OUT of data/ using relative path tricks.": "Чтение ../../etc/passwd пытается выйти ЗА пределы data/, используя трюки с относительными путями.",
    "If this succeeded, any handler taking a user-supplied filename could be tricked into reading arbitrary files on the host.": "Если бы это удалось, любой хендлер, принимающий имя файла от пользователя, можно было бы обмануть и заставить читать произвольные файлы на хосте.",
    "Legitimate reads still succeed": "Легитимные чтения всё равно работают",
    'root.Open("config.json") resolves inside the jail and works exactly like a normal file read - no extra code in the handler.': 'root.Open("config.json") резолвится внутри песочницы и работает точно как обычное чтение файла - без дополнительного кода в хендлере.',
    "The safety is structural: code that only ever has an *os.Root, never a raw path, cannot accidentally escape the jail - there's no boundary check to forget.": "Безопасность структурная: код, у которого есть только *os.Root, но никогда сырой путь, не может случайно выйти из песочницы - тут нет проверки границы, которую можно забыть.",

    // swiss-table
    'The same lookup: m["USD"]': 'Один и тот же поиск: m["USD"]',
    "We'll trace this one lookup through two implementations: Go's legacy map, and the new Swiss Table design.": "Мы проследим этот один поиск через две реализации: старую map в Go и новую конструкцию Swiss Table.",
    "The map TYPE never changes in your code - only the internal layout does. Seeing both traces side by side (in time, not space) shows exactly what that internal change buys you.": "ТИП map в вашем коде никогда не меняется - меняется только внутреннее устройство. Просмотр обоих трейсов рядом (во времени, не в пространстве) показывает, что именно даёт это внутреннее изменение.",
    "Legacy map: probe slot by slot": "Старая map: проверяем слот за слотом",
    "The old map walks its bucket one entry at a time, comparing keys, until it finds USD or runs out of entries.": "Старая map проходит свой bucket по одной записи, сравнивая ключи, пока не найдёт USD или не закончатся записи.",
    "Each entry lives at a different memory address, so each check that misses is very likely its OWN separate cache miss - the cost adds up linearly.": "Каждая запись живёт по своему адресу памяти, поэтому каждая неудачная проверка - это, скорее всего, СВОЙ отдельный промах кэша - стоимость растёт линейно.",
    "Swiss Table: jump straight to one group of 8": "Swiss Table: сразу переходим к одной группе из 8",
    "The hash picks a single 8-slot group, and its 8 one-byte 'control bytes' - a tiny fingerprint per slot - all live together in ONE cache line.": "Хэш выбирает одну группу из 8 слотов, и её 8 однобайтовых «контрольных байтов» - крошечный отпечаток на слот - все живут вместе в ОДНОЙ кэш-линии.",
    "Loading 8 slots' worth of metadata costs the same one cache-line fetch as loading just one - the layout was designed around that fact.": "Загрузка метаданных для 8 слотов стоит ровно одну загрузку кэш-линии, как и загрузка одного - устройство было спроектировано именно под этот факт.",
    "SIMD compares all 8 tags in one operation": "SIMD сравнивает все 8 тегов за одну операцию",
    "Instead of checking slot 0, then slot 1, then slot 2…, one SIMD-style instruction compares the target's fingerprint against all 8 control bytes simultaneously.": "Вместо проверки слота 0, затем слота 1, затем слота 2…, одна SIMD-инструкция сравнивает отпечаток цели со всеми 8 контрольными байтами одновременно.",
    "This is the structural win: legacy map cost scales with HOW MANY entries you check; Swiss Table cost is closer to constant - one fetch, one compare, almost always.": "Вот структурный выигрыш: стоимость старой map растёт с ТЕМ, сколько записей вы проверяете; стоимость Swiss Table почти константна - одна загрузка, одно сравнение, почти всегда.",
    "Match found - one cache line touched, total": "Совпадение найдено - всего одна затронутая кэш-линия",
    'USD sits in slot 2 of the group - found immediately. The whole lookup cost ONE cache-line fetch, versus up to 5 for the legacy map.': 'USD находится в слоте 2 группы - найдено сразу. Весь поиск стоил ОДНУ загрузку кэш-линии против до 5 у старой map.',
    "This is why the Swiss Table redesign matters in practice: hot map lookups in a request path get measurably faster purely from this layout change - no code changes required.": "Вот почему редизайн Swiss Table важен на практике: горячие поиски в map на пути запроса измеримо ускоряются просто за счёт изменения устройства - без изменений в коде.",

    // cleanup-seq
    "The object is alive": "Объект жив",
    "A *Conn lives inside a parent span. The stack holds a reference to it, so the garbage collector considers it reachable - alive.": "*Conn живёт внутри родительского span. Стек держит на него ссылку, поэтому сборщик мусора считает его достижимым - живым.",
    "Reachability from a root is the ONLY thing that keeps an object alive in Go - not how recently it was used, not its size, just 'can a root still get to it.'": "Достижимость из корня - ЕДИНСТВЕННОЕ, что держит объект живым в Go - не то, как недавно он использовался, не его размер, а только «может ли корень до него добраться».",
    "The last reference drops": "Последняя ссылка исчезает",
    "Whatever held that reference returns or goes out of scope. The *Conn is now unreachable from any root - eligible for collection, but not yet collected.": "То, что держало эту ссылку, возвращается или выходит из области видимости. *Conn теперь недостижим из любого корня - годен для сборки, но пока не собран.",
    "'Unreachable' and 'freed' are NOT the same moment in Go - there's a gap, and that gap is exactly what the next two steps are about.": "«Недостижим» и «освобождён» - это НЕ один и тот же момент в Go, между ними есть промежуток, и следующие два шага именно об этом промежутке.",
    "The GC's next mark pass finds it dead": "Следующий проход пометки GC находит его мёртвым",
    "The concurrent collector sweeps through live memory tracing from the roots. The *Conn is never reached this time - it's now PROVABLY garbage, not just assumed.": "Конкурентный сборщик проходит по живой памяти, трассируя от корней. *Conn на этот раз не достигается - теперь это ДОКАЗАННЫЙ мусор, а не просто предположение.",
    "Go won't free an object the instant it looks unused - it waits for the mark pass to confirm it, which is what makes collection safe even with concurrent mutation.": "Go не освобождает объект в момент, когда он ВЫГЛЯДИТ неиспользуемым - он ждёт подтверждения от прохода пометки, что и делает сборку безопасной даже при конкурентных изменениях.",
    "The registered cleanup runs exactly once": "Зарегистрированная очистка выполняется ровно один раз",
    "runtime.AddCleanup fires: syscall.Close(7). It captured the file descriptor by VALUE when registered - not the object itself, so it can run safely even though *Conn is gone.": "runtime.AddCleanup срабатывает: syscall.Close(7). Он захватил файловый дескриптор ПО ЗНАЧЕНИЮ при регистрации - не сам объект, поэтому может безопасно выполниться, даже когда *Conn уже нет.",
    "Unlike the legacy SetFinalizer, AddCleanup never resurrects the object and never silently skips a cycle - it's a plain function call guaranteed to run once, on a dead object.": "В отличие от старого SetFinalizer, AddCleanup никогда не воскрешает объект и никогда молча не пропускает цикл - это обычный вызов функции, гарантированно выполняемый один раз, на мёртвом объекте.",
    "Memory freed, no extra delay": "Память освобождена, без лишней задержки",
    "The parent span is reclaimed in the SAME cycle that proved the object dead - no resurrection pass, no waiting an extra GC cycle.": "Родительский span освобождается в ТОМ ЖЕ цикле, который доказал смерть объекта - без прохода воскрешения, без ожидания лишнего цикла GC.",
    "This is the practical reason AddCleanup replaced finalizers for resource cleanup: deterministic, single-cycle reclamation means file descriptors and connections don't linger.": "Это практическая причина, по которой AddCleanup заменил финализаторы для очистки ресурсов: детерминированное освобождение за один цикл означает, что файловые дескрипторы и соединения не задерживаются.",

    // synctest-bubble
    "Goroutines start inside an isolated bubble": "Горутины стартуют внутри изолированного пузыря",
    "Three goroutines run inside a synctest bubble - a sandbox with its OWN fake clock, separate from real wall-clock time.": "Три горутины выполняются внутри пузыря synctest - песочницы со СВОИМИ фальшивыми часами, отдельными от настенного времени.",
    "Isolating both the goroutines AND time itself is what will let the test fast-forward through delays instead of actually waiting for them.": "Именно изоляция и горутин, И самого времени позволит тесту промотать задержки вперёд, а не реально их ждать.",
    "Each one runs, then blocks": "Каждая выполняется, затем блокируется",
    "G1 sleeps for 0.5s, G2 for 0.8s, G3 for 1.0s (or waits on a channel) - each parks the moment it has nothing left to do.": "G1 спит 0.5с, G2 - 0.8с, G3 - 1.0с (или ждёт на канале) - каждая паркуется в момент, когда ей больше нечего делать.",
    "A real test would have to actually wait out the slowest of these - that's the time cost synctest is about to eliminate.": "Настоящему тесту пришлось бы реально дождаться самой медленной из них - именно эти временные затраты synctest сейчас устранит.",
    "synctest.Wait: a precise barrier": "synctest.Wait: точный барьер",
    "The test calls synctest.Wait, which blocks until EVERY goroutine in the bubble is durably parked - not 'probably done', but provably done.": "Тест вызывает synctest.Wait, который блокируется, пока КАЖДАЯ горутина в пузыре не устойчиво припаркована - не «вероятно готова», а доказуемо готова.",
    "This replaces a guessed time.Sleep(100*time.Millisecond) 'hope it's enough' with an exact, race-free synchronization point.": "Это заменяет угаданный time.Sleep(100*time.Millisecond) «надеюсь, хватит» точной, свободной от гонок точкой синхронизации.",
    "The fake clock jumps to the next timer": "Фальшивые часы перескакивают к следующему таймеру",
    "With every goroutine confirmed blocked, the bubble's clock fast-forwards directly to whenever the next timer fires - instantly, no real waiting.": "Когда подтверждено, что каждая горутина блокирована, часы пузыря мгновенно перематываются прямо к моменту срабатывания следующего таймера - без реального ожидания.",
    "Real time and bubble time are decoupled: the test can simulate 5 real-world seconds of timers in microseconds of actual CPU time.": "Реальное время и время пузыря разделены: тест может симулировать 5 реальных секунд таймеров за микросекунды настоящего процессорного времени.",
    "Goroutines wake and finish": "Горутины пробуждаются и завершаются",
    "Now that their timers/channels are ready, all three goroutines resume, complete their work, and the test's assertions run against a fully settled state.": "Теперь, когда их таймеры/каналы готовы, все три горутины продолжают работу, завершают её, и проверки теста выполняются на полностью устоявшемся состоянии.",
    "Because everything is driven by the deterministic bubble clock, there's no window where the assertions could race against a goroutine that's still finishing.": "Поскольку всё управляется детерминированными часами пузыря, нет окна, где проверки могли бы гоняться с горутиной, которая ещё завершается.",
    "No flakes: wall ≈ 0s, bubble = 5s": "Без нестабильности: настенное время ≈ 0с, время пузыря = 5с",
    "The whole test simulated 5 seconds of timers while real wall-clock time barely moved - fully deterministic, every run, every machine.": "Весь тест симулировал 5 секунд таймеров, пока настенное время почти не двигалось - полностью детерминировано, при каждом запуске, на любой машине.",
    "No time.Sleep means no 'flaky on a slow CI box' - the test's correctness no longer depends on how fast the test runner happens to be today.": "Отсутствие time.Sleep означает отсутствие «нестабильности на медленном CI» - корректность теста больше не зависит от того, насколько быстрой машине сегодня довелось его запускать.",

    // sql-txn
    "Two transfers want the same account": "Два перевода хотят один и тот же счёт",
    "T1 and T2 are both transactions trying to move money - and both need to touch account A at the same moment.": "T1 и T2 - обе транзакции пытаются перевести деньги, и обеим нужно тронуть счёт A в один и тот же момент.",
    "This exact scenario - concurrent writers, shared row - is what row-level locking exists to make safe.": "Именно этот сценарий - конкурентные писатели, общая строка - блокировка на уровне строк и существует, чтобы сделать безопасным.",
    "T1 locks account A": "T1 блокирует счёт A",
    "T1 runs SELECT … FOR UPDATE, which takes a lock on just that one row - not the whole table.": "T1 выполняет SELECT … FOR UPDATE, который берёт блокировку только на эту одну строку - не на всю таблицу.",
    "Locking only the specific row means transfers touching DIFFERENT accounts can still run fully in parallel - the lock's scope is as narrow as correctness allows.": "Блокировка только конкретной строки означает, что переводы, затрагивающие ДРУГИЕ счета, могут выполняться полностью параллельно - область блокировки настолько узкая, насколько позволяет корректность.",
    "T2 blocks behind the lock": "T2 блокируется за блокировкой",
    "T2 also needs account A, so it simply waits - Postgres won't let it read until T1's transaction finishes.": "T2 тоже нужен счёт A, поэтому он просто ждёт - Postgres не даст ему прочитать, пока транзакция T1 не завершится.",
    "If T2 read A mid-transfer, it could see a half-finished state (debited but not yet credited) - blocking prevents that entirely.": "Если бы T2 прочитал A в середине перевода, он мог бы увидеть наполовину завершённое состояние (списано, но ещё не зачислено) - блокировка полностью это предотвращает.",
    "Inside the transaction: debit and credit together": "Внутри транзакции: списание и зачисление вместе",
    "T1 subtracts $100 from A and adds $100 to B - both statements run inside the SAME transaction, so they can never land separately.": "T1 вычитает $100 из A и добавляет $100 к B - оба выражения выполняются внутри ОДНОЙ транзакции, поэтому они никогда не могут применяться отдельно.",
    "This is double-entry: if the process crashed between the two writes, the whole transaction rolls back - you never end up with money debited from A but never credited to B.": "Это двойная запись: если процесс упадёт между двумя записями, вся транзакция откатывается - вы никогда не получите деньги, списанные с A, но так и не зачисленные на B.",
    "COMMIT releases the lock": "COMMIT освобождает блокировку",
    "T1 commits - its changes become permanent, and the row lock on account A is released immediately.": "T1 коммитится - его изменения становятся постоянными, и блокировка строки счёта A немедленно освобождается.",
    "The lock is held for the shortest time that's still correct: exactly as long as T1's transaction is open, no longer.": "Блокировка держится минимально возможное время, при котором всё ещё корректно: ровно столько, сколько открыта транзакция T1, не дольше.",
    "T2 proceeds - the invariant held": "T2 продолжает - инвариант сохранён",
    "T2 now reads fresh, consistent balances and runs its own transfer. Through all of this, the total money in the system never changed.": "T2 теперь читает свежие, согласованные балансы и выполняет свой перевод. За всё это время общая сумма денег в системе не изменилась.",
    "This is the proof the pattern works: concurrent access was serialized just enough to keep Σ(balances) constant, without serializing the WHOLE database.": "Это доказательство того, что паттерн работает: конкурентный доступ был сериализован ровно настолько, чтобы Σ(балансов) оставалась постоянной, без сериализации ВСЕЙ базы данных.",

    // postgres-deep
    "A transfer enters the database boundary": "Перевод входит в границу базы",
    "The service receives one request, but the durable truth will be created by several tables together: accounts, transfers, ledger entries, and the outbox.": "Сервис получает один запрос, но долговременная истина будет создана несколькими таблицами вместе: accounts, transfers, ledger entries и outbox.",
    "The database boundary matters because retries, crashes, and duplicate requests all meet at the same place: the transaction.": "Граница базы важна, потому что retries, crashes и дубликаты запросов встречаются в одном месте: в транзакции.",
    "CHECK constraints reject impossible values": "CHECK constraints отвергают невозможные значения",
    "The schema refuses negative balances and non-positive transfer amounts before the data can become durable.": "Схема отказывает отрицательным балансам и неположительным суммам перевода до того, как данные станут долговечными.",
    "Go validation gives good error messages; Postgres constraints protect the data when a bad binary deploys anyway.": "Go-валидация даёт хорошие ошибки; Postgres constraints защищают данные, когда плохой бинарник всё равно задеплоен.",
    "UNIQUE idempotency_key absorbs retries": "UNIQUE idempotency_key поглощает retries",
    "The same client retry reaches the database twice, but the unique key lets only one transfer identity exist.": "Один и тот же client retry доходит до базы дважды, но unique key разрешает существовать только одной identity перевода.",
    "This is what stops timeouts and retry loops from double-charging a customer.": "Именно это не даёт timeouts и retry loops списать деньги дважды.",
    "Ledger rows and outbox commit atomically": "Строки леджера и outbox коммитятся атомарно",
    "The debit, credit, transfer row, and event row land in one transaction, so no downstream publisher can see a business event that the ledger did not commit.": "Debit, credit, transfer row и event row попадают в одну транзакцию, поэтому downstream publisher не увидит business event, который леджер не закоммитил.",
    "The outbox pattern turns 'write then publish' into a recoverable database fact instead of a timing hope.": "Outbox pattern превращает «записать, потом опубликовать» в восстанавливаемый факт базы, а не надежду на тайминг.",
    "A query shape arrives": "Приходит форма запроса",
    "The service asks for the latest 50 ledger entries for one account, ordered by posted_at descending.": "Сервис просит последние 50 ledger entries для одного счёта, отсортированные по posted_at descending.",
    "The planner optimizes this exact shape, not your mental model of which columns feel important.": "Планировщик оптимизирует именно эту форму, а не вашу ментальную модель важных колонок.",
    "No matching index means a wide scan": "Без подходящего индекса получается широкий scan",
    "A sequential scan may touch thousands or millions of rows, then sort, just to return a tiny page.": "Sequential scan может тронуть тысячи или миллионы строк и потом сортировать, чтобы вернуть маленькую страницу.",
    "The danger is not only time; it is shared buffer churn that evicts useful pages for other requests.": "Опасность не только во времени, но и в churn shared buffers, который вытесняет полезные страницы для других запросов.",
    "Composite index follows filter then sort": "Составной индекс следует фильтру, затем сортировке",
    "An index on (account_id, posted_at DESC) lets Postgres jump to one account's newest rows in order.": "Индекс на (account_id, posted_at DESC) позволяет Postgres прыгнуть к новейшим строкам одного счёта уже в порядке сортировки.",
    "Column order encodes the query shape: equality first, then ordering/range.": "Порядок колонок кодирует форму запроса: equality сначала, затем ordering/range.",
    "INCLUDE can avoid heap fetches": "INCLUDE может избежать heap fetches",
    "Including amount and direction lets the index answer the selected columns without visiting the table for every row.": "Включение amount и direction позволяет индексу ответить выбранными колонками без посещения таблицы для каждой строки.",
    "Covering helps only when the query really projects those columns and visibility permits an index-only scan.": "Covering помогает только если запрос реально возвращает эти колонки и visibility позволяет index-only scan.",
    "EXPLAIN proves the real plan": "EXPLAIN доказывает реальный план",
    "EXPLAIN (ANALYZE, BUFFERS) shows actual timing and whether the plan burned buffers or heap fetches.": "EXPLAIN (ANALYZE, BUFFERS) показывает фактическое время и сжигал ли план buffers или heap fetches.",
    "The optimization is not done until the second measurement proves it.": "Оптимизация не закончена, пока второе измерение её не доказало.",
    "A heavy DDL lock stops the table": "Тяжёлая DDL-блокировка останавливает таблицу",
    "Some schema changes need locks that block writers. On a hot table, that can become an incident before the migration finishes.": "Некоторым изменениям схемы нужны блокировки, останавливающие писателей. На горячей таблице это может стать инцидентом до завершения миграции.",
    "A migration is production code running against your largest stateful dependency. Treat it with the same care as a deploy.": "Миграция - production-код, работающий против вашей самой большой stateful-зависимости. Относитесь к ней как к деплою.",
    "Concurrent index build keeps writes moving": "Concurrent index build сохраняет записи",
    "CREATE INDEX CONCURRENTLY takes longer but avoids blocking ordinary reads and writes while the index is built.": "CREATE INDEX CONCURRENTLY занимает больше времени, но не блокирует обычные чтения и записи, пока индекс строится.",
    "You pay with time and restrictions, but you avoid turning the database into a single-file queue.": "Вы платите временем и ограничениями, но не превращаете базу в однопоточную очередь.",
    "Long transactions pin old row versions": "Длинные транзакции удерживают старые версии строк",
    "MVCC keeps old versions visible to old snapshots. A long transaction can keep those versions alive long after writers moved on.": "MVCC держит старые версии видимыми для старых snapshots. Длинная транзакция может удерживать эти версии долго после того, как писатели ушли дальше.",
    "This is how normal update traffic quietly becomes table and index bloat.": "Так обычный update-трафик тихо превращается в bloat таблиц и индексов.",
    "Vacuum cannot clean pinned tuples": "Vacuum не может очистить удержанные tuples",
    "Vacuum sees dead tuples, but it cannot remove versions that an old snapshot might still need.": "Vacuum видит dead tuples, но не может удалить версии, которые старому snapshot всё ещё могут понадобиться.",
    "Autovacuum is not magic; it needs transactions to end and enough IO budget to keep up.": "Autovacuum - не магия; ему нужны завершённые транзакции и достаточный IO budget.",
    "Batch backfills release pressure": "Batch backfills снимают давление",
    "Small batches with short transactions let writers continue, let vacuum clean, and make the migration interruptible.": "Малые батчи с короткими транзакциями дают писателям продолжать, vacuum - чистить, а миграции - быть прерываемой.",
    "Expand/backfill/contract is boring, and boring is exactly what you want from production database changes.": "Expand/backfill/contract скучен, и именно скучности вы хотите от production database changes.",

    // pqc-lattice
    "Two handshakes, same shape, different math": "Два рукопожатия, одна форма, разная математика",
    "Channel A negotiates a classical X25519 key. Channel B negotiates a hybrid key - classical X25519 PLUS a lattice-based ML-KEM-768 key, combined.": "Канал A договаривается о классическом ключе X25519. Канал B договаривается о гибридном ключе - классический X25519 ПЛЮС решёточный ключ ML-KEM-768, объединённые.",
    "Both look identical at the protocol level - a normal TLS handshake. The difference that matters is invisible: what hard math problem the key relies on.": "На уровне протокола оба выглядят одинаково - обычное TLS-рукопожатие. Значимая разница невидима: на какую сложную математическую задачу опирается ключ.",
    "An attacker harvests today's ciphertext": "Атакующий собирает сегодняшний шифротекст",
    "A passive adversary doesn't try to break the key right now - it just records both encrypted sessions and stores them.": "Пассивный атакующий не пытается взломать ключ прямо сейчас - он просто записывает обе зашифрованные сессии и сохраняет их.",
    "This is 'harvest now, decrypt later': the attack doesn't need to be feasible TODAY, only by the time a quantum computer exists.": "Это «собери сейчас, расшифруй позже»: атаке не нужно быть реализуемой СЕГОДНЯ, только к моменту, когда появится квантовый компьютер.",
    "Years later: a quantum computer arrives": "Годы спустя: появляется квантовый компьютер",
    "A cryptographically-relevant quantum computer comes online and is pointed at both stored recordings.": "Криптографически значимый квантовый компьютер запускается и направляется на обе сохранённые записи.",
    "This is the whole premise of post-quantum cryptography: defend data today against a computer that doesn't exist yet, because the recording already happened.": "В этом вся суть постквантовой криптографии: защищать данные сегодня от компьютера, которого ещё не существует, потому что запись уже произошла.",
    "Channel A's classical key falls": "Классический ключ канала A падает",
    "Shor's algorithm efficiently solves the discrete-log problem that X25519's security rests on - the recorded session decrypts.": "Алгоритм Шора эффективно решает задачу дискретного логарифма, на которой держится безопасность X25519 - записанная сессия расшифровывается.",
    "This is exactly why 'classical-only' key exchange is a liability for any data that needs to stay secret for years: today's strong key becomes tomorrow's broken one.": "Именно поэтому «только классический» обмен ключами - это риск для любых данных, которые должны храниться в секрете годами: сегодняшний сильный ключ становится завтрашним взломанным.",
    "Channel B's hybrid key holds": "Гибридный ключ канала B держится",
    "The ML-KEM-768 lattice key has no known efficient quantum attack - so even though the ciphertext was recorded, it stays unreadable.": "У решёточного ключа ML-KEM-768 нет известной эффективной квантовой атаки - поэтому, хотя шифротекст и был записан, он остаётся нечитаемым.",
    "Hybrid means EITHER half failing is survivable: it's only broken if BOTH the classical AND the lattice problem fall - a much higher bar than relying on one algorithm alone.": "Гибрид означает, что провал ЛЮБОЙ из половин переживаем: взлом происходит только если падают И классическая, И решёточная задача - гораздо более высокая планка, чем опора на один алгоритм.",

    // leak-graph
    "A live goroutine graph": "Граф живых горутин",
    "Goroutines are nodes; the channels and contexts connecting them are the edges. This is the shape the leak analyzer reasons about.": "Горутины - это узлы; каналы и контексты, соединяющие их - это рёбра. Именно с этой формой рассуждает анализатор утечек.",
    "Most goroutine leaks aren't a mystery once you can SEE the dependency graph - they're usually one missing edge.": "Большинство утечек горутин - не загадка, если вы можете УВИДЕТЬ граф зависимостей - обычно это одно недостающее ребро.",
    "G4 is stuck forever": "G4 застряла навсегда",
    "G4 is parked on <-results - and tracing the graph, NOTHING will ever send on that channel. It will wait until the process dies.": "G4 припаркована на <-results - и, трассируя граф, видно, что НИЧТО никогда не отправит в этот канал. Она будет ждать до самой смерти процесса.",
    "A blocked goroutine isn't automatically a leak - other goroutines block briefly all the time. It's a leak specifically because nothing can ever wake it.": "Блокированная горутина не является утечкой автоматически - другие горутины блокируются на короткое время постоянно. Это утечка именно потому, что ничто никогда не может её разбудить.",
    "The analyzer traces backward": "Анализатор трассирует назад",
    "Starting from the blocked goroutine, the analyzer walks the channel graph backward - G4 ← G3 - hunting for whoever was supposed to send.": "Начиная с блокированной горутины, анализатор идёт по графу каналов назад - G4 ← G3 - в поисках того, кто должен был отправить.",
    "Walking the graph backward from the symptom is exactly how you'd debug this by hand - the analyzer just does it instantly and exhaustively.": "Проход по графу назад от симптома - именно так вы бы дебажили это руками - анализатор просто делает это мгновенно и исчерпывающе.",
    "Root cause found": "Корневая причина найдена",
    "G2 dispatch is the actual problem: it never sends on results, and its context had no deadline to force it to give up and move on.": "G2 dispatch - вот настоящая проблема: она никогда не отправляет в results, а у её контекста не было дедлайна, чтобы заставить её сдаться и продолжить.",
    "Localizing to ONE goroutine and ONE missing send turns 'the program hangs sometimes' into a fix you can make in one line.": "Локализация до ОДНОЙ горутины и ОДНОЙ недостающей отправки превращает «программа иногда виснет» в исправление одной строкой.",
    "Read the goroutine dump": "Прочитайте дамп горутин",
    "The raw evidence is one SIGQUIT away: the dump names every goroutine, its wait reason and HOW LONG it has waited. Minutes of [chan receive] on a millisecond workload is the smoking gun.": "Сырая улика - на расстоянии одного SIGQUIT: дамп называет каждую горутину, причину её ожидания и СКОЛЬКО она уже ждёт. Минуты в [chan receive] на миллисекундной нагрузке - это дымящийся пистолет.",
    "Every Go binary already ships this tool. Reading the wait reason and duration is the fastest first move in any hang investigation - before profilers, before dashboards.": "Этот инструмент уже встроен в каждый Go-бинарь. Чтение причины и длительности ожидания - самый быстрый первый ход в любом расследовании зависания: до профилировщиков, до дашбордов.",
    "waiting for 5 minutes ⚠": "ждёт уже 5 минут ⚠",
    "One-line fix: a deadline": "Исправление одной строкой: дедлайн",
    "With context.WithTimeout around G2's work, the send either happens or the deadline fires - either way G4 wakes up and the graph drains cleanly.": "С context.WithTimeout вокруг работы G2 отправка либо происходит, либо срабатывает дедлайн - в любом случае G4 просыпается, и граф чисто опустошается.",
    "Leaks aren't fixed by restarting goroutines - they're fixed by guaranteeing every wait has a second exit: a send, a close, or a deadline.": "Утечки не чинятся перезапуском горутин - они чинятся гарантией, что у каждого ожидания есть второй выход: отправка, close или дедлайн.",
    "✓ G4 drained": "✓ G4 освобождена",
    "Guard the boundary in tests": "Охраняйте границу в тестах",
    "Count goroutines when a test starts and when it ends. If the numbers differ after everything should have drained, fail the test - the leak never reaches production.": "Считайте горутины на старте теста и на его финише. Если числа расходятся после того, как всё должно было завершиться - проваливайте тест: утечка никогда не доедет до продакшена.",
    "Production forensics is the backup plan. The cheap win is refusing to merge code that leaks: a boundary check turns a silent leak into red CI.": "Форензика в продакшене - запасной план. Дешёвая победа - отказ мержить текущий код: проверка на границе превращает тихую утечку в красный CI.",
    "goroutines at start: 4": "горутин на старте: 4",
    "goroutines at end:   4 ✓": "горутин на финише:  4 ✓",
    "PASS · no leaks": "PASS · без утечек",

    // simd-gc
    "Same work, two engines": "Одна работа, два движка",
    "We'll process the same 32-element array two ways: a plain scalar loop, one element at a time, and a SIMD vector loop.": "Мы обработаем один и тот же массив из 32 элементов двумя способами: обычным скалярным циклом, по одному элементу за раз, и векторным циклом SIMD.",
    "Comparing them on identical work isolates exactly what the vector hardware buys you - nothing about the task itself changes.": "Сравнение их на одинаковой работе изолирует именно то, что даёт векторное железо - сама задача при этом не меняется.",
    "Scalar: one element per cycle": "Скаляр: один элемент за такт",
    "The plain loop touches a single array element each iteration - the pointer crawls along one cell at a time.": "Обычный цикл трогает один элемент массива за итерацию - указатель ползёт по одной ячейке за раз.",
    "This is the baseline: N elements means N cycles of work, no matter how simple each individual step is.": "Это базовая линия: N элементов означает N тактов работы, независимо от того, насколько прост каждый отдельный шаг.",
    "SIMD: sixteen elements per cycle": "SIMD: шестнадцать элементов за такт",
    "One vector instruction loads and processes a whole 16-element lane at once - the same array, far fewer trips through the loop.": "Одна векторная инструкция загружает и обрабатывает целую дорожку из 16 элементов за раз - тот же массив, гораздо меньше проходов через цикл.",
    "The CPU has dedicated wide registers and circuits for this - it's not 'doing 16 things fast', it's doing them in the SAME instruction.": "У CPU есть выделенные широкие регистры и схемы именно для этого - это не «делать 16 вещей быстро», это делать их за ОДНУ инструкцию.",
    "Same result, ~16× fewer cycles": "Тот же результат, ~в 16× меньше тактов",
    "Both loops produce the identical output - only the number of cycles spent getting there differs.": "Оба цикла производят идентичный результат - различается только число тактов, потраченных на его получение.",
    "This is why hot numeric loops (hashing, checksums, image/byte processing) are worth vectorizing: the speedup is structural, not a micro-optimization.": "Вот почему горячие числовые циклы (хеширование, контрольные суммы, обработка изображений/байтов) стоит векторизовать: ускорение структурное, а не микрооптимизация.",
    "Green Tea GC sweeps contiguous spans": "Green Tea GC собирает мусор по непрерывным спанам",
    "Switching topics: the new collector marks memory in contiguous 8 KiB spans in parallel, instead of chasing one scattered object at a time.": "Меняем тему: новый сборщик помечает память непрерывными спанами по 8 КиБ параллельно, вместо погони за одним разрозненным объектом за раз.",
    "Spans are physically contiguous in memory - exactly the layout that lets a sweep be both vectorizable AND cache-friendly, the same idea as the SIMD loop above.": "Спаны физически непрерывны в памяти - именно такое устройство позволяет сборке быть и векторизуемой, И дружелюбной к кэшу - та же идея, что и в SIMD-цикле выше.",
    "Cache-friendly and scales with cores": "Дружелюбно к кэшу и масштабируется по ядрам",
    "Sequential span scanning avoids the scattered cache misses of object-by-object marking, and multiple cores can sweep different spans in parallel.": "Последовательное сканирование спанов избегает разрозненных промахов кэша при пометке объект-за-объектом, и несколько ядер могут собирать разные спаны параллельно.",
    "This connects directly back to M10: contiguous memory is what makes both a SIMD loop AND a GC sweep fast - the hardware always rewards sequential access.": "Это напрямую связано с M10: именно непрерывная память делает быстрыми и SIMD-цикл, И сборку GC - железо всегда вознаграждает последовательный доступ.",

    // container-rollout
    "Three healthy v1 pods serve traffic": "Три здоровых пода v1 обслуживают трафик",
    "The load balancer spreads incoming requests across every Ready pod. This is the steady state before a rollout begins.": "Балансировщик нагрузки распределяет входящие запросы по всем подам в состоянии Ready. Это устойчивое состояние перед началом раскатки.",
    "A rollout always starts from a known-good baseline - that's what makes it safe to compare against as the upgrade proceeds.": "Раскатка всегда начинается с заведомо исправной базовой линии - именно это делает безопасным сравнение с ней по ходу обновления.",
    "A new v2 pod starts - but gets no traffic yet": "Новый под v2 запускается - но пока не получает трафика",
    "A 4th pod boots running v2. Its readiness probe hasn't passed, so the load balancer deliberately routes it nothing.": "4-й под загружается с v2. Его readiness-проверка ещё не пройдена, поэтому балансировщик намеренно не направляет ему ничего.",
    "Sending live traffic to a pod that isn't ready (still loading config, warming caches) would mean real users hitting errors.": "Отправка живого трафика поду, который не готов (ещё загружает конфиг, разогревает кэши), означала бы, что настоящие пользователи получают ошибки.",
    "Readiness probe passes → pod joins rotation": "Readiness-проверка проходит → под входит в ротацию",
    "Once the probe succeeds, the load balancer adds the v2 pod to rotation immediately - it starts receiving its share of traffic.": "Как только проверка успешна, балансировщик немедленно добавляет под v2 в ротацию - он начинает получать свою долю трафика.",
    "This is the gate that makes rollouts safe: 'started' and 'ready to serve' are different states, and only the second one earns traffic.": "Это тот шлюз, который делает раскатки безопасными: «запущен» и «готов обслуживать» - разные состояния, и только второе заслуживает трафик.",
    "An old v1 pod drains": "Старый под v1 дренируется",
    "Now that v2 is carrying load, one v1 pod stops receiving NEW requests but keeps running until its in-flight requests finish.": "Теперь, когда v2 несёт нагрузку, один под v1 перестаёт получать НОВЫЕ запросы, но продолжает работать, пока не завершатся его запросы в полёте.",
    "Draining (not killing) is what guarantees zero dropped requests - a request that's already in progress always gets to complete.": "Именно дренаж (а не убийство) гарантирует ноль потерянных запросов - запрос, который уже в процессе, всегда получает возможность завершиться.",
    "The slot comes back as v2": "Слот возвращается как v2",
    "Once drained, the old pod terminates and a fresh v2 pod boots in its place - going through the same starting → ready sequence.": "После дренажа старый под завершается, и на его месте загружается новый под v2 - проходя через ту же последовательность запуск → готовность.",
    "Replacing pods ONE AT A TIME (not all at once) means the fleet never drops below enough healthy capacity to serve current load.": "Замена подов ПО ОДНОМУ (не все сразу) означает, что флот никогда не опускается ниже достаточной здоровой мощности для обслуживания текущей нагрузки.",
    "Repeat until the whole fleet is upgraded": "Повторяем, пока весь флот не обновится",
    "The same start → probe → join → drain → replace cycle repeats pod by pod until every pod runs v2.": "Тот же цикл запуск → проверка → вход → дренаж → замена повторяется под за подом, пока каждый под не будет работать на v2.",
    "Zero dropped requests, throughout an entire version upgrade, with no maintenance window - that's the payoff of doing it incrementally.": "Ноль потерянных запросов на протяжении всего обновления версии, без окна обслуживания - вот выигрыш от инкрементального подхода.",

    // cache-hierarchy
    "Small & fast, down to big & slow": "От маленького и быстрого до большого и медленного",
    "Memory is a pyramid: L1 is tiny but ~1 ns, RAM is huge but ~100 ns. Each step down is roughly 10× bigger and 10× slower.": "Память - это пирамида: L1 крошечный, но ~1 нс, RAM огромный, но ~100 нс. Каждый шаг вниз - примерно в 10× больше и в 10× медленнее.",
    "On-chip caches are small because fast memory is expensive to build - so the CPU keeps only the hottest data there and falls back to slower, bigger memory for the rest.": "Кэши на чипе маленькие, потому что быструю память дорого строить - поэтому CPU держит там только самые горячие данные, а для остального откатывается к более медленной, большей памяти.",
    "A miss escalates one level at a time": "Промах поднимается на уровень выше, шаг за шагом",
    "The CPU asks L1 first. Not there? Ask L2. Not there? Ask L3. Each 'no' costs a little more time before moving down.": "CPU сначала спрашивает L1. Нет там? Спрашивает L2. Нет там? Спрашивает L3. Каждое «нет» стоит немного больше времени перед переходом вниз.",
    "Each cache only stores a recent subset of memory - checking the small, fast one first is cheap insurance before paying for a slower lookup.": "Каждый кэш хранит только недавнее подмножество памяти - проверка маленького, быстрого кэша первым - это дешёвая страховка перед платой за более медленный поиск.",
    "RAM answers with a whole 64-byte line": "RAM отвечает целой 64-байтной линией",
    "RAM never hands back a single value - it returns the full 64-byte block containing it, and that block fills L3, then L2, then L1 on the way back up.": "RAM никогда не возвращает одно значение - она возвращает весь 64-байтный блок, содержащий его, и этот блок заполняет L3, затем L2, затем L1 на пути обратно вверх.",
    "Fetching one extra value is almost free once the bus is already moving data, so hardware always moves in line-sized chunks - betting that nearby bytes will be used soon too.": "Получить одно дополнительное значение почти бесплатно, когда шина уже передаёт данные, поэтому железо всегда двигается блоками размером в линию - делая ставку, что соседние байты тоже скоро понадобятся.",
    "The next 7 reads are now nearly free": "Следующие 7 чтений теперь почти бесплатны",
    "Those values were strangers a moment ago; now they live in L1 with the one we asked for. Reading them costs ~1 ns each instead of ~100 ns.": "Эти значения были чужими секунду назад; теперь они живут в L1 вместе с тем, что мы запросили. Их чтение стоит ~1 нс каждое вместо ~100 нс.",
    "This is why sequential, contiguous access (slices) is so much faster than scattered access (linked lists, pointer-chasing) - it cashes in on a line you already paid to fetch.": "Вот почему последовательный, непрерывный доступ (слайсы) настолько быстрее разрозненного доступа (связные списки, погоня за указателями) - он использует линию, за загрузку которой вы уже заплатили.",

    // cpu-pipeline
    "One instruction, five stages": "Одна инструкция, пять стадий",
    "Every instruction passes through 5 fixed stations: Fetch the instruction, Decode it, Execute it, access Memory, Write the result back.": "Каждая инструкция проходит через 5 фиксированных станций: Fetch (выборка), Decode (декодирование), Execute (выполнение), доступ к Memory (памяти), Write-back (запись результата).",
    "Splitting the work into small fixed stages is what lets the next instruction start before this one finishes - that's the whole trick of pipelining.": "Именно разбиение работы на маленькие фиксированные стадии позволяет следующей инструкции начаться до завершения этой - в этом весь фокус конвейеризации.",
    "The next instruction starts one cycle later": "Следующая инструкция начинается на такт позже",
    "While I1 moves to Decode, I2 enters Fetch right behind it - they're in different stages of the SAME pipe at the same time.": "Пока I1 переходит в Decode, I2 входит в Fetch прямо позади неё - они находятся в разных стадиях ОДНОГО конвейера одновременно.",
    "If the core waited for I1 to fully finish before starting I2, four of the five stages would sit idle the whole time. Overlap keeps every stage busy.": "Если бы ядро ждало полного завершения I1 перед началом I2, четыре из пяти стадий простаивали бы всё это время. Перекрытие держит каждую стадию занятой.",
    "Steady state: ~1 instruction retires per cycle": "Устойчивое состояние: ~1 инструкция завершается за такт",
    "Once the pipe is full, a NEW instruction finishes Write-back almost every cycle - even though any single one still takes 5 cycles start to finish.": "Когда конвейер заполнен, НОВАЯ инструкция завершает Write-back почти каждый такт - хотя каждая отдельная инструкция всё ещё занимает 5 тактов от начала до конца.",
    "This is the payoff: pipelining doesn't make one instruction faster, it overlaps many so the average THROUGHPUT approaches one per cycle.": "Вот и выигрыш: конвейеризация не делает одну инструкцию быстрее, она перекрывает многие, так что средняя ПРОПУСКНАЯ СПОСОБНОСТЬ приближается к одной за такт.",
    "A branch enters the pipe": "Переход входит в конвейер",
    "I5 is a conditional branch (an `if`). Its true outcome - which way execution should go next - isn't known until it reaches Execute.": "I5 - это условный переход (`if`). Его истинный исход - куда пойдёт выполнение далее - не известен, пока он не достигнет Execute.",
    "But Fetch can't just sit idle waiting 2 stages for that answer - every idle stage is wasted throughput.": "Но Fetch не может просто простаивать, ожидая этого ответа 2 стадии - каждая простаивающая стадия - это потерянная пропускная способность.",
    "Speculate: guess, and keep going": "Спекуляция: угадай и продолжай",
    "A branch predictor guesses the outcome (e.g. 'taken', based on history) and the pipeline fetches the NEXT instructions down that guessed path - before the branch is actually resolved.": "Предсказатель переходов угадывает исход (например, «переход выполнится», на основе истории), и конвейер выбирает СЛЕДУЮЩИЕ инструкции по этому предполагаемому пути - до того, как переход реально разрешится.",
    "A good predictor is right >95% of the time on real code, so guessing and running ahead wins far more cycles than it costs when wrong.": "Хороший предсказатель прав >95% времени на реальном коде, поэтому угадывание и забег вперёд выигрывают гораздо больше тактов, чем стоят при ошибке.",
    "Misprediction: the guess was wrong": "Ошибка предсказания: догадка была неверной",
    "I5 resolves in Execute - and it went the OTHER way. Everything fetched on the guessed path (I6, I7) was working on instructions that should never have run.": "I5 разрешается в Execute - и пошла ДРУГИМ путём. Всё, что было выбрано по предполагаемому пути (I6, I7), работало над инструкциями, которые никогда не должны были выполняться.",
    "Correctness comes first: the CPU cannot let wrong-path work touch real registers or memory, so it must be found and discarded immediately.": "Корректность превыше всего: CPU не может позволить работе с неверного пути тронуть настоящие регистры или память, поэтому она должна быть найдена и отброшена немедленно.",
    "Flush, refetch, and refill": "Сброс, повторная выборка и заполнение",
    "The wrong-path instructions are flushed out, Fetch restarts at the CORRECT target address, and the pipeline gradually fills back up - a short bubble of idle stages, then back to full speed.": "Инструкции с неверного пути сбрасываются, Fetch перезапускается с ПРАВИЛЬНОГО целевого адреса, и конвейер постепенно заполняется снова - короткий пузырь простаивающих стадий, затем снова полная скорость.",
    "The cost of a misprediction is only this refill delay (~15–20 cycles on real hardware) - far cheaper than stalling on every single branch and never speculating at all.": "Стоимость ошибки предсказания - это только эта задержка заполнения (~15–20 тактов на реальном железе) - гораздо дешевле, чем останавливаться на каждом переходе и вообще никогда не спекулировать.",

    // gmp-scheduler
    "Three roles: G, M and P": "Три роли: G, M и P",
    "G is a goroutine - a tiny, cheap unit of work (~2 KB stack). M is an OS thread - the thing the kernel actually runs. P is a processor - a scheduling slot with its own queue; the number of Ps equals GOMAXPROCS.": "G - это горутина: крошечная, дешёвая единица работы (стек ~2 КБ). M - это поток ОС: то, что реально выполняет ядро. P - это процессор: слот планирования со своей очередью; число P равно GOMAXPROCS.",
    "Separating 'work' (G) from 'who runs it' (M) from 'how many run at once' (P) is what lets Go run a million goroutines on a handful of threads.": "Разделение «работы» (G), «кто её выполняет» (M) и «сколько выполняется одновременно» (P) - вот что позволяет Go запускать миллион горутин на горстке потоков.",
    "Each P drains its own queue - no shared lock": "Каждый P опустошает свою очередь - без общей блокировки",
    "A P pulls goroutines one at a time from its OWN local queue and hands each to its M to run. Other Ps never need to touch this queue.": "P забирает горутины по одной из своей СОБСТВЕННОЙ локальной очереди и передаёт каждую своему M для выполнения. Другим P никогда не нужно трогать эту очередь.",
    "A private queue per P means most scheduling needs zero synchronization with other Ps - that's what keeps the hot path fast.": "Приватная очередь на каждый P означает, что большинству планирования не нужна синхронизация с другими P - именно это делает горячий путь быстрым.",
    "An idle P steals work instead of waiting": "Простаивающий P крадёт работу вместо ожидания",
    "P2's queue runs dry while P1 still has plenty queued. Rather than sit idle, P2 steals half of P1's remaining goroutines.": "Очередь P2 опустела, пока у P1 ещё много в очереди. Вместо простоя P2 крадёт половину оставшихся горутин P1.",
    "No central scheduler decides this - each idle P independently grabs work from a busy neighbor, so load balances itself without a bottleneck.": "Никакой центральный планировщик это не решает - каждый простаивающий P независимо забирает работу у занятого соседа, так что нагрузка балансируется сама, без узкого места.",
    "A blocking syscall can't be allowed to block the P": "Блокирующему syscall нельзя позволить заблокировать P",
    "M3 makes a slow syscall (e.g. reading a file) and the OS genuinely blocks that thread for its duration.": "M3 выполняет медленный syscall (например, чтение файла), и ОС реально блокирует этот поток на всё его время.",
    "If P3 stayed attached to the blocked M3, every OTHER goroutine queued on P3 would starve until the syscall returns - possibly milliseconds of wasted parallelism.": "Если бы P3 оставался прикреплён к блокированному M3, каждая ДРУГАЯ горутина в очереди P3 голодала бы, пока syscall не вернётся - возможно, миллисекунды потерянного параллелизма.",
    "The runtime detaches P3 and hands it to a fresh M": "Runtime отсоединяет P3 и передаёт его новому M",
    "P3 lets go of the blocked M3 and attaches to a new thread, M4, so its queued goroutines keep running immediately. M3 stays behind, still stuck in the kernel.": "P3 отпускает блокированный M3 и прикрепляется к новому потоку, M4, чтобы его горутины в очереди немедленно продолжили выполняться. M3 остаётся позади, всё ещё застряв в ядре.",
    "This is exactly why a Go process can have MORE OS threads than GOMAXPROCS: extra Ms exist only to cover threads parked in blocking syscalls.": "Именно поэтому у Go-процесса может быть БОЛЬШЕ потоков ОС, чем GOMAXPROCS: лишние M существуют только для того, чтобы прикрыть потоки, застрявшие в блокирующих syscall.",

    // sync-primitives
    "The problem: a data race": "Проблема: гонка данных",
    "Two goroutines run `n++` on the same variable with no coordination at all. Both read the old value, both compute +1, both write - one update is silently lost.": "Две горутины выполняют `n++` на одной переменной без какой-либо координации. Обе читают старое значение, обе вычисляют +1, обе пишут - одно обновление молча теряется.",
    "This isn't just 'sometimes wrong' - the Go memory model calls it undefined behavior, because the compiler and CPU are free to reorder these operations however they like.": "Это не просто «иногда неверно» - модель памяти Go называет это неопределённым поведением, потому что компилятор и CPU вольны переупорядочивать эти операции как угодно.",
    "Atomic: a lock-free compare-and-swap": "Atomic: lock-free compare-and-swap",
    "A goroutine reads the current value, computes the new one, then asks the CPU to swap it in 'only if nobody changed it since I read it.' If it lost the race, it just retries.": "Горутина читает текущее значение, вычисляет новое, затем просит CPU подменить его «только если никто не менял его с момента моего чтения». Если она проиграла гонку, она просто повторяет попытку.",
    "No goroutine ever blocks or sleeps - the whole update is one indivisible CPU instruction. It's the cheapest tool, but it only protects a single word.": "Ни одна горутина никогда не блокируется и не спит - всё обновление - это одна неделимая инструкция CPU. Это самый дешёвый инструмент, но он защищает только одно машинное слово.",
    "Mutex: one goroutine in the critical section at a time": "Mutex: одна горутина в критической секции за раз",
    "A goroutine must acquire the lock before touching shared state, and release it when done. Anyone else who wants in simply waits their turn.": "Горутина должна получить блокировку перед тем, как трогать общее состояние, и отпустить её по завершении. Любой другой, кто хочет войти, просто ждёт своей очереди.",
    "Use this when an INVARIANT spans more than one field (e.g. a balance and a log entry that must change together) - something a single atomic can never guarantee.": "Используйте это, когда ИНВАРИАНТ охватывает больше одного поля (например, баланс и запись в журнале, которые должны меняться вместе) - то, что один atomic никогда не может гарантировать.",
    "Channel: ownership moves with the value": "Channel: владение перемещается вместе со значением",
    "Instead of two goroutines sharing one variable, the producer sends the value down a channel - the consumer is now the only one who can touch it.": "Вместо того чтобы две горутины делили одну переменную, производитель отправляет значение в канал - теперь только потребитель может его трогать.",
    "'Don't communicate by sharing memory; share memory by communicating.' There's no shared state left to race on, because only one goroutine ever owns the value at a time.": "«Не общайтесь, разделяя память; разделяйте память, общаясь». Не остаётся общего состояния для гонки, потому что значением в любой момент владеет только одна горутина.",
    "Pick by the shape of the problem": "Выбирайте по форме задачи",
    "All three are race-free - the right choice depends on what you're protecting, not on habit.": "Все три варианта свободны от гонок - правильный выбор зависит от того, что вы защищаете, а не от привычки.",
    "Reaching for the wrong tool still 'works' but costs clarity or performance: an atomic-per-field can't keep two fields consistent; a mutex around a single counter is needless overhead; a channel as a lock is heavier than either.": "Выбор неверного инструмента всё равно «работает», но стоит ясности или производительности: atomic на каждое поле не может сохранить согласованность двух полей; mutex вокруг одного счётчика - лишние затраты; channel как блокировка тяжелее обоих вариантов.",

    // three-pillars
    "One request, three services": "Один запрос, три сервиса",
    "A request enters Service A, which calls Service B, which calls Service C - a normal cross-service call chain.": "Запрос входит в Сервис A, который вызывает Сервис B, который вызывает Сервис C - обычная цепочка межсервисных вызовов.",
    "Once a request crosses service boundaries, no single process can see the whole picture anymore - that's the gap observability exists to close.": "Как только запрос пересекает границы сервисов, ни один процесс больше не видит полной картины - именно этот разрыв и призвана закрыть observability.",
    "Each hop opens a child span": "Каждый переход открывает дочерний span",
    "Service A's span covers the whole request. When it calls B, B opens its OWN span nested inside A's. The nesting mirrors the call stack across services.": "Span Сервиса A покрывает весь запрос. Когда он вызывает B, B открывает СВОЙ собственный span, вложенный внутрь span'а A. Вложенность отражает стек вызовов между сервисами.",
    "A trace is just this tree of spans - it's how you see exactly which hop the time went to, instead of one opaque total latency number.": "Трейс - это просто дерево таких span'ов - так вы видите, на какой именно переход ушло время, вместо одного непрозрачного числа общей задержки.",
    "Metrics: cheap aggregates that answer 'is it broken?'": "Метрики: дешёвые агрегаты, отвечающие «всё ли сломано?»",
    "Every request bumps a counter and records its duration in a histogram - tiny, constant-cost numbers no matter how much traffic flows through.": "Каждый запрос увеличивает счётчик и записывает свою длительность в гистограмму - крошечные числа с постоянной стоимостью независимо от объёма трафика.",
    "Metrics are cheap enough to keep forever and alert on continuously - they're the first signal that something is wrong, even before anyone looks at a trace.": "Метрики достаточно дёшевы, чтобы хранить их вечно и непрерывно проверять на алерты - это первый сигнал о том, что что-то не так, ещё до того, как кто-то посмотрит на трейс.",
    "Logs: structured detail for one specific event": "Логи: структурированные детали для одного конкретного события",
    "Each service emits a key/value log line for what it actually did - not a sentence to parse, but searchable fields.": "Каждый сервис выпускает строку лога в формате ключ/значение о том, что он реально сделал - не предложение для разбора, а поля для поиска.",
    "Metrics tell you something's wrong; logs are where you read exactly what happened in the one request you're debugging.": "Метрики говорят вам, что что-то не так; логи - это то место, где вы читаете, что именно произошло в том одном запросе, который вы дебажите.",
    "Correlated by one trace_id": "Связаны одним trace_id",
    "The same trace_id is stamped on the span, the log lines, and (as a label) the metric for this request - so you can jump from a metric alert, to the slow trace, to the exact log line that explains it.": "Один и тот же trace_id проставлен на span, строках лога и (как метка) на метрике этого запроса - так вы можете прыгнуть от алерта по метрике к медленному трейсу и к точной строке лога, которая всё объясняет.",
    "Without a shared ID, the three pillars are three disconnected views. With it, they become one investigation: alert → trace → root cause.": "Без общего ID три столпа - это три несвязанных представления. С ним они становятся одним расследованием: алерт → трейс → корневая причина.",

    // circuit-breaker
    "Closed: calls flow normally": "Closed: вызовы идут нормально",
    "In the default CLOSED state, every call passes straight through to the service. The breaker just quietly counts failures in the background.": "В состоянии CLOSED по умолчанию каждый вызов проходит прямо к сервису. Автомат просто тихо считает сбои в фоне.",
    "Most of the time the dependency is healthy, so the breaker should add zero overhead - just watch, don't interfere.": "Большую часть времени зависимость здорова, поэтому автомат должен добавлять нулевые затраты - просто наблюдать, не мешать.",
    "Failures climb toward the trip threshold": "Сбои растут к порогу срабатывания",
    "The downstream service starts erroring. Each failed call still goes all the way out and back - the breaker just increments its counter.": "Нижестоящий сервис начинает выдавать ошибки. Каждый неудачный вызов всё равно идёт туда и обратно целиком - автомат просто увеличивает свой счётчик.",
    "The breaker needs real evidence the dependency is unhealthy (not one blip) before it changes behavior - that's what the threshold is for.": "Автомату нужны реальные доказательства нездоровья зависимости (не один всплеск), прежде чем менять поведение - именно для этого и существует порог.",
    "Trip → OPEN: fail fast, don't even ask": "Срабатывание → OPEN: быстрый отказ, даже не спрашивая",
    "The breaker trips OPEN. Calls now fail INSTANTLY at the breaker itself - they never even reach the struggling service.": "Автомат переходит в OPEN. Теперь вызовы отказывают МГНОВЕННО прямо на автомате - они даже не достигают проблемного сервиса.",
    "Waiting on a timeout from a service you already know is down just wastes time and adds more load to it. Failing fast is strictly better once you're sure it's unhealthy.": "Ожидание таймаута от сервиса, о котором вы уже знаете, что он лежит, просто тратит время и добавляет ему нагрузки. Быстрый отказ строго лучше, когда вы уверены в его нездоровье.",
    "Cooldown: giving the dependency room to breathe": "Охлаждение: даём зависимости пространство для восстановления",
    "For a fixed window, every call keeps failing fast - no traffic reaches the service at all.": "В течение фиксированного окна каждый вызов продолжает быстро отказывать - трафик вообще не доходит до сервиса.",
    "A struggling service often just needs time (to restart, drain a queue, recover from a spike) - sending it zero traffic for a bit is what lets it actually recover.": "Проблемному сервису часто просто нужно время (перезапуститься, опустошить очередь, восстановиться после всплеска) - отправка ему нулевого трафика на время и позволяет ему реально восстановиться.",
    "Half-Open: let exactly one probe through": "Half-Open: пропускаем ровно один пробный вызов",
    "Once the cooldown ends, the breaker allows a single real call through to test the water - everything else still waits.": "Когда охлаждение заканчивается, автомат пропускает один настоящий вызов, чтобы прощупать воду - всё остальное всё ещё ждёт.",
    "This answers 'has it recovered?' with minimal risk: if the service is still down, only one call pays the price, not a full flood.": "Это отвечает на вопрос «восстановился ли он?» с минимальным риском: если сервис всё ещё лежит, платит только один вызов, а не целый поток.",
    "Probe succeeds → back to Closed": "Проба успешна → назад в Closed",
    "The probe comes back healthy, so the breaker closes again and lets traffic flow normally. (Had it failed, the breaker would re-open and wait another cooldown.)": "Проба возвращается здоровой, поэтому автомат снова закрывается и пропускает трафик нормально. (Если бы она провалилась, автомат снова открылся бы и подождал ещё одно охлаждение.)",
    "This Closed → Open → Half-Open → Closed cycle is the whole pattern: protect the dependency when it's down, and self-heal automatically once it recovers - no human required.": "Этот цикл Closed → Open → Half-Open → Closed - весь паттерн целиком: защищать зависимость, когда она лежит, и автоматически самовосстанавливаться, когда она оживает - без участия человека.",

    // goroutine-spawn (headers, canvas labels)
    "goroutines · go spawns cheap concurrent work": "горутины · go запускает дешёвую конкурентную работу",
    "main goroutine": "горутина main",
    "run…": "идёт…",
    "done ✓": "готово ✓",
    "order is not guaranteed": "порядок не гарантирован",
    "main resumes ✓": "main продолжает ✓",
    // goroutine-spawn (per-step title/desc/why)
    "Every program starts as one goroutine": "Любая программа начинается с одной горутины",
    "A Go program begins with a single goroutine running main(). Nothing is concurrent yet.": "Программа на Go начинается с единственной горутины, выполняющей main(). Пока ничего конкурентного нет.",
    "A goroutine is NOT an OS thread - it's a lightweight task (~2 KB stack) the Go runtime multiplexes onto a small pool of real threads.": "Горутина - это НЕ поток ОС, а лёгкая задача (стек ~2 КБ), которую рантайм Go мультиплексирует на небольшой пул реальных потоков.",
    "go func() launches goroutines - almost free": "go func() запускает горутины - почти бесплатно",
    "Each `go f()` starts a new goroutine that runs independently. Here main spawns six of them in a loop.": "Каждый `go f()` запускает новую горутину, работающую независимо. Здесь main порождает шесть из них в цикле.",
    "Spawning costs a few KB and no syscall, so a server can keep hundreds of thousands of goroutines alive at once - unthinkable with OS threads.": "Запуск стоит несколько КБ и без syscall, поэтому сервер может держать сотни тысяч горутин одновременно - немыслимо для потоков ОС.",
    "They all run concurrently": "Все они выполняются конкурентно",
    "The six goroutines execute at the same time, interleaved across a handful of OS threads by the scheduler.": "Шесть горутин выполняются одновременно, чередуясь планировщиком на горстке потоков ОС.",
    "You do NOT control the order they run in - assuming an order is the single most common concurrency bug in Go.": "Вы НЕ управляете порядком их выполнения - предположение о порядке - самая частая ошибка конкурентности в Go.",
    "wg.Wait() blocks main until each Done()": "wg.Wait() блокирует main до каждого Done()",
    "main parks on wg.Wait(). As every goroutine finishes it calls wg.Done(), dropping the counter one by one.": "main паркуется на wg.Wait(). Каждая горутина по завершении вызывает wg.Done(), уменьшая счётчик по одному.",
    "Without a WaitGroup (or a channel) main could return early - and when main returns, the whole program exits, killing the other goroutines mid-work.": "Без WaitGroup (или канала) main мог бы завершиться раньше - а когда main возвращается, вся программа завершается, убивая остальные горутины на полпути.",
    "All done → main resumes": "Все завершились → main продолжает",
    "The counter hits zero, wg.Wait() returns, and main continues past it - now guaranteed every goroutine has finished.": "Счётчик достигает нуля, wg.Wait() возвращает управление, и main идёт дальше - теперь гарантировано, что каждая горутина завершилась.",
    "WaitGroup is the simplest way to fan out a fixed set of goroutines and join back safely; for streaming results you'd reach for a channel instead.": "WaitGroup - простейший способ разветвить фиксированный набор горутин и безопасно дождаться их; для потоковых результатов лучше взять канал.",

    // channel-flow (headers, canvas labels)
    "channels · handshake, buffering & select": "каналы · рукопожатие, буферизация и select",
    "sender": "отправитель",
    "receiver": "получатель",
    "ch  (unbuffered)": "ch  (небуферизованный)",
    "⏸ send blocks - no receiver yet": "⏸ отправка блокируется - получателя ещё нет",
    "✓ received - both goroutines proceed": "✓ получено - обе горутины продолжают",
    "value crosses in one handshake (rendezvous)": "значение проходит за одно рукопожатие (рандеву)",
    "buffered ch - cap 4": "буферизованный ch - cap 4",
    "3 sends, buffer has room → sender never blocks": "3 отправки, в буфере есть место → отправитель не блокируется",
    "ch <- v  ⏸ blocks (backpressure)": "ch <- v  ⏸ блокируется (обратное давление)",
    "chA ● ready": "chA ● готов",
    "chB ○ idle": "chB ○ простаивает",
    "waiting…": "ожидание…",
    "runs whichever case is ready first": "выполняет тот case, что готов первым",
    // channel-flow (per-step title/desc/why)
    "Unbuffered channel: the sender waits": "Небуферизованный канал: отправитель ждёт",
    "A goroutine runs `ch <- v` on an unbuffered channel. With no one receiving yet, the send simply blocks.": "Горутина выполняет `ch <- v` на небуферизованном канале. Пока никто не принимает, отправка просто блокируется.",
    "An unbuffered channel has zero storage - a send can't complete until another goroutine is ready to receive. Blocking IS the synchronization.": "У небуферизованного канала нет хранилища - отправка не завершится, пока другая горутина не будет готова принять. Блокировка И ЕСТЬ синхронизация.",
    "Receiver arrives → a single handshake": "Получатель приходит → одно рукопожатие",
    "Another goroutine runs `v := <-ch`. The value crosses and BOTH goroutines unblock at the same instant.": "Другая горутина выполняет `v := <-ch`. Значение проходит, и ОБЕ горутины разблокируются в один и тот же момент.",
    "This rendezvous is a guarantee: after the handshake, the sender knows the value was received - no lost messages, no polling.": "Это рандеву - гарантия: после рукопожатия отправитель знает, что значение получено - без потерянных сообщений и без опроса.",
    "A buffered channel holds values": "Буферизованный канал хранит значения",
    "make(chan T, 4) gives the channel a buffer. Sends succeed immediately while there's free space - the sender doesn't wait.": "make(chan T, 4) даёт каналу буфер. Отправки проходят сразу, пока есть свободное место - отправитель не ждёт.",
    "A buffer decouples sender and receiver timing: bursts of work can queue up instead of forcing a lock-step handshake every time.": "Буфер разделяет тайминг отправителя и получателя: всплески работы могут ставиться в очередь вместо жёсткого рукопожатия каждый раз.",
    "Buffer full → the next send blocks": "Буфер полон → следующая отправка блокируется",
    "Once all 4 slots are occupied, the 5th `ch <- v` blocks until a receiver frees a slot. This is natural backpressure.": "Когда все 4 слота заняты, 5-й `ch <- v` блокируется, пока получатель не освободит слот. Это естественное обратное давление.",
    "Backpressure is a feature: a fast producer is forced to slow to the consumer's pace instead of exhausting memory with an unbounded queue.": "Обратное давление - это преимущество: быстрый производитель вынужден замедлиться до темпа потребителя вместо того, чтобы исчерпать память неограниченной очередью.",
    "select waits on whichever is ready": "select ждёт тот канал, что готов",
    "select blocks on several channel operations at once and proceeds with the FIRST one that becomes ready - here, chA.": "select блокируется сразу на нескольких операциях с каналами и продолжает с ПЕРВОЙ, которая станет готова - здесь это chA.",
    "select is how one goroutine juggles many channels - combine it with a ctx.Done() case and you get clean timeouts and cancellation.": "select - это то, как одна горутина жонглирует множеством каналов; добавьте case с ctx.Done() и получите чистые таймауты и отмену.",

    // redis-cache
    "Redis · cache-aside lifecycle & the atomic lock": "Redis · жизненный цикл cache-aside и атомарная блокировка",
    "client": "клиент",
    "Redis": "Redis",
    "database": "база данных",
    "~50ms query": "запрос ~50мс",
    "MISS": "MISS",
    "TTL 60s": "TTL 60с",
    "HIT ✓": "HIT ✓",
    "database, uncached: ~50ms": "база данных, без кэша: ~50мс",
    "Redis, cached: <1ms": "Redis, с кэшем: <1мс",
    "TTL 60s → 0s": "TTL 60с → 0с",
    "worker-": "воркер-",
    " -> acquired the lock": " -> получил блокировку",
    "everyone else -> lock already held, backing off": "все остальные -> блокировка уже занята, отступают",
    // redis-cache - step captions
    "Without a cache, every read hits the database directly": "Без кэша каждое чтение идёт прямо в базу данных",
    "The client asks for a value and there is nowhere faster to check first - every single request pays the full cost of a real database query.": "Клиент запрашивает значение, и нет более быстрого места для проверки - каждый запрос платит полную цену настоящего запроса к базе данных.",
    "This is the baseline we're about to beat. Nothing here is wrong, it's just slow - and 'slow, every time' is expensive once traffic grows.": "Это базовая линия, которую мы сейчас побьём. Здесь всё корректно, просто медленно - а «медленно каждый раз» становится дорого с ростом трафика.",
    "First request: Redis is checked first - and it's a miss": "Первый запрос: сначала проверяется Redis - и это промах",
    "The client's read now stops at Redis before anything else. The key isn't there yet, so go-redis returns the sentinel error redis.Nil - not a crash, just \"not cached yet.\"": "Теперь чтение клиента сначала останавливается в Redis. Ключа там пока нет, поэтому go-redis возвращает сигнальную ошибку redis.Nil - не сбой, просто «ещё не закэшировано».",
    "Treating a miss as a normal, expected outcome - not an error to panic on - is what makes this pattern safe to use on every read, not just the lucky ones.": "Обращение с промахом как с нормальным, ожидаемым результатом - а не ошибкой, на которую нужно паниковать - делает этот паттерн безопасным для каждого чтения, а не только удачных.",
    "The answer comes back - and gets cached with a TTL": "Ответ приходит - и кэшируется с TTL",
    "The database returns the real value. Before handing it to the client, the code writes it into Redis with an expiration attached - e.g. 60 seconds.": "База данных возвращает настоящее значение. Перед тем как отдать его клиенту, код записывает его в Redis со сроком истечения - например, 60 секунд.",
    "Attaching a TTL at write time is what bounds how wrong this cached copy is allowed to become. Nobody has to remember to clean it up later - Redis does it alone.": "Прикрепление TTL в момент записи ограничивает то, насколько неверной может стать эта закэшированная копия. Никому не нужно помнить о её очистке позже - Redis делает это сам.",
    "Second request: cache hit - the database is never touched": "Второй запрос: попадание в кэш - база данных не тронута",
    "The exact same key is requested again. This time Redis has it: the client gets an answer in well under a millisecond, and the database does nothing at all.": "Запрашивается тот же самый ключ. На этот раз он есть в Redis: клиент получает ответ значительно быстрее миллисекунды, а база данных вообще ничего не делает.",
    "This is the entire payoff of cache-aside - the expensive path runs once per TTL window, no matter how many times the value is actually read in that window.": "Вот вся выгода cache-aside - дорогой путь выполняется один раз за окно TTL, независимо от того, сколько раз значение реально читается в этом окне.",
    "The TTL runs out - and the next request is a miss again": "TTL истекает - и следующий запрос снова промах",
    "60 seconds pass. Redis quietly deletes the key on its own. The next client to ask for it gets a miss, exactly like the very first request did.": "Проходит 60 секунд. Redis тихо удаляет ключ сам. Следующий клиент, запросивший его, получает промах - точно как самый первый запрос.",
    "This is the cache-aside lifecycle closing the loop: hit, hit, hit… until the TTL ends, then one miss repopulates it and the cycle simply continues.": "Это цикл cache-aside, замыкающий петлю: попадание, попадание, попадание… пока не закончится TTL, затем один промах заново заполняет кэш, и цикл просто продолжается.",
    "Atomic SETNX: five callers race, exactly one wins": "Атомарный SETNX: пять вызывающих сторон соревнуются, побеждает ровно одна",
    "Five clients call SET … NX on the same lock key at the same instant. Because Redis executes one command at a time, exactly one of them creates the key and gets the lock - the other four fail immediately.": "Пять клиентов вызывают SET … NX на один и тот же ключ блокировки в один и тот же момент. Поскольку Redis выполняет по одной команде за раз, ровно один из них создаёт ключ и получает блокировку - остальные четыре немедленно проваливаются.",
    "No extra coordination code was added anywhere. This atomicity is a free property of how Redis executes commands - it's what makes one Redis instance a correct distributed lock.": "Никакой дополнительный код координации не был добавлен нигде. Эта атомарность - бесплатное свойство того, как Redis выполняет команды - именно оно делает один инстанс Redis корректной распределённой блокировкой.",

    // raft-consensus
    "consensus · leader election & log replication": "консенсус · выборы лидера и репликация журнала",
    "A · term 3": "A · term 3",
    "B · term 4": "B · term 4",
    "LEADER": "ЛИДЕР",
    "CANDIDATE": "КАНДИДАТ",
    "follower": "фолловер",
    "unreachable": "недоступен",
    "heartbeat resets the timer before it ever fires": "heartbeat сбрасывает таймер прежде, чем тот успевает сработать",
    "no heartbeat - both timers keep climbing": "heartbeat нет - оба таймера продолжают расти",
    "RequestVote(term 4)": "RequestVote(term 4)",
    "votes: ": "голоса: ",
    "AppendEntries": "AppendEntries",
    "log: [SET balance[alice]=900]": "log: [SET balance[alice]=900]",
    "acked: ": "подтвердили: ",
    " - committed": " - закоммичено",
    // raft-consensus - step captions
    "A leader sends heartbeats to keep followers calm": "Лидер шлёт heartbeat, чтобы фолловеры оставались спокойны",
    "Node A is the current leader for term 3. It periodically pings B and C. As long as heartbeats keep arriving, each follower's election timer keeps getting reset - and stays quiet.": "Узел A - текущий лидер в term 3. Он периодически пингует B и C. Пока heartbeat приходит вовремя, таймер выборов у каждого фолловера постоянно сбрасывается - и молчит.",
    "A heartbeat is the leader saying 'I'm still here.' The whole election mechanism only ever activates once those heartbeats stop.": "Heartbeat - это способ лидера сказать «я всё ещё здесь». Весь механизм выборов включается только тогда, когда heartbeat пропадает.",
    "The leader goes silent": "Лидер замолкает",
    "A crashes, or the network partitions it away. No more heartbeats arrive - B and C's election timers now keep rising, uninterrupted, for the first time.": "A падает или оказывается отрезан сетевым разделением. Heartbeat больше не приходит - таймеры выборов у B и C впервые растут без остановки.",
    "One missed heartbeat proves nothing by itself. It takes a full election timeout with NO heartbeat in between to convince a follower the leader is really gone.": "Один пропущенный heartbeat сам по себе ничего не доказывает. Фолловер убеждается, что лидер действительно пропал, только когда весь election timeout проходит без единого heartbeat.",
    "B's timeout fires first -> becomes candidate, term++": "Таймаут у B срабатывает первым -> он становится кандидатом, term++",
    "B's randomized timeout elapses before C's. B increments its term (3 -> 4), becomes a candidate, and requests votes from everyone it can still reach.": "Случайный таймаут у B истекает раньше, чем у C. B увеличивает term (3 -> 4), становится кандидатом и запрашивает голоса у всех, до кого может достучаться.",
    "Randomizing each node's timeout is what keeps B and C from timing out at the exact same instant and splitting the vote forever.": "Именно рандомизация таймаута у каждого узла не даёт B и C истечь в один и тот же момент и вечно делить голоса пополам.",
    "A majority of votes -> B becomes leader": "Большинство голосов -> B становится лидером",
    "C grants its vote (A is unreachable, so it never gets asked). B now holds 2 of 3 votes - a majority - and becomes leader for term 4.": "C отдаёт свой голос (A недоступен, поэтому его даже не спрашивают). У B теперь 2 из 3 голосов - большинство - и он становится лидером в term 4.",
    "A majority can always be reached even with one node down, and two different candidates can never both reach a majority in the same term - that's exactly what guarantees at most one leader.": "Большинство всегда можно набрать, даже если один узел не работает, а два разных кандидата не могут одновременно набрать большинство в одном и том же term - именно это гарантирует не более одного лидера.",
    "New leader replicates a log entry": "Новый лидер реплицирует запись в журнал",
    "A client asks B to process one command. B appends it to its own log and sends AppendEntries to every follower it can reach - here, just C.": "Клиент просит B обработать одну команду. B добавляет её в свой журнал и отправляет AppendEntries каждому фолловеру, до которого может достучаться - здесь это только C.",
    "The leader is the only node ever allowed to accept new commands - that single-writer rule is what keeps the log's order unambiguous.": "Только лидеру разрешено принимать новые команды - именно это правило единственного писателя делает порядок записей в журнале однозначным.",
    "Committed the instant a majority acks - not waiting on the third": "Commit происходит сразу после подтверждения большинством - без ожидания третьего",
    "C acknowledges the entry. B (itself) plus C is 2 of 3 - a majority - so the entry commits immediately. B never waits on A, which is still down.": "C подтверждает запись. B (сам) плюс C - это 2 из 3, большинство - поэтому запись коммитится немедленно. B не ждёт A, который всё ещё недоступен.",
    "Waiting for every node to reply would let one slow or crashed node stall the whole cluster. Majority is the exact threshold that keeps replication both safe and always able to make progress.": "Если бы ждали ответа от всех узлов, один медленный или упавший узел мог бы остановить весь кластер. Большинство - это именно тот порог, который делает репликацию одновременно безопасной и всегда способной двигаться дальше.",

    // bfs-wave
    "graph traversal · breadth-first search": "обход графа · поиск в ширину",
    "A graph and a question": "Граф и вопрос",
    "Find the shortest route from A to T. Edges are the only roads; nothing is weighted - every hop costs 1.": "Найдите кратчайший маршрут от A до T. Рёбра - единственные дороги; весов нет, каждый переход стоит 1.",
    "'Shortest' in an unweighted graph is the keyword that should trigger BFS in your head - no other algorithm needed.": "«Кратчайший» в невзвешенном графе - ключевое слово, которое должно включать BFS у вас в голове: другой алгоритм не нужен.",
    "start: A": "старт: A",
    "target: T": "цель: T",
    "Enqueue the start": "Кладём старт в очередь",
    "BFS keeps one FIFO queue. Seed it with the start node and mark A visited - the wave begins as a single drop.": "BFS держит одну FIFO-очередь. Положите в неё стартовый узел и пометьте A посещённым - волна начинается с одной капли.",
    "The queue IS the algorithm: everything else is a loop around it.": "Очередь И ЕСТЬ алгоритм: всё остальное - цикл вокруг неё.",
    "queue: ": "очередь: ",
    "(empty)": "(пусто)",
    "Level 1: dequeue, visit, enqueue": "Уровень 1: достать, посетить, положить",
    "A leaves the queue; its neighbors B and C enter it. Everything one hop from the start is now discovered.": "A покидает очередь; её соседи B и C входят в неё. Всё, что в одном переходе от старта, теперь открыто.",
    "FIFO order guarantees the whole of level 1 is processed before anything from level 2 - that is the invariant everything rests on.": "Порядок FIFO гарантирует: весь уровень 1 обработан раньше, чем что-либо с уровня 2 - на этом инварианте держится всё.",
    "Level 2: the wave spreads": "Уровень 2: волна расходится",
    "B and C are processed in turn; D, E and F join the queue. The frontier is always a clean ring around what's been seen.": "B и C обрабатываются по очереди; D, E и F входят в очередь. Фронт - всегда ровное кольцо вокруг уже увиденного.",
    "Watch the shape: BFS never has a 'deep finger' into the graph - the discovered region grows evenly, like a ripple.": "Следите за формой: у BFS не бывает «глубокого пальца» в граф - открытая область растёт равномерно, как круги по воде.",
    "Visited set: seen once, never again": "Множество посещённых: один раз и навсегда",
    "C also points at B - but B is already visited, so the edge is skipped. Every node enters the queue at most once.": "C тоже указывает на B - но B уже посещена, и ребро пропускается. Каждый узел попадает в очередь не более одного раза.",
    "Without this check the first cycle would loop forever. With it, total work is O(V+E): each node and each edge touched once.": "Без этой проверки первый же цикл зациклил бы обход навсегда. С ней вся работа - O(V+E): каждый узел и каждое ребро тронуты по разу.",
    "already visited - skip": "уже посещена - пропуск",
    "Target reached = shortest path": "Цель достигнута = кратчайший путь",
    "T is discovered while processing level 2 - via E. Walking parent links back gives A → B → E → T: three hops, provably minimal.": "T открыта при обработке уровня 2 - через E. Пройдя по родительским ссылкам назад, получаем A → B → E → T: три перехода, доказуемо минимум.",
    "No search or comparison happened: BFS reached T first via a shortest path BY CONSTRUCTION, because all shorter levels were exhausted before.": "Никакого поиска и сравнения не было: BFS дошёл до T кратчайшим путём ПО ПОСТРОЕНИЮ, потому что все более короткие уровни были исчерпаны раньше.",
    "3 hops - minimal": "3 перехода - минимум",
    "Swap the queue for a stack: DFS": "Замените очередь стеком: DFS",
    "Same loop, LIFO container: the search dives A → B → D to the bottom before ever looking at C. Great for 'does a path exist' - useless for 'shortest'.": "Тот же цикл, LIFO-контейнер: поиск ныряет A → B → D до дна, даже не взглянув на C. Отлично для «существует ли путь» - бесполезно для «кратчайшего».",
    "One data structure choice flips the algorithm's personality. Interviews love asking why DFS can't answer shortest-path - now you can show it.": "Один выбор структуры данных меняет характер алгоритма. На интервью любят спрашивать, почему DFS не отвечает на «кратчайший путь» - теперь вы можете это показать.",
    "stack: ": "стек: ",
    "deep, not wide": "вглубь, а не вширь",

    // lru-cache
    "LRU cache · map + doubly-linked list": "LRU-кэш · map + двусвязный список",
    "Two structures, welded": "Две структуры, сваренные вместе",
    "A map gives O(1) 'where is key K'; a doubly-linked list keeps recency order. The weld: map values are pointers INTO the list.": "Map отвечает за O(1) «где ключ K»; двусвязный список хранит порядок свежести. Сварной шов: значения map - указатели ВНУТРЬ списка.",
    "Neither structure alone can do this job - the map can't order, the list can't look up. Interviews assign LRU precisely to test this composition.": "Ни одна структура в одиночку не справится: map не умеет упорядочивать, список - искать. LRU дают на интервью именно ради проверки этой композиции.",
    "capacity: 3 · full": "ёмкость: 3 · полон",
    "most recent": "самый свежий",
    "least recent": "самый старый",
    "Sentinels: no special cases": "Сентинелы: без особых случаев",
    "head and tail are permanent dummy nodes. Every real node always has a live prev and next - empty and single-node lists need no extra code.": "head и tail - постоянные фиктивные узлы. У каждого настоящего узла всегда есть живые prev и next - пустой список и список из одного узла не требуют отдельного кода.",
    "The classic interview stumble is nil-checking the list edges. Sentinels delete that whole class of bugs before it exists.": "Классический затык на интервью - nil-проверки на краях списка. Сентинелы удаляют весь этот класс багов ещё до его появления.",
    "never nil": "никогда не nil",
    "Get(7): jump, unlink, push front": "Get(7): прыжок, unlink, в начало",
    "The map lands directly on 7's node - no scan. unlink cuts it out; pushFront re-inserts it after head. 7 is now the most recent.": "Map приземляется прямо на узел 7 - без сканирования. unlink вырезает его; pushFront вставляет сразу после head. Теперь 7 - самый свежий.",
    "Get is a WRITE to the recency order, not just a read - that reordering is what makes the cache 'least recently USED', not 'least recently ADDED'.": "Get - это ЗАПИСЬ в порядок свежести, а не просто чтение: именно эта перестановка делает кэш «least recently USED», а не «least recently ADDED».",
    "1 map hop + 4 pointer writes": "1 прыжок по map + 4 записи указателей",
    "Put(4) on a full cache: evict the tail": "Put(4) в полный кэш: вытесняем хвост",
    "Capacity is 3 and 4 is a new key - someone must go. The victim needs no search: it is always tail.prev, here 9. Unlink it, delete its map entry, push 4 to the front.": "Ёмкость 3, а 4 - новый ключ: кто-то должен уйти. Жертву не нужно искать - это всегда tail.prev, здесь 9. Вырезаем её, удаляем её запись из map, кладём 4 в начало.",
    "Eviction is O(1) only because the list keeps the victim parked at the tail. A map alone would need an O(n) scan for the oldest entry.": "Вытеснение - O(1) только потому, что список держит жертву припаркованной у хвоста. Одному map понадобилось бы O(n) сканирование в поисках самой старой записи.",
    "evict 9: unlink + delete": "вытесняем 9: unlink + delete",
    "4 is most recent": "4 - самый свежий",
    "Put(2, new value): update in place": "Put(2, новое значение): обновление на месте",
    "2 already exists: overwrite its value inside the node, move it to the front. No eviction - the size did not change.": "2 уже существует: перезаписываем значение внутри узла, двигаем его в начало. Без вытеснения - размер не изменился.",
    "Forgetting this branch double-inserts the key and silently corrupts the size - the second most common LRU bug after broken pointer order.": "Забытая ветка вставляет ключ дважды и тихо ломает размер - второй по частоте баг LRU после перепутанного порядка указателей.",
    "Count the work: O(1), always": "Считаем работу: O(1), всегда",
    "Every operation is one map access plus a constant number of pointer writes - no loops, no scans, regardless of cache size.": "Каждая операция - одно обращение к map плюс константное число записей указателей: ни циклов, ни сканирований, при любом размере кэша.",
    "When the interviewer asks 'what's the complexity?', the answer is provable by counting the moves you just watched: nothing depends on n.": "Когда интервьюер спросит «какая сложность?», ответ доказывается подсчётом только что увиденных ходов: ничто не зависит от n.",
    "Get: map + 4 writes": "Get: map + 4 записи",
    "Put: map + ≤6 writes": "Put: map + ≤6 записей",
    "evict: 2 writes + delete": "вытеснение: 2 записи + delete",

    // hashmap-internals
    "map internals · buckets, tophash, growth": "внутренности map · бакеты, tophash, рост",
    "One hash, two jobs": "Один хеш, две работы",
    "hash(\"user:42\") yields 64 bits. Go splits the duty: LOW bits will choose the bucket, the top 8 bits become a one-byte fingerprint (tophash).": "hash(\"user:42\") даёт 64 бита. Go делит обязанности: МЛАДШИЕ биты выберут бакет, старшие 8 бит становятся однобайтовым отпечатком (tophash).",
    "Reusing one hash for both routing and fingerprinting is why map lookups stay cheap - no second hash function, no full key compare until the last moment.": "Повторное использование одного хеша и для маршрутизации, и для отпечатка - причина дешевизны поиска в map: ни второй хеш-функции, ни полного сравнения ключей до последнего момента.",
    "high 8 bits → tophash": "старшие 8 бит → tophash",
    "low bits → bucket": "младшие биты → бакет",
    "bucket ": "бакет ",
    "8 slots + tophash": "8 слотов + tophash",
    "Low bits pick the bucket": "Младшие биты выбирают бакет",
    "With 4 buckets, 'low bits' means hash & 3 - a single AND instruction. 0b...01 → bucket 1.": "При 4 бакетах «младшие биты» - это hash & 3, одна инструкция AND. 0b...01 → бакет 1.",
    "This is why the bucket count is always a power of two: modulo becomes a bit-mask, one cycle instead of a division.": "Вот почему число бакетов - всегда степень двойки: взятие остатка превращается в битовую маску, один такт вместо деления.",
    "tophash: scan 8 bytes, not 8 keys": "tophash: сканируем 8 байт, а не 8 ключей",
    "Inside the bucket, the lookup sweeps eight one-byte tophash stamps first - a single cache line. Full key comparison happens only on a stamp match.": "Внутри бакета поиск сначала пробегает восемь однобайтовых штампов tophash - одна кэш-линия. Полное сравнение ключа происходит только при совпадении штампа.",
    "String comparison is expensive; byte comparison is nearly free. The tophash array rejects 7 wrong slots without ever touching their keys.": "Сравнение строк дорого; сравнение байтов почти бесплатно. Массив tophash отбрасывает 7 неверных слотов, ни разу не тронув их ключи.",
    "tophash b6 matches → compare full key": "tophash b6 совпал → сравниваем полный ключ",
    "Collisions land in the same bucket": "Коллизии попадают в тот же бакет",
    "A different key with the same low bits joins bucket 1 in the next free slot. Eight collisions later, an overflow bucket chains on.": "Другой ключ с теми же младшими битами занимает следующий свободный слот бакета 1. Через восемь коллизий цепляется overflow-бакет.",
    "Collisions are normal operation, not an error - the design just keeps them within one cache line for as long as possible.": "Коллизии - штатная работа, а не ошибка: дизайн просто держит их в пределах одной кэш-линии как можно дольше.",
    'hash("user:97") → also bucket 1': 'hash("user:97") → тоже бакет 1',
    "Growth: double and evacuate": "Рост: удвоить и эвакуировать",
    "Past ~6.5 entries per bucket on average, the table doubles - and entries drift to their new homes INCREMENTALLY, a little on each write, not in one big pause.": "После ~6.5 записей на бакет в среднем таблица удваивается - и записи перетекают в новые дома ИНКРЕМЕНТАЛЬНО, понемногу на каждой записи, а не одной большой паузой.",
    "Incremental evacuation spreads the rehash cost across many operations - the same amortization idea as slice growth, applied to a whole table.": "Инкрементальная эвакуация размазывает стоимость рехеша по многим операциям - та же идея амортизации, что и в росте слайса, применённая к целой таблице.",
    "4 → 8 buckets · one more low bit": "4 → 8 бакетов · ещё один младший бит",
    "Why iteration order is random": "Почему порядок итерации случаен",
    "Range starts at a RANDOM bucket and offset on every iteration - deliberately, so no program can accidentally depend on an order that growth would change anyway.": "Range начинает со СЛУЧАЙНОГО бакета и смещения при каждой итерации - намеренно, чтобы ни одна программа случайно не зависела от порядка, который рост всё равно изменил бы.",
    "This is a favorite interview probe: it checks whether you know maps well enough to never sort-by-iterating. Need order? Collect keys and sort them.": "Любимая проверка на интервью: знаете ли вы map достаточно, чтобы никогда не «сортировать итерацией». Нужен порядок? Соберите ключи и отсортируйте их.",
    "range start: random, every time": "старт range: случайный, каждый раз",

    // slice-heap
    "slices & heaps · memory layout as an algorithm": "слайсы и кучи · раскладка памяти как алгоритм",
    "A slice is three words": "Слайс - это три слова",
    "pointer + len + cap, pointing into a backing array. Copying a slice copies these three words - never the elements.": "Указатель + len + cap, смотрящие в базовый массив. Копирование слайса копирует эти три слова - и никогда элементы.",
    "Every slice interview question unwinds from this picture: cheap passing, shared mutation, and the growth trap all live in the header.": "Каждый вопрос о слайсах на интервью разматывается из этой картинки: дешёвая передача, общая мутация и ловушка роста - всё живёт в заголовке.",
    "backing array": "базовый массив",
    "append with room: just write": "append с запасом: просто запись",
    "len 3, cap 5 - append(s, 7) writes into the existing array and bumps len. No allocation, nothing moves.": "len 3, cap 5 - append(s, 7) пишет в существующий массив и увеличивает len. Без аллокаций, ничего не переезжает.",
    "Within capacity, append is a single store - this is the fast path make([]T, 0, n) buys you when n is known.": "В пределах ёмкости append - одна запись в память; именно этот быстрый путь покупает make([]T, 0, n), когда n известно заранее.",
    "append past cap: reallocate and copy": "append за пределом cap: новая память и копия",
    "cap exhausted → allocate a bigger array (double, then ~1.25× for large slices), copy every element, point the NEW slice at it. The old array is abandoned - but anyone still holding it sees stale data.": "cap исчерпан → выделяется массив побольше (удвоение, затем ~1.25× для больших слайсов), копируется каждый элемент, НОВЫЙ слайс указывает на него. Старый массив брошен - но все, кто его ещё держит, видят устаревшие данные.",
    "This copy is why append is 'amortized' O(1) - and why two slices that used to share storage silently diverge after one of them grows. The #1 slice interview trap.": "Эта копия - причина, по которой append «амортизированно» O(1), и по которой два слайса, делившие память, тихо расходятся после роста одного из них. Ловушка №1 о слайсах на интервью.",
    "old (cap 5) - abandoned": "старый (cap 5) - брошен",
    "new (cap 10)": "новый (cap 10)",
    "A heap is a slice wearing a tree costume": "Куча - это слайс в костюме дерева",
    "The same values, two views: slice [1,3,2,9,7] and a complete binary tree. No pointers exist - children of i are 2i+1 and 2i+2, parent is (i-1)/2.": "Одни значения, два взгляда: слайс [1,3,2,9,7] и полное бинарное дерево. Указателей не существует - дети i живут в 2i+1 и 2i+2, родитель в (i-1)/2.",
    "Storing the tree as index math makes heaps allocation-free and cache-friendly - and means you can write one on a whiteboard in ten lines.": "Хранение дерева как индексной арифметики делает кучу свободной от аллокаций и дружелюбной к кэшу - и означает, что её можно написать на доске за десять строк.",
    "min-heap: every parent ≤ its children": "min-куча: каждый родитель ≤ своих детей",
    "Push 0: append, then sift up": "Push 0: append, затем всплытие",
    "0 lands at index 5 (a leaf), then swaps with its parent while smaller: 0 < 2 → swap with [2], 0 < 1 → swap with the root. Two hops, done.": "0 приземляется в индекс 5 (лист), затем меняется с родителем, пока меньше его: 0 < 2 → обмен с [2], 0 < 1 → обмен с корнем. Два прыжка - готово.",
    "Sift-up touches one root-to-leaf path - log n swaps worst case, which is the entire cost of insertion.": "Всплытие трогает один путь от листа к корню - log n обменов в худшем случае, и это вся стоимость вставки.",
    "Pop the min: last to root, sift down": "Pop минимума: последний в корень, погружение",
    "Take index 0 (always the minimum). Move the LAST element to the root, shrink the slice, and let it sink: swap with the smaller child until both children are bigger.": "Забираем индекс 0 (всегда минимум). Переносим ПОСЛЕДНИЙ элемент в корень, укорачиваем слайс и даём ему тонуть: обмен с меньшим из детей, пока оба ребёнка не станут больше.",
    "Pop is the other half of every priority queue - 'k largest', 'merge k lists' and heapsort are just push and pop in a loop.": "Pop - вторая половина любой очереди с приоритетами: «k наибольших», «слить k списков» и heapsort - это просто push и pop в цикле.",
    "popped: 0": "извлечено: 0",
    "Choosing the structure": "Выбор структуры",
    "Need lookup by key? Map. Need repeated access to the extreme? Heap. Need order and cheap append? Slice. Most interview problems are one of these three sentences.": "Нужен поиск по ключу? Map. Нужен многократный доступ к экстремуму? Куча. Нужен порядок и дешёвый append? Слайс. Большинство задач интервью - одно из этих трёх предложений.",
    "Interviewers rarely want exotic structures - they want the right basic one, chosen out loud with its costs. That sentence is the answer.": "Интервьюеры редко ждут экзотических структур - они ждут правильную базовую, выбранную вслух вместе с её стоимостями. Это предложение и есть ответ.",
    "map: O(1) by key": "map: O(1) по ключу",
    "heap: O(log n) extreme": "куча: O(log n) экстремум",
    "slice: O(1) append*": "слайс: O(1) append*",
    "* amortized - now you can explain the asterisk": "* амортизированно - теперь вы можете объяснить эту звёздочку",
  };

  // Azerbaijani mirror of CANVAS_RU above - same exact-string lookup, same keys.
  // Populated incrementally; any key missing here falls back to the English source
  // string (see tr() below), exactly like the COURSE_AZ/COURSE_EN merge in app.js.
  const CANVAS_AZ = {
  "STEP ": "ADDIM ",
  "  ·  ": "  ·  ",
  "garbage collector · tri-color mark & sweep": "zibilyığan (garbage collector) · üç rəngli mark & sweep",
  "go tool pprof · CPU flame graph": "go tool pprof · CPU flame qrafiki",
  "go test · table-driven subtests": "go test · cədvəl əsaslı subtestlər",
  "concurrency · worker pool (fan-out / fan-in)": "paralellik (concurrency) · worker pool (fan-out / fan-in)",
  "context · cancellation propagates down the tree": "context · ləğvetmə ağac boyunca aşağı yayılır",
  "net/http ServeMux · radix trie + os.Root IO sandbox": "net/http ServeMux · radix trie + os.Root IO sandbox",
  "m[\"USD\"] · legacy map vs Swiss Table lookup": "m[\"USD\"] · köhnə map ilə Swiss Table axtarışı",
  "runtime.AddCleanup · deterministic lifecycle": "runtime.AddCleanup · deterministik həyat dövrü",
  "testing/synctest · virtual time bubble": "testing/synctest · virtual zaman qabarcığı",
  "pgxpool · row-level locking · double-entry": "pgxpool · sətir səviyyəli kilidləmə · double-entry",
  "PostgreSQL · schema constraints · idempotency/outbox": "PostgreSQL · sxem məhdudiyyətləri · idempotentlik/outbox",
  "PostgreSQL · planner · composite index path": "PostgreSQL · planlaşdırıcı · kompozit indeks yolu",
  "PostgreSQL · locks · migrations · vacuum": "PostgreSQL · kilidlər · miqrasiyalar · vacuum",
  "harvest-now-decrypt-later · hybrid post-quantum TLS": "harvest-now-decrypt-later · hibrid post-kvant TLS",
  "runtime/pprof · goroutine-leak analyzer": "runtime/pprof · goroutine sızması analizatoru",
  "simd/archsimd · Green Tea GC": "simd/archsimd · Green Tea GC",
  "Kubernetes · rolling update · readiness probes": "Kubernetes · rolling update · readiness yoxlamaları",
  "memory hierarchy · why the next read is suddenly free": "yaddaş iyerarxiyası · niyə növbəti oxuma birdən pulsuz olur",
  "pipeline · how a branch misprediction costs cycles": "pipeline (konveyer) · yanlış branch proqnozu taktlara necə başa gəlir",
  "G-M-P scheduler · work stealing & syscall handoff": "G-M-P planlaşdırıcı · iş oğurluğu (work stealing) və syscall ötürməsi",
  "atomic vs mutex vs channel · same correctness, different shape": "atomic, mutex və channel · eyni korrektlik, fərqli forma",
  "the three pillars · one request, end to end": "üç sütun · bir sorğu, əvvəldən sona qədər",
  "circuit breaker · fail fast, recover automatically": "circuit breaker · tez uğursuz ol, avtomatik bərpa ol",
  "SRE · SLO / error budget / burn rate": "SRE · SLO / error budget / burn rate",
  "SRE · telemetry correlation stack": "SRE · telemetriya korrelyasiya stack-i",
  "SRE · incident response and toil loop": "SRE · insidentə cavab və toil dövrü",
  "Pick a user-visible SLI": "Addım 1: istifadəçiyə görünən SLI seçin",
  "Start from user experience: successful transfers divided by total transfer attempts.": "İstifadəçi təcrübəsindən başlayın: uğurlu köçürmələr ümumi köçürmə cəhdlərinə bölünür.",
  "Infrastructure metrics explain causes; SLIs define whether users are hurt.": "İnfrastruktur metrikaları səbəbləri izah edir; SLI-lər isə istifadəçilərin zərər çəkib-çəkmədiyini müəyyən edir.",
  "Set the SLO target": "Addım 2: SLO hədəfini təyin edin",
  "A 99.9% SLO leaves 0.1% of requests as the error budget.": "99.9% SLO sorğuların 0.1%-ni error budget olaraq saxlayır.",
  "The target turns reliability into a release and alerting control, not a vibe.": "Bu hədəf etibarlılığı hissiyyatdan çıxarıb, release və alerting üçün real bir nəzarət mexanizminə çevirir.",
  "Spend the budget": "Addım 3: budget necə xərclənir",
  "Small bursts are allowed while the long-window budget is healthy.": "Uzun pəncərədəki budget sağlam olduğu müddətcə kiçik sıçrayışlara icazə verilir.",
  "An error budget lets teams move fast without pretending production must be perfect.": "Error budget komandalara, production-un mükəmməl olması lazım imiş kimi davranmadan sürətli hərəkət etməyə imkan verir.",
  "Alert on burn rate": "Addım 4: alert-i burn rate əsasında qururuq",
  "A fast burn pages now; a slow burn opens a ticket and closer review.": "Sürətli yanma dərhal page göndərir; yavaş yanma isə ticket açır və daha yaxın nəzərdən keçirmə tələb edir.",
  "Burn-rate alerting maps urgency to user-visible reliability risk.": "Burn-rate alerting təcililiyi istifadəçiyə görünən etibarlılıq riskinə uyğunlaşdırır.",
  "Use budget for release decisions": "Addım 5: budget-dən release qərarları üçün istifadə edirik",
  "Healthy budget allows change; exhausted budget shifts work toward reliability.": "Sağlam budget dəyişikliyə icazə verir; tükənmiş budget isə işi etibarlılığa doğru yönəldir.",
  "That is the SRE bargain: product velocity is earned by staying inside the SLO.": "SRE-nin razılaşması budur: məhsulun sürəti SLO daxilində qalmaqla qazanılır.",
  "Instrument once with OpenTelemetry": "Addım 1: OpenTelemetry ilə bir dəfə instrumentasiya edirik",
  "The SDK and collector create one telemetry contract at the application boundary.": "SDK və collector tətbiq sərhədində vahid telemetriya müqaviləsi yaradır.",
  "Instrumentation is not the backend; it is how the app describes itself consistently.": "İnstrumentasiya backend deyil; tətbiqin özünü ardıcıl şəkildə necə təsvir etməsidir.",
  "Metrics go to Prometheus": "Addım 2: metrics Prometheus-a gedir",
  "Prometheus scrapes RED/USE metrics and evaluates SLO burn alerts.": "Prometheus RED/USE metriklərini toplayır və SLO burn alert-lərini qiymətləndirir.",
  "Metrics are the paging signal because they are cheap, aggregated and fast to query.": "Metrics page siqnalı rolunu oynayır, çünki ucuz, aqreqasiya olunmuş və sürətlə sorğulanandır.",
  "Thanos keeps long-retention metrics": "Addım 3: Thanos uzunmüddətli metrikaları saxlayır",
  "Thanos lets you query Prometheus data across clusters and longer windows.": "Thanos Prometheus datasını klasterlər arasında və daha uzun pəncərələrdə sorğulamağa imkan verir.",
  "Long windows catch slow burns that short dashboards miss.": "Uzun pəncərələr qısa dashboard-ların gözdən qaçırdığı yavaş yanmaları tutur.",
  "Traces go to Tempo": "Addım 4: traces Tempo-ya gedir",
  "A trace explains which hop made one request slow or wrong.": "Trace hansı hop-un sorğunu yavaş və ya səhv etdiyini izah edir.",
  "Traces are for localization after the metric told you users are hurt.": "Metric istifadəçilərin zərər çəkdiyini göstərdikdən sonra, trace problemi lokallaşdırmaq üçündür.",
  "Logs go to Loki": "Addım 5: logs Loki-yə gedir",
  "Logs carry the concrete event, keyed by bounded labels and trace_id.": "Logs konkret hadisəni daşıyır, məhdud label-lər və trace_id ilə açarlanır.",
  "Logs are expensive, so make them searchable and tied to the same request identity.": "Logs bahalıdır, ona görə axtarıla bilən edin və eyni sorğu kimliyinə bağlayın.",
  "Grafana correlates by trace_id": "Addım 6: Grafana trace_id ilə əlaqələndirir",
  "One incident workflow jumps metric -> trace -> logs without manual guessing.": "Vahid insident axını əl ilə təxmin etmədən metric -> trace -> logs arasında keçir.",
  "Correlation is what reduces mean time to understand.": "Korrelyasiya başa düşmə üçün orta vaxtı azaldan amildir.",
  "Alert fires from SLO burn": "Addım 1: alert SLO burn-dən tetiklənir",
  "The page starts from user impact, not from a random noisy symptom.": "Page istifadəçiyə təsirdən başlayır, təsadüfi səs-küylü simptomdan yox.",
  "Good alerts already contain the reason this wake-up is worth it.": "Yaxşı alert-lər artıq bu oyanışın nəyə dəyər olduğunu izah edir.",
  "Triage assigns incident roles": "Addım 2: triage insident rollarını təyin edir",
  "Incident commander, operations lead, communications and scribe separate the work.": "İnsident komandiri, operasiya rəhbəri, kommunikasiya və scribe işi bölüşdürür.",
  "Roles prevent the on-call engineer from being debugger, manager and reporter at once.": "Rollar on-call mühəndisin eyni anda debugger, menecer və hesabatçı olmasının qarşısını alır.",
  "Mitigate before perfect root cause": "Addım 3: əvvəlcə mitigation, sonra dəqiq kök səbəb",
  "Stop the bleeding first: rollback, shed load, fail over, disable a bad path.": "Əvvəlcə qanaxmanı dayandırın: rollback, yükü azaltmaq, fail over, pis yolu deaktiv etmək.",
  "RCA is valuable after users are safe; during impact, mitigation wins.": "RCA istifadəçilər təhlükəsizləşdikdən sonra dəyərlidir; təsir zamanı isə mitigation üstünlük təşkil edir.",
  "Write blameless RCA": "Addım 4: günahlandırmayan (blameless) RCA yazırıq",
  "Record impact, timeline, detection gaps and contributing factors.": "Təsiri, timeline-ı, aşkarlama boşluqlarını və töhfə verən amilləri qeyd edin.",
  "Blameless does not mean vague; it means precise without personal blame.": "Blameless qeyri-müəyyən demək deyil; şəxsi ittiham olmadan dəqiqlik deməkdir.",
  "Automate recurring toil": "Addım 5: təkrarlanan toil-i avtomatlaşdırırıq",
  "Turn repeat manual steps into runbooks, scripts or guarded controllers.": "Təkrarlanan əl addımlarını runbook-lara, skriptlərə və ya qorunan controller-lərə çevirin.",
  "The incident loop closes only when action items reduce the next incident.": "İnsident dövrü yalnız action item-lər növbəti insidenti azaltdıqda bağlanır.",
  "user requests": "istifadəçi sorğuları",
  "SLI = success / total": "SLI = success / total",
  "SLO 99.9%": "SLO 99.9%",
  "budget 0.1%": "budget 0.1%",
  "slow burn": "yavaş yanma",
  "fast burn": "sürətli yanma",
  "ticket": "ticket",
  "page now": "page now",
  "freeze risky releases": "riskli release-ləri dondurmaq",
  "ship carefully": "ehtiyatla ship etmək",
  "OpenTelemetry SDK": "OpenTelemetry SDK",
  "Collector": "Collector",
  "Prometheus": "Prometheus",
  "Thanos": "Thanos",
  "Tempo": "Tempo",
  "Loki": "Loki",
  "Grafana": "Grafana",
  "metrics": "metriklər",
  "traces": "trace-lər",
  "logs": "log-lar",
  "trace_id": "trace_id",
  "alert": "alert",
  "triage": "triage",
  "mitigate": "mitigation",
  "RCA": "RCA",
  "action items": "action item-lər",
  "automation": "avtomatlaşdırma",
  "runbook": "runbook",
  "less manual work": "daha az əl işi",
  "users hurt?": "istifadəçilər zərər çəkir?",
  "error budget decides": "error budget qərar verir",
  "export": "export",
  "span": "span",
  "30d / 90d / multi-cluster": "30d / 90d / multi-cluster",
  "service=ledger": "service=ledger",
  "route=/transfer/{id}": "route=/transfer/{id}",
  "SLO burn": "SLO burn",
  "IC": "IC",
  "ops": "ops",
  "comms": "comms",
  "scribe": "scribe",
  "impact": "impact",
  "stable": "sabit",
  "timeline": "timeline",
  "detection gap": "aşkarlama boşluğu",
  "contributing factors": "töhfə verən amillər",
  "root": "kök",
  "white = unreached": "ağ = çatılmayıb",
  "grey = reachable": "boz = çatıla bilər",
  "black = live": "qara = canlı",
  "sampler": "sampler",
  "samples captured: ": "tutulan sample-lər: ",
  "width = share of samples in that function": "en = həmin funksiyadakı sample-lərin payı",
  "▲ reflectWalk ≈ 40% of CPU - optimize here first": "▲ reflectWalk ≈ CPU-nun 40%-i - əvvəlcə burada optimallaşdırın",
  "go tool pprof · choosing the right profile": "go tool pprof · doğru profili seçmək",
  "go tool pprof · profile picker": "go tool pprof · profil seçici",
  "symptom": "simptom",
  "profile": "profil",
  "question answered": "cavablanan sual",
  "CPU hot path": "isti CPU yolu",
  "heap pressure": "heap təzyiqi",
  "goroutine leak": "goroutine sızması",
  "sync waiting": "sync gözləməsi",
  "cpu": "cpu",
  "heap": "heap",
  "goroutine": "goroutine",
  "block / mutex": "block / mutex",
  "where is CPU time spent?": "CPU vaxtı hara sərf olunur?",
  "what allocates or stays live?": "nə ayrılır və ya canlı qalır?",
  "where are goroutines stuck?": "goroutine-lər harada ilişib?",
  "where do goroutines wait?": "goroutine-lər harada gözləyir?",
  "30s CPU sample": "30 saniyəlik CPU sample",
  "inuse_space / alloc_space": "inuse_space / alloc_space",
  "stack dump": "stack dump",
  "contention time": "rəqabət (contention) vaxtı",
  "pick the profile that answers the question": "sualı cavablandıran profili seçin",
  "go tool pprof · measure, change one thing, measure again": "go tool pprof · ölç, bir şeyi dəyiş, yenidən ölç",
  "go tool pprof · optimize loop": "go tool pprof · optimallaşdırma dövrü",
  "benchmark/load test": "benchmark/load test",
  "cpu.out": "cpu.out",
  "go tool pprof": "go tool pprof",
  "top": "top",
  "list": "list",
  "flame": "flame",
  "top · list · flame": "top · list · flame",
  "hotspot": "hotspot",
  "one code change": "bir kod dəyişikliyi",
  "before": "əvvəl",
  "after": "sonra",
  "measure": "ölç",
  "fix": "düzəlt",
  "re-profile": "yenidən profilləşdir",
  "prove the win": "qazancı sübut et",
  "flat enough - stop": "kifayət qədər düz - dayan",
  "got ": "alındı ",
  " == want ": " == gözlənilən ",
  "✓ PASS": "✓ PASS",
  "ok   4/4 passed   ·   coverage 100%": "ok   4/4 keçdi   ·   coverage 100%",
  "jobs channel": "jobs kanalı",
  "worker ": "worker ",
  "busy…": "məşğul…",
  "results channel": "results kanalı",
  "processed: 6 / 6": "emal olundu: 6 / 6",
  "no locks · no shared mutable state": "kilid yoxdur · paylaşılan dəyişkən vəziyyət yoxdur",
  "running ●": "işləyir ●",
  "ctx (root)": "ctx (kök)",
  "worker": "worker",
  "ctx.Done() ✓": "ctx.Done() ✓",
  "✓ every goroutine returned - no leaks": "✓ bütün goroutine-lər qayıtdı - sızma yoxdur",
  "✓ ok": "✓ ok",
  "✗ blocked at the boundary": "✗ sərhəddə bloklandı",
  "cache miss ✗": "cache miss ✗",
  "match ✓": "uyğunluq ✓",
  "separate cache lines touched so far: ": "indiyədək toxunulan ayrı cache xətləri: ",
  "control bytes - one cache line:": "control byte-lar - bir cache xətti:",
  "↓ one instruction, all 8 lanes compared in parallel": "↓ bir təlimat, bütün 8 lane paralel müqayisə olunur",
  "stack root": "stack kökü",
  "parent span": "valideyn span",
  "ref": "ref",
  "ref dropped": "ref buraxıldı",
  "unreachable": "əlçatmaz",
  "GC mark sweep": "GC: mark sweep",
  "✓ fd closed · parent span freed": "✓ fd bağlandı · valideyn span azad edildi",
  "wall clock": "divar saatı",
  "bubble clock": "qabarcıq saatı",
  "⏸ blocked": "⏸ bloklanıb",
  "⏸ blocked +": "⏸ bloklanıb +",
  "synctest.Wait → all parked ✓": "synctest.Wait → hamısı parklanıb ✓",
  "⏩ fake clock advances 5s instantly": "⏩ saxta saat anında 5s irəli gedir",
  "✓ deterministic - no time.Sleep, no CI flake": "✓ deterministikdir - time.Sleep yoxdur, CI flake yoxdur",
  "PostgreSQL · accounts": "PostgreSQL · hesablar",
  "acct ": "hesab ",
  "$": "$",
  "LOCK": "KİLİD",
  "T1  transfer": "T1  köçürmə",
  "T2  transfer": "T2  köçürmə",
  "both need: acct A": "hər ikisinə lazımdır: hesab A",
  "waiting on lock…": "kilid gözlənilir…",
  "A: −$": "A: −$",
  "B: +$": "B: +$",
  "COMMIT ✓": "COMMIT ✓",
  "Σ = $800  ✓ invariant held": "Σ = $800  ✓ invariant qorundu",
  "HTTP transfer": "HTTP köçürməsi",
  "Go service": "Go servisi",
  "accounts": "accounts",
  "transfers": "transfers",
  "ledger_entries": "ledger_entries",
  "outbox_events": "outbox_events",
  "CHECK balance >= 0": "CHECK balance >= 0",
  "CHECK amount > 0": "CHECK amount > 0",
  "UNIQUE idempotency_key": "UNIQUE idempotency_key",
  "duplicate blocked": "dublikat bloklandı",
  "event committed": "event commit edildi",
  "schema is the final guardrail": "sxem son guardrail-dır",
  "rejected": "rədd edildi",
  "BEGIN": "BEGIN",
  "COMMIT": "COMMIT",
  "query": "sorğu",
  "planner": "planlaşdırıcı",
  "seq scan": "seq scan",
  "composite index": "kompozit indeks",
  "covering INCLUDE": "əhatəedici INCLUDE",
  "EXPLAIN verifies": "EXPLAIN yoxlayır",
  "buffers read": "buffers read",
  "heap fetches": "heap fetches",
  "latest 50": "son 50",
  "table heap": "table heap",
  "heap fetches avoided": "heap fetches-dən qaçınıldı",
  "Index Only Scan using ledger_entries_account_time_idx": "Index Only Scan using ledger_entries_account_time_idx",
  "hot table": "isti cədvəl",
  "writers": "yazanlar",
  "DDL migration": "DDL miqrasiyası",
  "ACCESS EXCLUSIVE": "ACCESS EXCLUSIVE",
  "blocked": "bloklandı",
  "CREATE INDEX CONCURRENTLY": "CREATE INDEX CONCURRENTLY",
  "writes continue": "yazılar davam edir",
  "long xact": "uzun tranzaksiya",
  "dead tuples": "dead tuples",
  "VACUUM waits": "VACUUM gözləyir",
  "batch backfill": "batch backfill",
  "pressure released": "təzyiq azaldı",
  "bloat grows": "bloat böyüyür",
  "small batches · short transactions": "kiçik batch-lər · qısa tranzaksiyalar",
  "Alice": "Alisa",
  "Bob": "Bob",
  "Channel A · Classic (X25519)": "Kanal A · Klassik (X25519)",
  "Channel B · Hybrid (+ML-KEM-768)": "Kanal B · Hibrid (+ML-KEM-768)",
  "harvester - recording ciphertext from both channels": "harvester - hər iki kanaldan şifrmətni qeydə alır",
  "ct": "şifrmətn",
  "stored, waiting for a future quantum computer": "saxlanılıb, gələcək kvant kompüterini gözləyir",
  "quantum computer online": "kvant kompüteri işə düşdü",
  "→ attacking both recorded sessions": "→ hər iki qeydə alınmış sessiyaya hücum edir",
  "X25519 classical key": "X25519 klassik açar",
  "broken by Shor's algorithm": "Şorun alqoritmi ilə sındırıldı",
  "still classically secure": "hələ də klassik olaraq təhlükəsizdir",
  "ML-KEM-768 lattice key": "ML-KEM-768 lattice açarı",
  "quantum-resistant - stays secret": "kvanta davamlıdır - sirr olaraq qalır",
  "missing": "yoxdur",
  "⏸ blocked on <-results": "⏸ <-results üzərində bloklanıb",
  "ROOT CAUSE": "KÖK SƏBƏB",
  "G2 dispatch never sends on results ch - context had no deadline.": "G2 dispatch heç vaxt results kanalına göndərmir - context-in deadline-ı yox idi.",
  "scalar loop": "skalyar dövr",
  "SIMD loop": "SIMD dövrü",
  "vs": "vs",
  "SIMD vector loop": "SIMD vektor dövrü",
  "scalar - 1 element / cycle": "skalyar - 1 element / takt",
  "cycles: ": "taktlar: ",
  "SIMD - 16 elements / cycle": "SIMD - 16 element / takt",
  "↓ each lane loads + processes 16 elements together": "↓ hər lane 16 elementi birlikdə yükləyir və emal edir",
  "32 cycles": "32 takt",
  "2 cycles": "2 takt",
  "parallel span sweep →": "paralel span sweep →",
  "✓ contiguous spans → cache-friendly, parallel sweep": "✓ ardıcıl span-lar → cache-dostu, paralel sweep",
  "vs scattered object-by-object marking in the legacy GC": "köhnə GC-dəki səpələnmiş obyekt-obyekt mark etməyə qarşı",
  "load balancer": "load balancer",
  "pod ": "pod ",
  "● Ready": "● Hazır",
  "◌ Starting": "◌ Başlayır",
  "◍ Draining": "◍ Boşaldılır",
  "probe ✗": "probe ✗",
  "probe ✓": "probe ✓",
  "finishing in-flight requests…": "davam edən sorğular tamamlanır…",
  "rollout ": "rollout ",
  "↓ bigger and slower": "↓ daha böyük və daha yavaş",
  "checking…": "yoxlanılır…",
  "→ not in any on-chip cache. Falling through to RAM.": "→ heç bir çip üstü cache-də yoxdur. RAM-a düşür.",
  "HIT ✓": "HIT ✓",
  "↑ the 64-byte line travels back up, filling each cache as it passes": "↑ 64-baytlıq xətt geriyə yuxarı qalxır, keçdiyi hər cache-i doldurur",
  "the 64-byte line, now resident in L1:": "64-baytlıq xətt, indi L1-də yerləşir:",
  "asked": "sorğulandı",
  "free": "pulsuz",
  "latency per read:": "oxuma başına gecikmə:",
  "1st read · ~100 ns (RAM)": "1-ci oxuma · ~100 ns (RAM)",
  "next 7 · ~1 ns each (L1) - ~100× faster": "növbəti 7 · hər biri ~1 ns (L1) - ~100× daha sürətli",
  "Fetch": "Fetch (gətirmə)",
  "Decode": "Decode (dekodlama)",
  "Execute": "Execute (icra)",
  "Memory": "Memory (yaddaş)",
  "Write-back": "Write-back (geri yazma)",
  "currently in: ": "hazırda mərhələdə: ",
  "outcome unknown until Execute": "nəticə Execute mərhələsinə qədər naməlumdur",
  "predictor guesses: “taken” → speculatively fetching I6, I7": "predictor təxmin edir: «keçid olacaq» → I6, I7 spekulyativ şəkildə gətirilir",
  "wrong guess → I6, I7 must be discarded": "səhv təxmin → I6, I7 ləğv edilməlidir",
  "bubble - refetching the correct path": "bubble - düzgün yolun yenidən gətirilməsi",
  "back to full speed": "tam sürətə qayıdış",
  "pipe full - overlapping instructions": "pipeline dolu - təlimatlar üst-üstə düşür",
  "✓ retiring this cycle": "✓ bu taktda tamamlanır",
  "G - goroutine: cheap work to run": "G - goroutine: işə salınacaq ucuz iş",
  "P - processor: a queue + the right to run Go code": "P - prosessor: növbə + Go kodunu icra etmə hüququ",
  "M - OS thread: what the kernel actually schedules": "M - OS thread: kernel-in əslində planlaşdırdığı şey",
  "→ running on M1": "→ M1-də işləyir",
  " queued on P1": " P1-də növbədədir",
  " queued": " növbədədir",
  "P2 is empty - P1 still has work": "P2 boşdur - P1-də hələ iş var",
  "stealing half of P1's queue →": "P1-in növbəsinin yarısını oğurlamaq →",
  "4 queued - going nowhere while M3 is stuck": "4 növbədədir - M3 ilişib qaldığı müddətcə heç yerə getmir",
  "M3 - blocked in syscall": "M3 - syscall-da bloklanıb",
  "M3": "M3",
  "P3's other goroutines are stuck behind it": "P3-ün digər goroutine-ləri onun arxasında ilişib qalıb",
  "M3 - still blocked": "M3 - hələ də bloklanıb",
  "M4 (fresh)": "M4 (yeni)",
  "P3's goroutines resume on M4": "P3-ün goroutine-ləri M4-də davam edir",
  "goroutine A": "goroutine A",
  "goroutine B": "goroutine B",
  "both read n, both compute n+1, both write - one increment vanishes": "hər ikisi n-i oxuyur, hər ikisi n+1 hesablayır, hər ikisi yazır - bir artırma yoxa çıxır",
  "compute n+1…": "n+1 hesablanır…",
  "CAS ✓ - swapped in": "CAS ✓ - dəyişdirildi",
  "atomic.Int64 - every update is one CPU instruction, never a wait": "atomic.Int64 - hər yeniləmə bir CPU təlimatıdır, heç vaxt gözləmə yoxdur",
  "waiting goroutines queue up; only the lock holder touches shared state": "gözləyən goroutine-lər növbəyə düzülür; yalnız kiliddə olan paylaşılan vəziyyətə toxunur",
  "producer": "istehsalçı",
  "consumer": "istehlakçı",
  "value (and ownership) in transit →": "dəyər (və sahiblik) ötürülür →",
  "consumer now owns it exclusively": "indi istehlakçı ona tam sahibdir",
  "Just one counter, flag, or pointer swap?": "Sadəcə bir sayğac, flag və ya pointer dəyişimi?",
  "An invariant spans several fields?": "İnvariant bir neçə sahəni əhatə edir?",
  "Handing work or a value to another goroutine?": "İşi və ya dəyəri başqa goroutine-ə ötürmək?",
  "→ atomic": "→ atomic",
  "→ mutex": "→ mutex",
  "→ channel": "→ channel",
  "Service ": "Servis ",
  "Service A - root span": "Servis A - kök span",
  "Service B - child span": "Servis B - alt span",
  "request_duration_seconds  p99 ≈ 0.21s": "request_duration_seconds  p99 ≈ 0.21s",
  "metric": "metrik",
  "trace": "trace",
  "log": "log",
  "requests_total{...} ⏤ p99 0.21s": "requests_total{...} ⏤ p99 0.21s",
  "Service A → B → C (3 spans)": "Servis A → B → C (3 span)",
  "client": "müştəri",
  "service": "servis",
  "breaker": "breaker",
  "failures: 0 / 5": "uğursuzluqlar: 0 / 5",
  "failures: ": "uğursuzluqlar: ",
  "threshold reached →": "hədd aşıldı →",
  "OPEN - bounced at the breaker": "OPEN - breaker tərəfindən rədd edildi",
  "cooldown: ": "soyuma müddəti: ",
  "s remaining": "s qalıb",
  "all calls still fail instantly": "bütün çağırışlar hələ də ani şəkildə uğursuz olur",
  "HALF-OPEN - one probe call": "HALF-OPEN - bir sınaq çağırışı",
  "trip on failures": "uğursuzluqlarda işə düşür",
  "cooldown elapses": "soyuma müddəti bitir",
  "probe succeeds ✓": "sınaq uğurlu ✓",
  "CLOSED": "CLOSED",
  "OPEN": "OPEN",
  "HALF-OPEN": "HALF-OPEN",
  "The heap is a graph of objects": "Heap - obyektlərin qrafıdır",
  "Two roots (global variables / goroutine stacks) point into a web of objects. Some objects (right side) aren't pointed to by anything reachable from a root.": "İki kök (qlobal dəyişənlər / goroutine stack-ləri) obyektlər şəbəkəsinə işarə edir. Bəzi obyektlərə (sağ tərəfdə) kökdən çatan heç nə işarə etmir.",
  "The collector's whole job is to tell live objects apart from dead ones - and 'reachable from a root' is the only definition of 'live' it needs.": "Collector-un bütün işi canlı obyektləri ölülərdən ayırmaqdır - və «kökdən çatılabilən» ona lazım olan yeganə «canlı» tərifidir.",
  "Start at the roots, mark them black": "Köklərdən başlayırıq, onları qara işarələyirik",
  "Marking begins at the roots - they're live by definition. Whatever they directly point to turns grey: 'reachable, but not yet scanned.'": "İşarələmə köklərdən başlayır - onlar tərifə görə canlıdır. Onların birbaşa işarə etdiyi hər şey boz olur: «çatılabilir, amma hələ skan edilməyib».",
  "Starting only from roots guarantees you never mark something live unless there's an actual chain of pointers reaching it.": "Yalnız köklərdən başlamaq təmin edir ki, ona çatan real işarəçilər (pointer) zənciri olmayınca heç nəyi canlı işarələməyəsiniz.",
  "Scan grey → black, level by level": "Boz → qara skan edilir, səviyyə-səviyyə",
  "Each grey object gets scanned: it turns black ('done'), and anything IT points to turns grey in turn. The reachable wave spreads outward through the graph.": "Hər boz obyekt skan edilir: qara olur («hazır»), və ONUN işarə etdiyi hər şey öz növbəsində boz olur. Çatılabilirlik dalğası qraf boyunca yayılır.",
  "This is why it's called tri-color: grey is the 'in-progress' frontier that guarantees every reachable object eventually gets scanned exactly once.": "Buna görə üç-rəngli adlanır: boz «prosesdə» sərhəddir və hər çatılabilir obyektin sonda düz bir dəfə skan olunmasını təmin edir.",
  "White = dead": "Ağ = ölü",
  "Once no grey objects remain, the wave is finished. Everything still white - including the cluster on the right - was never touched, because nothing live points to it.": "Boz obyekt qalmadıqda dalğa tamamlanır. Hələ ağ qalan hər şey - sağdakı klaster daxil olmaqla - heç vaxt toxunulmayıb, çünki ona heç bir canlı işarə etmir.",
  "This is the proof of garbage: not 'looks unused', but 'provably unreachable from any root.'": "Bu, zibilin sübutudur: «istifadə olunmur kimi görünür» yox, «heç bir kökdən sübutlu şəkildə çatılmazdır».",
  "Sweep: reclaim the white objects": "Sweep: ağ obyektləri geri qaytar",
  "The collector walks the heap one more time and frees every object still marked white. Black (live) objects are never touched.": "Collector heap-i bir dəfə də gəzir və hələ ağ işarələnmiş hər obyekti azad edir. Qara (canlı) obyektlərə heç vaxt toxunulmur.",
  "Marking and sweeping are kept as separate passes so the collector never frees something while it might still be mid-scan - correctness over speed.": "İşarələmə və sweep ayrı keçidlər kimi saxlanılır ki, collector hələ skan prosesində ola biləcək bir şeyi heç vaxt azad etməsin - sürətdən çox düzgünlük.",
  "The program runs - a call tree": "Proqram işləyir - çağırış ağacı",
  "A request flows main → handleRequest → a handful of child functions. Some of those calls are cheap, some are expensive - but just reading the code, you can't tell which.": "Sorğu main → handleRequest → bir neçə uşaq funksiyaya axır. Bu çağırışların bəziləri ucuz, bəziləri baha başa gəlir - amma sadəcə kodu oxuyaraq hansının hansı olduğunu bilmək mümkün deyil.",
  "Without measurement, optimization is guessing. Profiling replaces guessing with evidence.": "Ölçmə olmadan optimizasiya təxmindir. Profiling təxmini sübutla əvəz edir.",
  "The sampler ticks ~100×/second": "Sampler saniyədə ~100 dəfə işə düşür",
  "Rather than instrument every call, pprof just peeks at whatever stack is CURRENTLY running, many times a second, and records it.": "Hər çağırışı instrument etmək əvəzinə, pprof sadəcə HAZIRDA işləyən stack-ə saniyədə çox dəfə baxır və onu qeyd edir.",
  "Sampling is statistical, not exhaustive - that's exactly what makes it cheap enough to run in production without slowing the program down.": "Sampling statistikdir, hərtərəfli deyil - məhz bu, onu proqramı yavaşlatmadan production-da işlətmək üçün kifayət qədər ucuz edir.",
  "Samples aggregate into a flame graph": "Sample-lər flame graph-a birləşir",
  "Every captured stack stacks its frames into bars - a box sits inside its caller, and the more samples landed in a function, the WIDER its box grows.": "Tutulan hər stack öz frame-lərini zolaqlara toplayır - qutu öz çağıranının içində yerləşir, və funksiyaya nə qədər çox sample düşürsə, onun qutusu bir o qədər GENİŞ olur.",
  "Width directly encodes time spent, so the visual shape of the graph IS the measurement - no separate legend to decode.": "Genişlik birbaşa sərf olunan vaxtı kodlaşdırır, ona görə qrafın vizual forması ölçmənin ÖZÜDÜR - ayrıca legend deşifrə etməyə ehtiyac yoxdur.",
  "Find the widest box - that's the hotspot": "Ən geniş qutunu tapın - bu hotspot-dur",
  "reflectWalk is the widest leaf frame: roughly 40% of all CPU samples landed inside it. The tall, narrow stacks next to it barely register.": "reflectWalk ən geniş leaf frame-dir: bütün CPU sample-lərinin təxminən 40%-i onun içinə düşür. Yanındakı hündür, dar stack-lər demək olar ki, nəzərə çarpmır.",
  "Optimizing the widest box gives the biggest win for the least effort - optimizing a narrow box can't help much even if you make it instant.": "Ən geniş qutunu optimallaşdırmaq ən az səylə ən böyük qazancı verir - dar qutunu optimallaşdırmaq onu ani etsəniz belə çox köməyi olmur.",
  "Start from the symptom": "Simptomdan başlayın",
  "The symptom is your first filter. A service can be slow because it is burning CPU, allocating too much, leaking goroutines, or waiting on locks/channels.": "Simptom sizin ilk filtrinizdir. Servis CPU yandırdığına, həddindən artıq alokasiya etdiyinə, goroutine sızdırdığına və ya lock/channel-də gözlədiyinə görə yavaş ola bilər.",
  "Choosing the profile by symptom prevents you from staring at the wrong evidence.": "Profili simptoma görə seçmək sizin yanlış sübutlara baxmağınızın qarşısını alır.",
  "CPU profile answers: where is time spent?": "CPU profili cavab verir: vaxt harada sərf olunur?",
  "For a hot request path, collect a CPU profile. pprof samples the currently running stack and ranks functions by how often they were on-CPU.": "İsti sorğu yolu üçün CPU profili toplayın. pprof hazırda işləyən stack-i sample edir və funksiyaları CPU-da nə qədər tez-tez olduqlarına görə sıralayır.",
  "This is the profile for throughput work: algorithms, reflection, parsing, serialization, hashing, and tight loops.": "Bu, throughput işi üçün profildir: alqoritmlər, reflection, parsing, serialization, hashing və sıx dövrələr.",
  "Heap profile answers: what owns memory?": "Heap profili cavab verir: yaddaşa kim sahibdir?",
  "If RSS climbs or GC burns CPU, switch to heap. inuse_space shows what is live now; alloc_space shows allocation churn that feeds the GC.": "Əgər RSS artırsa və ya GC CPU yandırırsa, heap-ə keçin. inuse_space indi nə canlıdır göstərir; alloc_space GC-ni bəsləyən alokasiya axınını göstərir.",
  "Memory problems need ownership evidence - a CPU flame graph can hide the allocation site that actually creates pressure.": "Yaddaş problemləri sahiblik sübutu tələb edir - CPU flame graph əslində təzyiq yaradan alokasiya yerini gizlədə bilər.",
  "Goroutine profile answers: who is stuck?": "Goroutine profili cavab verir: kim ilişib qalıb?",
  "When goroutine count keeps rising, dump the goroutine profile. It shows every stack, so leaked workers and forgotten receives become visible.": "Goroutine sayı artmaqda davam etdikdə, goroutine profilini dump edin. O, hər stack-i göstərir, ona görə sızan worker-lər və unudulmuş receive-lər görünür olur.",
  "A leak is usually a lifetime bug, not a CPU bug - you need the parked stack, not a timing aggregate.": "Sızma adətən lifetime baqıdır, CPU baqı deyil - sizə vaxt aqreqatı yox, park edilmiş stack lazımdır.",
  "Block and mutex profiles answer: who waits?": "Block və mutex profilləri cavab verir: kim gözləyir?",
  "If CPU is low but latency is high, enable block or mutex profiling. The profile points at channel sends, receives, selects, and locks that consume wait time.": "Əgər CPU aşağıdırsa, amma latency yüksəkdirsə, block və ya mutex profiling-i aktivləşdirin. Profil gözləmə vaxtını yeyən channel send, receive, select və lock-lara işarə edir.",
  "Waiting time is invisible in a normal CPU profile because blocked goroutines are not on-CPU.": "Gözləmə vaxtı normal CPU profilində görünmür, çünki bloklanmış goroutine-lər CPU-da deyil.",
  "Reproduce the slow path": "Yavaş yolu təkrarlayın",
  "Start with a benchmark or representative load test. The profile is only useful if the workload exercises the behavior you actually need to improve.": "Benchmark və ya təmsiledici yük testi ilə başlayın. Profil yalnız yük yaxşılaşdırmaq istədiyiniz davranışı işə saldıqda faydalıdır.",
  "A clean reproduction turns performance work from folklore into an experiment you can repeat.": "Təmiz təkrarlanma performans işini folklordan təkrarlana bilən eksperimentə çevirir.",
  "Collect evidence, then inspect it": "Sübut toplayın, sonra onu araşdırın",
  "Write cpu.out, open it with go tool pprof, and move between top, list, and the flame graph until one hotspot is concrete.": "cpu.out yazın, go tool pprof ilə açın və bir hotspot konkretləşənə qədər top, list və flame graph arasında keçin.",
  "The toolchain gives you several views of the same samples: table for ranking, source listing for the line, flame graph for shape.": "Alət dəsti eyni sample-lərin bir neçə görünüşünü verir: sıralama üçün cədvəl, sətir üçün mənbə siyahısı, forma üçün flame graph.",
  "Change one hotspot": "Bir hotspot-u dəyişin",
  "Make one targeted change where the profile is widest: swap an algorithm, remove reflection, preallocate, cache, or move work out of the loop.": "Profilin ən geniş olduğu yerdə bir hədəflənmiş dəyişiklik edin: alqoritmi dəyişin, reflection-u silin, əvvəlcədən alokasiya edin, keşləyin və ya işi dövrədən çıxarın.",
  "One change at a time keeps causality intact - if the profile improves, you know what did it.": "Hər dəfə bir dəyişiklik səbəb-nəticə əlaqəsini qorumuş olur - əgər profil yaxşılaşırsa, nəyin bunu etdiyini bilirsiniz.",
  "Re-profile and compare shapes": "Yenidən profil çıxarın və formaları müqayisə edin",
  "Run the same workload again. The before graph had one dominant box; the after graph should be flatter or expose the next real bottleneck.": "Eyni yükü yenidən işlədin. Əvvəlki qrafda bir dominant qutu var idi; sonrakı qraf daha düz olmalı, ya da növbəti real darboğazı üzə çıxarmalıdır.",
  "The only optimization that counts is the one that survives a second measurement.": "Sayılan yeganə optimizasiya ikinci ölçmədən sağ çıxandır.",
  "A table of cases": "Hallar cədvəli",
  "Each row is one input pair plus the expected (want) result for the SAME function, Add(a, b).": "Hər sətir EYNİ funksiya, Add(a, b) üçün bir giriş cütü və gözlənilən (want) nəticədir.",
  "Separating 'what to test' (the table) from 'how to test it' (one shared piece of logic) means adding a new case is just adding a row - no new code.": "«Nə test edilir» (cədvəl) ilə «necə test edilir» (bir ortaq məntiq parçası) ayrılması yeni hal əlavə etməyin sadəcə sətir əlavə etmək olduğunu bildirir - yeni kod yoxdur.",
  "go test runs each case as an isolated subtest": "go test hər halı təcrid olunmuş subtest kimi işlədir",
  "t.Run wraps each row as its own named subtest - go test -run TestAdd/negatives can target just one, and one failing case never stops the others from running.": "t.Run hər sətri öz adlandırılmış subtest-i kimi əhatə edir - go test -run TestAdd/negatives yalnız birini hədəfləyə bilər, və bir uğursuz hal digərlərinin işləməsini heç vaxt dayandırmır.",
  "Isolation means a single bad case gives you a precise failure (\"TestAdd/negatives\"), not a vague \"something in TestAdd broke.\"": "Təcrid o deməkdir ki, bir pis hal sizə dəqiq bir uğursuzluq verir («TestAdd/negatives»), qeyri-müəyyən «TestAdd-da nəsə sındı» yox.",
  "Inputs flow into the function": "Girişlər funksiyaya axır",
  "For the active case, a(=2) and b(=3) are passed into Add(a, b), which computes a+b.": "Aktiv hal üçün a(=2) və b(=3) Add(a, b)-yə ötürülür, o da a+b-ni hesablayır.",
  "The function under test never knows it's being tested through a table - it just gets called like normal code, which is why this pattern adds no production complexity.": "Test edilən funksiya cədvəl vasitəsilə test edildiyini heç vaxt bilmir - o sadəcə adi kod kimi çağırılır, buna görə bu pattern production-a heç bir mürəkkəblik əlavə etmir.",
  "Compare got vs want": "got ilə want-i müqayisə edin",
  "The function returns got = 5. The test compares it to want = 5 from the table row. Equal → the case passes.": "Funksiya got = 5 qaytarır. Test onu cədvəl sətrindəki want = 5 ilə müqayisə edir. Bərabərdirsə → hal uğurludur.",
  "The comparison - not the function - is what decides pass/fail. A mismatch fails loudly with both values printed, so you see exactly what diverged.": "Uğur/uğursuzluğu funksiya yox, müqayisə həll edir. Uyğunsuzluq hər iki dəyər çap olunmaqla səsli şəkildə uğursuz olur, ona görə dəqiq nəyin fərqləndiyini görürsünüz.",
  "The same flow runs for every case": "Eyni axın hər hal üçün işləyir",
  "go test repeats exactly this input → function → compare flow for each remaining row, fully independently.": "go test məhz bu giriş → funksiya → müqayisə axınını qalan hər sətir üçün tam müstəqil şəkildə təkrarlayır.",
  "This is the payoff: one test function plus N table rows covers N scenarios - no copy-pasted test functions to maintain.": "Qazanc budur: bir test funksiyası artı N cədvəl sətri N ssenarini əhatə edir - saxlamaq üçün kopyalanmış test funksiyaları yoxdur.",
  "Summary": "Xülasə",
  "go test reports one line: how many passed, and coverage. Run it constantly - `go test -race -cover ./...` - so a regression is caught the moment it's introduced.": "go test bir sətir bildirir: neçəsi keçdi və coverage. Onu daim işlədin - `go test -race -cover ./...` - ki, reqressiya yarandığı an tutulsun.",
  "A fast, table-driven suite is cheap enough to run on every save, which is what makes 'catch it immediately' realistic instead of aspirational.": "Sürətli, cədvəl əsaslı test dəsti hər saxlamada işlətmək üçün kifayət qədər ucuzdur, bu da «dərhal tut» ifadəsini arzudan reallığa çevirir.",
  "Six jobs wait on a buffered channel": "Altı iş buferlənmiş kanalda gözləyir",
  "Work items sit in a channel, ready to be picked up. Nothing is processing yet - this is just a queue.": "İş vahidləri kanalda oturub, götürülməyə hazırdır. Hələ heç nə işlənmir - bu sadəcə növbədir.",
  "A channel decouples producing work from consuming it: the producer doesn't need to know or care how many workers exist.": "Kanal iş istehsalını onun istehlakından ayırır: istehsalçının neçə worker olduğunu bilməsinə və ya buna əhəmiyyət verməsinə ehtiyac yoxdur.",
  "Three workers pull from the SAME channel": "Üç worker EYNİ kanaldan çəkir",
  "Each worker goroutine independently calls `job := <-jobs` in a loop. The channel itself decides which worker gets which job - no coordination code needed.": "Hər worker goroutine müstəqil şəkildə dövrədə `job := <-jobs` çağırır. Hansı worker-in hansı işi alacağını kanalın özü qərar verir - koordinasiya kodu lazım deyil.",
  "This is fan-out: identical workers competing for jobs on one channel is enough to spread work across goroutines safely.": "Bu fan-out-dur: bir kanalda işlər üçün yarışan eyni worker-lər işi goroutine-lər arasında təhlükəsiz şəkildə yaymağa kifayət edir.",
  "Up to three jobs process at once": "Eyni anda üçə qədər iş emal olunur",
  "Each busy worker is running its own job concurrently - never more than 3 in flight, because there are only 3 workers.": "Hər məşğul worker öz işini konkurrent şəkildə işlədir - heç vaxt 3-dən çox uçuşda deyil, çünki cəmi 3 worker var.",
  "The number of workers is a deliberate dial: it caps concurrency so you don't overwhelm downstream resources, while still getting real parallelism.": "Worker sayı bilərəkdən qoyulmuş tənzimləyicidir: konkurrentliyi məhdudlaşdırır ki, downstream resursları həddindən artıq yükləməyəsiniz, amma yenə də real paralellik əldə edəsiniz.",
  "Fan-in: every worker sends to ONE results channel": "Fan-in: hər worker BİR nəticə kanalına göndərir",
  "When a worker finishes, it sends its result to a shared results channel - the same channel every other worker also writes to.": "Worker bitirdikdə, nəticəsini ortaq nəticə kanalına göndərir - digər bütün worker-lərin də yazdığı eyni kanal.",
  "The collector reading results doesn't need to know which worker produced what, or even how many workers there are - fan-in merges them for free.": "Nəticələri oxuyan collector hansı worker-in nə istehsal etdiyini, hətta neçə worker olduğunu belə bilməyə ehtiyac duymur - fan-in onları pulsuz birləşdirir.",
  "Drained: every job ran exactly once": "Boşaldıldı: hər iş dəqiq bir dəfə işlədi",
  "All six jobs were processed, never more than three at a time, and the results all merged onto one channel for the collector.": "Bütün altı iş emal olundu, heç vaxt eyni anda üçdən çox olmadan, və bütün nəticələr collector üçün bir kanalda birləşdi.",
  "No locks, no shared mutable state, no manual bookkeeping - the channel's blocking send/receive IS the synchronization.": "Lock yoxdur, ortaq dəyişkən vəziyyət yoxdur, əl ilə uçot yoxdur - kanalın bloklayıcı send/receive-i sinxronizasiyanın ÖZÜDÜR.",
  "A request creates a root context": "Sorğu kök context yaradır",
  "Every cancellation tree starts from one context at the top - typically derived from the incoming request.": "Hər ləğv ağacı yuxarıda bir context-dən başlayır - adətən gələn sorğudan törənir.",
  "Having ONE source of truth for 'should this request keep going' is what makes it possible to cancel an entire call tree with a single action later.": "«Bu sorğu davam etməlidirmi» üçün BİR həqiqət mənbəyinə sahib olmaq sonradan bütün çağırış ağacını bir hərəkətlə ləğv etməyi mümkün edir.",
  "Children derive their own contexts": "Uşaqlar öz context-lərini törədir",
  "Each branch derives a child context - WithCancel, WithTimeout - rather than creating an unrelated one from scratch.": "Hər budaq sıfırdan əlaqəsiz bir context yaratmaq əvəzinə uşaq context törədir - WithCancel, WithTimeout.",
  "Deriving (not creating fresh) is what wires the child to the parent: cancel the parent, and every derived child is automatically cancelled too.": "Məhz törətmə (sıfırdan yaratma yox) uşağı valideynə bağlayır: valideyni ləğv edin, hər törənmiş uşaq da avtomatik ləğv olunur.",
  "Goroutines attach at the leaves": "Goroutine-lər leaf-lərdə bağlanır",
  "Worker goroutines hold the leaf contexts and do real work - an HTTP call, a DB query - while watching ctx.Done() for a cancellation signal.": "Worker goroutine-ləri leaf context-ləri saxlayır və real iş görür - HTTP çağırışı, DB sorğusu - eyni zamanda ləğv siqnalı üçün ctx.Done()-a baxaraq.",
  "This is the realistic shape of a Go service: a deep tree of derived contexts with actual work happening only at the edges.": "Bu, Go servisinin real formasıdır: real işin yalnız kənarlarda baş verdiyi dərin törənmiş context ağacı.",
  "The deadline fires at the root": "Deadline kökdə işə düşür",
  "2 seconds elapse (or someone calls the root's cancel() function) - the root's Done() channel closes.": "2 saniyə keçir (və ya kimsə kökün cancel() funksiyasını çağırır) - kökün Done() kanalı bağlanır.",
  "Only the root needs to know WHY the request is ending (timeout, client disconnect, explicit cancel) - everything below just reacts to one signal.": "Yalnız kökün sorğunun NİYƏ bitdiyini bilməsi lazımdır (timeout, klient bağlantısının kəsilməsi, açıq ləğv) - aşağıdakı hər şey sadəcə bir siqnala reaksiya verir.",
  "Cancellation propagates down every edge": "Ləğv hər kənar boyunca aşağı yayılır",
  "The signal flows from root to children to grandchildren - each derived context's Done() closes in turn, depth by depth.": "Siqnal kökdən uşaqlara, sonra nəvələrə axır - hər törənmiş context-in Done()-u öz növbəsində, dərinlik-dərinlik bağlanır.",
  "This is automatic precisely BECAUSE children were derived, not created independently - there's no manual fan-out code that has to remember every goroutine.": "Bu, məhz UŞAQLARIN müstəqil deyil, törənmiş olması SƏBƏBİNDƏN avtomatikdir - hər goroutine-i xatırlamalı olan əl ilə fan-out kodu yoxdur.",
  "Clean shutdown - no goroutine leak": "Təmiz söndürmə - goroutine sızması yoxdur",
  "Cancellation reached every descendant. Every worker observed ctx.Done() closing and returned.": "Ləğv hər törəməyə çatdı. Hər worker ctx.Done()-un bağlandığını müşahidə etdi və qayıtdı.",
  "This is the payoff this whole module (and M7's leak detector) cares about: a goroutine that never learns its work is unwanted is a goroutine that never exits.": "Bütün bu modulun (və M7-nin sızma detektorunun) qayğısına qaldığı qazanc budur: işinin istənilmədiyini heç vaxt öyrənməyən goroutine heç vaxt çıxmayan goroutine deməkdir.",
  "A request arrives": "Sorğu gəlir",
  "GET /api/v1/ledger/42 enters Go's native net/http router.": "GET /api/v1/ledger/42 Go-nun daxili net/http router-inə daxil olur.",
  "The router's only job is mapping this one string to the right handler, fast - everything in this module is about how it does that without regular expressions.": "Router-in yeganə işi bu bir sətri düzgün handler-ə tez xəritələməkdir - bu modulda hər şey onun bunu regular expression-sız necə etdiyi ilə bağlıdır.",
  "The router walks a trie, segment by segment": "Router trie-i segment-segment gəzir",
  "ServeMux matches each path segment against the trie one node at a time - /api, then /v1, then /ledger - until it can't go any deeper.": "ServeMux hər yol seqmentini trie ilə bir dəfə bir node uyğunlaşdırır - /api, sonra /v1, sonra /ledger - daha dərinə gedə bilməyənə qədər.",
  "A trie turns routing into a fixed number of cheap segment comparisons instead of testing the path against every registered pattern in turn.": "Trie routing-i yolu sırayla hər qeydiyyatlı pattern-lə yoxlamaq əvəzinə sabit sayda ucuz segment müqayisəsinə çevirir.",
  "{id} captures the wildcard segment": "{id} wildcard seqmentini tutur",
  "The trie's last node is a wildcard - it matches ANY segment and captures it as \"42\", readable in the handler via r.PathValue(\"id\").": "Trie-nin son node-u wildcard-dır - o İSTƏNİLƏN seqmentə uyğun gəlir və onu \"42\" kimi tutur, handler-də r.PathValue(\"id\") vasitəsilə oxunur.",
  "A typed wildcard node is what lets one route handle /ledger/42, /ledger/99, /ledger/anything - without falling back to slower regexp matching.": "Məhz tipləşdirilmiş wildcard node bir marşrutun /ledger/42, /ledger/99, /ledger/hər-şey-i - daha yavaş regexp uyğunlaşdırmasına keçmədən - idarə etməsinə imkan verir.",
  "Handler resolves → 200 OK": "Handler işə düşür → 200 OK",
  "Once both the method (GET) and the full path match, the registered handler runs and returns a response.": "Həm metod (GET), həm də tam yol uyğun gəldikdə, qeydiyyatlı handler işə düşür və cavab qaytarır.",
  "Matching method AND path together (not just path) is what lets GET /ledger/42 and DELETE /ledger/42 route to two completely different handlers.": "Metod VƏ yolun birlikdə uyğunlaşdırılması (yalnız yol yox) GET /ledger/42 və DELETE /ledger/42-nin iki tamamilə fərqli handler-ə yönləndirilməsinə imkan verir.",
  "os.Root: a directory you can't escape": "os.Root: qaça bilmədiyiniz qovluq",
  "A handler that reads files opens them through os.Root(\"data\") instead of the raw filesystem - every path it resolves is forced to stay inside data/.": "Faylları oxuyan handler onları xam fayl sistemi əvəzinə os.Root(\"data\") vasitəsilə açır - onun həll etdiyi hər yol data/ daxilində qalmağa məcburdur.",
  "Path traversal (`../../etc/passwd`) is a classic vulnerability - os.Root makes 'escaping the jail' a type error, not a runtime check you might forget.": "Yol keçidi (`../../etc/passwd`) klassik zəiflikdir - os.Root «həbsxanadan qaçmağı» unuda biləcəyiniz runtime yoxlaması yox, tip xətasına çevirir.",
  "An escape attempt is blocked": "Qaçış cəhdi bloklanır",
  "A read of ../../etc/passwd tries to walk OUT of data/ using relative path tricks.": "../../etc/passwd-i oxumaq cəhdi nisbi yol hiylələri ilə data/-dən KƏNARA çıxmağa çalışır.",
  "If this succeeded, any handler taking a user-supplied filename could be tricked into reading arbitrary files on the host.": "Bu uğurlu olsaydı, istifadəçi tərəfindən verilən fayl adını qəbul edən istənilən handler host-da ixtiyari faylları oxumağa aldadıla bilərdi.",
  "Legitimate reads still succeed": "Qanuni oxumalar hələ də uğurlu olur",
  "root.Open(\"config.json\") resolves inside the jail and works exactly like a normal file read - no extra code in the handler.": "root.Open(\"config.json\") həbsxana daxilində həll olunur və dəqiq adi fayl oxuma kimi işləyir - handler-də əlavə kod yoxdur.",
  "The safety is structural: code that only ever has an *os.Root, never a raw path, cannot accidentally escape the jail - there's no boundary check to forget.": "Təhlükəsizlik struktur xarakterlidir: yalnız *os.Root-a sahib olan, heç vaxt xam yola sahib olmayan kod təsadüfən həbsxanadan qaça bilməz - unudula biləcək sərhəd yoxlaması yoxdur.",
  "The same lookup: m[\"USD\"]": "Eyni axtarış: m[\"USD\"]",
  "We'll trace this one lookup through two implementations: Go's legacy map, and the new Swiss Table design.": "Biz bu bir axtarışı iki implementasiya vasitəsilə izləyəcəyik: Go-nun köhnə map-i və yeni Swiss Table dizaynı.",
  "The map TYPE never changes in your code - only the internal layout does. Seeing both traces side by side (in time, not space) shows exactly what that internal change buys you.": "Kodunuzda map TİPİ heç vaxt dəyişmir - yalnız daxili düzülüş dəyişir. Hər iki trace-i yan-yana görmək (məkanda yox, zamanda) həmin daxili dəyişikliyin sizə nə qazandırdığını dəqiq göstərir.",
  "Legacy map: probe slot by slot": "Köhnə map: slot-slot yoxlayır",
  "The old map walks its bucket one entry at a time, comparing keys, until it finds USD or runs out of entries.": "Köhnə map öz bucket-ini bir dəfə bir qeyd gəzir, açarları müqayisə edir, USD-i tapana və ya qeydlər bitənə qədər.",
  "Each entry lives at a different memory address, so each check that misses is very likely its OWN separate cache miss - the cost adds up linearly.": "Hər qeyd fərqli yaddaş ünvanında yaşayır, ona görə uğursuz olan hər yoxlama çox güman ki, öz AYRI cache miss-idir - xərc xətti olaraq artır.",
  "Swiss Table: jump straight to one group of 8": "Swiss Table: birbaşa 8-lik bir qrupa keç",
  "The hash picks a single 8-slot group, and its 8 one-byte 'control bytes' - a tiny fingerprint per slot - all live together in ONE cache line.": "Hash bir tək 8-slotlu qrup seçir, və onun 8 birbaytlıq «control byte»-ı - hər slot üçün kiçik barmaq izi - hamısı BİR cache line-da birlikdə yaşayır.",
  "Loading 8 slots' worth of metadata costs the same one cache-line fetch as loading just one - the layout was designed around that fact.": "8 slot dəyərində metadata yükləmək bir slotu yükləmək qədər eyni bir cache-line fetch-ə başa gəlir - düzülüş məhz bu fakt ətrafında dizayn edilib.",
  "SIMD compares all 8 tags in one operation": "SIMD bütün 8 taqı bir əməliyyatda müqayisə edir",
  "Instead of checking slot 0, then slot 1, then slot 2…, one SIMD-style instruction compares the target's fingerprint against all 8 control bytes simultaneously.": "Slot 0-ı, sonra slot 1-i, sonra slot 2-ni yoxlamaq əvəzinə, bir SIMD tipli instruksiya hədəfin barmaq izini bütün 8 control byte ilə eyni vaxtda müqayisə edir.",
  "This is the structural win: legacy map cost scales with HOW MANY entries you check; Swiss Table cost is closer to constant - one fetch, one compare, almost always.": "Struktur qazanc budur: köhnə map xərci NEÇƏ qeyd yoxladığınıza görə miqyaslanır; Swiss Table xərci sabitə daha yaxındır - demək olar ki, həmişə bir fetch, bir müqayisə.",
  "Match found - one cache line touched, total": "Uyğunluq tapıldı - cəmi bir cache line toxunuldu",
  "USD sits in slot 2 of the group - found immediately. The whole lookup cost ONE cache-line fetch, versus up to 5 for the legacy map.": "USD qrupun 2-ci slotunda yerləşir - dərhal tapılır. Bütün axtarış cəmi BİR cache-line fetch-ə başa gəldi, köhnə map üçün 5-ə qədərə qarşı.",
  "This is why the Swiss Table redesign matters in practice: hot map lookups in a request path get measurably faster purely from this layout change - no code changes required.": "Buna görə Swiss Table yenidən dizaynı praktikada əhəmiyyət daşıyır: sorğu yolundakı isti map axtarışları sadəcə bu düzülüş dəyişikliyi sayəsində ölçülə bilən şəkildə sürətlənir - kod dəyişikliyi tələb olunmur.",
  "The object is alive": "Obyekt canlıdır",
  "A *Conn lives inside a parent span. The stack holds a reference to it, so the garbage collector considers it reachable - alive.": "*Conn valideyn span daxilində yaşayır. Stack ona istinad saxlayır, ona görə zibil yığan onu çatılabilir hesab edir - canlı.",
  "Reachability from a root is the ONLY thing that keeps an object alive in Go - not how recently it was used, not its size, just 'can a root still get to it.'": "Kökdən çatılabilirlik Go-da obyekti canlı saxlayan YEGANƏ şeydir - nə yaxınlarda istifadə olunub-olunmaması, nə ölçüsü, sadəcə «kök hələ ona çata bilirmi».",
  "The last reference drops": "Son istinad düşür",
  "Whatever held that reference returns or goes out of scope. The *Conn is now unreachable from any root - eligible for collection, but not yet collected.": "O istinadı saxlayan nə olursa olsun qayıdır və ya scope-dan çıxır. *Conn indi heç bir kökdən çatılabilən deyil - yığılmağa layiqdir, amma hələ yığılmayıb.",
  "'Unreachable' and 'freed' are NOT the same moment in Go - there's a gap, and that gap is exactly what the next two steps are about.": "«Çatılabilməz» və «azad edilmiş» Go-da EYNİ an DEYİL - aralarında boşluq var, və növbəti iki addım məhz bu boşluqla bağlıdır.",
  "The GC's next mark pass finds it dead": "GC-nin növbəti mark keçidi onu ölü tapır",
  "The concurrent collector sweeps through live memory tracing from the roots. The *Conn is never reached this time - it's now PROVABLY garbage, not just assumed.": "Konkurrent collector köklərdən izləyərək canlı yaddaş boyu sweep edir. *Conn bu dəfə heç çatılmır - indi bu sadəcə fərz edilən yox, SÜBUT OLUNMUŞ zibildir.",
  "Go won't free an object the instant it looks unused - it waits for the mark pass to confirm it, which is what makes collection safe even with concurrent mutation.": "Go obyekti istifadə olunmur kimi göründüyü an azad etmir - mark keçidinin bunu təsdiqləməsini gözləyir, bu da yığmanı konkurrent dəyişikliklə belə təhlükəsiz edir.",
  "The registered cleanup runs exactly once": "Qeydiyyatlı cleanup dəqiq bir dəfə işləyir",
  "runtime.AddCleanup fires: syscall.Close(7). It captured the file descriptor by VALUE when registered - not the object itself, so it can run safely even though *Conn is gone.": "runtime.AddCleanup işə düşür: syscall.Close(7). O, qeydiyyat zamanı fayl deskriptorunu DƏYƏR üzrə tutmuşdu - obyektin özünü yox, ona görə *Conn getdikdən sonra da təhlükəsiz işləyə bilər.",
  "Unlike the legacy SetFinalizer, AddCleanup never resurrects the object and never silently skips a cycle - it's a plain function call guaranteed to run once, on a dead object.": "Köhnə SetFinalizer-dən fərqli olaraq, AddCleanup heç vaxt obyekti diriltmir və heç vaxt sükutla dövrü ötürmür - bu, ölü obyekt üzərində bir dəfə işləməsi zəmanət verilən sadə funksiya çağırışıdır.",
  "Memory freed, no extra delay": "Yaddaş azad edildi, əlavə gecikmə yoxdur",
  "The parent span is reclaimed in the SAME cycle that proved the object dead - no resurrection pass, no waiting an extra GC cycle.": "Valideyn span obyektin ölü olduğunu sübut edən EYNİ dövrdə geri qaytarılır - dirilmə keçidi yoxdur, əlavə GC dövrü gözləmək yoxdur.",
  "This is the practical reason AddCleanup replaced finalizers for resource cleanup: deterministic, single-cycle reclamation means file descriptors and connections don't linger.": "Bu, AddCleanup-un resurs təmizliyi üçün finalizer-ləri əvəz etməsinin praktiki səbəbidir: deterministik, tək dövrlü geri qaytarma fayl deskriptorlarının və bağlantıların yubanmaması deməkdir.",
  "Goroutines start inside an isolated bubble": "Goroutine-lər təcrid olunmuş bubble daxilində başlayır",
  "Three goroutines run inside a synctest bubble - a sandbox with its OWN fake clock, separate from real wall-clock time.": "Üç goroutine synctest bubble daxilində işləyir - real divar saatından ayrı, ÖZ saxta saatı olan sandbox.",
  "Isolating both the goroutines AND time itself is what will let the test fast-forward through delays instead of actually waiting for them.": "Həm goroutine-ləri, HƏM DƏ vaxtın özünü təcrid etmək testə gecikmələri real gözləmək əvəzinə irəli sürüşdürməyə imkan verəcək.",
  "Each one runs, then blocks": "Hər biri işləyir, sonra bloklanır",
  "G1 sleeps for 0.5s, G2 for 0.8s, G3 for 1.0s (or waits on a channel) - each parks the moment it has nothing left to do.": "G1 0.5s, G2 0.8s, G3 1.0s yatır (və ya kanalda gözləyir) - hər biri edəcək işi qalmadığı an parklanır.",
  "A real test would have to actually wait out the slowest of these - that's the time cost synctest is about to eliminate.": "Real test bunların ən yavaşını real olaraq gözləməli olardı - synctest məhz bu vaxt xərcini aradan qaldırır.",
  "synctest.Wait: a precise barrier": "synctest.Wait: dəqiq maneə",
  "The test calls synctest.Wait, which blocks until EVERY goroutine in the bubble is durably parked - not 'probably done', but provably done.": "Test synctest.Wait çağırır, bu da bubble daxilindəki HƏR goroutine dayanıqlı şəkildə parklanana qədər bloklayır - «yəqin ki hazırdır» yox, sübutlu şəkildə hazırdır.",
  "This replaces a guessed time.Sleep(100*time.Millisecond) 'hope it's enough' with an exact, race-free synchronization point.": "Bu, təxmin edilən time.Sleep(100*time.Millisecond) «kifayət edər ümid edirəm» yanaşmasını dəqiq, race-siz sinxronizasiya nöqtəsi ilə əvəz edir.",
  "The fake clock jumps to the next timer": "Saxta saat növbəti taymerə tullanır",
  "With every goroutine confirmed blocked, the bubble's clock fast-forwards directly to whenever the next timer fires - instantly, no real waiting.": "Hər goroutine-in bloklandığı təsdiqləndikdən sonra, bubble-ın saatı birbaşa növbəti taymerin işə düşəcəyi ana sürüşür - ani, real gözləmə yoxdur.",
  "Real time and bubble time are decoupled: the test can simulate 5 real-world seconds of timers in microseconds of actual CPU time.": "Real vaxt və bubble vaxtı ayrılıb: test real dünya taymerlərinin 5 saniyəsini real CPU vaxtının mikrosaniyələrində simulyasiya edə bilər.",
  "Goroutines wake and finish": "Goroutine-lər oyanır və bitir",
  "Now that their timers/channels are ready, all three goroutines resume, complete their work, and the test's assertions run against a fully settled state.": "İndi taymerlər/kanallar hazır olduğundan, hər üç goroutine davam edir, işini tamamlayır, və testin təsdiqləri tam yerləşmiş vəziyyətə qarşı işləyir.",
  "Because everything is driven by the deterministic bubble clock, there's no window where the assertions could race against a goroutine that's still finishing.": "Hər şey determinist bubble saatı ilə idarə olunduğundan, təsdiqlərin hələ bitməkdə olan goroutine ilə yarışa biləcəyi pəncərə yoxdur.",
  "No flakes: wall ≈ 0s, bubble = 5s": "Qeyri-sabitlik yoxdur: divar vaxtı ≈ 0s, bubble = 5s",
  "The whole test simulated 5 seconds of timers while real wall-clock time barely moved - fully deterministic, every run, every machine.": "Bütün test 5 saniyəlik taymeri simulyasiya edərkən real divar vaxtı demək olar ki, hərəkət etmədi - tam determinist, hər işə salmada, hər maşında.",
  "No time.Sleep means no 'flaky on a slow CI box' - the test's correctness no longer depends on how fast the test runner happens to be today.": "time.Sleep olmaması «yavaş CI maşınında qeyri-sabit» olmaması deməkdir - testin düzgünlüyü artıq test işlədicisinin bu gün nə qədər sürətli olmasından asılı deyil.",
  "Two transfers want the same account": "İki köçürmə eyni hesabı istəyir",
  "T1 and T2 are both transactions trying to move money - and both need to touch account A at the same moment.": "T1 və T2 hər ikisi pul köçürməyə çalışan tranzaksiyalardır - və hər ikisinin eyni anda A hesabına toxunması lazımdır.",
  "This exact scenario - concurrent writers, shared row - is what row-level locking exists to make safe.": "Məhz bu ssenari - konkurrent yazanlar, ortaq sətir - row-level lock-un təhlükəsiz etmək üçün mövcud olduğu şeydir.",
  "T1 locks account A": "T1 A hesabını bloklayır",
  "T1 runs SELECT … FOR UPDATE, which takes a lock on just that one row - not the whole table.": "T1 SELECT … FOR UPDATE işlədir, bu da yalnız o bir sətir üçün lock götürür - bütün cədvəl üçün yox.",
  "Locking only the specific row means transfers touching DIFFERENT accounts can still run fully in parallel - the lock's scope is as narrow as correctness allows.": "Yalnız konkret sətri bloklamaq FƏRQLİ hesablara toxunan köçürmələrin hələ də tam paralel işləyə biləcəyi deməkdir - lock-un əhatəsi düzgünlüyün icazə verdiyi qədər dardır.",
  "T2 blocks behind the lock": "T2 lock arxasında bloklanır",
  "T2 also needs account A, so it simply waits - Postgres won't let it read until T1's transaction finishes.": "T2-yə də A hesabı lazımdır, ona görə sadəcə gözləyir - Postgres T1-in tranzaksiyası bitənə qədər ona oxumağa icazə vermir.",
  "If T2 read A mid-transfer, it could see a half-finished state (debited but not yet credited) - blocking prevents that entirely.": "Əgər T2 köçürmənin ortasında A-nı oxusaydı, yarımçıq bitmiş vəziyyəti görə bilərdi (debit edilib, amma hələ kredit edilməyib) - bloklama bunu tamamilə önləyir.",
  "Inside the transaction: debit and credit together": "Tranzaksiya daxilində: debit və kredit birlikdə",
  "T1 subtracts $100 from A and adds $100 to B - both statements run inside the SAME transaction, so they can never land separately.": "T1 A-dan $100 çıxarır və B-yə $100 əlavə edir - hər iki ifadə EYNİ tranzaksiya daxilində işləyir, ona görə heç vaxt ayrı-ayrı tətbiq oluna bilməzlər.",
  "This is double-entry: if the process crashed between the two writes, the whole transaction rolls back - you never end up with money debited from A but never credited to B.": "Bu double-entry-dir: proses iki yazı arasında çökərsə, bütün tranzaksiya geri alınır - siz heç vaxt A-dan çıxılıb B-yə heç vaxt kredit edilməyən pulla qalmırsınız.",
  "COMMIT releases the lock": "COMMIT lock-u azad edir",
  "T1 commits - its changes become permanent, and the row lock on account A is released immediately.": "T1 commit olur - dəyişiklikləri daimi olur, və A hesabındakı sətir lock-u dərhal azad edilir.",
  "The lock is held for the shortest time that's still correct: exactly as long as T1's transaction is open, no longer.": "Lock hələ də düzgün olan ən qısa müddət ərzində saxlanılır: dəqiq T1-in tranzaksiyası açıq olduğu qədər, daha uzun yox.",
  "T2 proceeds - the invariant held": "T2 davam edir - invariant qorundu",
  "T2 now reads fresh, consistent balances and runs its own transfer. Through all of this, the total money in the system never changed.": "T2 indi təzə, ardıcıl balansları oxuyur və öz köçürməsini işlədir. Bütün bu müddət ərzində sistemdəki ümumi pul heç vaxt dəyişmədi.",
  "This is the proof the pattern works: concurrent access was serialized just enough to keep Σ(balances) constant, without serializing the WHOLE database.": "Bu, pattern-in işlədiyinin sübutudur: konkurrent giriş Σ(balanslar)-ı sabit saxlamaq üçün lazım olduğu qədər ardıcıllaşdırıldı, BÜTÜN verilənlər bazasını ardıcıllaşdırmadan.",
  "A transfer enters the database boundary": "Köçürmə verilənlər bazası sərhədinə daxil olur",
  "The service receives one request, but the durable truth will be created by several tables together: accounts, transfers, ledger entries, and the outbox.": "Servis bir sorğu qəbul edir, amma davamlı həqiqət bir neçə cədvəl tərəfindən birlikdə yaradılacaq: accounts, transfers, ledger entries və outbox.",
  "The database boundary matters because retries, crashes, and duplicate requests all meet at the same place: the transaction.": "Verilənlər bazası sərhədi əhəmiyyətlidir, çünki retry-lər, çökmələr və təkrarlanan sorğular hamısı eyni yerdə görüşür: tranzaksiyada.",
  "CHECK constraints reject impossible values": "CHECK constraint-ləri mümkünsüz dəyərləri rədd edir",
  "The schema refuses negative balances and non-positive transfer amounts before the data can become durable.": "Sxem məlumat davamlı ola bilmədən əvvəl mənfi balansları və müsbət olmayan köçürmə məbləğlərini rədd edir.",
  "Go validation gives good error messages; Postgres constraints protect the data when a bad binary deploys anyway.": "Go validasiyası yaxşı xəta mesajları verir; Postgres constraint-ləri pis binar hər halda deploy olunduqda məlumatı qoruyur.",
  "UNIQUE idempotency_key absorbs retries": "UNIQUE idempotency_key retry-ləri udur",
  "The same client retry reaches the database twice, but the unique key lets only one transfer identity exist.": "Eyni klient retry-i verilənlər bazasına iki dəfə çatır, amma unique açar yalnız bir köçürmə identitetinin mövcud olmasına icazə verir.",
  "This is what stops timeouts and retry loops from double-charging a customer.": "Bu, timeout-ların və retry dövrələrinin müştəridən iki dəfə pul çıxarmasının qarşısını alan şeydir.",
  "Ledger rows and outbox commit atomically": "Ledger sətirləri və outbox atomik commit olunur",
  "The debit, credit, transfer row, and event row land in one transaction, so no downstream publisher can see a business event that the ledger did not commit.": "Debit, kredit, transfer sətri və hadisə sətri bir tranzaksiyada yerləşir, ona görə heç bir downstream publisher ledger-in commit etmədiyi biznes hadisəsini görə bilməz.",
  "The outbox pattern turns 'write then publish' into a recoverable database fact instead of a timing hope.": "Outbox pattern «yaz, sonra dərc et»-i vaxt ümidi əvəzinə bərpa oluna bilən verilənlər bazası faktına çevirir.",
  "A query shape arrives": "Sorğu forması gəlir",
  "The service asks for the latest 50 ledger entries for one account, ordered by posted_at descending.": "Servis bir hesab üçün son 50 ledger qeydini, posted_at üzrə azalan sırayla istəyir.",
  "The planner optimizes this exact shape, not your mental model of which columns feel important.": "Planlaşdırıcı hansı sütunların vacib göründüyü haqqında mental modelinizi yox, məhz bu forma optimallaşdırır.",
  "No matching index means a wide scan": "Uyğun indeks olmadıqda geniş scan olur",
  "A sequential scan may touch thousands or millions of rows, then sort, just to return a tiny page.": "Ardıcıl scan minlərlə və ya milyonlarla sətrə toxuna bilər, sonra çeşidləyər, sadəcə kiçik bir səhifə qaytarmaq üçün.",
  "The danger is not only time; it is shared buffer churn that evicts useful pages for other requests.": "Təhlükə yalnız vaxt deyil; digər sorğular üçün faydalı səhifələri çıxaran ortaq buffer churn-dur.",
  "Composite index follows filter then sort": "Kompozit indeks əvvəl filter, sonra sort ardıcıllığına əməl edir",
  "An index on (account_id, posted_at DESC) lets Postgres jump to one account's newest rows in order.": "(account_id, posted_at DESC) üzrə indeks Postgres-ə bir hesabın ən yeni sətirlərinə birbaşa sıra ilə keçməyə imkan verir.",
  "Column order encodes the query shape: equality first, then ordering/range.": "Sütun sırası sorğu formasını kodlaşdırır: əvvəl bərabərlik, sonra ordering/range.",
  "INCLUDE can avoid heap fetches": "INCLUDE heap fetch-lərdən qaça bilər",
  "Including amount and direction lets the index answer the selected columns without visiting the table for every row.": "amount və direction-un daxil edilməsi indeksə hər sətir üçün cədvələ baş çəkmədən seçilmiş sütunlara cavab verməyə imkan verir.",
  "Covering helps only when the query really projects those columns and visibility permits an index-only scan.": "Covering yalnız sorğu həqiqətən o sütunları qaytardıqda və visibility index-only scan-a icazə verdikdə köməkçidir.",
  "EXPLAIN proves the real plan": "EXPLAIN real planı sübut edir",
  "EXPLAIN (ANALYZE, BUFFERS) shows actual timing and whether the plan burned buffers or heap fetches.": "EXPLAIN (ANALYZE, BUFFERS) faktiki vaxtı və planın buffer və ya heap fetch yandırıb-yandırmadığını göstərir.",
  "The optimization is not done until the second measurement proves it.": "Optimizasiya ikinci ölçmə bunu sübut edənə qədər bitmiş sayılmır.",
  "A heavy DDL lock stops the table": "Ağır DDL lock cədvəli dayandırır",
  "Some schema changes need locks that block writers. On a hot table, that can become an incident before the migration finishes.": "Bəzi sxem dəyişiklikləri yazanları bloklayan lock-lar tələb edir. İsti cədvəldə bu, miqrasiya bitmədən insidentə çevrilə bilər.",
  "A migration is production code running against your largest stateful dependency. Treat it with the same care as a deploy.": "Miqrasiya ən böyük stateful asılılığınıza qarşı işləyən production koddur. Ona deploy qədər diqqətlə yanaşın.",
  "Concurrent index build keeps writes moving": "Concurrent index build yazıları davam etdirir",
  "CREATE INDEX CONCURRENTLY takes longer but avoids blocking ordinary reads and writes while the index is built.": "CREATE INDEX CONCURRENTLY daha uzun çəkir, amma indeks qurulan zaman adi oxu və yazıları bloklamaqdan qaçır.",
  "You pay with time and restrictions, but you avoid turning the database into a single-file queue.": "Vaxt və məhdudiyyətlərlə ödəyirsiniz, amma verilənlər bazasını tək fayllıq növbəyə çevirməkdən qaçırsınız.",
  "Long transactions pin old row versions": "Uzun tranzaksiyalar köhnə sətir versiyalarını bərkidir",
  "MVCC keeps old versions visible to old snapshots. A long transaction can keep those versions alive long after writers moved on.": "MVCC köhnə versiyaları köhnə snapshot-lar üçün görünən saxlayır. Uzun tranzaksiya yazanlar irəli getdikdən çox sonra da bu versiyaları canlı saxlaya bilər.",
  "This is how normal update traffic quietly becomes table and index bloat.": "Normal update trafiki bu şəkildə sükutla cədvəl və indeks bloat-una çevrilir.",
  "Vacuum cannot clean pinned tuples": "Vacuum bərkidilmiş tuple-ları təmizləyə bilmir",
  "Vacuum sees dead tuples, but it cannot remove versions that an old snapshot might still need.": "Vacuum ölü tuple-ları görür, amma köhnə snapshot-un hələ də ehtiyac duya biləcəyi versiyaları silə bilmir.",
  "Autovacuum is not magic; it needs transactions to end and enough IO budget to keep up.": "Autovacuum sehr deyil; onun tranzaksiyaların bitməsinə və kifayət qədər IO büdcəsinə ehtiyacı var.",
  "Batch backfills release pressure": "Batch backfill-lər təzyiqi azaldır",
  "Small batches with short transactions let writers continue, let vacuum clean, and make the migration interruptible.": "Qısa tranzaksiyalı kiçik batch-lər yazanların davam etməsinə, vacuum-un təmizləməsinə imkan verir və miqrasiyanı fasilə edilə bilən edir.",
  "Expand/backfill/contract is boring, and boring is exactly what you want from production database changes.": "Expand/backfill/contract sıxıcıdır, və sıxıcılıq məhz production verilənlər bazası dəyişikliklərindən istədiyiniz şeydir.",
  "Two handshakes, same shape, different math": "İki handshake, eyni forma, fərqli riyaziyyat",
  "Channel A negotiates a classical X25519 key. Channel B negotiates a hybrid key - classical X25519 PLUS a lattice-based ML-KEM-768 key, combined.": "Kanal A klassik X25519 açarı danışır. Kanal B hibrid açar danışır - klassik X25519 ARTI lattice əsaslı ML-KEM-768 açarı, birləşdirilmiş.",
  "Both look identical at the protocol level - a normal TLS handshake. The difference that matters is invisible: what hard math problem the key relies on.": "Hər ikisi protokol səviyyəsində eyni görünür - adi TLS handshake. Əhəmiyyət daşıyan fərq görünməzdir: açarın hansı çətin riyazi məsələyə söykəndiyi.",
  "An attacker harvests today's ciphertext": "Hücumçu bugünkü ciphertext-i toplayır",
  "A passive adversary doesn't try to break the key right now - it just records both encrypted sessions and stores them.": "Passiv rəqib indi açarı sındırmağa çalışmır - sadəcə hər iki şifrələnmiş sessiyanı qeyd edir və saxlayır.",
  "This is 'harvest now, decrypt later': the attack doesn't need to be feasible TODAY, only by the time a quantum computer exists.": "Bu «indi topla, sonra deşifrə et»-dir: hücumun BU GÜN mümkün olmasına ehtiyac yoxdur, yalnız kvant kompüteri mövcud olan zaman.",
  "Years later: a quantum computer arrives": "İllər sonra: kvant kompüteri gəlir",
  "A cryptographically-relevant quantum computer comes online and is pointed at both stored recordings.": "Kriptoqrafik cəhətdən aktual kvant kompüteri işə düşür və hər iki saxlanılan yazıya yönləndirilir.",
  "This is the whole premise of post-quantum cryptography: defend data today against a computer that doesn't exist yet, because the recording already happened.": "Post-kvant kriptoqrafiyanın bütün əsası budur: bugünkü məlumatı hələ mövcud olmayan kompüterdən qorumaq, çünki yazı artıq baş verib.",
  "Channel A's classical key falls": "Kanal A-nın klassik açarı yıxılır",
  "Shor's algorithm efficiently solves the discrete-log problem that X25519's security rests on - the recorded session decrypts.": "Shor alqoritmi X25519-un təhlükəsizliyinin söykəndiyi diskret loqarifm məsələsini səmərəli həll edir - qeydə alınmış sessiya deşifrə olunur.",
  "This is exactly why 'classical-only' key exchange is a liability for any data that needs to stay secret for years: today's strong key becomes tomorrow's broken one.": "Buna görə «yalnız klassik» açar mübadiləsi illərlə sirr qalmalı olan hər hansı məlumat üçün risk yaradır: bugünkü güclü açar sabahkı sınmış açara çevrilir.",
  "Channel B's hybrid key holds": "Kanal B-nin hibrid açarı dayanır",
  "The ML-KEM-768 lattice key has no known efficient quantum attack - so even though the ciphertext was recorded, it stays unreadable.": "ML-KEM-768 lattice açarının məlum səmərəli kvant hücumu yoxdur - ona görə ciphertext qeydə alınsa belə, oxunmaz qalır.",
  "Hybrid means EITHER half failing is survivable: it's only broken if BOTH the classical AND the lattice problem fall - a much higher bar than relying on one algorithm alone.": "Hibrid o deməkdir ki, HƏR İKİ yarının biri uğursuz olsa belə sağ qalınır: yalnız HƏM klassik, HƏM DƏ lattice məsələsi yıxılarsa sınır - bir alqoritmə güvənməkdən daha yüksək standart.",
  "A live goroutine graph": "Canlı goroutine qrafı",
  "Goroutines are nodes; the channels and contexts connecting them are the edges. This is the shape the leak analyzer reasons about.": "Goroutine-lər node-lardır; onları birləşdirən kanallar və context-lər isə kənarlardır. Sızma analizatorunun mühakimə etdiyi forma budur.",
  "Most goroutine leaks aren't a mystery once you can SEE the dependency graph - they're usually one missing edge.": "Asılılıq qrafını GÖRƏ bildikdən sonra əksər goroutine sızmaları sirr olmaqdan çıxır - adətən bir çatışmayan kənardır.",
  "G4 is stuck forever": "G4 həmişəlik ilişib qalıb",
  "G4 is parked on <-results - and tracing the graph, NOTHING will ever send on that channel. It will wait until the process dies.": "G4 <-results üzərində parklanıb - qrafı izlədikdə görünür ki, HEÇ NƏ o kanala heç vaxt göndərməyəcək. Proses ölənə qədər gözləyəcək.",
  "A blocked goroutine isn't automatically a leak - other goroutines block briefly all the time. It's a leak specifically because nothing can ever wake it.": "Bloklanmış goroutine avtomatik sızma deyil - digər goroutine-lər həmişə qısa müddətə bloklanır. Bu, məhz heç nəyin onu heç vaxt oyada bilməməsi səbəbindən sızmadır.",
  "The analyzer traces backward": "Analizator geriyə izləyir",
  "Starting from the blocked goroutine, the analyzer walks the channel graph backward - G4 ← G3 - hunting for whoever was supposed to send.": "Bloklanmış goroutine-dən başlayaraq analizator kanal qrafını geriyə gəzir - G4 ← G3 - göndərməli olan kimin olduğunu axtararaq.",
  "Walking the graph backward from the symptom is exactly how you'd debug this by hand - the analyzer just does it instantly and exhaustively.": "Simptomdan geriyə qrafı gəzmək dəqiq sizin bunu əl ilə debug edəcəyiniz üsuldur - analizator sadəcə bunu ani və hərtərəfli edir.",
  "Root cause found": "Kök səbəb tapıldı",
  "G2 dispatch is the actual problem: it never sends on results, and its context had no deadline to force it to give up and move on.": "G2 dispatch əsl problemdir: o heç vaxt results-a göndərmir, və onun context-inin ondan əl çəkib davam etməyə məcbur edəcək deadline-ı yox idi.",
  "Localizing to ONE goroutine and ONE missing send turns 'the program hangs sometimes' into a fix you can make in one line.": "BİR goroutine və BİR çatışmayan göndərişə lokallaşdırma «proqram bəzən donur»-u bir sətirdə edə biləcəyiniz düzəlişə çevirir.",
  "Read the goroutine dump": "Goroutine dump-ı oxuyun",
  "The raw evidence is one SIGQUIT away: the dump names every goroutine, its wait reason and HOW LONG it has waited. Minutes of [chan receive] on a millisecond workload is the smoking gun.": "Xam sübut bir SIGQUIT məsafəsindədir: dump hər goroutine-i, onun gözləmə səbəbini və NƏ QƏDƏR gözlədiyini adlandırır. Millisaniyəlik yükdə dəqiqələrlə [chan receive] birbaşa sübutdur.",
  "Every Go binary already ships this tool. Reading the wait reason and duration is the fastest first move in any hang investigation - before profilers, before dashboards.": "Hər Go binarında bu alət artıq var. Gözləmə səbəbini və müddətini oxumaq hər donma araşdırmasında ən sürətli ilk addımdır - profiler-lərdən əvvəl, dashboard-lardan əvvəl.",
  "waiting for 5 minutes ⚠": "5 dəqiqədir gözləyir ⚠",
  "One-line fix: a deadline": "Bir sətirlik düzəliş: deadline",
  "With context.WithTimeout around G2's work, the send either happens or the deadline fires - either way G4 wakes up and the graph drains cleanly.": "G2-nin işi ətrafında context.WithTimeout ilə göndəriş ya baş verir, ya da deadline işə düşür - hər halda G4 oyanır və qraf təmiz boşalır.",
  "Leaks aren't fixed by restarting goroutines - they're fixed by guaranteeing every wait has a second exit: a send, a close, or a deadline.": "Sızmalar goroutine-ləri yenidən başlatmaqla düzəlmir - onlar hər gözləmənin ikinci çıxışı olmasını təmin etməklə düzəlir: göndəriş, close və ya deadline.",
  "✓ G4 drained": "✓ G4 boşaldıldı",
  "Guard the boundary in tests": "Sərhədi testlərdə qoruyun",
  "Count goroutines when a test starts and when it ends. If the numbers differ after everything should have drained, fail the test - the leak never reaches production.": "Test başlayanda və bitəndə goroutine-ləri sayın. Hər şey boşalmalı olduqdan sonra rəqəmlər fərqlənərsə, testi uğursuz edin - sızma heç vaxt production-a çatmır.",
  "Production forensics is the backup plan. The cheap win is refusing to merge code that leaks: a boundary check turns a silent leak into red CI.": "Production forensika ehtiyat planıdır. Ucuz qazanc sızan kodu merge etməkdən imtina etməkdir: sərhəd yoxlaması sükut edən sızmanı qırmızı CI-a çevirir.",
  "goroutines at start: 4": "başlanğıcda goroutine-lər: 4",
  "goroutines at end:   4 ✓": "sonda goroutine-lər:  4 ✓",
  "PASS · no leaks": "PASS · sızma yoxdur",
  "Same work, two engines": "Eyni iş, iki mühərrik",
  "We'll process the same 32-element array two ways: a plain scalar loop, one element at a time, and a SIMD vector loop.": "Eyni 32 elementli massivi iki üsulla emal edəcəyik: adi skalyar dövrə, bir dəfə bir element, və SIMD vektor dövrəsi.",
  "Comparing them on identical work isolates exactly what the vector hardware buys you - nothing about the task itself changes.": "Onları eyni iş üzərində müqayisə etmək vektor avadanlığının sizə nə qazandırdığını dəqiq təcrid edir - tapşırığın özü ilə bağlı heç nə dəyişmir.",
  "Scalar: one element per cycle": "Skalyar: taktda bir element",
  "The plain loop touches a single array element each iteration - the pointer crawls along one cell at a time.": "Adi dövrə hər iterasiyada bir massiv elementinə toxunur - işarəçi bir dəfə bir hüceyrə boyu sürünür.",
  "This is the baseline: N elements means N cycles of work, no matter how simple each individual step is.": "Bu bazadır: N element N takt iş deməkdir, hər fərdi addımın nə qədər sadə olmasından asılı olmayaraq.",
  "SIMD: sixteen elements per cycle": "SIMD: taktda on altı element",
  "One vector instruction loads and processes a whole 16-element lane at once - the same array, far fewer trips through the loop.": "Bir vektor instruksiyası bütün 16 elementlik zolağı bir dəfəyə yükləyir və emal edir - eyni massiv, dövrə boyu çox daha az keçid.",
  "The CPU has dedicated wide registers and circuits for this - it's not 'doing 16 things fast', it's doing them in the SAME instruction.": "CPU-nun bunun üçün xüsusi geniş registrləri və sxemləri var - bu «16 şeyi sürətli etmək» deyil, onları EYNİ instruksiyada etməkdir.",
  "Same result, ~16× fewer cycles": "Eyni nəticə, ~16× az takt",
  "Both loops produce the identical output - only the number of cycles spent getting there differs.": "Hər iki dövrə eyni nəticəni verir - yalnız ora çatmaq üçün sərf olunan takt sayı fərqlənir.",
  "This is why hot numeric loops (hashing, checksums, image/byte processing) are worth vectorizing: the speedup is structural, not a micro-optimization.": "Buna görə isti rəqəm dövrələrini (hashing, checksum, şəkil/bayt emalı) vektorlaşdırmağa dəyər: sürətlənmə struktur xarakterlidir, mikro-optimizasiya yox.",
  "Green Tea GC sweeps contiguous spans": "Green Tea GC ardıcıl span-ları sweep edir",
  "Switching topics: the new collector marks memory in contiguous 8 KiB spans in parallel, instead of chasing one scattered object at a time.": "Mövzunu dəyişirik: yeni collector yaddaşı bir dağınıq obyektin ardınca qaçmaq əvəzinə paralel şəkildə ardıcıl 8 KiB span-larda işarələyir.",
  "Spans are physically contiguous in memory - exactly the layout that lets a sweep be both vectorizable AND cache-friendly, the same idea as the SIMD loop above.": "Span-lar yaddaşda fiziki olaraq ardıcıldır - məhz sweep-in həm vektorlaşdırıla bilən, HƏM DƏ cache-dostu olmasına imkan verən düzülüş, yuxarıdakı SIMD dövrəsi ilə eyni fikir.",
  "Cache-friendly and scales with cores": "Cache-dostu və nüvələrlə miqyaslanır",
  "Sequential span scanning avoids the scattered cache misses of object-by-object marking, and multiple cores can sweep different spans in parallel.": "Ardıcıl span skanlaması obyekt-obyekt işarələmənin dağınıq cache miss-lərindən qaçır, və bir neçə nüvə fərqli span-ları paralel sweep edə bilər.",
  "This connects directly back to M10: contiguous memory is what makes both a SIMD loop AND a GC sweep fast - the hardware always rewards sequential access.": "Bu birbaşa M10-a bağlanır: ardıcıl yaddaş həm SIMD dövrəsini, HƏM DƏ GC sweep-i sürətli edən şeydir - avadanlıq həmişə ardıcıl girişi mükafatlandırır.",
  "Three healthy v1 pods serve traffic": "Üç sağlam v1 pod trafikə xidmət edir",
  "The load balancer spreads incoming requests across every Ready pod. This is the steady state before a rollout begins.": "Yük balanslaşdırıcısı gələn sorğuları hər Ready pod arasında paylayır. Bu, rollout başlamazdan əvvəlki sabit vəziyyətdir.",
  "A rollout always starts from a known-good baseline - that's what makes it safe to compare against as the upgrade proceeds.": "Rollout həmişə məlum-yaxşı bazadan başlayır - yenilənmə davam etdikcə onunla müqayisəni təhlükəsiz edən budur.",
  "A new v2 pod starts - but gets no traffic yet": "Yeni v2 pod başlayır - amma hələ trafik almır",
  "A 4th pod boots running v2. Its readiness probe hasn't passed, so the load balancer deliberately routes it nothing.": "4-cü pod v2 ilə işə düşür. Onun readiness sınağı hələ keçməyib, ona görə yük balanslaşdırıcısı bilərəkdən ona heç nə yönləndirmir.",
  "Sending live traffic to a pod that isn't ready (still loading config, warming caches) would mean real users hitting errors.": "Hazır olmayan poda (hələ config yükləyir, keş isidir) canlı trafik göndərmək real istifadəçilərin xətalara rast gəlməsi deməkdir.",
  "Readiness probe passes → pod joins rotation": "Readiness sınağı keçir → pod rotasiyaya qoşulur",
  "Once the probe succeeds, the load balancer adds the v2 pod to rotation immediately - it starts receiving its share of traffic.": "Sınaq uğurlu olduqdan sonra yük balanslaşdırıcısı v2 podu dərhal rotasiyaya əlavə edir - trafikin öz payını almağa başlayır.",
  "This is the gate that makes rollouts safe: 'started' and 'ready to serve' are different states, and only the second one earns traffic.": "Rollout-ları təhlükəsiz edən qapı budur: «başladı» və «xidmətə hazır» fərqli vəziyyətlərdir, və yalnız ikincisi trafik qazanır.",
  "An old v1 pod drains": "Köhnə v1 pod boşalır",
  "Now that v2 is carrying load, one v1 pod stops receiving NEW requests but keeps running until its in-flight requests finish.": "İndi v2 yükü daşıdığından, bir v1 pod YENİ sorğular almağı dayandırır, amma uçuşdakı sorğuları bitənə qədər işləməyə davam edir.",
  "Draining (not killing) is what guarantees zero dropped requests - a request that's already in progress always gets to complete.": "Öldürmək yox, boşaltmaq sıfır itirilmiş sorğunu təmin edən şeydir - artıq prosesdə olan sorğu həmişə tamamlanma imkanı əldə edir.",
  "The slot comes back as v2": "Slot v2 olaraq geri qayıdır",
  "Once drained, the old pod terminates and a fresh v2 pod boots in its place - going through the same starting → ready sequence.": "Boşaldıqdan sonra köhnə pod dayanır, və onun yerində təzə v2 pod işə düşür - eyni başlama → hazırlıq ardıcıllığından keçərək.",
  "Replacing pods ONE AT A TIME (not all at once) means the fleet never drops below enough healthy capacity to serve current load.": "PODLARI BİRBƏBİR (hamısını eyni anda yox) əvəz etmək o deməkdir ki, park heç vaxt cari yükə xidmət üçün kifayət qədər sağlam tutumdan aşağı düşmür.",
  "Repeat until the whole fleet is upgraded": "Bütün park yenilənənə qədər təkrarla",
  "The same start → probe → join → drain → replace cycle repeats pod by pod until every pod runs v2.": "Eyni başlat → yoxla → qoşul → boşalt → əvəz et dövrü hər pod üçün təkrarlanır, tə ki hər pod v2 versiyasında işləyir.",
  "Zero dropped requests, throughout an entire version upgrade, with no maintenance window - that's the payoff of doing it incrementally.": "Bütün versiya yeniləməsi boyunca, texniki xidmət fasiləsi olmadan sıfır itirilmiş sorğu - inkremental yanaşmanın gətirdiyi qazanc budur.",
  "Small & fast, down to big & slow": "Kiçik və sürətlidən böyük və yavaşa",
  "Memory is a pyramid: L1 is tiny but ~1 ns, RAM is huge but ~100 ns. Each step down is roughly 10× bigger and 10× slower.": "Yaddaş piramidadır: L1 çox kiçikdir, amma ~1 ns, RAM nəhəngdir, amma ~100 ns. Hər addım aşağı təxminən 10× böyük və 10× yavaşdır.",
  "On-chip caches are small because fast memory is expensive to build - so the CPU keeps only the hottest data there and falls back to slower, bigger memory for the rest.": "Çip üzərindəki keşlər kiçikdir, çünki sürətli yaddaş qurmaq bahadır - ona görə CPU orada yalnız ən 'isti' datanı saxlayır, qalanı üçün daha yavaş, daha böyük yaddaşa müraciət edir.",
  "A miss escalates one level at a time": "Miss bir səviyyə yuxarı qalxır, addım-addım",
  "The CPU asks L1 first. Not there? Ask L2. Not there? Ask L3. Each 'no' costs a little more time before moving down.": "CPU əvvəlcə L1-dən soruşur. Orada yoxdur? L2-dən soruşur. Orada da yoxdur? L3-dən soruşur. Hər 'yox' cavabı aşağı keçmədən əvvəl bir az da vaxt aparır.",
  "Each cache only stores a recent subset of memory - checking the small, fast one first is cheap insurance before paying for a slower lookup.": "Hər keş yaddaşın yalnız son vaxtlar istifadə olunan alt dəstini saxlayır - əvvəlcə kiçik, sürətli olanı yoxlamaq, yavaş axtarışa görə ödəməzdən əvvəl ucuz sığortadır.",
  "RAM answers with a whole 64-byte line": "RAM bütöv 64-baytlıq xətlə cavab verir",
  "RAM never hands back a single value - it returns the full 64-byte block containing it, and that block fills L3, then L2, then L1 on the way back up.": "RAM heç vaxt tək bir dəyər qaytarmır - onu ehtiva edən bütün 64-baytlıq bloku qaytarır, və bu blok geri yolda əvvəlcə L3-ü, sonra L2-ni, sonra L1-i doldurur.",
  "Fetching one extra value is almost free once the bus is already moving data, so hardware always moves in line-sized chunks - betting that nearby bytes will be used soon too.": "Şin artıq data daşıyarkən bir əlavə dəyər almaq demək olar ki, pulsuzdur, ona görə avadanlıq həmişə xətt ölçülü bloklarla hərəkət edir - yaxınlıqdakı baytların da tezliklə lazım olacağına mərc edərək.",
  "The next 7 reads are now nearly free": "İndi növbəti 7 oxuma demək olar ki, pulsuzdur",
  "Those values were strangers a moment ago; now they live in L1 with the one we asked for. Reading them costs ~1 ns each instead of ~100 ns.": "Bu dəyərlər bir an əvvəl yad idi; indi istədiyimizlə birlikdə L1-də yaşayırlar. Onları oxumaq hər biri ~100 ns əvəzinə ~1 ns başa gəlir.",
  "This is why sequential, contiguous access (slices) is so much faster than scattered access (linked lists, pointer-chasing) - it cashes in on a line you already paid to fetch.": "Elə buna görə də ardıcıl, kəsintisiz giriş (slice-lar) səpələnmiş girişdən (bağlı siyahılar, işarəçi qovğusu) qat-qat sürətlidir - artıq ödədiyiniz xətti işə salır.",
  "One instruction, five stages": "Bir təlimat, beş mərhələ",
  "Every instruction passes through 5 fixed stations: Fetch the instruction, Decode it, Execute it, access Memory, Write the result back.": "Hər təlimat 5 sabit stansiyadan keçir: Fetch (təlimatı gətir), Decode (deşifrə et), Execute (icra et), Memory-yə (yaddaşa) müraciət et, Write-back (nəticəni geri yaz).",
  "Splitting the work into small fixed stages is what lets the next instruction start before this one finishes - that's the whole trick of pipelining.": "İşi kiçik, sabit mərhələlərə bölmək məhz növbəti təlimatın bu bitmədən başlamasına imkan verir - pipelining-in bütün hiyləsi budur.",
  "The next instruction starts one cycle later": "Növbəti təlimat bir takt sonra başlayır",
  "While I1 moves to Decode, I2 enters Fetch right behind it - they're in different stages of the SAME pipe at the same time.": "I1 Decode-a keçərkən, I2 onun arxasınca dərhal Fetch-ə girir - onlar eyni vaxtda EYNİ konveyerin fərqli mərhələlərindədir.",
  "If the core waited for I1 to fully finish before starting I2, four of the five stages would sit idle the whole time. Overlap keeps every stage busy.": "Əgər nüvə I2-ni başlatmazdan əvvəl I1-in tam bitməsini gözləsəydi, beş mərhələdən dördü bütün bu müddət boş qalardı. Üst-üstə düşmə hər mərhələni məşğul saxlayır.",
  "Steady state: ~1 instruction retires per cycle": "Sabit vəziyyət: təxminən 1 təlimat hər taktda tamamlanır",
  "Once the pipe is full, a NEW instruction finishes Write-back almost every cycle - even though any single one still takes 5 cycles start to finish.": "Konveyer dolduqdan sonra, demək olar hər taktda YENİ bir təlimat Write-back-i tamamlayır - hərçənd hər hansı bir təlimatın özü hələ də başdan sona 5 takt aparır.",
  "This is the payoff: pipelining doesn't make one instruction faster, it overlaps many so the average THROUGHPUT approaches one per cycle.": "Qazanc budur: pipelining bir təlimatı sürətləndirmir, o çoxlarını üst-üstə salır ki, orta ötürmə qabiliyyəti (THROUGHPUT) hər takta bir təlimata yaxınlaşsın.",
  "A branch enters the pipe": "Bir şaxələnmə konveyerə girir",
  "I5 is a conditional branch (an `if`). Its true outcome - which way execution should go next - isn't known until it reaches Execute.": "I5 şərti şaxələnmədir (bir `if`). Onun həqiqi nəticəsi - icranın sonra hansı istiqamətə gedəcəyi - Execute-ə çatana qədər məlum deyil.",
  "But Fetch can't just sit idle waiting 2 stages for that answer - every idle stage is wasted throughput.": "Amma Fetch sadəcə 2 mərhələ bu cavabı gözləyərək boş dura bilməz - hər boş mərhələ itirilmiş ötürmə qabiliyyətidir.",
  "Speculate: guess, and keep going": "Spekulyasiya: təxmin et və davam et",
  "A branch predictor guesses the outcome (e.g. 'taken', based on history) and the pipeline fetches the NEXT instructions down that guessed path - before the branch is actually resolved.": "Şaxə proqnozlaşdırıcı nəticəni təxmin edir (məsələn, tarixçəyə əsasən 'gedəcək') və konveyer şaxə həqiqətən həll olunmazdan əvvəl bu təxmin edilmiş yol üzrə NÖVBƏTİ təlimatları gətirir.",
  "A good predictor is right >95% of the time on real code, so guessing and running ahead wins far more cycles than it costs when wrong.": "Yaxşı proqnozlaşdırıcı real kodda >95% hallarda haqlı çıxır, ona görə təxmin edib irəli qaçmaq səhv olduqda itirilən taktlardan qat-qat çox takt qazandırır.",
  "Misprediction: the guess was wrong": "Yanlış proqnoz: təxmin səhv çıxdı",
  "I5 resolves in Execute - and it went the OTHER way. Everything fetched on the guessed path (I6, I7) was working on instructions that should never have run.": "I5 Execute-də həll olunur - və o DİGƏR istiqamətə getdi. Təxmin edilmiş yolda gətirilən hər şey (I6, I7) heç vaxt icra olunmamalı olan təlimatlar üzərində işləyirdi.",
  "Correctness comes first: the CPU cannot let wrong-path work touch real registers or memory, so it must be found and discarded immediately.": "Düzgünlük hər şeydən öndədir: CPU yanlış yol üzrə görülən işə real registrlərə və ya yaddaşa toxunmağa icazə verə bilməz, ona görə o dərhal tapılıb ləğv edilməlidir.",
  "Flush, refetch, and refill": "Təmizlə, yenidən gətir, yenidən doldur",
  "The wrong-path instructions are flushed out, Fetch restarts at the CORRECT target address, and the pipeline gradually fills back up - a short bubble of idle stages, then back to full speed.": "Yanlış yol təlimatları təmizlənir, Fetch DÜZGÜN hədəf ünvanından yenidən başlayır, və konveyer tədricən yenidən dolur - boş mərhələlərdən qısa bir 'qabarcıq', sonra yenidən tam sürət.",
  "The cost of a misprediction is only this refill delay (~15–20 cycles on real hardware) - far cheaper than stalling on every single branch and never speculating at all.": "Yanlış proqnozun qiyməti yalnız bu yenidən doldurma gecikməsidir (real avadanlıqda ~15–20 takt) - hər bir tək şaxədə dayanmaq və heç vaxt spekulyasiya etməməkdən qat-qat ucuzdur.",
  "Three roles: G, M and P": "Üç rol: G, M və P",
  "G is a goroutine - a tiny, cheap unit of work (~2 KB stack). M is an OS thread - the thing the kernel actually runs. P is a processor - a scheduling slot with its own queue; the number of Ps equals GOMAXPROCS.": "G bir horutindir - işin kiçik, ucuz vahidi (~2 KB stek). M bir OS thread-dir - nüvənin real olaraq icra etdiyi şey. P bir prosessordur - öz növbəsi olan planlaşdırma yuvası; P-lərin sayı GOMAXPROCS-a bərabərdir.",
  "Separating 'work' (G) from 'who runs it' (M) from 'how many run at once' (P) is what lets Go run a million goroutines on a handful of threads.": "'İşi' (G), 'onu kimin icra etdiyini' (M) və 'eyni anda neçəsinin işlədiyini' (P) ayırmaq Go-ya bir ovuc thread üzərində milyon horutin işlətməyə imkan verir.",
  "Each P drains its own queue - no shared lock": "Hər P öz növbəsini boşaldır - ortaq kilid yoxdur",
  "A P pulls goroutines one at a time from its OWN local queue and hands each to its M to run. Other Ps never need to touch this queue.": "P öz LOKAL növbəsindən horutinləri bir-bir çəkir və hər birini işlətmək üçün öz M-inə verir. Digər P-lərin bu növbəyə heç vaxt toxunmasına ehtiyac yoxdur.",
  "A private queue per P means most scheduling needs zero synchronization with other Ps - that's what keeps the hot path fast.": "Hər P üçün ayrıca növbə o deməkdir ki, planlaşdırmanın böyük hissəsi digər P-lərlə sıfır sinxronizasiya tələb edir - məhz bu, işlək yolu sürətli saxlayır.",
  "An idle P steals work instead of waiting": "Boşdayan P gözləmək əvəzinə iş oğurlayır",
  "P2's queue runs dry while P1 still has plenty queued. Rather than sit idle, P2 steals half of P1's remaining goroutines.": "P1-də hələ çoxlu iş növbədə olarkən P2-nin növbəsi boşalır. Boş dayanmaq əvəzinə, P2 P1-in qalan horutinlərinin yarısını oğurlayır.",
  "No central scheduler decides this - each idle P independently grabs work from a busy neighbor, so load balances itself without a bottleneck.": "Bunu heç bir mərkəzi planlaşdırıcı qərara almır - hər boşdayan P müstəqil şəkildə məşğul qonşudan iş tutur, beləliklə yük heç bir dar boğaz olmadan özü-özünü tarazlaşdırır.",
  "A blocking syscall can't be allowed to block the P": "Blok edən syscall-a P-ni bloklamağa icazə verilə bilməz",
  "M3 makes a slow syscall (e.g. reading a file) and the OS genuinely blocks that thread for its duration.": "M3 yavaş bir syscall edir (məsələn, fayl oxumaq) və OS bu thread-i onun müddəti ərzində həqiqətən bloklayır.",
  "If P3 stayed attached to the blocked M3, every OTHER goroutine queued on P3 would starve until the syscall returns - possibly milliseconds of wasted parallelism.": "Əgər P3 bloklanmış M3-ə bağlı qalsaydı, P3-də növbədə olan hər BAŞQA horutin syscall qayıdana qədər ac qalardı - bəlkə də millisaniyələrlə itirilmiş paralellik.",
  "The runtime detaches P3 and hands it to a fresh M": "Runtime P3-ü ayırır və onu təzə bir M-ə verir",
  "P3 lets go of the blocked M3 and attaches to a new thread, M4, so its queued goroutines keep running immediately. M3 stays behind, still stuck in the kernel.": "P3 bloklanmış M3-ü buraxır və yeni bir thread-ə, M4-ə bağlanır, beləliklə növbədəki horutinlər dərhal işləməyə davam edir. M3 arxada qalır, hələ də nüvədə ilişib qalır.",
  "This is exactly why a Go process can have MORE OS threads than GOMAXPROCS: extra Ms exist only to cover threads parked in blocking syscalls.": "Məhz buna görə Go prosesi GOMAXPROCS-dan DAHA ÇOX OS thread-inə malik ola bilər: əlavə M-lər yalnız bloklayıcı syscall-larda dayanan thread-ləri örtmək üçün mövcuddur.",
  "The problem: a data race": "Problem: data yarışı (data race)",
  "Two goroutines run `n++` on the same variable with no coordination at all. Both read the old value, both compute +1, both write - one update is silently lost.": "İki horutin heç bir koordinasiya olmadan eyni dəyişən üzərində `n++` icra edir. Hər ikisi köhnə dəyəri oxuyur, hər ikisi +1 hesablayır, hər ikisi yazır - bir yeniləmə səssizcə itir.",
  "This isn't just 'sometimes wrong' - the Go memory model calls it undefined behavior, because the compiler and CPU are free to reorder these operations however they like.": "Bu sadəcə 'bəzən səhvdir' demək deyil - Go yaddaş modeli bunu qeyri-müəyyən davranış adlandırır, çünki kompilyator və CPU bu əməliyyatları istədikləri kimi yenidən sıralamaqda sərbəstdirlər.",
  "Atomic: a lock-free compare-and-swap": "Atomic: kilidsiz compare-and-swap",
  "A goroutine reads the current value, computes the new one, then asks the CPU to swap it in 'only if nobody changed it since I read it.' If it lost the race, it just retries.": "Horutin cari dəyəri oxuyur, yenisini hesablayır, sonra CPU-dan onu 'yalnız mən oxuyandan bəri heç kim dəyişməyibsə' dəyişdirməyi xahiş edir. Yarışı uduzarsa, sadəcə yenidən cəhd edir.",
  "No goroutine ever blocks or sleeps - the whole update is one indivisible CPU instruction. It's the cheapest tool, but it only protects a single word.": "Heç bir horutin heç vaxt bloklanmır və ya yatmır - bütün yeniləmə bir bölünməz CPU təlimatıdır. Bu ən ucuz alətdir, amma yalnız bir maşın sözünü qoruyur.",
  "Mutex: one goroutine in the critical section at a time": "Mutex: eyni anda kritik bölmədə yalnız bir horutin",
  "A goroutine must acquire the lock before touching shared state, and release it when done. Anyone else who wants in simply waits their turn.": "Horutin ortaq vəziyyətə toxunmazdan əvvəl kiliddi əldə etməli, bitirdikdən sonra buraxmalıdır. Girmək istəyən hər kəs sadəcə növbəsini gözləyir.",
  "Use this when an INVARIANT spans more than one field (e.g. a balance and a log entry that must change together) - something a single atomic can never guarantee.": "Bunu bir İNVARİANT birdən çox sahəni əhatə etdikdə istifadə edin (məsələn, birlikdə dəyişməli olan balans və jurnal qeydi) - bunu tək bir atomic heç vaxt zəmanət edə bilməz.",
  "Channel: ownership moves with the value": "Channel: sahiblik dəyərlə birlikdə köçür",
  "Instead of two goroutines sharing one variable, the producer sends the value down a channel - the consumer is now the only one who can touch it.": "İki horutinin bir dəyişəni bölüşməsi əvəzinə, istehsalçı dəyəri kanala göndərir - artıq yalnız istehlakçı ona toxuna bilər.",
  "'Don't communicate by sharing memory; share memory by communicating.' There's no shared state left to race on, because only one goroutine ever owns the value at a time.": "'Yaddaşı bölüşərək ünsiyyət qurma; ünsiyyət quraraq yaddaşı bölüş.' Yarışa girəcək ortaq vəziyyət qalmır, çünki dəyərə istənilən anda yalnız bir horutin sahiblik edir.",
  "Pick by the shape of the problem": "Problemin formasına görə seçin",
  "All three are race-free - the right choice depends on what you're protecting, not on habit.": "Hər üçü də yarışdan azaddır - düzgün seçim vərdişə deyil, nəyi qoruduğunuza bağlıdır.",
  "Reaching for the wrong tool still 'works' but costs clarity or performance: an atomic-per-field can't keep two fields consistent; a mutex around a single counter is needless overhead; a channel as a lock is heavier than either.": "Səhv alət götürmək yenə də 'işləyir', amma aydınlıq və ya performansa başa gəlir: hər sahə üçün ayrı atomic iki sahəni uzlaşdırılmış saxlaya bilmir; tək bir sayğac ətrafında mutex lazımsız yükdür; kilid kimi channel isə hər ikisindən ağırdır.",
  "One request, three services": "Bir sorğu, üç servis",
  "A request enters Service A, which calls Service B, which calls Service C - a normal cross-service call chain.": "Sorğu Servis A-ya daxil olur, o Servis B-ni çağırır, o da Servis C-ni çağırır - adi servislərarası çağırış zənciri.",
  "Once a request crosses service boundaries, no single process can see the whole picture anymore - that's the gap observability exists to close.": "Sorğu servis sərhədlərini keçdiyi andan, heç bir tək proses artıq bütün mənzərəni görə bilmir - observability-nin bağlamaq üçün mövcud olduğu boşluq məhz budur.",
  "Each hop opens a child span": "Hər keçid bir alt span açır",
  "Service A's span covers the whole request. When it calls B, B opens its OWN span nested inside A's. The nesting mirrors the call stack across services.": "Servis A-nın span-ı bütün sorğunu əhatə edir. O, B-ni çağıranda, B A-nınkinin içərisinə yerləşdirilmiş ÖZ span-ını açır. İç-içə düzülüş servislər arasında çağırış stekini əks etdirir.",
  "A trace is just this tree of spans - it's how you see exactly which hop the time went to, instead of one opaque total latency number.": "Trace sadəcə bu span ağacıdır - bu, bir qapalı ümumi gecikmə rəqəmi əvəzinə, vaxtın dəqiq hansı keçidə getdiyini görmə üsuludur.",
  "Metrics: cheap aggregates that answer 'is it broken?'": "Metrics: 'sınıqdırmı?' sualına cavab verən ucuz aqreqatlar",
  "Every request bumps a counter and records its duration in a histogram - tiny, constant-cost numbers no matter how much traffic flows through.": "Hər sorğu bir sayğacı artırır və müddətini histoqramda qeyd edir - trafik nə qədər çox olsa da sabit qiymətə başa gələn kiçik rəqəmlər.",
  "Metrics are cheap enough to keep forever and alert on continuously - they're the first signal that something is wrong, even before anyone looks at a trace.": "Metrics əbədi saxlamaq və davamlı olaraq alert etmək üçün kifayət qədər ucuzdur - kimsə trace-ə baxmazdan əvvəl belə, nəyin səhv olduğuna ilk siqnal onlardır.",
  "Logs: structured detail for one specific event": "Logs: bir konkret hadisə üçün strukturlaşdırılmış detal",
  "Each service emits a key/value log line for what it actually did - not a sentence to parse, but searchable fields.": "Hər servis nəyi real olaraq etdiyi barədə açar/dəyər log sətri buraxır - təhlil edilməli cümlə deyil, axtarıla bilən sahələr.",
  "Metrics tell you something's wrong; logs are where you read exactly what happened in the one request you're debugging.": "Metrics sizə nəyinsə səhv olduğunu deyir; loglar isə debug etdiyiniz həmin bir sorğuda dəqiq nə baş verdiyini oxuduğunuz yerdir.",
  "Correlated by one trace_id": "Bir trace_id ilə əlaqələndirilir",
  "The same trace_id is stamped on the span, the log lines, and (as a label) the metric for this request - so you can jump from a metric alert, to the slow trace, to the exact log line that explains it.": "Eyni trace_id span-a, log sətirlərinə və (bir etiket kimi) bu sorğunun metrikasına həkk olunur - beləliklə metrika alertindən yavaş trace-ə, oradan da hər şeyi izah edən dəqiq log sətrinə keçə bilirsiniz.",
  "Without a shared ID, the three pillars are three disconnected views. With it, they become one investigation: alert → trace → root cause.": "Ortaq bir ID olmadan, üç sütun üç ayrı görüntüdür. Onunla birlikdə, tək bir araşdırmaya çevrilirlər: alert → trace → kök səbəb.",
  "Closed: calls flow normally": "Closed: çağırışlar normal axır",
  "In the default CLOSED state, every call passes straight through to the service. The breaker just quietly counts failures in the background.": "Standart CLOSED vəziyyətdə hər çağırış birbaşa servisə keçir. Breaker sadəcə arxa planda səssizcə uğursuzluqları sayır.",
  "Most of the time the dependency is healthy, so the breaker should add zero overhead - just watch, don't interfere.": "Əksər hallarda asılılıq sağlamdır, ona görə breaker sıfır əlavə yük əlavə etməlidir - sadəcə izləyir, mane olmur.",
  "Failures climb toward the trip threshold": "Uğursuzluqlar tetiklənmə həddinə doğru artır",
  "The downstream service starts erroring. Each failed call still goes all the way out and back - the breaker just increments its counter.": "Aşağı axın servisi xəta verməyə başlayır. Hər uğursuz çağırış yenə də tam yol qət edir - breaker sadəcə sayğacını artırır.",
  "The breaker needs real evidence the dependency is unhealthy (not one blip) before it changes behavior - that's what the threshold is for.": "Breaker davranışını dəyişdirmədən əvvəl asılılığın həqiqətən sağlam olmadığına dair real sübuta (bir dəfəlik sıçrayışa deyil) ehtiyac duyur - hədd məhz bunun üçündür.",
  "Trip → OPEN: fail fast, don't even ask": "Tetiklənmə → OPEN: sürətlə uğursuz ol, hətta soruşma da",
  "The breaker trips OPEN. Calls now fail INSTANTLY at the breaker itself - they never even reach the struggling service.": "Breaker OPEN vəziyyətinə keçir. İndi çağırışlar birbaşa breaker-in özündə DƏRHAL uğursuz olur - hətta çətinlik çəkən servisə belə çatmırlar.",
  "Waiting on a timeout from a service you already know is down just wastes time and adds more load to it. Failing fast is strictly better once you're sure it's unhealthy.": "Artıq lənglədiyini bildiyiniz bir servisdən timeout gözləmək sadəcə vaxt itirir və ona daha çox yük əlavə edir. Sağlam olmadığına əmin olduqdan sonra sürətlə uğursuz olmaq mütləq daha yaxşıdır.",
  "Cooldown: giving the dependency room to breathe": "Soyuma: asılılığa nəfəs almaq üçün yer vermək",
  "For a fixed window, every call keeps failing fast - no traffic reaches the service at all.": "Sabit bir pəncərə boyu, hər çağırış sürətlə uğursuz olmağa davam edir - servisə heç bir trafik çatmır.",
  "A struggling service often just needs time (to restart, drain a queue, recover from a spike) - sending it zero traffic for a bit is what lets it actually recover.": "Çətinlik çəkən servisə çox vaxt sadəcə vaxt lazımdır (yenidən başlamaq, növbəni boşaltmaq, sıçrayışdan sonra bərpa olmaq) - bir müddət ona sıfır trafik göndərmək onun real bərpasına imkan verir.",
  "Half-Open: let exactly one probe through": "Half-Open: dəqiq bir sınaq buraxılır",
  "Once the cooldown ends, the breaker allows a single real call through to test the water - everything else still waits.": "Soyuma bitdikdən sonra, breaker suyu yoxlamaq üçün bir real çağırışın keçməsinə icazə verir - qalan hər şey hələ də gözləyir.",
  "This answers 'has it recovered?' with minimal risk: if the service is still down, only one call pays the price, not a full flood.": "Bu, 'bərpa olubmu?' sualına minimal riskə cavab verir: servis hələ də lənglədirsə, yalnız bir çağırış qiymətini ödəyir, tam bir axın yox.",
  "Probe succeeds → back to Closed": "Sınaq uğurlu olur → Closed-a qayıdır",
  "The probe comes back healthy, so the breaker closes again and lets traffic flow normally. (Had it failed, the breaker would re-open and wait another cooldown.)": "Sınaq sağlam qayıdır, ona görə breaker yenidən bağlanır və trafikin normal axmasına icazə verir. (Uğursuz olsaydı, breaker yenidən açılıb başqa soyuma gözləyəcəkdi.)",
  "This Closed → Open → Half-Open → Closed cycle is the whole pattern: protect the dependency when it's down, and self-heal automatically once it recovers - no human required.": "Bu Closed → Open → Half-Open → Closed dövrü paternin tamamıdır: asılılığı lənglədiyi zaman qoruyur və bərpa olduğu andan insan iştirakı olmadan avtomatik özünü sağaldır.",
  "goroutines · go spawns cheap concurrent work": "horutinlər · go ucuz konkurrent iş işə salır",
  "main goroutine": "main horutin",
  "run…": "işləyir…",
  "done ✓": "hazırdır ✓",
  "order is not guaranteed": "sıra zəmanət edilmir",
  "main resumes ✓": "main davam edir ✓",
  "Every program starts as one goroutine": "Hər proqram bir horutin olaraq başlayır",
  "A Go program begins with a single goroutine running main(). Nothing is concurrent yet.": "Go proqramı main() işlədən tək bir horutinlə başlayır. Hələ heç nə konkurrent deyil.",
  "A goroutine is NOT an OS thread - it's a lightweight task (~2 KB stack) the Go runtime multiplexes onto a small pool of real threads.": "Horutin OS thread-i DEYİL - Go runtime-in kiçik bir real thread hovuzu üzərinə multipleksləşdirdiyi yüngül bir tapşırıqdır (~2 KB stek).",
  "go func() launches goroutines - almost free": "go func() horutinlər işə salır - demək olar pulsuz",
  "Each `go f()` starts a new goroutine that runs independently. Here main spawns six of them in a loop.": "Hər `go f()` müstəqil işləyən yeni bir horutin başladır. Burada main bir dövrdə altısını yaradır.",
  "Spawning costs a few KB and no syscall, so a server can keep hundreds of thousands of goroutines alive at once - unthinkable with OS threads.": "Yaratmaq bir neçə KB-a başa gəlir və heç bir syscall tələb etmir, ona görə server eyni anda yüz minlərlə horutini canlı saxlaya bilər - OS thread-ləri ilə ağlasığmaz.",
  "They all run concurrently": "Onların hamısı konkurrent işləyir",
  "The six goroutines execute at the same time, interleaved across a handful of OS threads by the scheduler.": "Altı horutin eyni anda, planlaşdırıcı tərəfindən bir ovuc OS thread-i üzərində növbəli şəkildə icra olunur.",
  "You do NOT control the order they run in - assuming an order is the single most common concurrency bug in Go.": "Onların hansı sırayla işlədiyini idarə ETMİRSİNİZ - sıra fərz etmək Go-da ən geniş yayılmış konkurrentlik xətasıdır.",
  "wg.Wait() blocks main until each Done()": "wg.Wait() main-i hər Done()-a qədər bloklayır",
  "main parks on wg.Wait(). As every goroutine finishes it calls wg.Done(), dropping the counter one by one.": "main wg.Wait()-da dayanır. Hər horutin bitdikcə wg.Done() çağırır, sayğacı birbəbir azaldır.",
  "Without a WaitGroup (or a channel) main could return early - and when main returns, the whole program exits, killing the other goroutines mid-work.": "WaitGroup (və ya kanal) olmadan main tez qayıda bilərdi - main qayıtdıqda isə bütün proqram bağlanır, digər horutinləri iş ortasında öldürür.",
  "All done → main resumes": "Hamısı bitdi → main davam edir",
  "The counter hits zero, wg.Wait() returns, and main continues past it - now guaranteed every goroutine has finished.": "Sayğac sıfıra çatır, wg.Wait() qayıdır, və main ondan sonrakı hissəyə davam edir - indi hər horutinin bitdiyi zəmanətlidir.",
  "WaitGroup is the simplest way to fan out a fixed set of goroutines and join back safely; for streaming results you'd reach for a channel instead.": "WaitGroup sabit sayda horutini paylayıb təhlükəsiz şəkildə geri birləşdirmək üçün ən sadə üsuldur; axın nəticələr üçün əvəzinə kanala müraciət edərdiniz.",
  "channels · handshake, buffering & select": "kanallar · əl sıxma, buferləşdirmə və select",
  "sender": "göndərici",
  "receiver": "qəbul edici",
  "ch  (unbuffered)": "ch  (bufersiz)",
  "⏸ send blocks - no receiver yet": "⏸ göndərmə bloklanır - hələ qəbul edici yoxdur",
  "✓ received - both goroutines proceed": "✓ qəbul edildi - hər iki horutin davam edir",
  "value crosses in one handshake (rendezvous)": "dəyər bir əl sıxma ilə keçir (rendezvous)",
  "buffered ch - cap 4": "buferli ch - tutum 4",
  "3 sends, buffer has room → sender never blocks": "3 göndərmə, buferdə yer var → göndərici heç vaxt bloklanmır",
  "ch <- v  ⏸ blocks (backpressure)": "ch <- v  ⏸ bloklanır (əks təzyiq)",
  "chA ● ready": "chA ● hazır",
  "chB ○ idle": "chB ○ boşda",
  "waiting…": "gözləyir…",
  "runs whichever case is ready first": "hansı case ilk hazır olarsa, onu icra edir",
  "Unbuffered channel: the sender waits": "Bufersiz kanal: göndərici gözləyir",
  "A goroutine runs `ch <- v` on an unbuffered channel. With no one receiving yet, the send simply blocks.": "Horutin bufersiz kanalda `ch <- v` icra edir. Hələ heç kim qəbul etmədiyi üçün göndərmə sadəcə bloklanır.",
  "An unbuffered channel has zero storage - a send can't complete until another goroutine is ready to receive. Blocking IS the synchronization.": "Bufersiz kanalın heç bir saxlama sahəsi yoxdur - başqa bir horutin qəbul etməyə hazır olana qədər göndərmə tamamlana bilməz. Bloklanma sinxronizasiyanın MƏHZ ÖZÜDÜR.",
  "Receiver arrives → a single handshake": "Qəbul edici gəlir → tək bir əl sıxma",
  "Another goroutine runs `v := <-ch`. The value crosses and BOTH goroutines unblock at the same instant.": "Başqa bir horutin `v := <-ch` icra edir. Dəyər keçir və HƏR İKİ horutin eyni anda blokdan çıxır.",
  "This rendezvous is a guarantee: after the handshake, the sender knows the value was received - no lost messages, no polling.": "Bu rendezvous bir zəmanətdir: əl sıxmadan sonra göndərici dəyərin qəbul edildiyini bilir - itirilmiş mesaj yoxdur, sorğulama (polling) yoxdur.",
  "A buffered channel holds values": "Buferli kanal dəyərləri saxlayır",
  "make(chan T, 4) gives the channel a buffer. Sends succeed immediately while there's free space - the sender doesn't wait.": "make(chan T, 4) kanala bufer verir. Sərbəst yer olduqca göndərmələr dərhal uğurlu olur - göndərici gözləmir.",
  "A buffer decouples sender and receiver timing: bursts of work can queue up instead of forcing a lock-step handshake every time.": "Bufer göndərici və qəbul edicinin zamanlamasını ayırır: iş sıçrayışları hər dəfə sərt bir əl sıxma tələb etmək əvəzinə növbəyə düzülə bilər.",
  "Buffer full → the next send blocks": "Bufer dolur → növbəti göndərmə bloklanır",
  "Once all 4 slots are occupied, the 5th `ch <- v` blocks until a receiver frees a slot. This is natural backpressure.": "Bütün 4 yuva dolduqdan sonra, 5-ci `ch <- v` qəbul edici bir yuvanı boşaldana qədər bloklanır. Bu təbii əks təzyiqdir.",
  "Backpressure is a feature: a fast producer is forced to slow to the consumer's pace instead of exhausting memory with an unbounded queue.": "Əks təzyiq bir üstünlükdür: sürətli istehsalçı sərhədsiz növbə ilə yaddaşı tükəndirmək əvəzinə istehlakçının templinə uyğunlaşmağa məcbur edilir.",
  "select waits on whichever is ready": "select hansı hazır olarsa onu gözləyir",
  "select blocks on several channel operations at once and proceeds with the FIRST one that becomes ready - here, chA.": "select eyni anda bir neçə kanal əməliyyatını bloklayır və hazır olan İLK əməliyyatla davam edir - burada chA.",
  "select is how one goroutine juggles many channels - combine it with a ctx.Done() case and you get clean timeouts and cancellation.": "select bir horutinin çoxlu kanalla necə jonqlyorluq etdiyidir - onu ctx.Done() case-i ilə birləşdirsəniz, təmiz timeout və ləğvetmə əldə edirsiniz.",
  "Redis · cache-aside lifecycle & the atomic lock": "Redis · cache-aside həyat dövrü və atomik kilid",
  "Redis": "Redis",
  "database": "verilənlər bazası",
  "~50ms query": "~50ms sorğu",
  "MISS": "MISS",
  "TTL 60s": "TTL 60s",
  "database, uncached: ~50ms": "verilənlər bazası, keşsiz: ~50ms",
  "Redis, cached: <1ms": "Redis, keşlənmiş: <1ms",
  "TTL 60s → 0s": "TTL 60s → 0s",
  "worker-": "worker-",
  " -> acquired the lock": " -> kiliddi əldə etdi",
  "everyone else -> lock already held, backing off": "digərləri -> kilid artıq tutulub, geri çəkilirlər",
  "Without a cache, every read hits the database directly": "Keş olmadan hər oxuma birbaşa verilənlər bazasına dəyir",
  "The client asks for a value and there is nowhere faster to check first - every single request pays the full cost of a real database query.": "Müştəri bir dəyər soruşur və əvvəlcə yoxlamaq üçün daha sürətli heç bir yer yoxdur - hər tək sorğu real verilənlər bazası sorğusunun tam qiymətini ödəyir.",
  "This is the baseline we're about to beat. Nothing here is wrong, it's just slow - and 'slow, every time' is expensive once traffic grows.": "Bu, indi keçəcəyimiz baza xəttdir. Burada heç nə səhv deyil, sadəcə yavaşdır - və trafik artdıqca 'hər dəfə yavaş' olmaq bahalaşır.",
  "First request: Redis is checked first - and it's a miss": "Birinci sorğu: əvvəlcə Redis yoxlanılır - və bu miss-dir",
  "The client's read now stops at Redis before anything else. The key isn't there yet, so go-redis returns the sentinel error redis.Nil - not a crash, just \"not cached yet.\"": "Müştərinin oxuması indi hər şeydən əvvəl Redis-də dayanır. Açar hələ orada deyil, ona görə go-redis siqnal xətası redis.Nil qaytarır - sıradan çıxma deyil, sadəcə \"hələ keşlənməyib\".",
  "Treating a miss as a normal, expected outcome - not an error to panic on - is what makes this pattern safe to use on every read, not just the lucky ones.": "Miss-i normal, gözlənilən nəticə kimi qəbul etmək - panikaya səbəb olan xəta kimi yox - məhz bu paternin hər oxumada, təkcə uğurlu hallarda deyil, təhlükəsiz istifadə olunmasını təmin edir.",
  "The answer comes back - and gets cached with a TTL": "Cavab qayıdır - və TTL ilə keşlənir",
  "The database returns the real value. Before handing it to the client, the code writes it into Redis with an expiration attached - e.g. 60 seconds.": "Verilənlər bazası real dəyəri qaytarır. Onu müştəriyə verməzdən əvvəl, kod onu bitmə müddəti ilə - məsələn, 60 saniyə - Redis-ə yazır.",
  "Attaching a TTL at write time is what bounds how wrong this cached copy is allowed to become. Nobody has to remember to clean it up later - Redis does it alone.": "Yazma anında TTL əlavə etmək bu keşlənmiş nüsxənin nə qədər səhv ola biləcəyini məhdudlaşdırır. Heç kim onu sonra təmizləməyi yadda saxlamalı deyil - Redis bunu özü edir.",
  "Second request: cache hit - the database is never touched": "İkinci sorğu: keş uğuru - verilənlər bazasına heç toxunulmur",
  "The exact same key is requested again. This time Redis has it: the client gets an answer in well under a millisecond, and the database does nothing at all.": "Eyni açar yenidən sorğulanır. Bu dəfə Redis-də var: müştəri bir millisaniyədən çox az müddətdə cavab alır, verilənlər bazası isə heç nə etmir.",
  "This is the entire payoff of cache-aside - the expensive path runs once per TTL window, no matter how many times the value is actually read in that window.": "Cache-aside-ın bütün qazancı budur - bahalı yol TTL pəncərəsində bir dəfə işləyir, dəyər həmin pəncərədə faktiki neçə dəfə oxunmasından asılı olmayaraq.",
  "The TTL runs out - and the next request is a miss again": "TTL bitir - və növbəti sorğu yenidən miss olur",
  "60 seconds pass. Redis quietly deletes the key on its own. The next client to ask for it gets a miss, exactly like the very first request did.": "60 saniyə keçir. Redis açarı özü sakitcə silir. Onu soruşan növbəti müştəri, tam ilk sorğu kimi, miss alır.",
  "This is the cache-aside lifecycle closing the loop: hit, hit, hit… until the TTL ends, then one miss repopulates it and the cycle simply continues.": "Bu, dövrü qapadan cache-aside həyat dövrüdür: hit, hit, hit… tə ki TTL bitənə qədər, sonra bir miss onu yenidən doldurur və dövr sadəcə davam edir.",
  "Atomic SETNX: five callers race, exactly one wins": "Atomik SETNX: beş çağıran yarışır, dəqiq biri qazanır",
  "Five clients call SET … NX on the same lock key at the same instant. Because Redis executes one command at a time, exactly one of them creates the key and gets the lock - the other four fail immediately.": "Beş müştəri eyni anda eyni kilid açarında SET … NX çağırır. Redis bir dəfəyə bir əmr icra etdiyi üçün, dəqiq biri açarı yaradır və kiliddi əldə edir - digər dördü dərhal uğursuz olur.",
  "No extra coordination code was added anywhere. This atomicity is a free property of how Redis executes commands - it's what makes one Redis instance a correct distributed lock.": "Heç bir yerdə əlavə koordinasiya kodu əlavə olunmadı. Bu atomarlıq Redis-in əmrləri necə icra etməsinin pulsuz bir xüsusiyyətidir - məhz bu, bir Redis instansını düzgün paylanmış kilidə çevirir.",
  "consensus · leader election & log replication": "konsensus · lider seçimi və jurnal replikasiyası",
  "A · term 3": "A · term 3",
  "B · term 4": "B · term 4",
  "LEADER": "LİDER",
  "CANDIDATE": "NAMİZƏD",
  "follower": "follower",
  "heartbeat resets the timer before it ever fires": "heartbeat taymer işə düşməzdən əvvəl onu sıfırlayır",
  "no heartbeat - both timers keep climbing": "heartbeat yoxdur - hər iki taymer artmağa davam edir",
  "RequestVote(term 4)": "RequestVote(term 4)",
  "votes: ": "səslər: ",
  "AppendEntries": "AppendEntries",
  "log: [SET balance[alice]=900]": "log: [SET balance[alice]=900]",
  "acked: ": "təsdiqlədi: ",
  " - committed": " - commit edildi",
  "A leader sends heartbeats to keep followers calm": "Lider follower-ləri sakit saxlamaq üçün heartbeat göndərir",
  "Node A is the current leader for term 3. It periodically pings B and C. As long as heartbeats keep arriving, each follower's election timer keeps getting reset - and stays quiet.": "A qovşağı term 3 üçün cari liderdir. O, dövri olaraq B və C-yə ping göndərir. Heartbeat-lər gəldikcə, hər follower-in seçim taymeri sıfırlanmağa davam edir - və sakit qalır.",
  "A heartbeat is the leader saying 'I'm still here.' The whole election mechanism only ever activates once those heartbeats stop.": "Heartbeat liderin 'mən hələ buradayam' deməsidir. Bütün seçim mexanizmi yalnız bu heartbeat-lər dayandıqda işə düşür.",
  "The leader goes silent": "Lider susur",
  "A crashes, or the network partitions it away. No more heartbeats arrive - B and C's election timers now keep rising, uninterrupted, for the first time.": "A çökür və ya şəbəkə onu ayırır. Artıq heartbeat gəlmir - B və C-nin seçim taymerləri ilk dəfə fasiləsiz artmağa başlayır.",
  "One missed heartbeat proves nothing by itself. It takes a full election timeout with NO heartbeat in between to convince a follower the leader is really gone.": "Bir buraxılmış heartbeat özlüyündə heç nə sübut etmir. Follower-i liderin həqiqətən getdiyinə inandırmaq üçün aralarında heç bir heartbeat olmayan tam bir seçim timeout-u lazımdır.",
  "B's timeout fires first -> becomes candidate, term++": "B-nin timeout-u ilk işə düşür -> namizəd olur, term++",
  "B's randomized timeout elapses before C's. B increments its term (3 -> 4), becomes a candidate, and requests votes from everyone it can still reach.": "B-nin rastgele timeout-u C-ninkindən əvvəl bitir. B öz term-ini artırır (3 -> 4), namizəd olur və hələ çata bildiyi hər kəsdən səs istəyir.",
  "Randomizing each node's timeout is what keeps B and C from timing out at the exact same instant and splitting the vote forever.": "Hər qovşağın timeout-unu rastgeleləşdirmək məhz B və C-nin eyni anda timeout olub səsi əbədi bölməsinin qarşısını alır.",
  "A majority of votes -> B becomes leader": "Səslərin çoxluğu -> B lider olur",
  "C grants its vote (A is unreachable, so it never gets asked). B now holds 2 of 3 votes - a majority - and becomes leader for term 4.": "C öz səsini verir (A əlçatmaz olduğu üçün ondan heç soruşulmur). B indi 3 səsdən 2-sini - çoxluğu - tutur və term 4 üçün lider olur.",
  "A majority can always be reached even with one node down, and two different candidates can never both reach a majority in the same term - that's exactly what guarantees at most one leader.": "Çoxluğa hətta bir qovşaq işləmədikdə də həmişə çatmaq olar, iki fərqli namizəd isə heç vaxt eyni term-də ikisi də çoxluğa çata bilməz - məhz bu ən çoxu bir lider olmasını təmin edir.",
  "New leader replicates a log entry": "Yeni lider bir log qeydini replikasiya edir",
  "A client asks B to process one command. B appends it to its own log and sends AppendEntries to every follower it can reach - here, just C.": "Müştəri B-dən bir əmri işləməyi xahiş edir. B onu öz log-una əlavə edir və çata bildiyi hər follower-ə - burada yalnız C-yə - AppendEntries göndərir.",
  "The leader is the only node ever allowed to accept new commands - that single-writer rule is what keeps the log's order unambiguous.": "Yeni əmrləri qəbul etməyə icazəli yeganə qovşaq liderdir - bu tək-yazıcı qaydası log-un sırasını birmənalı saxlayır.",
  "Committed the instant a majority acks - not waiting on the third": "Çoxluq təsdiqlədiyi an commit olur - üçüncünü gözləmədən",
  "C acknowledges the entry. B (itself) plus C is 2 of 3 - a majority - so the entry commits immediately. B never waits on A, which is still down.": "C qeydi təsdiqləyir. B (özü) üstəgəl C 3-dən 2-dir - çoxluq - ona görə qeyd dərhal commit olur. B hələ də əlçatmaz olan A-nı heç vaxt gözləmir.",
  "Waiting for every node to reply would let one slow or crashed node stall the whole cluster. Majority is the exact threshold that keeps replication both safe and always able to make progress.": "Hər qovşağın cavab verməsini gözləmək bir yavaş və ya çökmüş qovşağa bütün klasteri dayandırmağa imkan verərdi. Çoxluq həm replikasiyanın təhlükəsiz, həm də həmişə irəliləyə bilməsini təmin edən dəqiq həddir.",
  "graph traversal · breadth-first search": "qraf gəzintisi · enliyinə axtarış (BFS)",
  "A graph and a question": "Bir qraf və bir sual",
  "Find the shortest route from A to T. Edges are the only roads; nothing is weighted - every hop costs 1.": "A-dan T-yə ən qısa yolu tapın. Kənarlar yeganə yollardır; heç nə çəkili deyil - hər keçid 1-ə başa gəlir.",
  "'Shortest' in an unweighted graph is the keyword that should trigger BFS in your head - no other algorithm needed.": "Çəkisiz qrafda 'ən qısa' sözü başınızda BFS-i işə salmalı olan açar sözdür - başqa alqoritmə ehtiyac yoxdur.",
  "start: A": "start: A",
  "target: T": "hədəf: T",
  "Enqueue the start": "Başlanğıcı növbəyə qoy",
  "BFS keeps one FIFO queue. Seed it with the start node and mark A visited - the wave begins as a single drop.": "BFS bir FIFO növbə saxlayır. Onu başlanğıc qovşaqla toxumlayın və A-nı ziyarət edilmiş kimi işarələyin - dalğa tək bir damcı kimi başlayır.",
  "The queue IS the algorithm: everything else is a loop around it.": "Növbə alqoritmin ÖZÜDÜR: qalan hər şey onun ətrafında bir dövrdür.",
  "queue: ": "növbə: ",
  "(empty)": "(boş)",
  "Level 1: dequeue, visit, enqueue": "1-ci səviyyə: çıxar, ziyarət et, növbəyə qoy",
  "A leaves the queue; its neighbors B and C enter it. Everything one hop from the start is now discovered.": "A növbəni tərk edir; qonşuları B və C ona daxil olur. Başlanğıcdan bir keçid uzaqlıqdakı hər şey artıq kəşf edilib.",
  "FIFO order guarantees the whole of level 1 is processed before anything from level 2 - that is the invariant everything rests on.": "FIFO sırası 1-ci səviyyənin tamamının 2-ci səviyyədən hər hansı bir şeydən əvvəl işləndiyini təmin edir - hər şeyin dayandığı invariant budur.",
  "Level 2: the wave spreads": "2-ci səviyyə: dalğa yayılır",
  "B and C are processed in turn; D, E and F join the queue. The frontier is always a clean ring around what's been seen.": "B və C növbə ilə işlənir; D, E və F növbəyə qoşulur. Sərhəd həmişə görülənin ətrafında təmiz bir həlqədir.",
  "Watch the shape: BFS never has a 'deep finger' into the graph - the discovered region grows evenly, like a ripple.": "Formaya diqqət edin: BFS-də heç vaxt qrafa 'dərin barmaq' olmur - kəşf edilmiş bölgə su dalğası kimi bərabər böyüyür.",
  "Visited set: seen once, never again": "Ziyarət edilmişlər dəsti: bir dəfə görülür, bir daha yox",
  "C also points at B - but B is already visited, so the edge is skipped. Every node enters the queue at most once.": "C da B-yə işarə edir - amma B artıq ziyarət edilib, ona görə kənar keçilir. Hər qovşaq növbəyə ən çoxu bir dəfə daxil olur.",
  "Without this check the first cycle would loop forever. With it, total work is O(V+E): each node and each edge touched once.": "Bu yoxlama olmasaydı, ilk dövr sonsuz dövr edərdi. Onunla, ümumi iş O(V+E)-dir: hər qovşağa və hər kənara bir dəfə toxunulur.",
  "already visited - skip": "artıq ziyarət edilib - keç",
  "Target reached = shortest path": "Hədəfə çatıldı = ən qısa yol",
  "T is discovered while processing level 2 - via E. Walking parent links back gives A → B → E → T: three hops, provably minimal.": "T 2-ci səviyyə işlənərkən - E vasitəsilə - kəşf olunur. Valideyn bağlantılarını geriyə izləmək A → B → E → T verir: üç keçid, sübut edilə bilən minimum.",
  "No search or comparison happened: BFS reached T first via a shortest path BY CONSTRUCTION, because all shorter levels were exhausted before.": "Heç bir axtarış və ya müqayisə baş vermədi: BFS T-yə QURULUŞA GÖRƏ ən qısa yolla ilk çatdı, çünki bütün daha qısa səviyyələr əvvəlcə tükənmişdi.",
  "3 hops - minimal": "3 keçid - minimum",
  "Swap the queue for a stack: DFS": "Növbəni stеklə əvəz edin: DFS",
  "Same loop, LIFO container: the search dives A → B → D to the bottom before ever looking at C. Great for 'does a path exist' - useless for 'shortest'.": "Eyni dövr, LIFO konteyner: axtarış C-yə heç baxmadan A → B → D üzrə dibə şığıyır. 'Yol varmı' üçün əladır - 'ən qısa' üçün faydasızdır.",
  "One data structure choice flips the algorithm's personality. Interviews love asking why DFS can't answer shortest-path - now you can show it.": "Bir data strukturu seçimi alqoritmin xarakterini tamamilə dəyişir. Müsahibələr DFS-in niyə ən qısa yola cavab verə bilmədiyini soruşmağı sevir - indi bunu göstərə bilərsiniz.",
  "stack: ": "stek: ",
  "deep, not wide": "dərinə, enə yox",
  "LRU cache · map + doubly-linked list": "LRU keş · map + ikitərəfli bağlı siyahı",
  "Two structures, welded": "İki struktur, qaynaqlanıb",
  "A map gives O(1) 'where is key K'; a doubly-linked list keeps recency order. The weld: map values are pointers INTO the list.": "Map O(1)-də 'K açarı haradadır' cavabını verir; ikitərəfli bağlı siyahı isə istifadə sırasını saxlayır. Qaynaq nöqtəsi: map dəyərləri siyahının İÇİNƏ işarəçilərdir.",
  "Neither structure alone can do this job - the map can't order, the list can't look up. Interviews assign LRU precisely to test this composition.": "Nə struktur tək başına bu işi görə bilməz - map sıralaya bilmir, siyahı axtara bilmir. Müsahibələr LRU-nu məhz bu kompozisiyanı yoxlamaq üçün verir.",
  "capacity: 3 · full": "tutum: 3 · dolu",
  "most recent": "ən yeni",
  "least recent": "ən köhnə",
  "Sentinels: no special cases": "Sentinellər: xüsusi hal yoxdur",
  "head and tail are permanent dummy nodes. Every real node always has a live prev and next - empty and single-node lists need no extra code.": "head və tail daimi saxta qovşaqlardır. Hər real qovşağın həmişə canlı prev və next-i var - boş və tək qovşaqlı siyahılar əlavə koda ehtiyac duymur.",
  "The classic interview stumble is nil-checking the list edges. Sentinels delete that whole class of bugs before it exists.": "Klassik müsahibə büdrəməsi siyahının kənarlarını nil yoxlamaqdır. Sentinellər bu xəta sinfinin bütününü mövcud olmazdan əvvəl aradan qaldırır.",
  "never nil": "heç vaxt nil deyil",
  "Get(7): jump, unlink, push front": "Get(7): tullan, ayır, önə keç",
  "The map lands directly on 7's node - no scan. unlink cuts it out; pushFront re-inserts it after head. 7 is now the most recent.": "Map birbaşa 7-nin qovşağına düşür - skan yoxdur. unlink onu kəsib çıxarır; pushFront onu head-dən sonra yenidən daxil edir. İndi 7 ən yenidir.",
  "Get is a WRITE to the recency order, not just a read - that reordering is what makes the cache 'least recently USED', not 'least recently ADDED'.": "Get sadəcə oxuma deyil, istifadə sırasına bir YAZMADIR - məhz bu yenidən sıralama keşi 'least recently ADDED' deyil, 'least recently USED' edir.",
  "1 map hop + 4 pointer writes": "1 map tullanışı + 4 işarəçi yazısı",
  "Put(4) on a full cache: evict the tail": "Put(4) dolu keşdə: quyruğu çıxar",
  "Capacity is 3 and 4 is a new key - someone must go. The victim needs no search: it is always tail.prev, here 9. Unlink it, delete its map entry, push 4 to the front.": "Tutum 3-dür və 4 yeni açardır - kimsə getməlidir. Qurbanı axtarmağa ehtiyac yoxdur: o həmişə tail.prev-dir, burada 9. Onu ayırın, map qeydini silin, 4-ü önə qoyun.",
  "Eviction is O(1) only because the list keeps the victim parked at the tail. A map alone would need an O(n) scan for the oldest entry.": "Çıxarma yalnız O(1)-dir, çünki siyahı qurbanı həmişə quyruqda saxlayır. Tək başına map ən köhnə qeyd üçün O(n) skan tələb edərdi.",
  "evict 9: unlink + delete": "9-u çıxar: unlink + delete",
  "4 is most recent": "4 ən yenidir",
  "Put(2, new value): update in place": "Put(2, yeni dəyər): yerində yenilə",
  "2 already exists: overwrite its value inside the node, move it to the front. No eviction - the size did not change.": "2 artıq mövcuddur: qovşaq içindəki dəyərini üzərinə yazın, onu önə köçürün. Çıxarma yoxdur - ölçü dəyişmədi.",
  "Forgetting this branch double-inserts the key and silently corrupts the size - the second most common LRU bug after broken pointer order.": "Bu budağı unutmaq açarı iki dəfə daxil edir və ölçünü səssizcə pozur - qırıq işarəçi sırasından sonra ikinci ən çox rast gəlinən LRU xətası.",
  "Count the work: O(1), always": "İşi say: O(1), həmişə",
  "Every operation is one map access plus a constant number of pointer writes - no loops, no scans, regardless of cache size.": "Hər əməliyyat bir map müraciəti üstəgəl sabit sayda işarəçi yazısıdır - dövr yoxdur, skan yoxdur, keşin ölçüsündən asılı olmayaraq.",
  "When the interviewer asks 'what's the complexity?', the answer is provable by counting the moves you just watched: nothing depends on n.": "Müsahib 'mürəkkəblik nədir?' soruşanda, cavab az öncə izlədiyiniz addımları saymaqla sübut edilir: heç nə n-dən asılı deyil.",
  "Get: map + 4 writes": "Get: map + 4 yazı",
  "Put: map + ≤6 writes": "Put: map + ≤6 yazı",
  "evict: 2 writes + delete": "çıxarma: 2 yazı + delete",
  "map internals · buckets, tophash, growth": "map daxili quruluşu · bucket, tophash, böyümə",
  "One hash, two jobs": "Bir hash, iki iş",
  "hash(\"user:42\") yields 64 bits. Go splits the duty: LOW bits will choose the bucket, the top 8 bits become a one-byte fingerprint (tophash).": "hash(\"user:42\") 64 bit verir. Go vəzifəni bölür: AŞAĞI bitlər bucket-i seçəcək, ən yuxarı 8 bit isə birbaytlıq bir barmaq izinə (tophash) çevriləcək.",
  "Reusing one hash for both routing and fingerprinting is why map lookups stay cheap - no second hash function, no full key compare until the last moment.": "Bir hash-i həm marşrutlaşdırma, həm barmaq izi üçün təkrar istifadə etmək map axtarışlarının ucuz qalmasının səbəbidir - ikinci bir hash funksiyası yoxdur, son ana qədər tam açar müqayisəsi yoxdur.",
  "high 8 bits → tophash": "yuxarı 8 bit → tophash",
  "low bits → bucket": "aşağı bitlər → bucket",
  "bucket ": "bucket ",
  "8 slots + tophash": "8 yuva + tophash",
  "Low bits pick the bucket": "Aşağı bitlər bucket-i seçir",
  "With 4 buckets, 'low bits' means hash & 3 - a single AND instruction. 0b...01 → bucket 1.": "4 bucket ilə, 'aşağı bitlər' hash & 3 deməkdir - tək bir AND təlimatı. 0b...01 → bucket 1.",
  "This is why the bucket count is always a power of two: modulo becomes a bit-mask, one cycle instead of a division.": "Bucket sayının həmişə ikinin qüvvəti olmasının səbəbi budur: qalıq (modulo) bir bit maskaya çevrilir, bölmə əvəzinə bir takt.",
  "tophash: scan 8 bytes, not 8 keys": "tophash: 8 açar deyil, 8 bayt skan edilir",
  "Inside the bucket, the lookup sweeps eight one-byte tophash stamps first - a single cache line. Full key comparison happens only on a stamp match.": "Bucket daxilində, axtarış əvvəlcə səkkiz birbaytlıq tophash möhürünü - tək bir keş xətti - gəzir. Tam açar müqayisəsi yalnız möhür uyğun gələndə baş verir.",
  "String comparison is expensive; byte comparison is nearly free. The tophash array rejects 7 wrong slots without ever touching their keys.": "Sətir müqayisəsi bahalıdır; bayt müqayisəsi demək olar pulsuzdur. Tophash massivi 7 səhv yuvanı onların açarlarına heç toxunmadan rədd edir.",
  "tophash b6 matches → compare full key": "tophash b6 uyğun gəlir → tam açarı müqayisə et",
  "Collisions land in the same bucket": "Kolliziyalar eyni bucket-ə düşür",
  "A different key with the same low bits joins bucket 1 in the next free slot. Eight collisions later, an overflow bucket chains on.": "Eyni aşağı bitlərə malik fərqli bir açar bucket 1-ə növbəti boş yuvada qoşulur. Səkkiz kollizyadan sonra, overflow bucket zəncirlənir.",
  "Collisions are normal operation, not an error - the design just keeps them within one cache line for as long as possible.": "Kolliziyalar normal işdir, xəta deyil - dizayn onları sadəcə mümkün qədər uzun bir keş xətti daxilində saxlayır.",
  "hash(\"user:97\") → also bucket 1": "hash(\"user:97\") → bucket 1-ə də",
  "Growth: double and evacuate": "Böyümə: ikiqat artır və köçür",
  "Past ~6.5 entries per bucket on average, the table doubles - and entries drift to their new homes INCREMENTALLY, a little on each write, not in one big pause.": "Bucket başına orta hesabla ~6.5 qeyddən sonra, cədvəl ikiqat artır - və qeydlər İNKREMENTAL olaraq, hər yazıda bir az, bir böyük fasilə şəklində deyil, yeni yerlərinə köçür.",
  "Incremental evacuation spreads the rehash cost across many operations - the same amortization idea as slice growth, applied to a whole table.": "İnkremental köçürmə rehash xərcini bir çox əməliyyat üzrə yayır - slice böyüməsindəki eyni amortizasiya fikri, bütöv bir cədvələ tətbiq olunub.",
  "4 → 8 buckets · one more low bit": "4 → 8 bucket · bir aşağı bit daha",
  "Why iteration order is random": "Niyə iterasiya sırası rastgeledir",
  "Range starts at a RANDOM bucket and offset on every iteration - deliberately, so no program can accidentally depend on an order that growth would change anyway.": "Range hər iterasiyada TƏSADÜFİ bir bucket və offset-dən başlayır - qəsdən, ki heç bir proqram yanlışlıqla böyümənin dəyişəcəyi bir sıradan asılı olmasın.",
  "This is a favorite interview probe: it checks whether you know maps well enough to never sort-by-iterating. Need order? Collect keys and sort them.": "Bu, sevimli bir müsahibə sualıdır: map-ları heç vaxt 'iterasiya ilə sıralamayacaq' qədər yaxşı bildiyinizi yoxlayır. Sıra lazımdır? Açarları toplayıb sıralayın.",
  "range start: random, every time": "range başlanğıcı: hər dəfə təsadüfi",
  "slices & heaps · memory layout as an algorithm": "slice və heap · alqoritm kimi yaddaş düzülüşü",
  "A slice is three words": "Slice üç sözdür",
  "pointer + len + cap, pointing into a backing array. Copying a slice copies these three words - never the elements.": "işarəçi + len + cap, arxa massivə işarə edir. Slice-ı kopyalamaq bu üç sözü kopyalayır - heç vaxt elementləri deyil.",
  "Every slice interview question unwinds from this picture: cheap passing, shared mutation, and the growth trap all live in the header.": "Hər slice müsahibə sualı bu şəkildən açılır: ucuz ötürmə, ortaq mutasiya və böyümə tələsi - hamısı başlıqda yaşayır.",
  "backing array": "arxa massiv",
  "append with room: just write": "yer olanda append: sadəcə yaz",
  "len 3, cap 5 - append(s, 7) writes into the existing array and bumps len. No allocation, nothing moves.": "len 3, cap 5 - append(s, 7) mövcud massivə yazır və len-i artırır. Ayırma yoxdur, heç nə köçmür.",
  "Within capacity, append is a single store - this is the fast path make([]T, 0, n) buys you when n is known.": "Tutum daxilində, append tək bir yazma əməliyyatıdır - n əvvəlcədən məlum olanda make([]T, 0, n) sizə aldığı sürətli yol budur.",
  "append past cap: reallocate and copy": "cap-dən kənar append: yenidən ayır və kopyala",
  "cap exhausted → allocate a bigger array (double, then ~1.25× for large slices), copy every element, point the NEW slice at it. The old array is abandoned - but anyone still holding it sees stale data.": "cap tükənəndə → daha böyük bir massiv ayrılır (ikiqat, sonra böyük slice-lar üçün ~1.25×), hər element kopyalanır, YENİ slice ona işarə edir. Köhnə massiv tərk edilir - amma onu hələ də tutan hər kəs köhnəlmiş data görür.",
  "This copy is why append is 'amortized' O(1) - and why two slices that used to share storage silently diverge after one of them grows. The #1 slice interview trap.": "Bu kopya append-in 'amortizasiya edilmiş' O(1) olmasının səbəbidir - və bir zamanlar yaddaş bölüşən iki slice-ın biri böyüdükdən sonra səssizcə ayrılmasının səbəbi. #1 slice müsahibə tələsi.",
  "old (cap 5) - abandoned": "köhnə (cap 5) - tərk edilib",
  "new (cap 10)": "yeni (cap 10)",
  "A heap is a slice wearing a tree costume": "Heap ağac kostyumu geymiş bir slice-dır",
  "The same values, two views: slice [1,3,2,9,7] and a complete binary tree. No pointers exist - children of i are 2i+1 and 2i+2, parent is (i-1)/2.": "Eyni dəyərlər, iki görünüş: slice [1,3,2,9,7] və tam bir ikili ağac. İşarəçi yoxdur - i-nin uşaqları 2i+1 və 2i+2-dədir, valideyni (i-1)/2-dədir.",
  "Storing the tree as index math makes heaps allocation-free and cache-friendly - and means you can write one on a whiteboard in ten lines.": "Ağacı indeks riyaziyyatı kimi saxlamaq heap-ları ayırmasız və keşə dost edir - və onu bir taxta üzərində on sətirdə yaza bilməyiniz deməkdir.",
  "min-heap: every parent ≤ its children": "min-heap: hər valideyn ≤ öz uşaqları",
  "Push 0: append, then sift up": "Push 0: append et, sonra yuxarı süz",
  "0 lands at index 5 (a leaf), then swaps with its parent while smaller: 0 < 2 → swap with [2], 0 < 1 → swap with the root. Two hops, done.": "0 indeks 5-ə (bir yarpağa) düşür, sonra kiçik olduğu müddətcə valideyni ilə yer dəyişir: 0 < 2 → [2] ilə dəyişir, 0 < 1 → kök ilə dəyişir. İki addım, tamam.",
  "Sift-up touches one root-to-leaf path - log n swaps worst case, which is the entire cost of insertion.": "Yuxarı süzülmə kökdən yarpağa bir yolu gəzir - ən pis halda log n dəyişmə, bu da əlavənin bütün qiymətidir.",
  "Pop the min: last to root, sift down": "Minimumu çıxar: sonuncu kökə, aşağı süz",
  "Take index 0 (always the minimum). Move the LAST element to the root, shrink the slice, and let it sink: swap with the smaller child until both children are bigger.": "İndeks 0-ı (həmişə minimum) götürün. SON elementi kökə köçürün, slice-ı kiçildin və onun batmasına icazə verin: hər iki uşaq daha böyük olana qədər kiçik uşaqla yer dəyişin.",
  "Pop is the other half of every priority queue - 'k largest', 'merge k lists' and heapsort are just push and pop in a loop.": "Pop hər prioritet növbənin digər yarısıdır - 'ən böyük k', 'k siyahını birləşdir' və heapsort sadəcə dövrdə push və pop-dur.",
  "popped: 0": "çıxarıldı: 0",
  "Choosing the structure": "Strukturu seçmək",
  "Need lookup by key? Map. Need repeated access to the extreme? Heap. Need order and cheap append? Slice. Most interview problems are one of these three sentences.": "Açarla axtarış lazımdır? Map. Ekstrema tez-tez giriş lazımdır? Heap. Sıra və ucuz append lazımdır? Slice. Müsahibə problemlərinin əksəriyyəti bu üç cümlədən biridir.",
  "Interviewers rarely want exotic structures - they want the right basic one, chosen out loud with its costs. That sentence is the answer.": "Müsahiblər nadir hallarda ekzotik strukturlar istəyir - onlar qiymətləri ilə birlikdə səsli seçilmiş düzgün əsas strukturu istəyirlər. Cavab elə bu cümlədir.",
  "map: O(1) by key": "map: açarla O(1)",
  "heap: O(log n) extreme": "heap: O(log n) ekstrema",
  "slice: O(1) append*": "slice: O(1) append*",
  "* amortized - now you can explain the asterisk": "* amortizasiya edilib - indi ulduz işarəsini izah edə bilərsiniz"
};

  function lang() { return (typeof window !== "undefined" && window.__LANG__) || "en"; }
  function tr(s) {
    const l = lang();
    if (l === "ru") return CANVAS_RU[s] || s;
    if (l === "az") return CANVAS_AZ[s] || s;
    return s;
  }

  /* --------------------------------------------------------- math utils */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  // overshoot ease - for playful pop-in scale effects (badges, arrivals, "aha" moments)
  const easeOutBack = (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
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
    const rendered = tr(str);
    const family = opts.mono ? "ui-monospace, 'JetBrains Mono', monospace" : "Inter, system-ui, sans-serif";
    let size = opts.size || 13;
    const minSize = opts.minSize || Math.max(8.5, size - 3);
    ctx.font = `${opts.weight || 500} ${size}px ${family}`;
    if (opts.maxWidth) {
      while (size > minSize && ctx.measureText(rendered).width > opts.maxWidth) {
        size -= 0.5;
        ctx.font = `${opts.weight || 500} ${size}px ${family}`;
      }
    }
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.baseline || "alphabetic";
    if (opts.alpha != null) { ctx.globalAlpha = opts.alpha; }
    if (opts.maxWidth) ctx.fillText(rendered, x, y, opts.maxWidth);
    else ctx.fillText(rendered, x, y);
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
      cx += 16 + ctx.measureText(tr(it[0])).width + 18;
    });
  }

  /* ------------------------------------------------------------ "juice"
     A small toolkit of playful, purely time-of-p-driven effects so the
     climax of a step (a hit, a commit, a trip, a resume) gets a visible
     flourish instead of just a color swap. Everything here is a pure
     function of its progress argument - safe to scrub/seek/replay,
     exactly like the rest of this deterministic timeline engine. */

  // expanding "ping" ring - one clean pulse announcing "this just happened".
  // p: 0..1 local progress since the triggering moment (call within(...) at the call site).
  function ring(ctx, x, y, color, p, opts = {}) {
    const p2 = clamp(p, 0, 1);
    const r = lerp(opts.from || 6, opts.to || 34, easeOut(p2));
    ctx.save();
    ctx.globalAlpha = (1 - p2) * (opts.alpha ?? 0.85);
    ctx.strokeStyle = color; ctx.lineWidth = opts.lw || 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.restore();
  }

  // deterministic particle burst - small dots flying outward from (x,y), fading out.
  // No Math.random(): angles/radii come from a fixed, seeded-looking pattern so
  // scrubbing back and forth always redraws the exact same burst.
  function burst(ctx, x, y, color, p, n = 10) {
    const p2 = clamp(p, 0, 1);
    if (p2 <= 0) return;
    const grow = easeOut(p2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.35;
      const rMax = 26 + (i % 3) * 10;
      const r = grow * rMax;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      const sz = lerp(2.6, 0.6, p2);
      ctx.save();
      ctx.globalAlpha = (1 - p2) * 0.9;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(px, py, Math.max(0.4, sz), 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  // a breathing halo behind "the thing to look at right now" - draws attention
  // without stealing focus. t: continuous global time (seconds), any float works.
  function glowPulse(ctx, x, y, r, color, t) {
    const k = 0.55 + 0.45 * Math.sin(t * 2.4);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * (1.6 + 0.3 * k));
    g.addColorStop(0, color); g.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.25 * k;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * (1.6 + 0.3 * k), 0, 7); ctx.fill();
    ctx.restore();
  }

  // a directional connector with marching-ants motion - makes "this is where
  // data/control is flowing, in this direction" immediately legible.
  // t: continuous global time (seconds); pass the same t already given to render().
  function flow(ctx, x1, y1, x2, y2, color, lw, t) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
    ctx.setLineDash([6, 7]);
    ctx.lineDashOffset = -(t * 26) % 13;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  // scale factor for a pop-in entrance (badges, nodes, arrivals) - 0..1 local progress.
  function pop(p) { return clamp(easeOutBack(clamp(p, 0, 1)), 0, 1.15); }

  /* ----------------------------------------------- step-by-step render
     Turns an array of STEPS (each its own isolated draw(ctx,p,w,h,c,u,info))
     into a single render(ctx,t,w,h,c,u) for makeTimeline: exactly one step's
     visual is on screen at a time (p = 0..1 progress through THAT step),
     so every phase is a focused, self-contained mini-scene. */
  function stepRender(steps, duration, header) {
    return function (ctx, t, w, h, c, u) {
      if (header) text(ctx, header, 24, 28, { color: c.text, size: 13.5, minSize: 10, weight: 700, mono: true, maxWidth: w - 48 });
      let i = 0;
      for (let k = 0; k < steps.length; k++) if (steps[k].t <= t + 1e-6) i = k;
      const startT = steps[i].t;
      const endT = i + 1 < steps.length ? steps[i + 1].t : duration;
      const p = clamp((t - startT) / Math.max(0.0001, endT - startT), 0, 1);
      text(ctx, tr("STEP ") + (i + 1) + "/" + steps.length + tr("  ·  ") + tr(steps[i].title), 24, 50,
        { color: c.purple, size: 11.5, minSize: 9.5, weight: 700, mono: true, maxWidth: w - 48 });
      u.t = t; // continuous global time, for ambient motion (flow/glowPulse) inside step draws
      steps[i].draw(ctx, p, w, h, c, u, { index: i, total: steps.length, title: steps[i].title });
    };
  }

  /* --------------------------------------------------- timeline engine */
  function makeTimeline(canvas, def) {
    const ctx = canvas.getContext("2d");
    let raf = 0, playing = false, t = 0, last = 0, speed = 0.4;
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
        seg, within, lerp, clamp, easeInOut, easeOut, easeOutBack,
        rr, fillRR, text, line, arrow, dot, badge, legend,
        ring, burst, glowPulse, flow, pop,
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
        // grey = "actively being scanned right now" - a soft breathing halo pulls the eye there.
        if (col === "grey") u.glowPulse(ctx, x, y, R, "rgba(245,177,76,.55)", u.t || 0);
        // sweeping a garbage node reclaims it - a small dissolving puff instead of just fading.
        if (n.g && sweepA > 0 && sweepA < 1) u.burst(ctx, x, y, c.dim, sweepA, 7);
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
        why: "The collector's whole job is to tell live objects apart from dead ones - and 'reachable from a root' is the only definition of 'live' it needs.",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, 0, false, 0); },
      },
      {
        t: 2.0,
        title: "Start at the roots, mark them black",
        desc: "Marking begins at the roots - they're live by definition. Whatever they directly point to turns grey: 'reachable, but not yet scanned.'",
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
        desc: "Once no grey objects remain, the wave is finished. Everything still white - including the cluster on the right - was never touched, because nothing live points to it.",
        why: "This is the proof of garbage: not 'looks unused', but 'provably unreachable from any root.'",
        draw(ctx, p, w, h, c, u) { drawHeap(ctx, c, u, w, h, 4, true, 0); },
      },
      {
        t: 9.4,
        title: "Sweep: reclaim the white objects",
        desc: "The collector walks the heap one more time and frees every object still marked white. Black (live) objects are never touched.",
        why: "Marking and sweeping are kept as separate passes so the collector never frees something while it might still be mid-scan - correctness over speed.",
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
        title: "The program runs - a call tree",
        desc: "A request flows main → handleRequest → a handful of child functions. Some of those calls are cheap, some are expensive - but just reading the code, you can't tell which.",
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
        why: "Sampling is statistical, not exhaustive - that's exactly what makes it cheap enough to run in production without slowing the program down.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          u.text(ctx, "sampler", cx0, h * 0.18, { align: "center", color: c.warn, size: 13, weight: 700 });
          const cyc = (p * 40) % (Math.PI * 2);
          const blink = Math.sin(cyc) > 0;
          u.dot(ctx, cx0 + 60, h * 0.18 - 5, 6, blink ? c.warn : c.dim, blink ? "rgba(245,177,76,.5)" : null);
          if (blink) u.ring(ctx, cx0 + 60, h * 0.18 - 5, c.warn, cyc / Math.PI, { from: 5, to: 20, lw: 1.6 });
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
        desc: "Every captured stack stacks its frames into bars - a box sits inside its caller, and the more samples landed in a function, the WIDER its box grows.",
        why: "Width directly encodes time spent, so the visual shape of the graph IS the measurement - no separate legend to decode.",
        draw(ctx, p, w, h, c, u) {
          drawFlame(ctx, c, u, w, h, u.easeOut(u.clamp(p, 0, 1)), false);
          u.text(ctx, "width = share of samples in that function", 24, h - 18, { color: c.dim, size: 11.5 });
        },
      },
      {
        t: 7.8,
        title: "Find the widest box - that's the hotspot",
        desc: "reflectWalk is the widest leaf frame: roughly 40% of all CPU samples landed inside it. The tall, narrow stacks next to it barely register.",
        why: "Optimizing the widest box gives the biggest win for the least effort - optimizing a narrow box can't help much even if you make it instant.",
        draw(ctx, p, w, h, c, u) {
          // pre-compute geometry from the same constants drawFlame uses, so the glow sits BEHIND the box
          const x0g = 24, plotWg = w - 48, rowHg = 34, bottomYg = h - 50;
          const hotYg = bottomYg - 3 * (rowHg + 5), hotWg = 0.4 * plotWg;
          u.glowPulse(ctx, x0g + hotWg / 2, hotYg + rowHg / 2, rowHg, "rgba(255,107,107,.5)", u.t || 0);
          drawFlame(ctx, c, u, w, h, 1, true);
          const x0 = x0g;
          if (p < 0.5) u.burst(ctx, x0g + hotWg / 2, hotYg + rowHg / 2, c.bad, u.easeOut(u.clamp(p / 0.5, 0, 1)), 9);
          const a = u.clamp(p / 0.4, 0, 1);
          u.fillRR(ctx, x0, 64, 340, 32, 8, "rgba(255,107,107,.12)", c.bad, 1.6);
          u.text(ctx, "▲ reflectWalk ≈ 40% of CPU - optimize here first", x0 + 12, 85, { color: c.bad, size: 12, weight: 700, alpha: a });
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
  /* F2. PICK THE RIGHT PPROF PROFILE                                    */
  /* =================================================================== */
  ANIM["pprof-profile-types"] = (canvas) => {
    const rows = [
      { symptom: "CPU hot path", profile: "cpu", question: "where is CPU time spent?", detail: "30s CPU sample", color: "go" },
      { symptom: "heap pressure", profile: "heap", question: "what allocates or stays live?", detail: "inuse_space / alloc_space", color: "warn" },
      { symptom: "goroutine leak", profile: "goroutine", question: "where are goroutines stuck?", detail: "stack dump", color: "purple" },
      { symptom: "sync waiting", profile: "block / mutex", question: "where do goroutines wait?", detail: "contention time", color: "bad" },
    ];

    function rowColor(c, r) {
      return r.color === "go" ? c.go : r.color === "warn" ? c.warn : r.color === "purple" ? c.purple : c.bad;
    }

    function drawRows(ctx, p, w, h, c, u, active) {
      const narrow = w < 560;
      const x = 24, rw = w - 48, top = narrow ? 76 : 82, rowH = narrow ? 47 : 50, gap = narrow ? 5 : 10;
      u.text(ctx, "symptom", x + 10, 73, { color: c.dim, size: 10.5, weight: 700, mono: true });
      if (!narrow) {
        u.text(ctx, "profile", x + rw * .38, 73, { color: c.dim, size: 10.5, weight: 700, mono: true });
        u.text(ctx, "question answered", x + rw * .62, 73, { color: c.dim, size: 10.5, weight: 700, mono: true });
      }
      rows.forEach((r, i) => {
        const appear = active < 0 ? 1 : u.clamp((p - i * 0.09) / 0.25, 0, 1);
        if (appear <= 0) return;
        const y = top + i * (rowH + gap);
        const on = active === i;
        const col = rowColor(c, r);
        if (on) u.glowPulse(ctx, x + rw / 2, y + rowH / 2, Math.min(86, rw * .23), col + "66", u.t || 0);
        ctx.save();
        ctx.globalAlpha = appear;
        u.fillRR(ctx, x, y, rw, rowH, 9, on ? "rgba(0,173,216,.08)" : c.panel, on ? col : c.line, on ? 2.2 : 1.3);
        u.text(ctx, r.symptom, x + 14, y + (narrow ? 16 : 20), { color: c.text, size: narrow ? 11.2 : 12.5, weight: 700, mono: true });
        u.text(ctx, r.detail, narrow ? x + rw - 14 : x + 14, y + (narrow ? 42 : 38), { align: narrow ? "right" : "left", color: c.dim, size: narrow ? 9.3 : 10.5, weight: 500, mono: true });
        const bx = narrow ? x + rw - 118 : x + rw * .38;
        u.badge(ctx, bx, y + (narrow ? 6 : 10), r.profile, col, r.color === "warn" || r.color === "go" ? "#06121f" : "#fff");
        const qx = narrow ? x + 128 : x + rw * .62;
        const qy = narrow ? y + 31 : y + 31;
        u.text(ctx, r.question, narrow ? x + 14 : qx, qy, { color: on ? col : c.text, size: narrow ? 9.6 : 11.5, weight: on ? 700 : 600 });
        if (on) {
          const sx = x + 122, sy = y + rowH / 2, ex = narrow ? bx - 8 : bx - 12;
          u.flow(ctx, sx, sy, ex, sy, col, 2, u.t || 0);
          if (p < .75) u.ring(ctx, bx + 18, y + 24, col, u.clamp((p - .1) / .55, 0, 1), { from: 8, to: 30, lw: 1.7 });
        }
        ctx.restore();
      });
      u.text(ctx, "pick the profile that answers the question", x, h - 16, { color: c.dim, size: narrow ? 9.5 : 11.5, weight: 600 });
    }

    const STEPS = [
      {
        t: 0,
        title: "Start from the symptom",
        desc: "The symptom is your first filter. A service can be slow because it is burning CPU, allocating too much, leaking goroutines, or waiting on locks/channels.",
        why: "Choosing the profile by symptom prevents you from staring at the wrong evidence.",
        draw(ctx, p, w, h, c, u) { drawRows(ctx, p, w, h, c, u, -1); },
      },
      {
        t: 2.2,
        title: "CPU profile answers: where is time spent?",
        desc: "For a hot request path, collect a CPU profile. pprof samples the currently running stack and ranks functions by how often they were on-CPU.",
        why: "This is the profile for throughput work: algorithms, reflection, parsing, serialization, hashing, and tight loops.",
        draw(ctx, p, w, h, c, u) { drawRows(ctx, 1, w, h, c, u, 0); },
      },
      {
        t: 4.7,
        title: "Heap profile answers: what owns memory?",
        desc: "If RSS climbs or GC burns CPU, switch to heap. inuse_space shows what is live now; alloc_space shows allocation churn that feeds the GC.",
        why: "Memory problems need ownership evidence - a CPU flame graph can hide the allocation site that actually creates pressure.",
        draw(ctx, p, w, h, c, u) { drawRows(ctx, 1, w, h, c, u, 1); },
      },
      {
        t: 7.2,
        title: "Goroutine profile answers: who is stuck?",
        desc: "When goroutine count keeps rising, dump the goroutine profile. It shows every stack, so leaked workers and forgotten receives become visible.",
        why: "A leak is usually a lifetime bug, not a CPU bug - you need the parked stack, not a timing aggregate.",
        draw(ctx, p, w, h, c, u) { drawRows(ctx, 1, w, h, c, u, 2); },
      },
      {
        t: 9.7,
        title: "Block and mutex profiles answer: who waits?",
        desc: "If CPU is low but latency is high, enable block or mutex profiling. The profile points at channel sends, receives, selects, and locks that consume wait time.",
        why: "Waiting time is invisible in a normal CPU profile because blocked goroutines are not on-CPU.",
        draw(ctx, p, w, h, c, u) { drawRows(ctx, 1, w, h, c, u, 3); },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12.0,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.0, "go tool pprof · profile picker"),
    });
  };

  /* =================================================================== */
  /* F2. PROFILE → FIX → RE-PROFILE                                      */
  /* =================================================================== */
  ANIM["pprof-optimize-loop"] = (canvas) => {
    const nodes = [
      { label: "measure", sub: "benchmark/load test", x: .20, y: .30, color: "go" },
      { label: "cpu.out", sub: "go tool pprof", x: .42, y: .30, color: "warn" },
      { label: "hotspot", sub: "top · list · flame", x: .64, y: .30, color: "bad" },
      { label: "fix", sub: "one code change", x: .78, y: .62, color: "purple" },
      { label: "re-profile", sub: "prove the win", x: .36, y: .62, color: "go" },
    ];

    function nodeColor(c, n) {
      return n.color === "go" ? c.go : n.color === "warn" ? c.warn : n.color === "purple" ? c.purple : c.bad;
    }

    function drawMiniFlame(ctx, c, u, x, y, w, hot, label) {
      const rowH = 18;
      u.text(ctx, label, x, y - 9, { color: c.dim, size: 10.5, weight: 700, mono: true });
      u.fillRR(ctx, x, y + rowH * 3, w, rowH, 3, c.go, "rgba(0,0,0,.14)", 1);
      u.fillRR(ctx, x, y + rowH * 2, w, rowH, 3, c.goSoft, "rgba(0,0,0,.14)", 1);
      u.fillRR(ctx, x, y + rowH, w * (hot ? .54 : .28), rowH, 3, hot ? "rgba(255,107,107,.88)" : c.warn, hot ? c.bad : "rgba(0,0,0,.14)", hot ? 2 : 1);
      u.fillRR(ctx, x + w * (hot ? .54 : .28), y + rowH, w * (hot ? .25 : .34), rowH, 3, c.warn, "rgba(0,0,0,.14)", 1);
      u.fillRR(ctx, x, y, w * (hot ? .43 : .18), rowH, 3, hot ? "rgba(255,107,107,.88)" : c.purple, hot ? c.bad : "rgba(0,0,0,.14)", hot ? 2 : 1);
      u.text(ctx, hot ? "reflectWalk" : "parseJSON", x + 6, y + 13, { color: hot ? "#fff" : "#06121f", size: 9.5, weight: 700, mono: true });
    }

    function drawLoop(ctx, p, w, h, c, u, active) {
      const narrow = w < 560;
      const pos = narrow
        ? nodes.map((n, i) => ({ n, x: w / 2, y: 84 + i * 39 }))
        : nodes.map((n) => ({ n, x: 28 + n.x * (w - 56), y: 72 + n.y * (h - 130) }));
      for (let i = 0; i < pos.length; i++) {
        const a = pos[i], b = pos[(i + 1) % pos.length];
        const on = active >= i || active === 4;
        u.flow(ctx, a.x, a.y, b.x, b.y, on ? nodeColor(c, a.n) : c.line, on ? 2.4 : 1.4, u.t || 0);
      }
      pos.forEach((pt, i) => {
        const appear = u.clamp((p - i * .08) / .28, 0, 1);
        if (appear <= 0) return;
        const col = nodeColor(c, pt.n);
        const on = i === active;
        if (on) u.glowPulse(ctx, pt.x, pt.y, 34, col + "66", u.t || 0);
        const cardW = narrow ? Math.min(w - 72, 230) : 132;
        const cardH = narrow ? 32 : 50;
        ctx.save();
        ctx.globalAlpha = appear;
        u.fillRR(ctx, pt.x - cardW / 2, pt.y - cardH / 2, cardW, cardH, 10, on ? "rgba(0,173,216,.09)" : c.panel, on ? col : c.line, on ? 2.2 : 1.3);
        u.text(ctx, pt.n.label, pt.x, pt.y + (narrow ? 4 : -2), { align: "center", color: on ? col : c.text, size: narrow ? 10.5 : 12, weight: 800, mono: true });
        if (!narrow) u.text(ctx, pt.n.sub, pt.x, pt.y + 15, { align: "center", color: c.dim, size: 9.6, weight: 600, mono: true });
        ctx.restore();
      });
    }

    const STEPS = [
      {
        t: 0,
        title: "Reproduce the slow path",
        desc: "Start with a benchmark or representative load test. The profile is only useful if the workload exercises the behavior you actually need to improve.",
        why: "A clean reproduction turns performance work from folklore into an experiment you can repeat.",
        draw(ctx, p, w, h, c, u) {
          drawLoop(ctx, 1, w, h, c, u, 0);
          u.badge(ctx, 28, h - 46, "benchmark/load test", "rgba(0,173,216,.9)", "#06121f");
        },
      },
      {
        t: 2.5,
        title: "Collect evidence, then inspect it",
        desc: "Write cpu.out, open it with go tool pprof, and move between top, list, and the flame graph until one hotspot is concrete.",
        why: "The toolchain gives you several views of the same samples: table for ranking, source listing for the line, flame graph for shape.",
        draw(ctx, p, w, h, c, u) {
          drawLoop(ctx, 1, w, h, c, u, p < .5 ? 1 : 2);
          const x = 28, y = h - 74;
          ["top", "list", "flame"].forEach((label, i) => {
            u.badge(ctx, x + i * 86, y, label, i === Math.floor(p * 3) ? c.warn : c.panel, i === Math.floor(p * 3) ? "#06121f" : c.text);
          });
        },
      },
      {
        t: 5.1,
        title: "Change one hotspot",
        desc: "Make one targeted change where the profile is widest: swap an algorithm, remove reflection, preallocate, cache, or move work out of the loop.",
        why: "One change at a time keeps causality intact - if the profile improves, you know what did it.",
        draw(ctx, p, w, h, c, u) {
          drawLoop(ctx, 1, w, h, c, u, 3);
          const x = 30, y = h - 92, boxW = Math.min(260, w - 60);
          u.fillRR(ctx, x, y, boxW, 46, 8, "rgba(169,139,255,.10)", c.purple, 1.5);
          u.text(ctx, "hotspot", x + 12, y + 17, { color: c.purple, size: 11, weight: 800, mono: true });
          u.text(ctx, "reflectWalk", x + 92, y + 17, { color: c.text, size: 11, weight: 700, mono: true });
          u.text(ctx, "one code change", x + 12, y + 35, { color: c.dim, size: 10.5, weight: 600, mono: true });
          if (p < .75) u.burst(ctx, x + boxW - 26, y + 23, c.purple, u.clamp(p / .75, 0, 1), 9);
        },
      },
      {
        t: 7.7,
        title: "Re-profile and compare shapes",
        desc: "Run the same workload again. The before graph had one dominant box; the after graph should be flatter or expose the next real bottleneck.",
        why: "The only optimization that counts is the one that survives a second measurement.",
        draw(ctx, p, w, h, c, u) {
          drawLoop(ctx, 1, w, h, c, u, 4);
          const gap = 26, fw = Math.min(220, (w - 74) / 2), y = h - 122, x1 = 28, x2 = x1 + fw + gap;
          drawMiniFlame(ctx, c, u, x1, y, fw, true, "before");
          u.arrow(ctx, x1 + fw + 5, y + 32, x2 - 10, y + 32, c.go, 2);
          drawMiniFlame(ctx, c, u, x2, y, fw, false, "after");
          if (p > .45) u.badge(ctx, Math.max(28, w - 178), h - 38, "flat enough - stop", "rgba(58,210,159,.88)", "#06121f");
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.2,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.2, "go tool pprof · optimize loop"),
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
        why: "Separating 'what to test' (the table) from 'how to test it' (one shared piece of logic) means adding a new case is just adding a row - no new code.",
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
        desc: "t.Run wraps each row as its own named subtest - go test -run TestAdd/negatives can target just one, and one failing case never stops the others from running.",
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
        why: "The function under test never knows it's being tested through a table - it just gets called like normal code, which is why this pattern adds no production complexity.",
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
        why: "The comparison - not the function - is what decides pass/fail. A mismatch fails loudly with both values printed, so you see exactly what diverged.",
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
            const pass = u.clamp((p - 0.6) / 0.25, 0, 1);
            u.ring(ctx, rx + w * 0.3 - 20, rowY + 24, c.good, pass, { from: 4, to: 22, lw: 1.8 });
          }
        },
      },
      {
        t: 8.6,
        title: "The same flow runs for every case",
        desc: "go test repeats exactly this input → function → compare flow for each remaining row, fully independently.",
        why: "This is the payoff: one test function plus N table rows covers N scenarios - no copy-pasted test functions to maintain.",
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
        desc: "go test reports one line: how many passed, and coverage. Run it constantly - `go test -race -cover ./...` - so a regression is caught the moment it's introduced.",
        why: "A fast, table-driven suite is cheap enough to run on every save, which is what makes 'catch it immediately' realistic instead of aspirational.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          if (p < 0.5) u.burst(ctx, w / 2, h * 0.4 + 20, c.good, u.easeOut(u.clamp(p / 0.5, 0, 1)), 12);
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
  /* F4. WORKER POOL - FAN-OUT / FAN-IN                                  */
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
        desc: "Work items sit in a channel, ready to be picked up. Nothing is processing yet - this is just a queue.",
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
        desc: "Each worker goroutine independently calls `job := <-jobs` in a loop. The channel itself decides which worker gets which job - no coordination code needed.",
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
        desc: "Each busy worker is running its own job concurrently - never more than 3 in flight, because there are only 3 workers.",
        why: "The number of workers is a deliberate dial: it caps concurrency so you don't overwhelm downstream resources, while still getting real parallelism.",
        draw(ctx, p, w, h, c, u) {
          const wx = w / 2 - 75, wTop = h * 0.18, wSp = 90, wW = 150, wH = 56;
          for (let k = 0; k < 3; k++) {
            const prog = u.clamp((p - k * 0.08) / 0.7, 0, 1);
            u.glowPulse(ctx, wx + wW / 2, wTop + k * wSp + wH / 2, wH * 0.6, "rgba(0,173,216,.35)", (u.t || 0) + k);
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
        desc: "When a worker finishes, it sends its result to a shared results channel - the same channel every other worker also writes to.",
        why: "The collector reading results doesn't need to know which worker produced what, or even how many workers there are - fan-in merges them for free.",
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
        why: "No locks, no shared mutable state, no manual bookkeeping - the channel's blocking send/receive IS the synchronization.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          if (p < 0.45) u.burst(ctx, w / 2, h * 0.36 + 22, c.good, u.easeOut(u.clamp(p / 0.45, 0, 1)), 12);
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
      const N = (fx) => 28 + fx * (w - 56);
      const levelY = [92, Math.max(174, h * 0.46), h - 54];
      const M = (fy, d) => levelY[d] || (64 + fy * (h - 120));
      edges.forEach((e) => {
        const a = nodes[e[0]], b = nodes[e[1]];
        if (a.d > maxDepth || b.d > maxDepth) return;
        const dead = cancelledFn && cancelledFn(b);
        u.line(ctx, N(a.x), M(a.y, a.d) + 16, N(b.x), M(b.y, b.d) - 16, dead ? c.bad : c.good, dead ? 2.2 : 1.8);
      });
      Object.keys(nodes).forEach((k) => {
        const n = nodes[k];
        if (n.d > maxDepth) return;
        const dead = cancelledFn && cancelledFn(n);
        const fill = dead ? "rgba(255,107,107,.12)" : "rgba(58,210,159,.10)";
        const stroke = dead ? c.bad : c.good;
        const leafW = Math.max(72, Math.min(116, (w - 72) / 4 - 8));
        const branchW = Math.min(136, Math.max(104, w * 0.13));
        const x = N(n.x), y = M(n.y, n.d), bw = n.d === 2 ? leafW : branchW, bh = 44;
        u.fillRR(ctx, x - bw / 2, y - bh / 2, bw, bh, 11, fill, stroke, dead ? 2 : 1.7);
        u.text(ctx, n.label, x, y - 2, { align: "center", color: dead ? c.bad : c.text, size: 11.5, minSize: 9.5, weight: 700, mono: true, maxWidth: bw - 16 });
        u.text(ctx, dead ? "ctx.Done() ✓" : "running ●", x, y + 14, { align: "center", color: dead ? c.bad : c.good, size: 10, minSize: 8.5, weight: 600, mono: true, maxWidth: bw - 16 });
      });
    }

    const STEPS = [
      {
        t: 0,
        title: "A request creates a root context",
        desc: "Every cancellation tree starts from one context at the top - typically derived from the incoming request.",
        why: "Having ONE source of truth for 'should this request keep going' is what makes it possible to cancel an entire call tree with a single action later.",
        draw(ctx, p, w, h, c, u) { drawTree(ctx, c, u, w, h, 0, () => false); },
      },
      {
        t: 2.0,
        title: "Children derive their own contexts",
        desc: "Each branch derives a child context - WithCancel, WithTimeout - rather than creating an unrelated one from scratch.",
        why: "Deriving (not creating fresh) is what wires the child to the parent: cancel the parent, and every derived child is automatically cancelled too.",
        draw(ctx, p, w, h, c, u) { drawTree(ctx, c, u, w, h, 1, () => false); },
      },
      {
        t: 4.0,
        title: "Goroutines attach at the leaves",
        desc: "Worker goroutines hold the leaf contexts and do real work - an HTTP call, a DB query - while watching ctx.Done() for a cancellation signal.",
        why: "This is the realistic shape of a Go service: a deep tree of derived contexts with actual work happening only at the edges.",
        draw(ctx, p, w, h, c, u) { drawTree(ctx, c, u, w, h, 2, () => false); },
      },
      {
        t: 6.0,
        title: "The deadline fires at the root",
        desc: "2 seconds elapse (or someone calls the root's cancel() function) - the root's Done() channel closes.",
        why: "Only the root needs to know WHY the request is ending (timeout, client disconnect, explicit cancel) - everything below just reacts to one signal.",
        draw(ctx, p, w, h, c, u) {
          drawTree(ctx, c, u, w, h, 2, (n) => n.d === 0);
          const f = 0.5 + 0.5 * Math.sin(p * 26);
          const N = (fx) => 28 + fx * (w - 56);
          const levelY = [92, Math.max(174, h * 0.46), h - 54];
          const x = N(nodes.root.x), y = levelY[nodes.root.d];
          ctx.strokeStyle = "rgba(255,107,107," + f + ")"; ctx.lineWidth = 3;
          u.rr(ctx, x - 61, y - 25, 122, 50, 12); ctx.stroke();
        },
      },
      {
        t: 7.6,
        title: "Cancellation propagates down every edge",
        desc: "The signal flows from root to children to grandchildren - each derived context's Done() closes in turn, depth by depth.",
        why: "This is automatic precisely BECAUSE children were derived, not created independently - there's no manual fan-out code that has to remember every goroutine.",
        draw(ctx, p, w, h, c, u) {
          const wave = u.clamp(p, 0, 1) * 2;
          drawTree(ctx, c, u, w, h, 2, (n) => wave >= n.d);
          const N = (fx) => 28 + fx * (w - 56);
          const levelY = [92, Math.max(174, h * 0.46), h - 54];
          const M = (n) => levelY[n.d];
          edges.forEach((e) => {
            const a = nodes[e[0]], b = nodes[e[1]];
            const localp = u.clamp(wave - (b.d - 1), 0, 1);
            if (wave >= b.d) u.flow(ctx, N(a.x), M(a) + 16, N(b.x), M(b) - 16, "rgba(255,107,107,.7)", 2, u.t || 0);
            if (wave >= a.d && localp > 0 && localp < 1) u.dot(ctx, u.lerp(N(a.x), N(b.x), localp), u.lerp(M(a) + 16, M(b) - 16, localp), 5, c.bad, "rgba(255,107,107,.5)");
          });
        },
      },
      {
        t: 9.6,
        title: "Clean shutdown - no goroutine leak",
        desc: "Cancellation reached every descendant. Every worker observed ctx.Done() closing and returned.",
        why: "This is the payoff this whole module (and M7's leak detector) cares about: a goroutine that never learns its work is unwanted is a goroutine that never exits.",
        draw(ctx, p, w, h, c, u) {
          drawTree(ctx, c, u, w, h, 2, () => true);
          if (p < 0.5) {
            const N = (fx) => 28 + fx * (w - 56);
            const levelY = [92, Math.max(174, h * 0.46), h - 54];
            ["g1", "g2", "g3", "g4"].forEach((k) => u.burst(ctx, N(nodes[k].x), levelY[nodes[k].d], c.good, u.easeOut(u.clamp(p / 0.5, 0, 1)), 6));
          }
          u.text(ctx, "✓ every goroutine returned - no leaks", w / 2, h - 16, { align: "center", color: c.good, size: 13, weight: 700, alpha: u.clamp(p / 0.3, 0, 1) });
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
      const widths = nodes.map((node) => Math.max(36, Math.min(78, tr(node).length * 8 + 18)));
      for (let i = 0; i < n - 1; i++) u.line(ctx, x0 + step * i + widths[i] / 2, y, x0 + step * (i + 1) - widths[i + 1] / 2, y, i < active ? c.go : c.line, i < active ? 2.5 : 1.5);
      for (let i = 0; i < n; i++) {
        const nx = x0 + step * i, on = i <= active, wild = nodes[i] === "{id}";
        const nw = widths[i];
        u.fillRR(ctx, nx - nw / 2, y - 18, nw, 36, 9, on ? (wild ? c.warn : c.go) : c.panel, on ? (wild ? c.warn : c.go) : c.line, on ? 2.2 : 1.5);
        u.text(ctx, nodes[i], nx, y + 5, { align: "center", color: on ? "#06101f" : c.dim, size: 11.5, minSize: 9.5, weight: 700, mono: true, maxWidth: nw - 8 });
        u.text(ctx, labels[i], nx, y + 38, { align: "center", color: on ? c.text : c.dim, size: 11, mono: true, alpha: on ? 1 : 0.5 });
      }
      return { x0, x1, step, n };
    }

    const STEPS = [
      {
        t: 0,
        title: "A request arrives",
        desc: "GET /api/v1/ledger/42 enters Go's native net/http router.",
        why: "The router's only job is mapping this one string to the right handler, fast - everything in this module is about how it does that without regular expressions.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.5, 0, 1);
          u.fillRR(ctx, w / 2 - 160, h * 0.4, 320, 40, 9, c.panel, c.go, 1.8);
          u.text(ctx, "GET /api/v1/ledger/42", w / 2, h * 0.4 + 26, { align: "center", color: c.goSoft, mono: true, size: 14, weight: 700, alpha: a });
        },
      },
      {
        t: 2.0,
        title: "The router walks a trie, segment by segment",
        desc: "ServeMux matches each path segment against the trie one node at a time - /api, then /v1, then /ledger - until it can't go any deeper.",
        why: "A trie turns routing into a fixed number of cheap segment comparisons instead of testing the path against every registered pattern in turn.",
        draw(ctx, p, w, h, c, u) {
          const active = Math.floor(u.clamp(p, 0, 1) * 3.999);
          drawTrie(ctx, c, u, w, h, active, h * 0.36);
        },
      },
      {
        t: 4.4,
        title: "{id} captures the wildcard segment",
        desc: 'The trie\'s last node is a wildcard - it matches ANY segment and captures it as "42", readable in the handler via r.PathValue("id").',
        why: "A typed wildcard node is what lets one route handle /ledger/42, /ledger/99, /ledger/anything - without falling back to slower regexp matching.",
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
          if (p < 0.4) u.burst(ctx, w / 2, h * 0.62 + 10, c.good, u.easeOut(u.clamp(p / 0.4, 0, 1)), 8);
          u.badge(ctx, w / 2 - 36, h * 0.62, "200 OK", c.good, "#06101f");
        },
      },
      {
        t: 8.4,
        title: "os.Root: a directory you can't escape",
        desc: 'A handler that reads files opens them through os.Root("data") instead of the raw filesystem - every path it resolves is forced to stay inside data/.',
        why: "Path traversal (`../../etc/passwd`) is a classic vulnerability - os.Root makes 'escaping the jail' a type error, not a runtime check you might forget.",
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
            u.ring(ctx, jx, jy + jh / 2, c.bad, u.clamp((p - 0.6) / 0.3, 0, 1), { from: 4, to: 30, lw: 2 });
          }
        },
      },
      {
        t: 12.4,
        title: "Legitimate reads still succeed",
        desc: 'root.Open("config.json") resolves inside the jail and works exactly like a normal file read - no extra code in the handler.',
        why: "The safety is structural: code that only ever has an *os.Root, never a raw path, cannot accidentally escape the jail - there's no boundary check to forget.",
        draw(ctx, p, w, h, c, u) {
          const jx = w * 0.5, jy = h * 0.22, jw = w * 0.3, jh = h * 0.5;
          u.fillRR(ctx, jx, jy, jw, jh, 12, "rgba(58,210,159,0.06)", c.good, 2);
          u.text(ctx, "data/", jx + 16, jy - 14, { color: c.good, size: 13, weight: 700, mono: true });
          u.fillRR(ctx, jx + 20, jy + 24, jw - 40, 28, 7, c.panel, c.line, 1.3);
          u.text(ctx, "config.json", jx + 32, jy + 43, { color: c.text, size: 11.5, mono: true });
          const px = u.lerp(jx - 170, jx + jw / 2, u.clamp(p / 0.6, 0, 1));
          u.dot(ctx, px, jy + jh / 2 + 20, 7, c.good, "rgba(58,210,159,.5)");
          u.text(ctx, 'root.Open("config.json")', px, jy + jh / 2 + 20 - 22, { align: "center", color: c.good, size: 11.5, mono: true });
          if (p > 0.65) {
            u.text(ctx, "✓ ok", jx + jw / 2, jy + jh + 28, { align: "center", color: c.good, size: 13, weight: 700 });
            u.ring(ctx, jx + jw / 2, jy + jh + 22, c.good, u.clamp((p - 0.65) / 0.3, 0, 1), { from: 3, to: 20, lw: 1.6 });
          }
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
    const slots = ["EUR", "GBP", "JPY", "CHF", "USD", "-"];
    const ctrl = ["h0", "h1", "USD", "h3", "h4", "h5", "-", "-"];

    const STEPS = [
      {
        t: 0,
        title: 'The same lookup: m["USD"]',
        desc: "We'll trace this one lookup through two implementations: Go's legacy map, and the new Swiss Table design.",
        why: "The map TYPE never changes in your code - only the internal layout does. Seeing both traces side by side (in time, not space) shows exactly what that internal change buys you.",
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
        why: "Each entry lives at a different memory address, so each check that misses is very likely its OWN separate cache miss - the cost adds up linearly.",
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
        desc: "The hash picks a single 8-slot group, and its 8 one-byte 'control bytes' - a tiny fingerprint per slot - all live together in ONE cache line.",
        why: "Loading 8 slots' worth of metadata costs the same one cache-line fetch as loading just one - the layout was designed around that fact.",
        draw(ctx, p, w, h, c, u) {
          const cellW = Math.min(90, (w * 0.8) / 8), sx = (w - cellW * 8) / 2, cy = h * 0.32;
          const reveal = u.clamp(p / 0.7, 0, 1);
          u.text(ctx, "control bytes - one cache line:", sx, cy - 16, { color: c.dim, size: 12.5 });
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
        why: "This is the structural win: legacy map cost scales with HOW MANY entries you check; Swiss Table cost is closer to constant - one fetch, one compare, almost always.",
        draw(ctx, p, w, h, c, u) {
          const cellW = Math.min(90, (w * 0.8) / 8), sx = (w - cellW * 8) / 2, cy = h * 0.28;
          for (let i = 0; i < 8; i++) {
            const isHit = ctrl[i] === "USD", x = sx + i * cellW;
            const matched = isHit && p > 0.6;
            if (matched) u.ring(ctx, x + (cellW - 6) / 2, cy + 20, c.good, u.clamp((p - 0.6) / 0.3, 0, 1), { from: 4, to: 28, lw: 1.8 });
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
        title: "Match found - one cache line touched, total",
        desc: 'USD sits in slot 2 of the group - found immediately. The whole lookup cost ONE cache-line fetch, versus up to 5 for the legacy map.',
        why: "This is why the Swiss Table redesign matters in practice: hot map lookups in a request path get measurably faster purely from this layout change - no code changes required.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.4, 0, 1);
          if (p < 0.35) u.burst(ctx, w / 2, h * 0.3 + 20, c.good, u.easeOut(u.clamp(p / 0.35, 0, 1)), 10);
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
        desc: "A *Conn lives inside a parent span. The stack holds a reference to it, so the garbage collector considers it reachable - alive.",
        why: "Reachability from a root is the ONLY thing that keeps an object alive in Go - not how recently it was used, not its size, just 'can a root still get to it.'",
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
        desc: "Whatever held that reference returns or goes out of scope. The *Conn is now unreachable from any root - eligible for collection, but not yet collected.",
        why: "'Unreachable' and 'freed' are NOT the same moment in Go - there's a gap, and that gap is exactly what the next two steps are about.",
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
        desc: "The concurrent collector sweeps through live memory tracing from the roots. The *Conn is never reached this time - it's now PROVABLY garbage, not just assumed.",
        why: "Go won't free an object the instant it looks unused - it waits for the mark pass to confirm it, which is what makes collection safe even with concurrent mutation.",
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
        desc: "runtime.AddCleanup fires: syscall.Close(7). It captured the file descriptor by VALUE when registered - not the object itself, so it can run safely even though *Conn is gone.",
        why: "Unlike the legacy SetFinalizer, AddCleanup never resurrects the object and never silently skips a cycle - it's a plain function call guaranteed to run once, on a dead object.",
        draw(ctx, p, w, h, c, u) {
          const { cx, midY } = scene(ctx, c, u, w, h, 1, "rgba(107,124,153,0.15)", c.dim, 1);
          const flash = 0.5 + 0.5 * Math.sin(p * 24);
          if (p < 0.3) u.ring(ctx, cx, midY + 72, c.good, u.easeOut(u.clamp(p / 0.3, 0, 1)), { from: 4, to: 40, lw: 2 });
          u.fillRR(ctx, cx - 110, midY + 56, 220, 32, 8, "rgba(58,210,159," + (0.12 + 0.14 * flash) + ")", c.good, 2);
          u.text(ctx, "AddCleanup ▶ syscall.Close(7)", cx, midY + 77, { align: "center", color: c.good, size: 13, weight: 700, mono: true });
        },
      },
      {
        t: 8.4,
        title: "Memory freed, no extra delay",
        desc: "The parent span is reclaimed in the SAME cycle that proved the object dead - no resurrection pass, no waiting an extra GC cycle.",
        why: "This is the practical reason AddCleanup replaced finalizers for resource cleanup: deterministic, single-cycle reclamation means file descriptors and connections don't linger.",
        draw(ctx, p, w, h, c, u) {
          const fade = 1 - u.clamp(p / 0.5, 0, 1);
          scene(ctx, c, u, w, h, fade, "rgba(107,124,153,0.15)", c.dim, Math.max(0.15, fade));
          if (p > 0.45) {
            u.text(ctx, "✓ fd closed · parent span freed", w / 2, h * 0.46 + 80, { align: "center", color: c.good, size: 13.5, weight: 700, alpha: u.clamp((p - 0.45) / 0.3, 0, 1) });
            if (p < 0.7) u.burst(ctx, w / 2, h * 0.46 + 74, c.good, u.easeOut(u.clamp((p - 0.45) / 0.25, 0, 1)), 9);
          }
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
        desc: "Three goroutines run inside a synctest bubble - a sandbox with its OWN fake clock, separate from real wall-clock time.",
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
        desc: "G1 sleeps for 0.5s, G2 for 0.8s, G3 for 1.0s (or waits on a channel) - each parks the moment it has nothing left to do.",
        why: "A real test would have to actually wait out the slowest of these - that's the time cost synctest is about to eliminate.",
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
        desc: "The test calls synctest.Wait, which blocks until EVERY goroutine in the bubble is durably parked - not 'probably done', but provably done.",
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
        desc: "With every goroutine confirmed blocked, the bubble's clock fast-forwards directly to whenever the next timer fires - instantly, no real waiting.",
        why: "Real time and bubble time are decoupled: the test can simulate 5 real-world seconds of timers in microseconds of actual CPU time.",
        draw(ctx, p, w, h, c, u) {
          const bubbleVal = u.lerp(0, 5, u.clamp(p / 0.6, 0, 1)).toFixed(3);
          clocks(ctx, c, u, w, "0.002", bubbleVal);
          const { bx, by, bw, bh } = bubbleBox(ctx, c, u, w, h);
          const a = 0.5 + 0.5 * Math.sin(p * 26);
          if (p < 0.6) u.ring(ctx, w - 90, 60, c.go, u.clamp(p / 0.6, 0, 1), { from: 6, to: 46, lw: 2.4 });
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
        desc: "The whole test simulated 5 seconds of timers while real wall-clock time barely moved - fully deterministic, every run, every machine.",
        why: "No time.Sleep means no 'flaky on a slow CI box' - the test's correctness no longer depends on how fast the test runner happens to be today.",
        draw(ctx, p, w, h, c, u) {
          clocks(ctx, c, u, w, "0.002", "5.000");
          const { bx, by, bw, bh } = bubbleBox(ctx, c, u, w, h);
          if (p < 0.4) u.burst(ctx, bx + bw / 2, by + bh - 24, c.good, u.easeOut(u.clamp(p / 0.4, 0, 1)), 10);
          u.text(ctx, "✓ deterministic - no time.Sleep, no CI flake", bx + bw / 2, by + bh - 16, { align: "center", color: c.good, size: 13, weight: 700, alpha: u.clamp(p / 0.3, 0, 1) });
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
        desc: "T1 and T2 are both transactions trying to move money - and both need to touch account A at the same moment.",
        why: "This exact scenario - concurrent writers, shared row - is what row-level locking exists to make safe.",
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
        desc: "T1 runs SELECT … FOR UPDATE, which takes a lock on just that one row - not the whole table.",
        why: "Locking only the specific row means transfers touching DIFFERENT accounts can still run fully in parallel - the lock's scope is as narrow as correctness allows.",
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
        desc: "T2 also needs account A, so it simply waits - Postgres won't let it read until T1's transaction finishes.",
        why: "If T2 read A mid-transfer, it could see a half-finished state (debited but not yet credited) - blocking prevents that entirely.",
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
        desc: "T1 subtracts $100 from A and adds $100 to B - both statements run inside the SAME transaction, so they can never land separately.",
        why: "This is double-entry: if the process crashed between the two writes, the whole transaction rolls back - you never end up with money debited from A but never credited to B.",
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
        desc: "T1 commits - its changes become permanent, and the row lock on account A is released immediately.",
        why: "The lock is held for the shortest time that's still correct: exactly as long as T1's transaction is open, no longer.",
        draw(ctx, p, w, h, c, u) {
          accounts(ctx, c, u, w, h, "400", "400", u.clamp(p / 0.4, 0, 1) < 1);
          if (p > 0.15) {
            u.badge(ctx, w / 2 - 36, h * 0.4, "COMMIT ✓", c.good);
            if (p < 0.5) u.burst(ctx, w / 2, h * 0.4 + 10, c.good, u.easeOut(u.clamp((p - 0.15) / 0.35, 0, 1)), 8);
          }
        },
      },
      {
        t: 10.4,
        title: "T2 proceeds - the invariant held",
        desc: "T2 now reads fresh, consistent balances and runs its own transfer. Through all of this, the total money in the system never changed.",
        why: "This is the proof the pattern works: concurrent access was serialized just enough to keep Σ(balances) constant, without serializing the WHOLE database.",
        draw(ctx, p, w, h, c, u) {
          accounts(ctx, c, u, w, h, "400", "400", false);
          const a = u.clamp(p / 0.4, 0, 1);
          u.text(ctx, "Σ = $800  ✓ invariant held", w / 2, h * 0.86, { align: "center", color: c.good, size: 14, weight: 700, mono: true, alpha: a });
          if (p < 0.35) u.ring(ctx, w / 2, h * 0.86 - 6, c.good, u.clamp(p / 0.35, 0, 1), { from: 4, to: 34, lw: 2 });
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
  /* M17. POSTGRES SCHEMA CONSTRAINTS, PLANNER, LOCKS & VACUUM           */
  /* =================================================================== */
  ANIM["pg-schema-constraints"] = (canvas) => {
    function box(ctx, u, c, x, y, w, h, label, color, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      u.fillRR(ctx, x, y, w, h, 10, color ? color + "18" : c.panel, color || c.line, color ? 1.8 : 1.3);
      u.text(ctx, label, x + w / 2, y + h / 2 + 4, { align: "center", color: color || c.text, size: 12.5, minSize: 9.5, weight: 700, mono: true, maxWidth: w - 16 });
      ctx.restore();
    }
    function schema(ctx, u, c, w, active) {
      const cols = [
        ["accounts", c.go],
        ["transfers", c.purple],
        ["ledger_entries", c.good],
        ["outbox_events", c.warn],
      ];
      const startX = w * 0.08, gap = w * 0.035, bw = (w * 0.84 - gap * 3) / 4, y = 158;
      cols.forEach((item, i) => box(ctx, u, c, startX + i * (bw + gap), y, bw, 58, item[0], item[1], active >= i ? 1 : 0.45));
      return { startX, gap, bw, y };
    }
    const STEPS = [
      {
        t: 0,
        title: "A transfer enters the database boundary",
        desc: "The service receives one request, but the durable truth will be created by several tables together: accounts, transfers, ledger entries, and the outbox.",
        why: "The database boundary matters because retries, crashes, and duplicate requests all meet at the same place: the transaction.",
        draw(ctx, p, w, h, c, u) {
          const sx = w * 0.13, gx = w * 0.35, a = u.clamp(p / 0.45, 0, 1);
          box(ctx, u, c, sx - 62, h * 0.31 - 24, 124, 48, "HTTP transfer", c.go, 1);
          box(ctx, u, c, gx - 58, h * 0.31 - 24, 116, 48, "Go service", c.purple, a);
          u.arrow(ctx, sx + 62, h * 0.31, gx - 58, h * 0.31, c.go, 2);
          const s = schema(ctx, u, c, w, 3);
          if (a > 0.5) u.flow(ctx, gx + 58, h * 0.31, s.startX + s.bw / 2, s.y - 8, c.good, 2, u.t || 0);
        },
      },
      {
        t: 2.4,
        title: "CHECK constraints reject impossible values",
        desc: "The schema refuses negative balances and non-positive transfer amounts before the data can become durable.",
        why: "Go validation gives good error messages; Postgres constraints protect the data when a bad binary deploys anyway.",
        draw(ctx, p, w, h, c, u) {
          const s = schema(ctx, u, c, w, 1);
          u.badge(ctx, s.startX + 10, s.y + 78, "CHECK balance >= 0", c.go);
          u.badge(ctx, s.startX + s.bw + s.gap + 8, s.y + 78, "CHECK amount > 0", c.purple);
          const x = u.lerp(w * 0.17, s.startX + s.bw + s.gap + s.bw / 2, u.easeInOut(u.clamp(p / 0.7, 0, 1)));
          u.dot(ctx, x, h * 0.42, 8, p > 0.7 ? c.bad : c.warn, "rgba(255,107,107,0.35)");
          if (p > 0.72) u.text(ctx, "rejected", x, h * 0.42 + 28, { align: "center", color: c.bad, size: 12, weight: 700 });
        },
      },
      {
        t: 4.8,
        title: "UNIQUE idempotency_key absorbs retries",
        desc: "The same client retry reaches the database twice, but the unique key lets only one transfer identity exist.",
        why: "This is what stops timeouts and retry loops from double-charging a customer.",
        draw(ctx, p, w, h, c, u) {
          const s = schema(ctx, u, c, w, 1);
          const tx = s.startX + s.bw + s.gap;
          u.badge(ctx, tx + 8, s.y + 78, "UNIQUE idempotency_key", c.purple);
          [0, 1].forEach((i) => {
            const py = h * (0.36 + i * 0.13);
            const end = tx + s.bw / 2;
            const px = u.lerp(w * 0.12, end, u.easeInOut(u.clamp((p - i * 0.18) / 0.58, 0, 1)));
            u.dot(ctx, px, py, 7, i === 0 ? c.good : c.warn, i === 0 ? "rgba(58,210,159,0.35)" : "rgba(245,177,76,0.35)");
          });
          if (p > 0.72) {
            u.badge(ctx, tx + s.bw * 0.48, h * 0.54, "duplicate blocked", c.warn);
            u.ring(ctx, tx + s.bw * 0.55, h * 0.49, c.warn, u.clamp((p - 0.72) / 0.25, 0, 1), { from: 6, to: 30 });
          }
        },
      },
      {
        t: 7.2,
        title: "Ledger rows and outbox commit atomically",
        desc: "The debit, credit, transfer row, and event row land in one transaction, so no downstream publisher can see a business event that the ledger did not commit.",
        why: "The outbox pattern turns 'write then publish' into a recoverable database fact instead of a timing hope.",
        draw(ctx, p, w, h, c, u) {
          const s = schema(ctx, u, c, w, 3);
          const cx = w / 2, cy = h * 0.72;
          u.text(ctx, "BEGIN", cx - 160, cy, { color: c.dim, size: 12, mono: true, weight: 700 });
          u.line(ctx, cx - 104, cy - 4, cx + 104, cy - 4, c.line, 2);
          const prog = u.clamp(p / 0.9, 0, 1);
          u.line(ctx, cx - 104, cy - 4, u.lerp(cx - 104, cx + 104, prog), cy - 4, c.good, 4);
          u.text(ctx, "COMMIT", cx + 120, cy, { color: c.good, size: 12, mono: true, weight: 700 });
          if (p > 0.5) {
            u.badge(ctx, s.startX + 3 * (s.bw + s.gap) + 18, s.y + 78, "event committed", c.good);
            u.text(ctx, "schema is the final guardrail", cx, h * 0.88, { align: "center", color: c.good, size: 13, weight: 700 });
          }
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 9.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 9.6, "PostgreSQL · schema constraints · idempotency/outbox"),
    });
  };

  ANIM["pg-index-planner"] = (canvas) => {
    function pill(ctx, u, c, x, y, label, color, w = 132) {
      u.fillRR(ctx, x, y, w, 34, 9, color + "14", color, 1.5);
      u.text(ctx, label, x + w / 2, y + 22, { align: "center", color, size: 11.5, minSize: 9, weight: 700, mono: true, maxWidth: w - 14 });
    }
    function bars(ctx, u, c, x, y, values, labels) {
      values.forEach((v, i) => {
        const bw = v * 130;
        u.fillRR(ctx, x, y + i * 30, 130, 18, 5, "rgba(42,58,85,0.55)", c.line, 1);
        u.fillRR(ctx, x, y + i * 30, Math.max(6, bw), 18, 5, i === 0 ? "rgba(245,177,76,0.32)" : "rgba(58,210,159,0.32)", i === 0 ? c.warn : c.good, 1);
        u.text(ctx, labels[i], x + 140, y + i * 30 + 13, { color: c.dim, size: 10.5, mono: true });
      });
    }
    function rows(ctx, u, c, x, y, activeCount, color) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 5; j++) {
          const on = i * 5 + j < activeCount;
          u.fillRR(ctx, x + j * 25, y + i * 18, 18, 12, 3, on ? color + "35" : "rgba(42,58,85,0.45)", on ? color : c.line, 0.8);
        }
      }
    }
    const STEPS = [
      {
        t: 0,
        title: "A query shape arrives",
        desc: "The service asks for the latest 50 ledger entries for one account, ordered by posted_at descending.",
        why: "The planner optimizes this exact shape, not your mental model of which columns feel important.",
        draw(ctx, p, w, h, c, u) {
          pill(ctx, u, c, w * 0.09, h * 0.5, "query", c.go);
          u.text(ctx, "WHERE account_id = $1", w * 0.34, h * 0.31, { color: c.text, size: 13, mono: true, weight: 700 });
          u.text(ctx, "ORDER BY posted_at DESC LIMIT 50", w * 0.34, h * 0.39, { color: c.text, size: 13, mono: true, weight: 700 });
          pill(ctx, u, c, w * 0.72, h * 0.5, "planner", c.purple, 150);
          u.flow(ctx, w * 0.09 + 132, h * 0.5 + 17, w * 0.72, h * 0.5 + 17, c.go, 2, u.t || 0);
        },
      },
      {
        t: 2.4,
        title: "No matching index means a wide scan",
        desc: "A sequential scan may touch thousands or millions of rows, then sort, just to return a tiny page.",
        why: "The danger is not only time; it is shared buffer churn that evicts useful pages for other requests.",
        draw(ctx, p, w, h, c, u) {
          rows(ctx, u, c, w * 0.13, h * 0.24, Math.floor(u.lerp(8, 40, p)), c.warn);
          pill(ctx, u, c, w * 0.56, h * 0.34, "seq scan", c.warn, 150);
          bars(ctx, u, c, w * 0.56, h * 0.54, [0.95, 0.65], ["buffers read", "heap fetches"]);
        },
      },
      {
        t: 4.8,
        title: "Composite index follows filter then sort",
        desc: "An index on (account_id, posted_at DESC) lets Postgres jump to one account's newest rows in order.",
        why: "Column order encodes the query shape: equality first, then ordering/range.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.16, y = h * 0.24;
          pill(ctx, u, c, x, y, "account_id", c.go, 140);
          pill(ctx, u, c, x + 158, y, "posted_at DESC", c.purple, 170);
          for (let i = 0; i < 7; i++) {
            const yy = y + 58 + i * 20;
            u.line(ctx, x + 18, yy, x + 300, yy, i < 3 ? c.good : c.line, i < 3 ? 2.5 : 1.2);
            u.dot(ctx, x + 18 + i * 34, yy, 4, i < 3 ? c.good : c.dim);
          }
          u.arrow(ctx, w * 0.68, h * 0.3, w * 0.68, h * 0.63, c.good, 2);
          u.text(ctx, "latest 50", w * 0.72, h * 0.49, { color: c.good, size: 13, weight: 700, mono: true });
        },
      },
      {
        t: 7.2,
        title: "INCLUDE can avoid heap fetches",
        desc: "Including amount and direction lets the index answer the selected columns without visiting the table for every row.",
        why: "Covering helps only when the query really projects those columns and visibility permits an index-only scan.",
        draw(ctx, p, w, h, c, u) {
          pill(ctx, u, c, w * 0.11, h * 0.28, "composite index", c.go, 180);
          pill(ctx, u, c, w * 0.11, h * 0.45, "covering INCLUDE", c.good, 180);
          u.text(ctx, "amount_cents, direction", w * 0.13, h * 0.62, { color: c.good, size: 12, mono: true, weight: 700 });
          u.line(ctx, w * 0.48, h * 0.28, w * 0.48, h * 0.68, c.line, 1.4, [5, 5]);
          pill(ctx, u, c, w * 0.62, h * 0.36, "table heap", c.dim, 132);
          const blocked = p > 0.45;
          u.line(ctx, w * 0.29, h * 0.46, w * 0.62, h * 0.46, blocked ? c.good : c.warn, 2, blocked ? null : [5, 5]);
          u.text(ctx, blocked ? "heap fetches avoided" : "heap fetches", w * 0.5, h * 0.43, { align: "center", color: blocked ? c.good : c.warn, size: 11.5, weight: 700 });
        },
      },
      {
        t: 9.6,
        title: "EXPLAIN proves the real plan",
        desc: "EXPLAIN (ANALYZE, BUFFERS) shows actual timing and whether the plan burned buffers or heap fetches.",
        why: "The optimization is not done until the second measurement proves it.",
        draw(ctx, p, w, h, c, u) {
          pill(ctx, u, c, w * 0.12, h * 0.31, "EXPLAIN verifies", c.purple, 180);
          bars(ctx, u, c, w * 0.45, h * 0.28, [u.lerp(0.9, 0.18, p), u.lerp(0.7, 0.08, p)], ["buffers read", "heap fetches"]);
          u.text(ctx, "Index Only Scan using ledger_entries_account_time_idx", w * 0.12, h * 0.68, { color: c.good, size: 11.5, mono: true, weight: 700, maxWidth: w * 0.76 });
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 12,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12, "PostgreSQL · planner · composite index path"),
    });
  };

  ANIM["pg-lock-vacuum"] = (canvas) => {
    function table(ctx, u, c, w, h) {
      u.fillRR(ctx, w * 0.17, h * 0.34, w * 0.66, h * 0.34, 12, c.panel, c.line, 1.5);
      u.text(ctx, "hot table", w / 2, h * 0.34 + 25, { align: "center", color: c.text, size: 13, weight: 700, mono: true });
    }
    function writers(ctx, u, c, w, h, blocked) {
      for (let i = 0; i < 4; i++) {
        const x = w * (0.18 + i * 0.16), y = h * 0.2;
        u.fillRR(ctx, x - 34, y - 17, 68, 34, 8, blocked ? "rgba(255,107,107,0.12)" : "rgba(58,210,159,0.12)", blocked ? c.bad : c.good, 1.4);
        u.text(ctx, "writers", x, y + 5, { align: "center", color: blocked ? c.bad : c.good, size: 10.5, weight: 700 });
        u.line(ctx, x, y + 18, x, h * 0.34, blocked ? c.bad : c.good, 1.5, blocked ? [4, 4] : null);
      }
    }
    const STEPS = [
      {
        t: 0,
        title: "A heavy DDL lock stops the table",
        desc: "Some schema changes need locks that block writers. On a hot table, that can become an incident before the migration finishes.",
        why: "A migration is production code running against your largest stateful dependency. Treat it with the same care as a deploy.",
        draw(ctx, p, w, h, c, u) {
          table(ctx, u, c, w, h); writers(ctx, u, c, w, h, true);
          u.badge(ctx, w * 0.39, h * 0.48, "ACCESS EXCLUSIVE", c.bad);
          u.text(ctx, "DDL migration", w / 2, h * 0.75, { align: "center", color: c.bad, size: 13, weight: 700, mono: true });
          if (p < 0.45) u.ring(ctx, w / 2, h * 0.51, c.bad, u.clamp(p / 0.45, 0, 1), { from: 18, to: 92, lw: 3 });
        },
      },
      {
        t: 2.4,
        title: "Concurrent index build keeps writes moving",
        desc: "CREATE INDEX CONCURRENTLY takes longer but avoids blocking ordinary reads and writes while the index is built.",
        why: "You pay with time and restrictions, but you avoid turning the database into a single-file queue.",
        draw(ctx, p, w, h, c, u) {
          table(ctx, u, c, w, h); writers(ctx, u, c, w, h, false);
          u.text(ctx, "CREATE INDEX CONCURRENTLY", w / 2, h * 0.5, { align: "center", color: c.go, size: 13, weight: 700, mono: true });
          u.flow(ctx, w * 0.22, h * 0.63, w * 0.78, h * 0.63, c.go, 3, u.t || 0);
          u.badge(ctx, w * 0.43, h * 0.73, "writes continue", c.good);
        },
      },
      {
        t: 4.8,
        title: "Long transactions pin old row versions",
        desc: "MVCC keeps old versions visible to old snapshots. A long transaction can keep those versions alive long after writers moved on.",
        why: "This is how normal update traffic quietly becomes table and index bloat.",
        draw(ctx, p, w, h, c, u) {
          table(ctx, u, c, w, h);
          u.badge(ctx, w * 0.18, h * 0.22, "long xact", c.warn);
          for (let i = 0; i < 10; i++) {
            const x = w * 0.25 + i * (w * 0.05), y = h * 0.48 + (i % 2) * 30;
            u.fillRR(ctx, x, y, 34, 20, 5, i < 4 ? "rgba(58,210,159,0.20)" : "rgba(245,177,76,0.22)", i < 4 ? c.good : c.warn, 1.1);
          }
          u.text(ctx, "dead tuples", w * 0.56, h * 0.78, { color: c.warn, size: 12.5, weight: 700, mono: true });
        },
      },
      {
        t: 7.2,
        title: "Vacuum cannot clean pinned tuples",
        desc: "Vacuum sees dead tuples, but it cannot remove versions that an old snapshot might still need.",
        why: "Autovacuum is not magic; it needs transactions to end and enough IO budget to keep up.",
        draw(ctx, p, w, h, c, u) {
          table(ctx, u, c, w, h);
          u.badge(ctx, w * 0.2, h * 0.22, "long xact", c.warn);
          u.badge(ctx, w * 0.62, h * 0.22, "VACUUM waits", c.bad);
          u.line(ctx, w * 0.42, h * 0.24, w * 0.62, h * 0.24, c.bad, 2, [4, 4]);
          for (let i = 0; i < 14; i++) {
            const x = w * 0.22 + i * (w * 0.04), y = h * 0.48 + (i % 3) * 24;
            u.dot(ctx, x, y, 5, i > 8 ? c.bad : c.warn, "rgba(245,177,76,0.25)");
          }
          u.text(ctx, "bloat grows", w / 2, h * 0.82, { align: "center", color: c.bad, size: 13, weight: 700 });
        },
      },
      {
        t: 9.6,
        title: "Batch backfills release pressure",
        desc: "Small batches with short transactions let writers continue, let vacuum clean, and make the migration interruptible.",
        why: "Expand/backfill/contract is boring, and boring is exactly what you want from production database changes.",
        draw(ctx, p, w, h, c, u) {
          table(ctx, u, c, w, h); writers(ctx, u, c, w, h, false);
          u.badge(ctx, w * 0.22, h * 0.47, "batch backfill", c.go);
          u.badge(ctx, w * 0.59, h * 0.47, "pressure released", c.good);
          u.flow(ctx, w * 0.36, h * 0.5, w * 0.59, h * 0.5, c.good, 2.5, u.t || 0);
          u.text(ctx, "small batches · short transactions", w / 2, h * 0.79, { align: "center", color: c.good, size: 13, weight: 700, mono: true });
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 12,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12, "PostgreSQL · locks · migrations · vacuum"),
    });
  };

  /* =================================================================== */
  /* M6. THE CRYPTOGRAPHIC LATTICE  (hybrid ML-KEM)                      */
  /* =================================================================== */
  ANIM["pqc-lattice"] = (canvas) => {
    function channelHead(ctx, c, u, x, colW, label, color) {
      u.text(ctx, label, x, h0, { color, size: 13, minSize: 10.5, weight: 700, maxWidth: colW });
      u.fillRR(ctx, x, h0 + 18, 60, 32, 8, c.panel, c.line, 1.4);
      u.text(ctx, "Alice", x + 30, h0 + 39, { align: "center", color: c.text, size: 11.5 });
      u.fillRR(ctx, x + colW - 90, h0 + 18, 60, 32, 8, c.panel, c.line, 1.4);
      u.text(ctx, "Bob", x + colW - 60, h0 + 39, { align: "center", color: c.text, size: 11.5 });
      u.line(ctx, x + 60, h0 + 34, x + colW - 90, h0 + 34, c.line, 1.5);
    }
    const h0 = 92;

    const STEPS = [
      {
        t: 0,
        title: "Two handshakes, same shape, different math",
        desc: "Channel A negotiates a classical X25519 key. Channel B negotiates a hybrid key - classical X25519 PLUS a lattice-based ML-KEM-768 key, combined.",
        why: "Both look identical at the protocol level - a normal TLS handshake. The difference that matters is invisible: what hard math problem the key relies on.",
        draw(ctx, p, w, h, c, u) {
          const colW = (w - 80) / 2;
          channelHead(ctx, c, u, 40, colW, "Channel A · Classic (X25519)", c.accent);
          channelHead(ctx, c, u, 40 + colW + 20, colW, "Channel B · Hybrid (+ML-KEM-768)", c.go);
          u.line(ctx, w / 2, h0 - 8, w / 2, h * 0.75, c.line, 1.5, [4, 6]);
          const kp = u.easeInOut(u.clamp(p / 0.7, 0, 1));
          [[40, c.accent], [40 + colW + 20, c.go]].forEach(([x, col]) => {
            u.dot(ctx, u.lerp(x + 64, x + colW - 94, kp), h0 + 34, 6, col, col + "55");
          });
        },
      },
      {
        t: 2.4,
        title: "An attacker harvests today's ciphertext",
        desc: "A passive adversary doesn't try to break the key right now - it just records both encrypted sessions and stores them.",
        why: "This is 'harvest now, decrypt later': the attack doesn't need to be feasible TODAY, only by the time a quantum computer exists.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          u.text(ctx, "harvester - recording ciphertext from both channels", w / 2, h * 0.3, { align: "center", color: c.warn, size: 13, minSize: 10, weight: 600, alpha: a, maxWidth: w - 56 });
          for (let i = 0; i < 8; i++) {
            const ia = u.clamp((p - i * 0.08) / 0.3, 0, 1);
            if (ia <= 0) continue;
            const x = w / 2 - 8 * 27 + i * 54;
            u.fillRR(ctx, x, h * 0.42, 40, 36, 6, "rgba(245,177,76,0.18)", c.warn, 1.4);
            u.text(ctx, "ct", x + 20, h * 0.42 + 23, { align: "center", color: c.warn, size: 12, weight: 700, mono: true, alpha: ia });
          }
          u.text(ctx, "stored, waiting for a future quantum computer", w / 2, h * 0.58, { align: "center", color: c.dim, size: 12, minSize: 9.5, alpha: a, maxWidth: w - 56 });
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
          u.text(ctx, "→ attacking both recorded sessions", w / 2, h * 0.4 + 30, { align: "center", color: c.dim, size: 13, minSize: 10, alpha: a, maxWidth: w - 56 });
        },
      },
      {
        t: 7.0,
        title: "Channel A's classical key falls",
        desc: "Shor's algorithm efficiently solves the discrete-log problem that X25519's security rests on - the recorded session decrypts.",
        why: "This is exactly why 'classical-only' key exchange is a liability for any data that needs to stay secret for years: today's strong key becomes tomorrow's broken one.",
        draw(ctx, p, w, h, c, u) {
          const colW = w * 0.6, x = w / 2 - colW / 2;
          const cracked = p > 0.5;
          u.text(ctx, "X25519 classical key", x, h * 0.26, { color: c.dim, size: 12 });
          for (let i = 0; i < 30; i++) { const ang = i * 0.6, r2 = 30 + (i % 4) * 7; u.dot(ctx, x + colW * 0.3 + Math.cos(ang) * r2, h * 0.42 + Math.sin(ang) * r2 * 0.6, 2.4, cracked ? c.bad : c.accent); }
          if (cracked && p < 0.75) u.burst(ctx, x + colW * 0.75, h * 0.42, c.bad, u.easeOut(u.clamp((p - 0.5) / 0.25, 0, 1)), 10);
          drawLock(ctx, x + colW * 0.75, h * 0.42, cracked ? c.bad : c.warn, !cracked, u);
          u.text(ctx, cracked ? "broken by Shor's algorithm" : "still classically secure", x + colW * 0.75, h * 0.42 + 56, { align: "center", color: cracked ? c.bad : c.warn, size: 12.5, minSize: 10, weight: 700, maxWidth: colW * 0.44 });
        },
      },
      {
        t: 9.0,
        title: "Channel B's hybrid key holds",
        desc: "The ML-KEM-768 lattice key has no known efficient quantum attack - so even though the ciphertext was recorded, it stays unreadable.",
        why: "Hybrid means EITHER half failing is survivable: it's only broken if BOTH the classical AND the lattice problem fall - a much higher bar than relying on one algorithm alone.",
        draw(ctx, p, w, h, c, u) {
          const colW = w * 0.6, x = w / 2 - colW / 2;
          u.text(ctx, "ML-KEM-768 lattice key", x, h * 0.26, { color: c.dim, size: 12 });
          const cols = 11, rows = 6, sp = 20, gx = x + 10, gy = h * 0.32;
          const reveal = u.clamp(p / 0.5, 0, 1);
          for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
            if ((i * rows + j) / (cols * rows) > reveal) continue;
            u.dot(ctx, gx + i * sp + (j % 2) * 6, gy + j * sp, 2.4, c.go);
          }
          u.glowPulse(ctx, x + colW * 0.78, h * 0.42, 22, "rgba(58,210,159,.4)", u.t || 0);
          drawLock(ctx, x + colW * 0.78, h * 0.42, c.good, true, u);
          u.text(ctx, "quantum-resistant - stays secret", x + colW * 0.78, h * 0.42 + 56, { align: "center", color: c.good, size: 12.5, minSize: 10, weight: 700, alpha: u.clamp(p / 0.6, 0, 1), maxWidth: colW * 0.44 });
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
        const healed = opts.fixed && e[1] === "g4";
        u.line(ctx, a.x, a.y + 18, b.x, b.y - 18, healed ? c.good : isLeakEdge ? c.bad : c.line, healed ? 2.4 : isLeakEdge ? 2.4 : 1.5, isLeakEdge && !healed ? [6, 4] : null);
        // horizontal edges: lift the label clear of the node boxes it joins
        u.text(ctx, e[2], (a.x + b.x) / 2 + 8, (a.y + b.y) / 2 - (a.y === b.y ? 26 : 0), { color: c.dim, size: 10.5, mono: true });
      });
      Object.keys(nodes).forEach((k) => {
        const nd = nodes[k], pos = N(k);
        let stroke = c.line, fill = c.panel, fg = c.text;
        if (nd.state === "blocked" && opts.blocked) { stroke = c.bad; fill = "rgba(255,107,107,0.14)"; fg = c.bad; }
        if (nd.state === "missing" && opts.rootFound) { stroke = c.accent; fill = "rgba(206,50,98,0.14)"; }
        if (opts.fixed && (nd.state === "blocked" || nd.state === "missing")) { stroke = c.good; fill = "rgba(58,210,159,0.12)"; fg = c.good; }
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
        why: "Most goroutine leaks aren't a mystery once you can SEE the dependency graph - they're usually one missing edge.",
        draw(ctx, p, w, h, c, u) { drawGraph(ctx, c, u, w, { leakEdge: false, blocked: false, rootFound: false, pulseT: 0 }); },
      },
      {
        t: 2.1,
        title: "G4 is stuck forever",
        desc: "G4 is parked on <-results - and tracing the graph, NOTHING will ever send on that channel. It will wait until the process dies.",
        why: "A blocked goroutine isn't automatically a leak - other goroutines block briefly all the time. It's a leak specifically because nothing can ever wake it.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { leakEdge: true, blocked: true, rootFound: false, pulseT: p * 10 });
          u.badge(ctx, w / 2 - 70, 276 + 26, "⏸ blocked on <-results", c.bad, "#fff");
        },
      },
      {
        t: 4.2,
        title: "Read the goroutine dump",
        desc: "The raw evidence is one SIGQUIT away: the dump names every goroutine, its wait reason and HOW LONG it has waited. Minutes of [chan receive] on a millisecond workload is the smoking gun.",
        why: "Every Go binary already ships this tool. Reading the wait reason and duration is the fastest first move in any hang investigation - before profilers, before dashboards.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.12, y = 86, lw = w * 0.76;
          u.fillRR(ctx, x, y, lw, 178, 12, c.panel, c.line, 1.5);
          u.text(ctx, "kill -QUIT $(pidof ledger)   # or /debug/pprof/goroutine?debug=2", x + 18, y + 26, { color: c.dim, size: 11, mono: true });
          const lines = [
            ["goroutine 42 [chan receive, 5 minutes]:", c.bad],
            ["  main.(*Collector).run  collector.go:71", c.bad],
            ["goroutine 17 [select]:", c.text],
            ["  main.dispatch  dispatch.go:33", c.dim],
            ["goroutine 8 [IO wait]:", c.text],
            ["  net/http.(*conn).serve  server.go:2009", c.dim],
          ];
          const shown = Math.ceil(u.clamp(p * 1.7, 0, 1) * lines.length);
          lines.slice(0, shown).forEach((ln, i) => {
            u.text(ctx, ln[0], x + 18, y + 52 + i * 20, { color: ln[1], size: 11.5, mono: true });
          });
          if (shown >= 2) u.badge(ctx, x + lw - 190, y + 38, "waiting for 5 minutes ⚠", c.bad, "#fff");
        },
      },
      {
        t: 6.3,
        title: "The analyzer traces backward",
        desc: "Starting from the blocked goroutine, the analyzer walks the channel graph backward - G4 ← G3 - hunting for whoever was supposed to send.",
        why: "Walking the graph backward from the symptom is exactly how you'd debug this by hand - the analyzer just does it instantly and exhaustively.",
        draw(ctx, p, w, h, c, u) {
          const N = drawGraph(ctx, c, u, w, { leakEdge: true, blocked: true, rootFound: false, pulseT: p * 10 });
          const seg1 = u.clamp(p * 1.6, 0, 1), a = N("g4"), b = N("g3");
          u.dot(ctx, u.lerp(a.x, b.x, seg1), u.lerp(a.y - 18, b.y + 18, seg1), 6, c.warn, "rgba(245,177,76,.6)");
        },
      },
      {
        t: 8.4,
        title: "Root cause found",
        desc: "G2 dispatch is the actual problem: it never sends on results, and its context had no deadline to force it to give up and move on.",
        why: "Localizing to ONE goroutine and ONE missing send turns 'the program hangs sometimes' into a fix you can make in one line.",
        draw(ctx, p, w, h, c, u) {
          const N = drawGraph(ctx, c, u, w, { leakEdge: true, blocked: true, rootFound: true, pulseT: p * 10 });
          if (p < 0.35) { const g2 = N("g2"); u.ring(ctx, g2.x, g2.y, c.accent, u.clamp(p / 0.35, 0, 1), { from: 4, to: 40, lw: 2.2 }); }
          const a = u.clamp(p / 0.3, 0, 1);
          u.fillRR(ctx, w * 0.1, h * 0.78, w * 0.8, 70, 12, "rgba(206,50,98,0.08)", c.accent, 1.8);
          u.text(ctx, "ROOT CAUSE", w * 0.1 + 18, h * 0.78 + 22, { color: c.accent, size: 12, weight: 800, alpha: a });
          u.text(ctx, "G2 dispatch never sends on results ch - context had no deadline.", w * 0.1 + 18, h * 0.78 + 42, { color: c.text, size: 12.5, alpha: a });
          u.text(ctx, "fix: ctx, cancel := context.WithTimeout(...) ; defer cancel()", w * 0.1 + 18, h * 0.78 + 60, { color: c.good, size: 11.5, mono: true, alpha: a });
        },
      },
      {
        t: 10.5,
        title: "One-line fix: a deadline",
        desc: "With context.WithTimeout around G2's work, the send either happens or the deadline fires - either way G4 wakes up and the graph drains cleanly.",
        why: "Leaks aren't fixed by restarting goroutines - they're fixed by guaranteeing every wait has a second exit: a send, a close, or a deadline.",
        draw(ctx, p, w, h, c, u) {
          const N = drawGraph(ctx, c, u, w, { leakEdge: true, blocked: false, rootFound: false, fixed: true, pulseT: 0 });
          const a = N("g3"), b = N("g4"), seg = 0.5 + 0.5 * Math.sin(p * 9 - 1.5);
          u.dot(ctx, u.lerp(a.x, b.x, seg), u.lerp(a.y + 18, b.y - 18, seg), 6, c.good, "rgba(58,210,159,.6)");
          if (p > 0.3) u.badge(ctx, w / 2 - 52, 276 + 26, "✓ G4 drained", c.good, "#06121f");
          u.text(ctx, "ctx, cancel := context.WithTimeout(ctx, 2*time.Second)", w / 2, h * 0.9, { align: "center", color: c.good, size: 11.5, mono: true });
        },
      },
      {
        t: 12.6,
        title: "Guard the boundary in tests",
        desc: "Count goroutines when a test starts and when it ends. If the numbers differ after everything should have drained, fail the test - the leak never reaches production.",
        why: "Production forensics is the backup plan. The cheap win is refusing to merge code that leaks: a boundary check turns a silent leak into red CI.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.14, y = 96, lw = w * 0.72;
          u.fillRR(ctx, x, y, lw, 168, 12, c.panel, c.line, 1.5);
          u.text(ctx, "func TestCollector(t *testing.T) {", x + 18, y + 28, { color: c.text, size: 11.5, mono: true });
          u.text(ctx, "    defer verifyNoLeaks(t) // count before vs after", x + 18, y + 48, { color: c.accent, size: 11.5, mono: true });
          u.text(ctx, "    runPipeline(t)", x + 18, y + 68, { color: c.dim, size: 11.5, mono: true });
          u.text(ctx, "}", x + 18, y + 88, { color: c.text, size: 11.5, mono: true });
          const a = u.clamp((p - 0.25) / 0.3, 0, 1);
          u.text(ctx, "goroutines at start: 4", x + 18, y + 120, { color: c.text, size: 12, mono: true, alpha: a });
          u.text(ctx, "goroutines at end:   4 ✓", x + 18, y + 140, { color: c.good, size: 12, mono: true, alpha: a });
          if (p > 0.6) u.badge(ctx, x + lw - 150, y + 118, "PASS · no leaks", c.good, "#06121f");
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 14.8,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 14.8, "runtime/pprof · goroutine-leak analyzer"),
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
        why: "Comparing them on identical work isolates exactly what the vector hardware buys you - nothing about the task itself changes.",
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
        desc: "The plain loop touches a single array element each iteration - the pointer crawls along one cell at a time.",
        why: "This is the baseline: N elements means N cycles of work, no matter how simple each individual step is.",
        draw(ctx, p, w, h, c, u) {
          const N = 32, done = Math.floor(u.clamp(p, 0, 1) * N);
          u.text(ctx, "scalar - 1 element / cycle", 40, h * 0.3, { color: c.warn, size: 13, weight: 600 });
          const { gx, cell } = cellRow(ctx, c, u, w, h * 0.36, N, done, c.warn);
          if (done < N) { const px = gx + done * cell; u.line(ctx, px, h * 0.32, px, h * 0.36 + 32, c.warn, 2.2); }
          u.text(ctx, tr("cycles: ") + done, w - 40, h * 0.3, { align: "right", color: c.warn, size: 12.5, mono: true, weight: 700 });
        },
      },
      {
        t: 4.4,
        title: "SIMD: sixteen elements per cycle",
        desc: "One vector instruction loads and processes a whole 16-element lane at once - the same array, far fewer trips through the loop.",
        why: "The CPU has dedicated wide registers and circuits for this - it's not 'doing 16 things fast', it's doing them in the SAME instruction.",
        draw(ctx, p, w, h, c, u) {
          const N = 32, done = Math.floor(u.clamp(p, 0, 1) * N);
          u.text(ctx, "SIMD - 16 elements / cycle", 40, h * 0.3, { color: c.go, size: 13, weight: 700 });
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
        desc: "Both loops produce the identical output - only the number of cycles spent getting there differs.",
        why: "This is why hot numeric loops (hashing, checksums, image/byte processing) are worth vectorizing: the speedup is structural, not a micro-optimization.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.3, 0, 1);
          const rows = [["scalar loop", "32 cycles", c.warn], ["SIMD loop", "2 cycles", c.go]];
          rows.forEach((r, i) => {
            const ra = u.clamp((p - i * 0.2) / 0.3, 0, 1);
            if (ra <= 0) return;
            const y = h * 0.36 + i * 56;
            if (i === 1 && ra > 0 && ra < 0.6) u.ring(ctx, w * 0.8 - 60, y + 21, c.go, ra / 0.6, { from: 4, to: 26, lw: 1.8 });
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
        why: "Spans are physically contiguous in memory - exactly the layout that lets a sweep be both vectorizable AND cache-friendly, the same idea as the SIMD loop above.",
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
        why: "This connects directly back to M10: contiguous memory is what makes both a SIMD loop AND a GC sweep fast - the hardware always rewards sequential access.",
        draw(ctx, p, w, h, c, u) {
          const a = u.clamp(p / 0.4, 0, 1);
          if (p < 0.3) u.burst(ctx, w / 2, h * 0.42 - 8, c.good, u.easeOut(u.clamp(p / 0.3, 0, 1)), 10);
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
      const lbw = Math.min(230, Math.max(150, w - 96));
      const lbx = w / 2 - lbw / 2, lby = h0;
      u.fillRR(ctx, lbx, lby, lbw, 38, 10, "rgba(0,173,216,0.12)", c.go, 1.8);
      u.text(ctx, "load balancer", lbx + lbw / 2, lby + 24, { align: "center", color: c.go, size: 12.5, minSize: 10, weight: 700, maxWidth: lbw - 18 });
      return { lbx, lby, lbw };
    }
    const h0 = 84;
    function pods(ctx, c, u, w, states, traffic, animT) {
      const { lbx, lby, lbw } = lb(ctx, c, u, w);
      const slotY = h0 + 112, podW = Math.min(120, (w - 80) / 4 - 14), gap = (w - 80 - podW * states.length) / Math.max(1, states.length - 1);
      const col = colors(c);
      states.forEach((st, i) => {
        const x = 40 + i * (podW + gap), pc = col[st.status] || c.line, isReady = st.status === "ready";
        if (st.status === "empty") { u.fillRR(ctx, x, slotY, podW, 64, 12, "transparent", c.line, 1.2); u.text(ctx, "-", x + podW / 2, slotY + 38, { align: "center", color: c.dim, size: 16 }); }
        else {
          u.fillRR(ctx, x, slotY, podW, 64, 12, "rgba(255,255,255,0.02)", pc, isReady ? 2.2 : 1.6);
          u.text(ctx, tr("pod ") + st.ver, x + podW / 2, slotY + 26, { align: "center", color: c.text, size: 13, weight: 700, mono: true });
          const pillTxt = st.status === "ready" ? "● Ready" : st.status === "starting" ? "◌ Starting" : "◍ Draining";
          u.text(ctx, pillTxt, x + podW / 2, slotY + 46, { align: "center", color: pc, size: 11, minSize: 9, weight: 600, maxWidth: podW - 10 });
        }
        if (traffic) {
          const fromX = lbx + lbw / 2, fromY = lby + 38, toX = x + podW / 2, toY = slotY;
          if (isReady) {
            u.flow(ctx, fromX, fromY, toX, toY, "rgba(58,210,159,0.4)", 1.6, animT);
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
        why: "A rollout always starts from a known-good baseline - that's what makes it safe to compare against as the upgrade proceeds.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }], true, p * 10);
        },
      },
      {
        t: 2.4,
        title: "A new v2 pod starts - but gets no traffic yet",
        desc: "A 4th pod boots running v2. Its readiness probe hasn't passed, so the load balancer deliberately routes it nothing.",
        why: "Sending live traffic to a pod that isn't ready (still loading config, warming caches) would mean real users hitting errors.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "starting" }], true, p * 10);
          const blink = Math.sin(p * 16) > 0;
          u.text(ctx, blink ? "probe ✗" : "probe …", w - 90, h0 + 112 + 80, { align: "center", color: c.warn, size: 11, mono: true });
        },
      },
      {
        t: 4.6,
        title: "Readiness probe passes → pod joins rotation",
        desc: "Once the probe succeeds, the load balancer adds the v2 pod to rotation immediately - it starts receiving its share of traffic.",
        why: "This is the gate that makes rollouts safe: 'started' and 'ready to serve' are different states, and only the second one earns traffic.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
          if (p > 0.3) {
            u.text(ctx, "probe ✓", w - 90, h0 + 112 + 80, { align: "center", color: c.good, size: 11, mono: true, weight: 600 });
            if (p < 0.6) u.ring(ctx, w - 90, h0 + 112 + 32, c.good, u.clamp((p - 0.3) / 0.3, 0, 1), { from: 4, to: 30, lw: 2 });
          }
        },
      },
      {
        t: 6.6,
        title: "An old v1 pod drains",
        desc: "Now that v2 is carrying load, one v1 pod stops receiving NEW requests but keeps running until its in-flight requests finish.",
        why: "Draining (not killing) is what guarantees zero dropped requests - a request that's already in progress always gets to complete.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v1", status: "draining" }, { ver: "v1", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
          u.text(ctx, "finishing in-flight requests…", 40 + 60, h0 + 112 + 80, { align: "center", color: c.accent, size: 11, minSize: 8.5, mono: true, maxWidth: 150 });
        },
      },
      {
        t: 8.6,
        title: "The slot comes back as v2",
        desc: "Once drained, the old pod terminates and a fresh v2 pod boots in its place - going through the same starting → ready sequence.",
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
        why: "Zero dropped requests, throughout an entire version upgrade, with no maintenance window - that's the payoff of doing it incrementally.",
        draw(ctx, p, w, h, c, u) {
          pods(ctx, c, u, w, [{ ver: "v2", status: "ready" }, { ver: "v2", status: "ready" }, { ver: "v1", status: "ready" }, { ver: "v2", status: "ready" }], true, p * 10);
          const pct = Math.round(u.clamp(p / 0.6, 0, 1) * 100);
          u.text(ctx, tr("rollout ") + Math.min(100, 75 + pct / 4) + "%", w - 60, h0 + 112 + 100, { align: "right", color: c.go, size: 13, weight: 700, mono: true, maxWidth: 180 });
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
        why: "On-chip caches are small because fast memory is expensive to build - so the CPU keeps only the hottest data there and falls back to slower, bigger memory for the rest.",
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
        why: "Each cache only stores a recent subset of memory - checking the small, fast one first is cheap insurance before paying for a slower lookup.",
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
        desc: "RAM never hands back a single value - it returns the full 64-byte block containing it, and that block fills L3, then L2, then L1 on the way back up.",
        why: "Fetching one extra value is almost free once the bus is already moving data, so hardware always moves in line-sized chunks - betting that nearby bytes will be used soon too.",
        draw(ctx, p, w, h, c, u) {
          const ascendP = u.seg(p, 0.05, 0.85, u.easeInOut);
          const filled = [ascendP >= 1, ascendP >= 2 / 3, ascendP >= 1 / 3];
          drawLevels(ctx, c, u, w, filled);
          const dotY = u.lerp(rowY(3), rowY(0), ascendP);
          u.dot(ctx, leftX + 26, dotY, 7, c.good, "rgba(58,210,159,0.4)");
          if (ascendP >= 1 && p < 0.95) u.ring(ctx, leftX + maxW0(w) * 0.94 + 46, rowY(3) + rowH / 2, c.good, u.clamp((p - 0.85) / 0.1, 0, 1), { from: 4, to: 26, lw: 2 });
          u.badge(ctx, leftX + maxW0(w) * 0.94 + 16, rowY(3) + rowH / 2 - 10, "HIT ✓", c.good, "#06101f");
          u.text(ctx, "↑ the 64-byte line travels back up, filling each cache as it passes", leftX, rowY(0) - 18, { color: c.good, size: 12, weight: 600, alpha: u.clamp(ascendP * 2, 0, 1) });
        },
      },
      {
        t: 7.6,
        title: "The next 7 reads are now nearly free",
        desc: "Those values were strangers a moment ago; now they live in L1 with the one we asked for. Reading them costs ~1 ns each instead of ~100 ns.",
        why: "This is why sequential, contiguous access (slices) is so much faster than scattered access (linked lists, pointer-chasing) - it cashes in on a line you already paid to fetch.",
        draw(ctx, p, w, h, c, u) {
          const fx = leftX, fy = h * 0.32;
          u.text(ctx, "the 64-byte line, now resident in L1:", fx, fy, { color: c.text, size: 13.5, weight: 600 });
          const cells = 8, cw = Math.min(64, (w - fx * 2 - 7 * 10) / cells), ch2 = 46;
          const filledN = Math.floor(u.clamp(p / 0.7, 0, 1) * cells);
          for (let i = 0; i < cells; i++) {
            const x = fx + i * (cw + 10), y = fy + 22, on = i < filledN, isFirst = i === 0, justArrived = on && i === filledN - 1;
            if (justArrived) u.glowPulse(ctx, x + cw / 2, y + ch2 / 2, ch2 * 0.5, isFirst ? "rgba(206,50,98,.5)" : "rgba(0,173,216,.5)", u.t || 0);
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
            u.text(ctx, "next 7 · ~1 ns each (L1) - ~100× faster", fx + Math.max(6, barMaxW * 0.01) + 10, barY + 34 + 15, { color: c.go, size: 11.5, weight: 600, mono: true });
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
        why: "Splitting the work into small fixed stages is what lets the next instruction start before this one finishes - that's the whole trick of pipelining.",
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
        desc: "While I1 moves to Decode, I2 enters Fetch right behind it - they're in different stages of the SAME pipe at the same time.",
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
        desc: "Once the pipe is full, a NEW instruction finishes Write-back almost every cycle - even though any single one still takes 5 cycles start to finish.",
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
          u.text(ctx, retiring ? "✓ retiring this cycle" : "pipe full - overlapping instructions", x0, trackTop - 26, { color: retiring ? c.good : c.dim, size: 13, weight: 600 });
        },
      },
      {
        t: 7.2,
        title: "A branch enters the pipe",
        desc: "I5 is a conditional branch (an `if`). Its true outcome - which way execution should go next - isn't known until it reaches Execute.",
        why: "But Fetch can't just sit idle waiting 2 stages for that answer - every idle stage is wasted throughput.",
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
        desc: "A branch predictor guesses the outcome (e.g. 'taken', based on history) and the pipeline fetches the NEXT instructions down that guessed path - before the branch is actually resolved.",
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
        desc: "I5 resolves in Execute - and it went the OTHER way. Everything fetched on the guessed path (I6, I7) was working on instructions that should never have run.",
        why: "Correctness comes first: the CPU cannot let wrong-path work touch real registers or memory, so it must be found and discarded immediately.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          if (p < 0.3) { const sw = slotW(w); u.burst(ctx, x0 + 2 * (sw + gap) + sw / 2, trackTop + slotH / 2, c.bad, u.easeOut(u.clamp(p / 0.3, 0, 1)), 9); }
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
        desc: "The wrong-path instructions are flushed out, Fetch restarts at the CORRECT target address, and the pipeline gradually fills back up - a short bubble of idle stages, then back to full speed.",
        why: "The cost of a misprediction is only this refill delay (~15–20 cycles on real hardware) - far cheaper than stalling on every single branch and never speculating at all.",
        draw(ctx, p, w, h, c, u) {
          drawTrack(ctx, c, u, w, trackTop);
          const pos = u.clamp(p, 0, 1) * 4.8;
          chip(ctx, c, u, w, trackTop, pos, "I6′", "rgba(58,210,159,0.30)", c.good, c.text);
          if (pos > 1) chip(ctx, c, u, w, trackTop, pos - 1, "I7′", "rgba(58,210,159,0.30)", c.good, c.text);
          if (pos >= 1 && p < 0.65) u.burst(ctx, x0, trackTop - 34, c.good, u.easeOut(u.clamp((p - 0.55) / 0.1, 0, 1)), 7);
          u.text(ctx, pos < 1 ? "bubble - refetching the correct path" : "back to full speed", x0, trackTop - 26, { color: pos < 1 ? c.warn : c.good, size: 13, weight: 600 });
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
        desc: "G is a goroutine - a tiny, cheap unit of work (~2 KB stack). M is an OS thread - the thing the kernel actually runs. P is a processor - a scheduling slot with its own queue; the number of Ps equals GOMAXPROCS.",
        why: "Separating 'work' (G) from 'who runs it' (M) from 'how many run at once' (P) is what lets Go run a million goroutines on a handful of threads.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, gy = h * 0.30, py = h * 0.5, my = h * 0.7;
          const a1 = u.clamp(p / 0.3, 0, 1), a2 = u.clamp((p - 0.3) / 0.3, 0, 1), a3 = u.clamp((p - 0.6) / 0.3, 0, 1);
          ctx.globalAlpha = a1; gChip(ctx, c, u, cx0 - 11, gy - 11); u.text(ctx, "G - goroutine: cheap work to run", cx0, gy + 30, { align: "center", color: c.purple, size: 12.5 }); ctx.globalAlpha = 1;
          ctx.globalAlpha = a2; pBox(ctx, c, u, cx0 - 50, py - 20, "P"); u.text(ctx, "P - processor: a queue + the right to run Go code", cx0, py + 36, { align: "center", color: c.go, size: 12.5 }); ctx.globalAlpha = 1;
          ctx.globalAlpha = a3; mBox(ctx, c, u, cx0 - 55, my - 18, "M"); u.text(ctx, "M - OS thread: what the kernel actually schedules", cx0, my + 34, { align: "center", color: c.good, size: 12.5 }); ctx.globalAlpha = 1;
        },
      },
      {
        t: 2.6,
        title: "Each P drains its own queue - no shared lock",
        desc: "A P pulls goroutines one at a time from its OWN local queue and hands each to its M to run. Other Ps never need to touch this queue.",
        why: "A private queue per P means most scheduling needs zero synchronization with other Ps - that's what keeps the hot path fast.",
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
        why: "No central scheduler decides this - each idle P independently grabs work from a busy neighbor, so load balances itself without a bottleneck.",
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
          if (p < 0.45) u.text(ctx, "P2 is empty - P1 still has work", w / 2, 168, { align: "center", color: c.warn, size: 13, weight: 600 });
          else {
            u.text(ctx, "stealing half of P1's queue →", w / 2, 168, { align: "center", color: c.purple, size: 13, weight: 600 });
            u.flow(ctx, x1 + 40, 82, x2 - 40, 82, "rgba(169,139,255,.55)", 2, u.t || 0);
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
        why: "If P3 stayed attached to the blocked M3, every OTHER goroutine queued on P3 would starve until the syscall returns - possibly milliseconds of wasted parallelism.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          pBox(ctx, c, u, cx0 - 50, 110, "P3");
          queueRow(ctx, c, u, cx0, 70, 4, 8);
          u.text(ctx, "4 queued - going nowhere while M3 is stuck", cx0, 100, { align: "center", color: c.dim, size: 11.5 });
          const blockedP = u.clamp(p / 0.5, 0, 1);
          const fill = blockedP > 0 ? "rgba(255,107,107,0.18)" : "rgba(58,210,159,0.14)";
          const stroke = blockedP > 0 ? c.bad : c.good;
          mBox(ctx, c, u, cx0 - 55, 190, blockedP > 0 ? "M3 - blocked in syscall" : "M3", fill, stroke);
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
          mBox(ctx, c, u, cx0 - 175, 190, "M3 - still blocked", "rgba(255,107,107,0.14)", c.bad);
          if (moveP > 0.5) {
            const a = u.clamp((moveP - 0.5) * 2, 0, 1);
            ctx.globalAlpha = a; mBox(ctx, c, u, px - 55, 190, "M4 (fresh)", "rgba(169,139,255,0.18)", c.purple); ctx.globalAlpha = 1;
            u.line(ctx, px, 150, px, 190, c.line, 1.4, [3, 4]);
            const drained = Math.min(4, Math.floor(a * 5));
            queueRow(ctx, c, u, px, 70, 4 - drained, 8);
            if (a > 0.6) {
              u.text(ctx, "P3's goroutines resume on M4", px, 240, { align: "center", color: c.good, size: 13, weight: 600 });
              if (a < 0.85) u.burst(ctx, px, 190, c.good, u.easeOut(u.clamp((a - 0.6) / 0.25, 0, 1)), 8);
            }
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
        desc: "Two goroutines run `n++` on the same variable with no coordination at all. Both read the old value, both compute +1, both write - one update is silently lost.",
        why: "This isn't just 'sometimes wrong' - the Go memory model calls it undefined behavior, because the compiler and CPU are free to reorder these operations however they like.",
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
          if (pp > 0.4) u.text(ctx, "both read n, both compute n+1, both write - one increment vanishes", cx0, h * 0.85, { align: "center", color: c.bad, size: 13, weight: 600, alpha: u.clamp((pp - 0.4) / 0.4, 0, 1) });
        },
      },
      {
        t: 2.6,
        title: "Atomic: a lock-free compare-and-swap",
        desc: "A goroutine reads the current value, computes the new one, then asks the CPU to swap it in 'only if nobody changed it since I read it.' If it lost the race, it just retries.",
        why: "No goroutine ever blocks or sleeps - the whole update is one indivisible CPU instruction. It's the cheapest tool, but it only protects a single word.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, valY = h * 0.32;
          u.fillRR(ctx, cx0 - 40, valY - 22, 80, 44, 10, "rgba(0,173,216,0.18)", c.go, 2);
          u.text(ctx, "n", cx0, valY + 7, { align: "center", color: c.go, size: 18, weight: 700, mono: true });
          const cyc = p % 0.5, half = 0.35;
          const gx = cyc < half ? u.lerp(cx0 + 170, cx0 + 60, cyc / half) : cx0 + 60;
          if (cyc >= half) u.ring(ctx, gx, valY, c.good, (cyc - half) / (0.5 - half), { from: 4, to: 26, lw: 1.8 });
          u.dot(ctx, gx, valY, 8, cyc >= half ? c.good : c.warn, "rgba(0,173,216,0.3)");
          u.text(ctx, cyc >= half ? "CAS ✓ - swapped in" : "compute n+1…", gx, valY - 26, { align: "center", color: cyc >= half ? c.good : c.warn, size: 12, weight: 700 });
          u.text(ctx, "atomic.Int64 - every update is one CPU instruction, never a wait", cx0, h * 0.7, { align: "center", color: c.dim, size: 12.5 });
        },
      },
      {
        t: 5.2,
        title: "Mutex: one goroutine in the critical section at a time",
        desc: "A goroutine must acquire the lock before touching shared state, and release it when done. Anyone else who wants in simply waits their turn.",
        why: "Use this when an INVARIANT spans more than one field (e.g. a balance and a log entry that must change together) - something a single atomic can never guarantee.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2, lockY = h * 0.34;
          u.fillRR(ctx, cx0 - 36, lockY - 20, 72, 40, 10, "rgba(245,177,76,0.18)", c.warn, 2);
          u.text(ctx, "LOCK", cx0, lockY + 6, { align: "center", color: c.warn, size: 13, weight: 700 });
          const slot = Math.floor((p % 1) / (1 / 3));
          const labels = ["A", "B", "C"];
          for (let k = 0; k < 3; k++) {
            const inside = k === slot;
            const qx = inside ? cx0 : cx0 + 130 + ((k - slot + 3) % 3) * 46;
            if (inside) u.glowPulse(ctx, qx, lockY + 80, 14, "rgba(245,177,76,.45)", u.t || 0);
            u.dot(ctx, qx, lockY + 80, 9, inside ? c.warn : c.dim, inside ? "rgba(245,177,76,0.4)" : null);
            u.text(ctx, labels[k], qx, lockY + 60, { align: "center", color: inside ? c.warn : c.dim, size: 11 });
          }
          u.text(ctx, "waiting goroutines queue up; only the lock holder touches shared state", cx0, h * 0.78, { align: "center", color: c.dim, size: 12.5 });
        },
      },
      {
        t: 7.8,
        title: "Channel: ownership moves with the value",
        desc: "Instead of two goroutines sharing one variable, the producer sends the value down a channel - the consumer is now the only one who can touch it.",
        why: "'Don't communicate by sharing memory; share memory by communicating.' There's no shared state left to race on, because only one goroutine ever owns the value at a time.",
        draw(ctx, p, w, h, c, u) {
          const py = h * 0.34, prodX = w * 0.22, consX = w * 0.78;
          u.fillRR(ctx, prodX - 50, py - 20, 100, 40, 10, c.panel, c.purple, 1.8);
          u.text(ctx, "producer", prodX, py + 6, { align: "center", color: c.text, size: 12.5 });
          u.fillRR(ctx, consX - 50, py - 20, 100, 40, 10, c.panel, c.purple, 1.8);
          u.text(ctx, "consumer", consX, py + 6, { align: "center", color: c.text, size: 12.5 });
          u.flow(ctx, prodX + 50, py, consX - 50, py, "rgba(169,139,255,.45)", 1.8, u.t || 0);
          const cyc = p % 0.9, frac = u.clamp(cyc / 0.65, 0, 1);
          u.dot(ctx, u.lerp(prodX + 56, consX - 56, frac), py, 8, c.purple, "rgba(169,139,255,0.4)");
          u.text(ctx, frac < 1 ? "value (and ownership) in transit →" : "consumer now owns it exclusively", w / 2, py + 60, { align: "center", color: c.purple, size: 12.5, weight: 600 });
        },
      },
      {
        t: 10.0,
        title: "Pick by the shape of the problem",
        desc: "All three are race-free - the right choice depends on what you're protecting, not on habit.",
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
        desc: "A request enters Service A, which calls Service B, which calls Service C - a normal cross-service call chain.",
        why: "Once a request crosses service boundaries, no single process can see the whole picture anymore - that's the gap observability exists to close.",
        draw(ctx, p, w, h, c, u) {
          const { ax, bx, cx2, svcY, svcH } = services(ctx, c, u, w, h * 0.18);
          const legs = [[0, 0.34, ax, bx], [0.34, 0.66, bx, cx2], [0.66, 1, cx2, bx]];
          let x = ax;
          legs.forEach(([a, b, x1, x2]) => { if (p >= a) x = p < b ? u.lerp(x1, x2, u.seg(p, a, b)) : x2; });
          u.glowPulse(ctx, x, svcY + svcH / 2, 12, "rgba(206,50,98,.5)", u.t || 0);
          u.dot(ctx, x, svcY + svcH / 2, 7, c.accent, "rgba(206,50,98,0.4)");
        },
      },
      {
        t: 2.4,
        title: "Each hop opens a child span",
        desc: "Service A's span covers the whole request. When it calls B, B opens its OWN span nested inside A's. The nesting mirrors the call stack across services.",
        why: "A trace is just this tree of spans - it's how you see exactly which hop the time went to, instead of one opaque total latency number.",
        draw(ctx, p, w, h, c, u) {
          const gx0 = w * 0.14, gy0 = h * 0.28, barH = 28, barGap = 18, scale = (w * 0.72) / 3;
          const spans = [
            { label: "Service A - root span", row: 0, color: c.go, len: 1 },
            { label: "Service B - child span", row: 1, color: c.purple, len: 0.62 },
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
        desc: "Every request bumps a counter and records its duration in a histogram - tiny, constant-cost numbers no matter how much traffic flows through.",
        why: "Metrics are cheap enough to keep forever and alert on continuously - they're the first signal that something is wrong, even before anyone looks at a trace.",
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
        desc: "Each service emits a key/value log line for what it actually did - not a sentence to parse, but searchable fields.",
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
        desc: "The same trace_id is stamped on the span, the log lines, and (as a label) the metric for this request - so you can jump from a metric alert, to the slow trace, to the exact log line that explains it.",
        why: "Without a shared ID, the three pillars are three disconnected views. With it, they become one investigation: alert → trace → root cause.",
        draw(ctx, p, w, h, c, u) {
          const cx0 = w / 2;
          if (p < 0.25) u.burst(ctx, cx0, h * 0.18 + 10, c.accent, u.easeOut(u.clamp(p / 0.25, 0, 1)), 9);
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
        why: "Most of the time the dependency is healthy, so the breaker should add zero overhead - just watch, don't interfere.",
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
        desc: "The downstream service starts erroring. Each failed call still goes all the way out and back - the breaker just increments its counter.",
        why: "The breaker needs real evidence the dependency is unhealthy (not one blip) before it changes behavior - that's what the threshold is for.",
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
        desc: "The breaker trips OPEN. Calls now fail INSTANTLY at the breaker itself - they never even reach the struggling service.",
        why: "Waiting on a timeout from a service you already know is down just wastes time and adds more load to it. Failing fast is strictly better once you're sure it's unhealthy.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, breakerX, callY } = scene(ctx, c, u, w, h);
          const cyc = p % 0.4, half = 0.18;
          const x = cyc < half ? u.lerp(clientX, breakerX, cyc / half) : u.lerp(breakerX, clientX, (cyc - half) / half);
          call(ctx, u, x, callY, c.bad, false);
          if (p < 0.2) u.burst(ctx, breakerX, callY, c.bad, u.easeOut(u.clamp(p / 0.2, 0, 1)), 10);
          u.text(ctx, "OPEN - bounced at the breaker", breakerX, h * 0.5, { align: "center", color: c.bad, size: 14, weight: 700 });
        },
      },
      {
        t: 7.6,
        title: "Cooldown: giving the dependency room to breathe",
        desc: "For a fixed window, every call keeps failing fast - no traffic reaches the service at all.",
        why: "A struggling service often just needs time (to restart, drain a queue, recover from a spike) - sending it zero traffic for a bit is what lets it actually recover.",
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
        desc: "Once the cooldown ends, the breaker allows a single real call through to test the water - everything else still waits.",
        why: "This answers 'has it recovered?' with minimal risk: if the service is still down, only one call pays the price, not a full flood.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, breakerX, serviceX, callY } = scene(ctx, c, u, w, h);
          const half = 0.5;
          const x = p < half ? u.lerp(clientX, serviceX, p / half) : u.lerp(serviceX, clientX, (p - half) / half);
          call(ctx, u, x, callY, c.warn, false);
          u.text(ctx, "HALF-OPEN - one probe call", breakerX, h * 0.5, { align: "center", color: c.warn, size: 14, weight: 700 });
        },
      },
      {
        t: 11.4,
        title: "Probe succeeds → back to Closed",
        desc: "The probe comes back healthy, so the breaker closes again and lets traffic flow normally. (Had it failed, the breaker would re-open and wait another cooldown.)",
        why: "This Closed → Open → Half-Open → Closed cycle is the whole pattern: protect the dependency when it's down, and self-heal automatically once it recovers - no human required.",
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
          if (a >= 1 && p < 0.85) u.ring(ctx, nodes[0].x, nodes[0].y, c.good, u.clamp((p - 0.6) / 0.25, 0, 1), { from: 6, to: 44, lw: 2.2 });
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

  /* =================================================================== */
  /* F1 (extra). GOROUTINES - go SPAWNS CHEAP CONCURRENT WORK            */
  /* =================================================================== */
  ANIM["goroutine-spawn"] = (canvas) => {
    const N = 6;
    const grid = (w, h) => {
      const cols = 3, gw = 76, gh = 46, gapX = 34, gapY = 26;
      const totalW = cols * gw + (cols - 1) * gapX;
      return { cols, gw, gh, gapX, gapY, x0: (w - totalW) / 2, y0: h * 0.47 };
    };
    const cellPos = (g, w, h) => {
      const G = grid(w, h), r = Math.floor(g / G.cols), cc = g % G.cols;
      return { x: G.x0 + cc * (G.gw + G.gapX), y: G.y0 + r * (G.gh + G.gapY), gw: G.gw, gh: G.gh };
    };
    function mainBox(ctx, c, u, w, h, label, active) {
      const mw = 170, mh = 44, mx = w / 2 - mw / 2, my = h * 0.21;
      u.fillRR(ctx, mx, my, mw, mh, 10, active ? "rgba(0,173,216,0.16)" : c.panel, c.go, active ? 2.2 : 1.5);
      u.text(ctx, label, mx + mw / 2, my + 27, { align: "center", color: c.go, size: 12.5, weight: 700, mono: true });
      return { mx, my, mw, mh };
    }
    function wgBadge(ctx, c, u, w, h, remaining) {
      const bx = w - 140, by = h * 0.21;
      u.fillRR(ctx, bx, by, 116, 44, 10, c.panel, remaining > 0 ? c.warn : c.good, 1.8);
      u.text(ctx, "WaitGroup", bx + 58, by + 17, { align: "center", color: c.dim, size: 10 });
      u.text(ctx, tr("wg: ") + remaining, bx + 58, by + 35, { align: "center", color: remaining > 0 ? c.warn : c.good, size: 14, weight: 700, mono: true });
    }
    function cell(ctx, c, u, g, w, h, state, scale) {
      const pc = cellPos(g, w, h), cx = pc.x + pc.gw / 2, cy = pc.y + pc.gh / 2;
      let fill = c.panel, stroke = c.line, fg = c.dim, sub = "";
      if (state === "running") { fill = "rgba(169,139,255,0.18)"; stroke = c.purple; fg = c.text; sub = "run…"; u.glowPulse(ctx, cx, cy, pc.gh * 0.62, "rgba(169,139,255,.35)", (u.t || 0) + g * 0.7); }
      if (state === "done") { fill = "rgba(58,210,159,0.18)"; stroke = c.good; fg = c.good; sub = "done ✓"; }
      const s = scale == null ? 1 : scale;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
      u.fillRR(ctx, pc.x, pc.y, pc.gw, pc.gh, 9, fill, stroke, 1.8);
      u.text(ctx, "G" + (g + 1), cx, cy - 2, { align: "center", color: fg, size: 12, weight: 700, mono: true });
      if (sub) u.text(ctx, sub, cx, cy + 14, { align: "center", color: fg, size: 9.5, mono: true });
      ctx.restore();
      return { cx, cy };
    }

    const STEPS = [
      {
        t: 0,
        title: "Every program starts as one goroutine",
        desc: "A Go program begins with a single goroutine running main(). Nothing is concurrent yet.",
        why: "A goroutine is NOT an OS thread - it's a lightweight task (~2 KB stack) the Go runtime multiplexes onto a small pool of real threads.",
        draw(ctx, p, w, h, c, u) {
          mainBox(ctx, c, u, w, h, "main goroutine", true);
          u.text(ctx, "func main() { … }", w / 2, h * 0.5, { align: "center", color: c.dim, size: 14, mono: true, alpha: u.clamp(p / 0.4, 0, 1) });
        },
      },
      {
        t: 2.0,
        title: "go func() launches goroutines - almost free",
        desc: "Each `go f()` starts a new goroutine that runs independently. Here main spawns six of them in a loop.",
        why: "Spawning costs a few KB and no syscall, so a server can keep hundreds of thousands of goroutines alive at once - unthinkable with OS threads.",
        draw(ctx, p, w, h, c, u) {
          const M = mainBox(ctx, c, u, w, h, "main goroutine", true);
          const shown = u.clamp(p, 0, 1);
          wgBadge(ctx, c, u, w, h, Math.min(N, Math.floor(shown * (N + 0.6))));
          u.text(ctx, "for i := 0; i < 6; i++ { go work(i) }", w / 2, h * 0.37, { align: "center", color: c.purple, size: 12.5, mono: true, weight: 600 });
          for (let g = 0; g < N; g++) {
            const a = u.clamp((p - g * 0.12) / 0.28, 0, 1);
            if (a <= 0) continue;
            const pc = cellPos(g, w, h);
            u.line(ctx, w / 2, M.my + 44, pc.x + pc.gw / 2, pc.y, c.line, 1.2, [3, 4]);
            cell(ctx, c, u, g, w, h, "running", u.pop(a));
          }
        },
      },
      {
        t: 4.2,
        title: "They all run concurrently",
        desc: "The six goroutines execute at the same time, interleaved across a handful of OS threads by the scheduler.",
        why: "You do NOT control the order they run in - assuming an order is the single most common concurrency bug in Go.",
        draw(ctx, p, w, h, c, u) {
          mainBox(ctx, c, u, w, h, "main goroutine", true);
          wgBadge(ctx, c, u, w, h, N);
          for (let g = 0; g < N; g++) cell(ctx, c, u, g, w, h, "running", 1);
          u.text(ctx, "order is not guaranteed", w / 2, h * 0.9, { align: "center", color: c.dim, size: 12.5, alpha: u.clamp(p / 0.4, 0, 1) });
        },
      },
      {
        t: 6.4,
        title: "wg.Wait() blocks main until each Done()",
        desc: "main parks on wg.Wait(). As every goroutine finishes it calls wg.Done(), dropping the counter one by one.",
        why: "Without a WaitGroup (or a channel) main could return early - and when main returns, the whole program exits, killing the other goroutines mid-work.",
        draw(ctx, p, w, h, c, u) {
          mainBox(ctx, c, u, w, h, "main ⏸ wg.Wait()", false);
          const prog = u.clamp(p, 0, 1) * (N + 0.5), done = Math.min(N, Math.floor(prog));
          wgBadge(ctx, c, u, w, h, N - done);
          for (let g = 0; g < N; g++) {
            const st = g < done ? "done" : "running";
            const pos = cell(ctx, c, u, g, w, h, st, 1);
            if (g === done - 1) u.ring(ctx, pos.cx, pos.cy, c.good, u.clamp(prog - done, 0, 1), { from: 6, to: 30, lw: 1.8 });
          }
        },
      },
      {
        t: 8.8,
        title: "All done → main resumes",
        desc: "The counter hits zero, wg.Wait() returns, and main continues past it - now guaranteed every goroutine has finished.",
        why: "WaitGroup is the simplest way to fan out a fixed set of goroutines and join back safely; for streaming results you'd reach for a channel instead.",
        draw(ctx, p, w, h, c, u) {
          const M = mainBox(ctx, c, u, w, h, "main resumes ✓", true);
          wgBadge(ctx, c, u, w, h, 0);
          for (let g = 0; g < N; g++) cell(ctx, c, u, g, w, h, "done", 1);
          if (p < 0.5) u.burst(ctx, M.mx + M.mw / 2, M.my + 22, c.good, u.easeOut(u.clamp(p / 0.5, 0, 1)), 12);
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.8,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.8, "goroutines · go spawns cheap concurrent work"),
    });
  };

  /* =================================================================== */
  /* F1 (extra). CHANNELS - HANDSHAKE, BUFFERING & SELECT                */
  /* =================================================================== */
  ANIM["channel-flow"] = (canvas) => {
    function actor(ctx, c, u, x, y, label, color, active) {
      u.fillRR(ctx, x - 58, y - 22, 116, 44, 10, active ? "rgba(0,173,216,0.12)" : c.panel, color, active ? 2.2 : 1.5);
      u.text(ctx, label, x, y + 4, { align: "center", color: color, size: 12.5, weight: 700, mono: true });
    }
    function slots(ctx, c, u, w, y, cap, filled) {
      const sw = 46, gap = 8, totalW = cap * sw + (cap - 1) * gap, sx = (w - totalW) / 2;
      for (let k = 0; k < cap; k++) {
        const x = sx + k * (sw + gap), on = k < filled;
        u.fillRR(ctx, x, y, sw, 38, 7, on ? "rgba(0,173,216,0.22)" : c.panel, on ? c.go : c.line, on ? 2 : 1.4);
        if (on) u.text(ctx, "v", x + sw / 2, y + 24, { align: "center", color: c.goSoft, size: 13, weight: 700, mono: true });
      }
      return { sx, sw, gap, totalW };
    }

    const STEPS = [
      {
        t: 0,
        title: "Unbuffered channel: the sender waits",
        desc: "A goroutine runs `ch <- v` on an unbuffered channel. With no one receiving yet, the send simply blocks.",
        why: "An unbuffered channel has zero storage - a send can't complete until another goroutine is ready to receive. Blocking IS the synchronization.",
        draw(ctx, p, w, h, c, u) {
          const sx = w * 0.17, rx = w * 0.83, my = h * 0.42;
          actor(ctx, c, u, sx, my, "sender", c.go, true);
          actor(ctx, c, u, rx, my, "receiver", c.dim, false);
          u.text(ctx, "ch  (unbuffered)", w / 2, my - 44, { align: "center", color: c.dim, size: 12 });
          u.line(ctx, sx + 58, my, rx - 58, my, c.line, 1.6, [4, 5]);
          const jitter = 20 * (0.5 + 0.5 * Math.sin((u.t || 0) * 6));
          u.dot(ctx, sx + 58 + jitter, my, 7, c.warn, "rgba(245,177,76,.4)");
          u.text(ctx, "ch <- v", sx, my - 40, { align: "center", color: c.go, size: 11, mono: true });
          u.text(ctx, "⏸ send blocks - no receiver yet", w / 2, my + 58, { align: "center", color: c.warn, size: 13, weight: 700, alpha: u.clamp(p / 0.3, 0, 1) });
        },
      },
      {
        t: 2.2,
        title: "Receiver arrives → a single handshake",
        desc: "Another goroutine runs `v := <-ch`. The value crosses and BOTH goroutines unblock at the same instant.",
        why: "This rendezvous is a guarantee: after the handshake, the sender knows the value was received - no lost messages, no polling.",
        draw(ctx, p, w, h, c, u) {
          const sx = w * 0.17, rx = w * 0.83, my = h * 0.42;
          actor(ctx, c, u, sx, my, "sender", c.go, true);
          actor(ctx, c, u, rx, my, "receiver", c.go, true);
          u.line(ctx, sx + 58, my, rx - 58, my, c.line, 1.6, [4, 5]);
          u.text(ctx, "v := <-ch", rx, my - 40, { align: "center", color: c.go, size: 11, mono: true });
          const frac = u.clamp(p / 0.7, 0, 1), vx = u.lerp(sx + 58, rx - 58, u.easeInOut(frac));
          u.dot(ctx, vx, my, 7, c.go, "rgba(0,173,216,.4)");
          if (frac >= 1) {
            u.ring(ctx, rx - 58, my, c.good, u.clamp((p - 0.7) / 0.3, 0, 1), { from: 5, to: 28, lw: 2 });
            u.text(ctx, "✓ received - both goroutines proceed", w / 2, my + 58, { align: "center", color: c.good, size: 13, weight: 700 });
          } else {
            u.text(ctx, "value crosses in one handshake (rendezvous)", w / 2, my + 58, { align: "center", color: c.dim, size: 12.5 });
          }
        },
      },
      {
        t: 4.4,
        title: "A buffered channel holds values",
        desc: "make(chan T, 4) gives the channel a buffer. Sends succeed immediately while there's free space - the sender doesn't wait.",
        why: "A buffer decouples sender and receiver timing: bursts of work can queue up instead of forcing a lock-step handshake every time.",
        draw(ctx, p, w, h, c, u) {
          const my = h * 0.44;
          u.text(ctx, "buffered ch - cap 4", w / 2, my - 30, { align: "center", color: c.dim, size: 12 });
          const filled = Math.min(3, Math.floor(u.clamp(p / 0.85, 0, 1) * 3 + 0.001));
          slots(ctx, c, u, w, my, 4, filled);
          u.text(ctx, "ch <- v   (×3)", w / 2, my - 48, { align: "center", color: c.go, size: 11, mono: true });
          u.text(ctx, "3 sends, buffer has room → sender never blocks", w / 2, my + 66, { align: "center", color: c.good, size: 13, weight: 700, alpha: u.clamp((p - 0.5) / 0.3, 0, 1) });
        },
      },
      {
        t: 6.6,
        title: "Buffer full → the next send blocks",
        desc: "Once all 4 slots are occupied, the 5th `ch <- v` blocks until a receiver frees a slot. This is natural backpressure.",
        why: "Backpressure is a feature: a fast producer is forced to slow to the consumer's pace instead of exhausting memory with an unbounded queue.",
        draw(ctx, p, w, h, c, u) {
          const my = h * 0.44;
          u.text(ctx, "buffered ch - cap 4", w / 2, my - 30, { align: "center", color: c.dim, size: 12 });
          const g = slots(ctx, c, u, w, my, 4, 4);
          const jitter = 16 * (0.5 + 0.5 * Math.sin((u.t || 0) * 6));
          u.dot(ctx, g.sx + g.totalW + 22 + jitter, my + 19, 7, c.warn, "rgba(245,177,76,.4)");
          u.text(ctx, "ch <- v  ⏸ blocks (backpressure)", w / 2, my + 66, { align: "center", color: c.warn, size: 13, weight: 700, alpha: u.clamp(p / 0.3, 0, 1) });
        },
      },
      {
        t: 8.8,
        title: "select waits on whichever is ready",
        desc: "select blocks on several channel operations at once and proceeds with the FIRST one that becomes ready - here, chA.",
        why: "select is how one goroutine juggles many channels - combine it with a ctx.Done() case and you get clean timeouts and cancellation.",
        draw(ctx, p, w, h, c, u) {
          const selx = w / 2, sely = h * 0.5, chAx = w * 0.16, chAy = h * 0.3, chBx = w * 0.16, chBy = h * 0.7;
          const chosen = p > 0.4;
          actor(ctx, c, u, chAx, chAy, "chA ● ready", c.go, true);
          actor(ctx, c, u, chBx, chBy, "chB ○ idle", c.dim, false);
          u.flow(ctx, chAx + 58, chAy, selx - 74, sely - 14, chosen ? c.go : c.line, chosen ? 2 : 1.4, u.t || 0);
          u.line(ctx, chBx + 58, chBy, selx - 74, sely + 14, c.line, 1.4, [4, 5]);
          u.fillRR(ctx, selx - 74, sely - 32, 148, 64, 12, "rgba(0,173,216,0.08)", c.go, 2);
          u.text(ctx, "select { }", selx, sely - 6, { align: "center", color: c.go, size: 14, weight: 700, mono: true });
          u.text(ctx, chosen ? "→ case v := <-chA" : "waiting…", selx, sely + 16, { align: "center", color: chosen ? c.good : c.dim, size: 11.5, mono: true, weight: 600 });
          if (chosen) u.ring(ctx, selx, sely, c.good, u.clamp((p - 0.4) / 0.35, 0, 1), { from: 8, to: 46, lw: 2 });
          u.text(ctx, "runs whichever case is ready first", w / 2, h * 0.92, { align: "center", color: c.dim, size: 12.5 });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.8,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.8, "channels · handshake, buffering & select"),
    });
  };

  /* =================================================================== */
  /* M16. REDIS CACHE-ASIDE & THE ATOMIC LOCK                            */
  /* =================================================================== */
  ANIM["redis-cache"] = (canvas) => {
    function scene(ctx, c, u, w, h, cacheOn) {
      const clientX = w * 0.13, cacheX = w / 2, dbX = w * 0.87, rowY = h * 0.24;
      u.fillRR(ctx, clientX - 44, rowY - 20, 88, 40, 9, c.panel, c.line, 1.4);
      u.text(ctx, "client", clientX, rowY + 6, { align: "center", color: c.text, size: 12.5 });
      u.fillRR(ctx, cacheX - 52, rowY - 20, 104, 40, 9, cacheOn ? "rgba(206,50,98,0.14)" : c.panel, cacheOn ? c.accent : c.line, cacheOn ? 1.8 : 1.3);
      u.text(ctx, "Redis", cacheX, rowY + 6, { align: "center", color: cacheOn ? c.accent : c.dim, size: 12.5, weight: 700 });
      u.fillRR(ctx, dbX - 48, rowY - 20, 96, 40, 9, c.panel, c.line, 1.4);
      u.text(ctx, "database", dbX, rowY + 6, { align: "center", color: c.text, size: 12.5 });
      u.line(ctx, clientX + 44, rowY, cacheX - 52, rowY, c.line, 1.4, [3, 4]);
      u.line(ctx, cacheX + 52, rowY, dbX - 48, rowY, c.line, 1.4, [3, 4]);
      return { clientX, cacheX, dbX, rowY };
    }
    function ball(ctx, u, x, y, color, glow) { u.dot(ctx, x, y, 7, color, glow); }

    const STEPS = [
      {
        t: 0,
        title: "Without a cache, every read hits the database directly",
        desc: "The client asks for a value and there is nowhere faster to check first - every single request pays the full cost of a real database query.",
        why: "This is the baseline we're about to beat. Nothing here is wrong, it's just slow - and 'slow, every time' is expensive once traffic grows.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, dbX, rowY } = scene(ctx, c, u, w, h, false);
          const cyc = p % 0.6, half = 0.42;
          const x = cyc < half ? u.lerp(clientX, dbX, cyc / half) : u.lerp(dbX, clientX, (cyc - half) / (0.6 - half));
          ball(ctx, u, x, rowY, c.warn, "rgba(245,177,76,0.4)");
          if (cyc > half * 0.8 && cyc < half) u.text(ctx, "~50ms query", dbX, rowY - 30, { align: "center", color: c.warn, size: 11.5, weight: 600 });
        },
      },
      {
        t: 2.4,
        title: "First request: Redis is checked first - and it's a miss",
        desc: "The client's read now stops at Redis before anything else. The key isn't there yet, so go-redis returns the sentinel error redis.Nil - not a crash, just \"not cached yet.\"",
        why: "Treating a miss as a normal, expected outcome - not an error to panic on - is what makes this pattern safe to use on every read, not just the lucky ones.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, cacheX, dbX, rowY } = scene(ctx, c, u, w, h, true);
          const seg1 = u.clamp(p / 0.45, 0, 1), seg2 = u.clamp((p - 0.5) / 0.5, 0, 1);
          if (seg1 > 0 && seg1 < 1) ball(ctx, u, u.lerp(clientX, cacheX, seg1), rowY, c.warn, "rgba(245,177,76,0.4)");
          if (seg1 >= 1) u.badge(ctx, cacheX - 30, rowY - 52, "MISS", c.warn);
          if (seg2 > 0) ball(ctx, u, u.lerp(cacheX, dbX, u.easeInOut(seg2)), rowY, c.warn, "rgba(245,177,76,0.4)");
        },
      },
      {
        t: 4.8,
        title: "The answer comes back - and gets cached with a TTL",
        desc: "The database returns the real value. Before handing it to the client, the code writes it into Redis with an expiration attached - e.g. 60 seconds.",
        why: "Attaching a TTL at write time is what bounds how wrong this cached copy is allowed to become. Nobody has to remember to clean it up later - Redis does it alone.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, cacheX, dbX, rowY } = scene(ctx, c, u, w, h, true);
          const seg1 = u.clamp(p / 0.55, 0, 1), seg2 = u.clamp((p - 0.6) / 0.4, 0, 1);
          if (seg1 > 0 && seg1 < 1) ball(ctx, u, u.lerp(dbX, cacheX, seg1), rowY, c.good, "rgba(58,210,159,0.4)");
          if (seg1 >= 1) { u.fillRR(ctx, cacheX - 44, rowY + 26, 88, 22, 6, "rgba(58,210,159,0.16)", c.good, 1.4); u.text(ctx, "TTL 60s", cacheX, rowY + 41, { align: "center", color: c.good, size: 10.5, weight: 700, mono: true }); }
          if (seg2 > 0) ball(ctx, u, u.lerp(cacheX, clientX, u.easeInOut(seg2)), rowY, c.good, "rgba(58,210,159,0.4)");
        },
      },
      {
        t: 7.2,
        title: "Second request: cache hit - the database is never touched",
        desc: "The exact same key is requested again. This time Redis has it: the client gets an answer in well under a millisecond, and the database does nothing at all.",
        why: "This is the entire payoff of cache-aside - the expensive path runs once per TTL window, no matter how many times the value is actually read in that window.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, cacheX, dbX, rowY } = scene(ctx, c, u, w, h, true);
          u.fillRR(ctx, cacheX - 44, rowY + 26, 88, 22, 6, "rgba(58,210,159,0.16)", c.good, 1.4);
          u.text(ctx, "TTL 60s", cacheX, rowY + 41, { align: "center", color: c.good, size: 10.5, weight: 700, mono: true });
          const cyc = p % 0.5, half = 0.25;
          const x = cyc < half ? u.lerp(clientX, cacheX, cyc / half) : u.lerp(cacheX, clientX, (cyc - half) / half);
          ball(ctx, u, x, rowY, c.good, "rgba(58,210,159,0.4)");
          u.badge(ctx, cacheX - 24, rowY - 52, "HIT ✓", c.good, "#06101f");
          const by = rowY + 76, bw = w * 0.5, bx = w / 2 - bw / 2;
          u.fillRR(ctx, bx, by, bw, 20, 5, "rgba(245,177,76,0.22)", c.warn, 1.2);
          u.text(ctx, "database, uncached: ~50ms", bx + 8, by + 14, { color: c.warn, size: 10.5, mono: true });
          u.fillRR(ctx, bx, by + 26, Math.max(6, bw * 0.02), 20, 5, "rgba(58,210,159,0.3)", c.good, 1.2);
          u.text(ctx, "Redis, cached: <1ms", bx + Math.max(6, bw * 0.02) + 8, by + 40, { color: c.good, size: 10.5, mono: true });
        },
      },
      {
        t: 9.6,
        title: "The TTL runs out - and the next request is a miss again",
        desc: "60 seconds pass. Redis quietly deletes the key on its own. The next client to ask for it gets a miss, exactly like the very first request did.",
        why: "This is the cache-aside lifecycle closing the loop: hit, hit, hit… until the TTL ends, then one miss repopulates it and the cycle simply continues.",
        draw(ctx, p, w, h, c, u) {
          const { clientX, cacheX, rowY } = scene(ctx, c, u, w, h, p < 0.5);
          const fade = 1 - u.clamp(p / 0.45, 0, 1);
          if (fade > 0.02) { ctx.globalAlpha = fade; u.fillRR(ctx, cacheX - 44, rowY + 26, 88, 22, 6, "rgba(58,210,159,0.16)", c.good, 1.4); u.text(ctx, "TTL 60s → 0s", cacheX, rowY + 41, { align: "center", color: c.good, size: 10.5, weight: 700, mono: true }); ctx.globalAlpha = 1; }
          if (p > 0.55) {
            const seg = u.clamp((p - 0.55) / 0.4, 0, 1);
            ball(ctx, u, u.lerp(clientX, cacheX, seg), rowY, c.warn, "rgba(245,177,76,0.4)");
            if (seg >= 1) u.badge(ctx, cacheX - 30, rowY - 52, "MISS", c.warn);
          }
        },
      },
      {
        t: 12.0,
        title: "Atomic SETNX: five callers race, exactly one wins",
        desc: "Five clients call SET … NX on the same lock key at the same instant. Because Redis executes one command at a time, exactly one of them creates the key and gets the lock - the other four fail immediately.",
        why: "No extra coordination code was added anywhere. This atomicity is a free property of how Redis executes commands - it's what makes one Redis instance a correct distributed lock.",
        draw(ctx, p, w, h, c, u) {
          const cacheX = w / 2, cacheY = h * 0.24;
          u.fillRR(ctx, cacheX - 52, cacheY - 20, 104, 40, 9, "rgba(206,50,98,0.14)", c.accent, 1.8);
          u.text(ctx, "Redis", cacheX, cacheY + 6, { align: "center", color: c.accent, size: 12.5, weight: 700 });
          const n = 5, winner = 2, spread = Math.min(120, w * 0.32);
          const seg = u.clamp(p / 0.6, 0, 1);
          for (let i = 0; i < n; i++) {
            const angle = -0.9 + (i / (n - 1)) * 1.8;
            const sx = cacheX + Math.sin(angle) * spread, sy = cacheY + h * 0.42 + Math.cos(angle) * 26;
            const x = u.lerp(sx, cacheX, u.easeInOut(seg) * 0.86), y = u.lerp(sy, cacheY + 30, u.easeInOut(seg) * 0.86);
            const isWinner = i === winner;
            const settled = seg >= 0.98;
            const col = settled ? (isWinner ? c.good : c.bad) : c.dim;
            ball(ctx, u, x, y, col, isWinner && settled ? "rgba(58,210,159,0.4)" : null);
            if (settled) u.text(ctx, tr("worker-") + (i + 1), x, y + 18, { align: "center", color: col, size: 9.5, mono: true });
          }
          if (seg >= 0.98) {
            const a = u.clamp((p - 0.7) / 0.3, 0, 1);
            u.text(ctx, tr("worker-") + (winner + 1) + tr(" -> acquired the lock"), cacheX, cacheY - 40, { align: "center", color: c.good, size: 12.5, weight: 700, alpha: a });
            u.text(ctx, "everyone else -> lock already held, backing off", cacheX, cacheY - 58, { align: "center", color: c.dim, size: 11, alpha: a });
          }
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 14.6,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 14.6, "Redis · cache-aside lifecycle & the atomic lock"),
    });
  };

  /* =================================================================== */
  /* M20. CONSENSUS - LEADER ELECTION & LOG REPLICATION                  */
  /* =================================================================== */
  ANIM["raft-consensus"] = (canvas) => {
    function positions(w, h) {
      return {
        A: { x: w / 2, y: h * 0.2 },
        B: { x: w * 0.22, y: h * 0.76 },
        C: { x: w * 0.78, y: h * 0.76 },
      };
    }
    function node(ctx, c, u, x, y, label, sub, state) {
      let fill = c.panel, stroke = c.line, fg = c.dim, lw = 1.4;
      if (state === "leader") { fill = "rgba(58,210,159,0.16)"; stroke = c.good; fg = c.good; lw = 2.2; }
      if (state === "candidate") { fill = "rgba(245,177,76,0.14)"; stroke = c.warn; fg = c.warn; lw = 2; }
      if (state === "down") { fill = c.panel; stroke = c.line; fg = c.dim; lw = 1.2; }
      ctx.save();
      if (state === "down") ctx.globalAlpha = 0.4;
      u.fillRR(ctx, x - 64, y - 27, 128, 54, 10, fill, stroke, lw);
      u.text(ctx, label, x, y - 5, { align: "center", color: fg, size: 13, weight: 700, mono: true });
      if (sub) u.text(ctx, sub, x, y + 14, { align: "center", color: fg, size: 10.5, mono: true });
      ctx.restore();
    }
    function timerBar(ctx, c, u, x, y, frac, color) {
      const w = 64, h = 7;
      u.fillRR(ctx, x - w / 2, y, w, h, 3.5, c.panel, c.line, 1);
      if (frac > 0) u.fillRR(ctx, x - w / 2, y, w * u.clamp(frac, 0, 1), h, 3.5, color);
    }

    const STEPS = [
      {
        t: 0,
        title: "A leader sends heartbeats to keep followers calm",
        desc: "Node A is the current leader for term 3. It periodically pings B and C. As long as heartbeats keep arriving, each follower's election timer keeps getting reset - and stays quiet.",
        why: "A heartbeat is the leader saying 'I'm still here.' The whole election mechanism only ever activates once those heartbeats stop.",
        draw(ctx, p, w, h, c, u) {
          const pos = positions(w, h);
          node(ctx, c, u, pos.A.x, pos.A.y, "A · term 3", "LEADER", "leader");
          node(ctx, c, u, pos.B.x, pos.B.y, "B", "follower", "follower");
          node(ctx, c, u, pos.C.x, pos.C.y, "C", "follower", "follower");
          u.flow(ctx, pos.A.x, pos.A.y + 30, pos.B.x + 10, pos.B.y - 30, c.good, 1.6, u.t || 0);
          u.flow(ctx, pos.A.x, pos.A.y + 30, pos.C.x - 10, pos.C.y - 30, c.good, 1.6, u.t || 0);
          const cyc = (p * 3) % 1;
          timerBar(ctx, c, u, pos.B.x, pos.B.y + 34, cyc, c.good);
          timerBar(ctx, c, u, pos.C.x, pos.C.y + 34, (cyc + 0.4) % 1, c.good);
          if (cyc < 0.08) { u.ring(ctx, pos.B.x, pos.B.y, c.good, cyc / 0.08, { from: 8, to: 40, lw: 1.6 }); }
          u.text(ctx, "heartbeat resets the timer before it ever fires", w / 2, h * 0.95, { align: "center", color: c.dim, size: 12 });
        },
      },
      {
        t: 2.4,
        title: "The leader goes silent",
        desc: "A crashes, or the network partitions it away. No more heartbeats arrive - B and C's election timers now keep rising, uninterrupted, for the first time.",
        why: "One missed heartbeat proves nothing by itself. It takes a full election timeout with NO heartbeat in between to convince a follower the leader is really gone.",
        draw(ctx, p, w, h, c, u) {
          const pos = positions(w, h);
          node(ctx, c, u, pos.A.x, pos.A.y, "A · term 3", "unreachable", "down");
          node(ctx, c, u, pos.B.x, pos.B.y, "B", "follower", "follower");
          node(ctx, c, u, pos.C.x, pos.C.y, "C", "follower", "follower");
          const bFrac = u.clamp(p * 1.15, 0, 1), cFrac = u.clamp(p * 0.85, 0, 1);
          timerBar(ctx, c, u, pos.B.x, pos.B.y + 34, bFrac, c.warn);
          timerBar(ctx, c, u, pos.C.x, pos.C.y + 34, cFrac, c.warn);
          u.text(ctx, "no heartbeat - both timers keep climbing", w / 2, h * 0.95, { align: "center", color: c.warn, size: 12.5, weight: 600 });
        },
      },
      {
        t: 4.8,
        title: "B's timeout fires first -> becomes candidate, term++",
        desc: "B's randomized timeout elapses before C's. B increments its term (3 -> 4), becomes a candidate, and requests votes from everyone it can still reach.",
        why: "Randomizing each node's timeout is what keeps B and C from timing out at the exact same instant and splitting the vote forever.",
        draw(ctx, p, w, h, c, u) {
          const pos = positions(w, h);
          node(ctx, c, u, pos.A.x, pos.A.y, "A · term 3", "unreachable", "down");
          node(ctx, c, u, pos.B.x, pos.B.y, "B · term 4", "CANDIDATE", "candidate");
          node(ctx, c, u, pos.C.x, pos.C.y, "C", "follower", "follower");
          const a = u.clamp(p / 0.7, 0, 1);
          u.flow(ctx, pos.B.x + 40, pos.B.y - 10, pos.C.x - 40, pos.C.y - 10, c.warn, 1.8 * a, u.t || 0);
          u.text(ctx, "RequestVote(term 4)", (pos.B.x + pos.C.x) / 2, (pos.B.y + pos.C.y) / 2 - 34, { align: "center", color: c.warn, size: 12, weight: 700, alpha: a });
        },
      },
      {
        t: 7.2,
        title: "A majority of votes -> B becomes leader",
        desc: "C grants its vote (A is unreachable, so it never gets asked). B now holds 2 of 3 votes - a majority - and becomes leader for term 4.",
        why: "A majority can always be reached even with one node down, and two different candidates can never both reach a majority in the same term - that's exactly what guarantees at most one leader.",
        draw(ctx, p, w, h, c, u) {
          const pos = positions(w, h);
          const won = p > 0.55;
          node(ctx, c, u, pos.A.x, pos.A.y, "A · term 3", "unreachable", "down");
          node(ctx, c, u, pos.B.x, pos.B.y, "B · term 4", won ? "LEADER" : "CANDIDATE", won ? "leader" : "candidate");
          node(ctx, c, u, pos.C.x, pos.C.y, "C", "follower", "follower");
          const seg = u.clamp(p / 0.55, 0, 1);
          u.flow(ctx, pos.C.x - 40, pos.C.y - 10, pos.B.x + 40, pos.B.y - 10, c.good, 1.8, u.t || 0);
          const votes = seg >= 1 ? 2 : 1;
          u.text(ctx, tr("votes: ") + votes + "/3", w / 2, h * 0.5, { align: "center", color: votes >= 2 ? c.good : c.dim, size: 14, weight: 700, mono: true });
          if (won) u.ring(ctx, pos.B.x, pos.B.y, c.good, u.clamp((p - 0.55) / 0.4, 0, 1), { from: 8, to: 48, lw: 2 });
        },
      },
      {
        t: 9.6,
        title: "New leader replicates a log entry",
        desc: "A client asks B to process one command. B appends it to its own log and sends AppendEntries to every follower it can reach - here, just C.",
        why: "The leader is the only node ever allowed to accept new commands - that single-writer rule is what keeps the log's order unambiguous.",
        draw(ctx, p, w, h, c, u) {
          const pos = positions(w, h);
          node(ctx, c, u, pos.A.x, pos.A.y, "A · term 3", "unreachable", "down");
          node(ctx, c, u, pos.B.x, pos.B.y, "B · term 4", "LEADER", "leader");
          node(ctx, c, u, pos.C.x, pos.C.y, "C", "follower", "follower");
          u.text(ctx, "log: [SET balance[alice]=900]", pos.B.x, pos.B.y + 46, { align: "center", color: c.good, size: 10.5, mono: true });
          const a = u.clamp(p / 0.7, 0, 1);
          u.flow(ctx, pos.B.x + 40, pos.B.y - 10, pos.C.x - 40, pos.C.y - 10, c.go, 1.8 * a, u.t || 0);
          u.text(ctx, "AppendEntries", (pos.B.x + pos.C.x) / 2, (pos.B.y + pos.C.y) / 2 - 34, { align: "center", color: c.go, size: 12, weight: 700, alpha: a });
        },
      },
      {
        t: 12,
        title: "Committed the instant a majority acks - not waiting on the third",
        desc: "C acknowledges the entry. B (itself) plus C is 2 of 3 - a majority - so the entry commits immediately. B never waits on A, which is still down.",
        why: "Waiting for every node to reply would let one slow or crashed node stall the whole cluster. Majority is the exact threshold that keeps replication both safe and always able to make progress.",
        draw(ctx, p, w, h, c, u) {
          const pos = positions(w, h);
          const committed = p > 0.5;
          node(ctx, c, u, pos.A.x, pos.A.y, "A · term 3", "unreachable", "down");
          node(ctx, c, u, pos.B.x, pos.B.y, "B · term 4", "LEADER", "leader");
          node(ctx, c, u, pos.C.x, pos.C.y, "C", "follower", "follower");
          const acked = committed ? 2 : 1;
          u.text(ctx, tr("log: [SET balance[alice]=900]") + (committed ? " ✓" : ""), pos.B.x, pos.B.y + 46, { align: "center", color: c.good, size: 10.5, mono: true });
          u.text(ctx, tr("acked: ") + acked + "/3" + (committed ? tr(" - committed") : ""), w / 2, h * 0.5, { align: "center", color: committed ? c.good : c.dim, size: 14, weight: 700, mono: true });
          if (committed) u.burst(ctx, pos.B.x, pos.B.y, c.good, u.clamp((p - 0.5) / 0.4, 0, 1), 10);
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 14.4,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 14.4, "consensus · leader election & log replication"),
    });
  };

  /* =================================================================== */
  /* M18. SRE OPERATING MODEL                                            */
  /* =================================================================== */
  function sreBox(ctx, c, u, x, y, w, h, label, color, opts = {}) {
    u.fillRR(ctx, x - w / 2, y - h / 2, w, h, 8, opts.fill || "rgba(18,27,46,0.92)", color, opts.lw || 1.6);
    u.text(ctx, label, x, y + 4, {
      align: "center",
      color,
      size: opts.size || 12,
      weight: 700,
      mono: opts.mono !== false,
      maxWidth: w - 12,
      minSize: 9,
    });
  }

  ANIM["sre-slo-budget"] = (canvas) => {
    function budgetGauge(ctx, c, u, x, y, w, used) {
      u.fillRR(ctx, x, y, w, 18, 5, "rgba(42,58,85,0.7)", c.line, 1);
      const fill = Math.min(w, w * used);
      const col = used > 1 ? c.bad : used > 0.65 ? c.warn : c.good;
      u.fillRR(ctx, x, y, fill, 18, 5, col + "88", col, 1);
      u.text(ctx, "budget 0.1%", x + w / 2, y - 8, { align: "center", color: c.dim, size: 11, mono: true });
    }

    const STEPS = [
      {
        t: 0,
        title: "Pick a user-visible SLI",
        desc: "Start from user experience: successful transfers divided by total transfer attempts.",
        why: "Infrastructure metrics explain causes; SLIs define whether users are hurt.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42, left = w * 0.16, mid = w * 0.5, right = w * 0.84;
          sreBox(ctx, c, u, left, y, 120, 42, "user requests", c.go);
          sreBox(ctx, c, u, mid, y, 170, 42, "SLI = success / total", c.purple);
          sreBox(ctx, c, u, right, y, 128, 42, "users hurt?", c.warn);
          u.flow(ctx, left + 62, y, mid - 88, y, c.go, 2, u.t || 0);
          u.flow(ctx, mid + 88, y, right - 66, y, c.purple, 2, u.t || 0);
          const n = 20;
          for (let i = 0; i < n; i++) {
            const a = u.clamp((p - i * 0.018) / 0.45, 0, 1);
            if (a <= 0) continue;
            const px = u.lerp(left - 42, mid - 18, u.easeInOut(a));
            const py = y + Math.sin(i * 1.7) * 18;
            u.dot(ctx, px, py, 3.5, i % 11 === 0 ? c.bad : c.good);
          }
        },
      },
      {
        t: 2.2,
        title: "Set the SLO target",
        desc: "A 99.9% SLO leaves 0.1% of requests as the error budget.",
        why: "The target turns reliability into a release and alerting control, not a vibe.",
        draw(ctx, p, w, h, c, u) {
          const cx = w / 2, cy = h * 0.44;
          ctx.save();
          ctx.lineWidth = 13;
          ctx.strokeStyle = c.good;
          ctx.beginPath();
          ctx.arc(cx, cy, 76, -Math.PI / 2, Math.PI * 1.47);
          ctx.stroke();
          ctx.strokeStyle = c.bad;
          ctx.beginPath();
          ctx.arc(cx, cy, 76, Math.PI * 1.47, Math.PI * 1.5 + Math.PI * 0.02 * u.clamp(p, 0, 1));
          ctx.stroke();
          ctx.restore();
          u.text(ctx, "SLO 99.9%", cx, cy - 2, { align: "center", color: c.good, size: 20, weight: 800, mono: true });
          u.text(ctx, "budget 0.1%", cx, cy + 24, { align: "center", color: c.bad, size: 13, weight: 700, mono: true });
        },
      },
      {
        t: 4.4,
        title: "Spend the budget",
        desc: "Small bursts are allowed while the long-window budget is healthy.",
        why: "An error budget lets teams move fast without pretending production must be perfect.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.18, y = h * 0.42, bw = w * 0.64;
          budgetGauge(ctx, c, u, x, y, bw, u.lerp(0.18, 0.62, u.easeInOut(p)));
          u.text(ctx, "ship carefully", x + bw * 0.32, y + 48, { align: "center", color: c.good, size: 13, weight: 700 });
          u.text(ctx, "slow burn", x + bw * 0.67, y + 48, { align: "center", color: c.warn, size: 13, weight: 700 });
          u.dot(ctx, x + bw * u.lerp(0.18, 0.62, u.easeInOut(p)), y + 9, 7, c.warn, "rgba(245,177,76,.45)");
        },
      },
      {
        t: 6.6,
        title: "Alert on burn rate",
        desc: "A fast burn pages now; a slow burn opens a ticket and closer review.",
        why: "Burn-rate alerting maps urgency to user-visible reliability risk.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.17, y = h * 0.38, bw = w * 0.66;
          budgetGauge(ctx, c, u, x, y, bw, u.lerp(0.55, 1.22, u.easeInOut(p)));
          sreBox(ctx, c, u, w * 0.34, y + 78, 110, 36, "ticket", c.warn, { fill: "rgba(245,177,76,.1)" });
          sreBox(ctx, c, u, w * 0.66, y + 78, 126, 36, "page now", c.bad, { fill: "rgba(255,107,107,.1)" });
          u.flow(ctx, x + bw * 0.72, y + 22, w * 0.34, y + 58, c.warn, 2, u.t || 0);
          u.flow(ctx, x + bw * 0.98, y + 22, w * 0.66, y + 58, c.bad, 2.4, u.t || 0);
        },
      },
      {
        t: 8.8,
        title: "Use budget for release decisions",
        desc: "Healthy budget allows change; exhausted budget shifts work toward reliability.",
        why: "That is the SRE bargain: product velocity is earned by staying inside the SLO.",
        draw(ctx, p, w, h, c, u) {
          const cy = h * 0.45;
          sreBox(ctx, c, u, w * 0.28, cy, 160, 48, "ship carefully", c.good, { fill: "rgba(58,210,159,.1)" });
          sreBox(ctx, c, u, w * 0.72, cy, 174, 48, "freeze risky releases", c.bad, { fill: "rgba(255,107,107,.1)" });
          const x1 = w * 0.28 + 84, x2 = w * 0.72 - 92;
          u.line(ctx, x1, cy, x2, cy, c.line, 2, [6, 7]);
          u.dot(ctx, u.lerp(x1, x2, u.easeInOut(p)), cy, 7, p < 0.55 ? c.good : c.bad, "rgba(0,173,216,.25)");
          u.text(ctx, "error budget decides", w / 2, cy - 42, { align: "center", color: c.purple, size: 13, weight: 700 });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10.8,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10.8, "SRE · SLO / error budget / burn rate"),
    });
  };

  ANIM["sre-telemetry-stack"] = (canvas) => {
    const STEPS = [
      {
        t: 0,
        title: "Instrument once with OpenTelemetry",
        desc: "The SDK and collector create one telemetry contract at the application boundary.",
        why: "Instrumentation is not the backend; it is how the app describes itself consistently.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42;
          sreBox(ctx, c, u, w * 0.25, y, 168, 42, "OpenTelemetry SDK", c.go);
          sreBox(ctx, c, u, w * 0.56, y, 122, 42, "Collector", c.purple);
          sreBox(ctx, c, u, w * 0.82, y, 112, 42, "export", c.dim);
          u.flow(ctx, w * 0.25 + 86, y, w * 0.56 - 64, y, c.go, 2, u.t || 0);
          u.flow(ctx, w * 0.56 + 64, y, w * 0.82 - 58, y, c.purple, 2, u.t || 0);
        },
      },
      {
        t: 2,
        title: "Metrics go to Prometheus",
        desc: "Prometheus scrapes RED/USE metrics and evaluates SLO burn alerts.",
        why: "Metrics are the paging signal because they are cheap, aggregated and fast to query.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42;
          sreBox(ctx, c, u, w * 0.22, y, 112, 40, "metrics", c.good);
          sreBox(ctx, c, u, w * 0.52, y, 130, 44, "Prometheus", c.warn);
          sreBox(ctx, c, u, w * 0.78, y, 96, 38, "alert", c.bad);
          u.flow(ctx, w * 0.22 + 58, y, w * 0.52 - 68, y, c.good, 2, u.t || 0);
          if (p > 0.45) u.flow(ctx, w * 0.52 + 68, y, w * 0.78 - 50, y, c.bad, 2.3, u.t || 0);
        },
      },
      {
        t: 4,
        title: "Thanos keeps long-retention metrics",
        desc: "Thanos lets you query Prometheus data across clusters and longer windows.",
        why: "Long windows catch slow burns that short dashboards miss.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42;
          sreBox(ctx, c, u, w * 0.31, y, 132, 42, "Prometheus", c.warn);
          sreBox(ctx, c, u, w * 0.65, y, 112, 42, "Thanos", c.go);
          u.flow(ctx, w * 0.31 + 70, y, w * 0.65 - 58, y, c.warn, 2, u.t || 0);
          u.text(ctx, "30d / 90d / multi-cluster", w / 2, y + 66, { align: "center", color: c.dim, size: 12, mono: true });
        },
      },
      {
        t: 6,
        title: "Traces go to Tempo",
        desc: "A trace explains which hop made one request slow or wrong.",
        why: "Traces are for localization after the metric told you users are hurt.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42, xs = [w * 0.2, w * 0.38, w * 0.56, w * 0.74];
          xs.forEach((x, i) => sreBox(ctx, c, u, x, y + (i === 2 ? 28 : 0), 90, 34, i === 3 ? "Tempo" : "span", i === 2 ? c.warn : c.go));
          for (let i = 0; i < xs.length - 1; i++) u.flow(ctx, xs[i] + 46, y + (i === 2 ? 28 : 0), xs[i + 1] - 46, y + (i + 1 === 2 ? 28 : 0), c.go, 1.8, u.t || 0);
          u.text(ctx, "trace_id", w / 2, y - 52, { align: "center", color: c.purple, size: 14, weight: 700, mono: true });
        },
      },
      {
        t: 8,
        title: "Logs go to Loki",
        desc: "Logs carry the concrete event, keyed by bounded labels and trace_id.",
        why: "Logs are expensive, so make them searchable and tied to the same request identity.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.18, y = h * 0.28, rw = w * 0.64;
          sreBox(ctx, c, u, x, y, 92, 38, "logs", c.dim);
          sreBox(ctx, c, u, x + rw, y, 92, 38, "Loki", c.go);
          u.flow(ctx, x + 48, y, x + rw - 48, y, c.dim, 2, u.t || 0);
          ["service=ledger", "route=/transfer/{id}", "trace_id"].forEach((s, i) => {
            u.fillRR(ctx, w * 0.32, y + 54 + i * 26, w * 0.36, 20, 5, "rgba(42,58,85,.62)", c.line, 1);
            u.text(ctx, s, w / 2, y + 69 + i * 26, { align: "center", color: i === 2 ? c.purple : c.text, size: 10.5, mono: true });
          });
        },
      },
      {
        t: 10,
        title: "Grafana correlates by trace_id",
        desc: "One incident workflow jumps metric -> trace -> logs without manual guessing.",
        why: "Correlation is what reduces mean time to understand.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42, xs = [w * 0.18, w * 0.39, w * 0.6, w * 0.82];
          [["metrics", c.good], ["traces", c.go], ["logs", c.dim], ["Grafana", c.purple]].forEach((it, i) => {
            sreBox(ctx, c, u, xs[i], y, i === 3 ? 116 : 94, 38, it[0], it[1]);
          });
          u.flow(ctx, xs[0] + 48, y, xs[3] - 60, y - 36, c.good, 1.8, u.t || 0);
          u.flow(ctx, xs[1] + 48, y, xs[3] - 60, y, c.go, 1.8, u.t || 0);
          u.flow(ctx, xs[2] + 48, y, xs[3] - 60, y + 36, c.dim, 1.8, u.t || 0);
          u.text(ctx, "trace_id", w / 2, y + 72, { align: "center", color: c.purple, size: 13, mono: true, weight: 700 });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 12,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12, "SRE · telemetry correlation stack"),
    });
  };

  ANIM["sre-incident-toil"] = (canvas) => {
    const STEPS = [
      {
        t: 0,
        title: "Alert fires from SLO burn",
        desc: "The page starts from user impact, not from a random noisy symptom.",
        why: "Good alerts already contain the reason this wake-up is worth it.",
        draw(ctx, p, w, h, c, u) {
          sreBox(ctx, c, u, w * 0.28, h * 0.42, 120, 42, "SLO burn", c.bad);
          sreBox(ctx, c, u, w * 0.68, h * 0.42, 102, 42, "alert", c.warn);
          u.flow(ctx, w * 0.28 + 64, h * 0.42, w * 0.68 - 54, h * 0.42, c.bad, 2.4, u.t || 0);
          if (p > 0.35) u.glowPulse(ctx, w * 0.68, h * 0.42, 18, "rgba(255,107,107,.6)", u.t || 0);
        },
      },
      {
        t: 2,
        title: "Triage assigns incident roles",
        desc: "Incident commander, operations lead, communications and scribe separate the work.",
        why: "Roles prevent the on-call engineer from being debugger, manager and reporter at once.",
        draw(ctx, p, w, h, c, u) {
          const roles = [["IC", c.purple], ["ops", c.go], ["comms", c.warn], ["scribe", c.dim]];
          roles.forEach((r, i) => sreBox(ctx, c, u, w * (0.2 + i * 0.2), h * 0.42, 82, 38, r[0], r[1]));
        },
      },
      {
        t: 4,
        title: "Mitigate before perfect root cause",
        desc: "Stop the bleeding first: rollback, shed load, fail over, disable a bad path.",
        why: "RCA is valuable after users are safe; during impact, mitigation wins.",
        draw(ctx, p, w, h, c, u) {
          sreBox(ctx, c, u, w * 0.22, h * 0.42, 110, 42, "impact", c.bad);
          sreBox(ctx, c, u, w * 0.5, h * 0.42, 126, 42, "mitigate", c.good);
          sreBox(ctx, c, u, w * 0.78, h * 0.42, 96, 42, "stable", c.go);
          u.flow(ctx, w * 0.22 + 58, h * 0.42, w * 0.5 - 66, h * 0.42, c.bad, 2, u.t || 0);
          u.flow(ctx, w * 0.5 + 66, h * 0.42, w * 0.78 - 50, h * 0.42, c.good, 2, u.t || 0);
        },
      },
      {
        t: 6,
        title: "Write blameless RCA",
        desc: "Record impact, timeline, detection gaps and contributing factors.",
        why: "Blameless does not mean vague; it means precise without personal blame.",
        draw(ctx, p, w, h, c, u) {
          const x = w * 0.24, y = h * 0.26, bw = w * 0.52;
          u.fillRR(ctx, x, y, bw, h * 0.36, 9, "rgba(18,27,46,.94)", c.line, 1.4);
          ["impact", "timeline", "detection gap", "contributing factors"].forEach((s, i) => {
            u.text(ctx, s, x + 22, y + 34 + i * 34, { color: i === 0 ? c.bad : c.text, size: 12, mono: true, weight: 700 });
            u.line(ctx, x + 170, y + 29 + i * 34, x + bw - 24, y + 29 + i * 34, c.line, 1.2, [4, 5]);
          });
          sreBox(ctx, c, u, x + bw + 74, y + h * 0.18, 122, 40, "RCA", c.purple);
        },
      },
      {
        t: 8,
        title: "Automate recurring toil",
        desc: "Turn repeat manual steps into runbooks, scripts or guarded controllers.",
        why: "The incident loop closes only when action items reduce the next incident.",
        draw(ctx, p, w, h, c, u) {
          const y = h * 0.42;
          sreBox(ctx, c, u, w * 0.17, y, 104, 40, "action items", c.warn);
          sreBox(ctx, c, u, w * 0.4, y, 104, 40, "runbook", c.go);
          sreBox(ctx, c, u, w * 0.63, y, 116, 40, "automation", c.good);
          sreBox(ctx, c, u, w * 0.84, y, 142, 40, "less manual work", c.purple);
          u.flow(ctx, w * 0.17 + 54, y, w * 0.4 - 54, y, c.warn, 2, u.t || 0);
          u.flow(ctx, w * 0.4 + 54, y, w * 0.63 - 60, y, c.go, 2, u.t || 0);
          u.flow(ctx, w * 0.63 + 60, y, w * 0.84 - 74, y, c.good, 2, u.t || 0);
          if (p > 0.5) u.ring(ctx, w * 0.84, y, c.good, u.clamp((p - 0.5) / 0.5, 0, 1), { from: 48, to: 70, lw: 2 });
        },
      },
    ];

    return makeTimeline(canvas, {
      duration: 10,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 10, "SRE · incident response and toil loop"),
    });
  };

  /* =================================================================== */
  /* M19. BFS WAVE                                                       */
  /* =================================================================== */
  ANIM["bfs-wave"] = (canvas) => {
    // Fixed small graph: level 0 (A) -> 1 (B,C) -> 2 (D,E,F) -> 3 (T).
    const P = {
      A: { x: 0, y: 96 }, B: { x: -170, y: 176 }, C: { x: 170, y: 176 },
      D: { x: -250, y: 262 }, E: { x: -80, y: 262 }, F: { x: 170, y: 262 },
      T: { x: 60, y: 344 },
    };
    const EDGES = [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["C", "B"], ["E", "T"], ["F", "T"]];
    const LEVEL = { A: 0, B: 1, C: 1, D: 2, E: 2, F: 2, T: 3 };

    function drawGraph(ctx, c, u, w, opts) {
      const N = (k) => ({ x: w / 2 + P[k].x, y: P[k].y });
      EDGES.forEach((e) => {
        const a = N(e[0]), b = N(e[1]);
        const onPath = opts.path && opts.path.some((p, i) => i > 0 && opts.path[i - 1] === e[0] && p === e[1]);
        const skipped = opts.skipEdge && e[0] === "C" && e[1] === "B";
        u.line(ctx, a.x, a.y, b.x, b.y, onPath ? c.good : skipped ? c.bad : c.line, onPath ? 2.6 : 1.4, skipped ? [5, 4] : null);
      });
      Object.keys(P).forEach((k) => {
        const p = N(k), lv = LEVEL[k];
        const visited = lv < opts.wave || (lv === opts.wave && opts.waveP >= 1);
        const entering = lv === opts.wave && opts.waveP < 1;
        let fill = c.panel, strokeC = c.line, fg = c.text;
        if (visited) { fill = "rgba(0,173,216,0.16)"; strokeC = "#00add8"; }
        if (entering) { fill = "rgba(0,173,216," + 0.16 * opts.waveP + ")"; strokeC = "#00add8"; }
        if (opts.path && opts.path.indexOf(k) >= 0) { fill = "rgba(58,210,159,0.18)"; strokeC = c.good; fg = c.good; }
        ctx.beginPath(); ctx.arc(p.x, p.y, 21, 0, 7);
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = strokeC; ctx.lineWidth = 1.8; ctx.stroke();
        u.text(ctx, k, p.x, p.y + 4.5, { align: "center", color: fg, size: 13, weight: 700, mono: true });
      });
      return N;
    }
    function drawQueue(ctx, c, u, w, h, items) {
      u.text(ctx, tr("queue: "), w / 2 - 150, h - 34, { color: c.dim, size: 11, mono: true });
      items.forEach((q, i) => {
        u.fillRR(ctx, w / 2 - 96 + i * 40, h - 50, 32, 24, 6, "rgba(0,173,216,0.12)", "#00add8", 1.4);
        u.text(ctx, q, w / 2 - 80 + i * 40, h - 33, { align: "center", color: c.text, size: 12, weight: 700, mono: true });
      });
      if (!items.length) u.text(ctx, "(empty)", w / 2 - 90, h - 34, { color: c.dim, size: 11, mono: true });
    }

    const STEPS = [
      {
        t: 0,
        title: "A graph and a question",
        desc: "Find the shortest route from A to T. Edges are the only roads; nothing is weighted - every hop costs 1.",
        why: "'Shortest' in an unweighted graph is the keyword that should trigger BFS in your head - no other algorithm needed.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 0, waveP: 0 });
          u.badge(ctx, w / 2 - 24, 60, "start: A", "rgba(0,173,216,.9)", "#06121f");
          u.badge(ctx, w / 2 + 96, 344, "target: T", c.warn, "#06121f");
        },
      },
      {
        t: 2.1,
        title: "Enqueue the start",
        desc: "BFS keeps one FIFO queue. Seed it with the start node and mark A visited - the wave begins as a single drop.",
        why: "The queue IS the algorithm: everything else is a loop around it.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 0, waveP: u.clamp(p * 1.6, 0, 1) });
          drawQueue(ctx, c, u, w, h, ["A"]);
        },
      },
      {
        t: 4.2,
        title: "Level 1: dequeue, visit, enqueue",
        desc: "A leaves the queue; its neighbors B and C enter it. Everything one hop from the start is now discovered.",
        why: "FIFO order guarantees the whole of level 1 is processed before anything from level 2 - that is the invariant everything rests on.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 1, waveP: u.clamp(p * 1.6, 0, 1) });
          drawQueue(ctx, c, u, w, h, ["B", "C"]);
        },
      },
      {
        t: 6.3,
        title: "Level 2: the wave spreads",
        desc: "B and C are processed in turn; D, E and F join the queue. The frontier is always a clean ring around what's been seen.",
        why: "Watch the shape: BFS never has a 'deep finger' into the graph - the discovered region grows evenly, like a ripple.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 2, waveP: u.clamp(p * 1.6, 0, 1) });
          drawQueue(ctx, c, u, w, h, ["D", "E", "F"]);
        },
      },
      {
        t: 8.4,
        title: "Visited set: seen once, never again",
        desc: "C also points at B - but B is already visited, so the edge is skipped. Every node enters the queue at most once.",
        why: "Without this check the first cycle would loop forever. With it, total work is O(V+E): each node and each edge touched once.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 2, waveP: 1, skipEdge: true });
          drawQueue(ctx, c, u, w, h, ["D", "E", "F"]);
          u.badge(ctx, w / 2 + 24, 206, "already visited - skip", c.bad, "#fff");
        },
      },
      {
        t: 10.5,
        title: "Target reached = shortest path",
        desc: "T is discovered while processing level 2 - via E. Walking parent links back gives A → B → E → T: three hops, provably minimal.",
        why: "No search or comparison happened: BFS reached T first via a shortest path BY CONSTRUCTION, because all shorter levels were exhausted before.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 3, waveP: u.clamp(p * 2, 0, 1), path: ["A", "B", "E", "T"] });
          u.badge(ctx, w / 2 + 96, 344, "3 hops - minimal", "rgba(58,210,159,.9)", "#06121f");
        },
      },
      {
        t: 12.6,
        title: "Swap the queue for a stack: DFS",
        desc: "Same loop, LIFO container: the search dives A → B → D to the bottom before ever looking at C. Great for 'does a path exist' - useless for 'shortest'.",
        why: "One data structure choice flips the algorithm's personality. Interviews love asking why DFS can't answer shortest-path - now you can show it.",
        draw(ctx, p, w, h, c, u) {
          drawGraph(ctx, c, u, w, { wave: 0, waveP: 1, path: ["A", "B", "D"] });
          u.text(ctx, tr("stack: ") + "[C, E]", w / 2 - 150, h - 34, { color: c.dim, size: 11, mono: true });
          u.badge(ctx, w / 2 - 290, 292, "deep, not wide", c.warn, "#06121f");
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 14.8,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 14.8, "graph traversal · breadth-first search"),
    });
  };

  /* =================================================================== */
  /* M19. LRU CACHE                                                      */
  /* =================================================================== */
  ANIM["lru-cache"] = (canvas) => {
    function drawCache(ctx, c, u, w, opts) {
      const keys = opts.keys, y = 200, cw = 86, gap = 34, mapY = 100;
      const total = keys.length * (cw + gap) + gap + 108 + 54;
      const x0 = (w - total) / 2;
      u.text(ctx, "map[key]*node", x0, mapY - 28, { color: c.dim, size: 11, mono: true });
      keys.forEach((k) => {
        const mi = keys.indexOf(k);
        const mx = x0 + mi * 74;
        u.fillRR(ctx, mx, mapY - 14, 64, 26, 6, c.panel, opts.gone === k ? c.bad : c.line, 1.3);
        u.text(ctx, k + " →", mx + 12, mapY + 4, { color: opts.gone === k ? c.bad : c.text, size: 11.5, mono: true });
        const nodeX = x0 + 54 + gap + mi * (cw + gap) + cw / 2;
        u.line(ctx, mx + 32, mapY + 14, nodeX, y - 26, opts.hot === k ? c.warn : "rgba(122,133,153,.35)", opts.hot === k ? 1.8 : 1);
      });
      u.fillRR(ctx, x0, y - 22, 54, 44, 9, "rgba(169,139,255,0.10)", "#a98bff", 1.5);
      u.text(ctx, "head", x0 + 27, y + 4, { align: "center", color: "#a98bff", size: 10.5, weight: 700, mono: true });
      keys.forEach((k, i) => {
        const nx = x0 + 54 + gap + i * (cw + gap);
        const hot = opts.hot === k, dying = opts.gone === k;
        u.fillRR(ctx, nx, y - 22, cw, 44, 9, dying ? "rgba(255,107,107,0.12)" : hot ? "rgba(245,177,76,0.14)" : "rgba(0,173,216,0.10)", dying ? c.bad : hot ? c.warn : "#00add8", 1.6);
        u.text(ctx, k, nx + cw / 2, y + 4.5, { align: "center", color: dying ? c.bad : c.text, size: 12.5, weight: 700, mono: true });
        u.line(ctx, nx - gap, y - 6, nx, y - 6, c.line, 1.2);
        u.line(ctx, nx, y + 6, nx - gap, y + 6, c.line, 1.2);
      });
      const tx = x0 + 54 + gap + keys.length * (cw + gap);
      u.line(ctx, tx - gap, y - 6, tx, y - 6, c.line, 1.2);
      u.line(ctx, tx, y + 6, tx - gap, y + 6, c.line, 1.2);
      u.fillRR(ctx, tx, y - 22, 54, 44, 9, "rgba(169,139,255,0.10)", "#a98bff", 1.5);
      u.text(ctx, "tail", tx + 27, y + 4, { align: "center", color: "#a98bff", size: 10.5, weight: 700, mono: true });
      u.text(ctx, "most recent", x0 + 54 + gap, y + 48, { color: c.dim, size: 10.5 });
      u.text(ctx, "least recent", tx - gap - 76, y + 48, { color: c.dim, size: 10.5 });
    }
    const STEPS = [
      {
        t: 0,
        title: "Two structures, welded",
        desc: "A map gives O(1) 'where is key K'; a doubly-linked list keeps recency order. The weld: map values are pointers INTO the list.",
        why: "Neither structure alone can do this job - the map can't order, the list can't look up. Interviews assign LRU precisely to test this composition.",
        draw(ctx, p, w, h, c, u) {
          drawCache(ctx, c, u, w, { keys: ["2", "7", "9"] });
          u.badge(ctx, w / 2 - 62, h - 66, "capacity: 3 · full", "rgba(0,173,216,.9)", "#06121f");
        },
      },
      {
        t: 2.3,
        title: "Sentinels: no special cases",
        desc: "head and tail are permanent dummy nodes. Every real node always has a live prev and next - empty and single-node lists need no extra code.",
        why: "The classic interview stumble is nil-checking the list edges. Sentinels delete that whole class of bugs before it exists.",
        draw(ctx, p, w, h, c, u) {
          drawCache(ctx, c, u, w, { keys: ["2", "7", "9"] });
          u.badge(ctx, w / 2 - 240, 140, "never nil", "rgba(169,139,255,.9)", "#06121f");
          u.badge(ctx, w / 2 + 160, 140, "never nil", "rgba(169,139,255,.9)", "#06121f");
        },
      },
      {
        t: 4.6,
        title: "Get(7): jump, unlink, push front",
        desc: "The map lands directly on 7's node - no scan. unlink cuts it out; pushFront re-inserts it after head. 7 is now the most recent.",
        why: "Get is a WRITE to the recency order, not just a read - that reordering is what makes the cache 'least recently USED', not 'least recently ADDED'.",
        draw(ctx, p, w, h, c, u) {
          drawCache(ctx, c, u, w, { keys: p < 0.5 ? ["2", "7", "9"] : ["7", "2", "9"], hot: "7" });
          u.badge(ctx, w / 2 - 104, h - 66, "1 map hop + 4 pointer writes", c.warn, "#06121f");
        },
      },
      {
        t: 7,
        title: "Put(4) on a full cache: evict the tail",
        desc: "Capacity is 3 and 4 is a new key - someone must go. The victim needs no search: it is always tail.prev, here 9. Unlink it, delete its map entry, push 4 to the front.",
        why: "Eviction is O(1) only because the list keeps the victim parked at the tail. A map alone would need an O(n) scan for the oldest entry.",
        draw(ctx, p, w, h, c, u) {
          if (p < 0.45) {
            drawCache(ctx, c, u, w, { keys: ["7", "2", "9"], gone: "9" });
            u.badge(ctx, w / 2 + 40, h - 66, "evict 9: unlink + delete", c.bad, "#fff");
          } else {
            drawCache(ctx, c, u, w, { keys: ["4", "7", "2"], hot: "4" });
            u.badge(ctx, w / 2 - 62, h - 66, "4 is most recent", "rgba(58,210,159,.9)", "#06121f");
          }
        },
      },
      {
        t: 9.3,
        title: "Put(2, new value): update in place",
        desc: "2 already exists: overwrite its value inside the node, move it to the front. No eviction - the size did not change.",
        why: "Forgetting this branch double-inserts the key and silently corrupts the size - the second most common LRU bug after broken pointer order.",
        draw(ctx, p, w, h, c, u) {
          drawCache(ctx, c, u, w, { keys: p < 0.5 ? ["4", "7", "2"] : ["2", "4", "7"], hot: "2" });
        },
      },
      {
        t: 11.6,
        title: "Count the work: O(1), always",
        desc: "Every operation is one map access plus a constant number of pointer writes - no loops, no scans, regardless of cache size.",
        why: "When the interviewer asks 'what's the complexity?', the answer is provable by counting the moves you just watched: nothing depends on n.",
        draw(ctx, p, w, h, c, u) {
          drawCache(ctx, c, u, w, { keys: ["2", "4", "7"] });
          u.legend(ctx, w / 2 - 250, h - 58, [["Get: map + 4 writes", "#00add8"], ["Put: map + ≤6 writes", "#f5b14c"], ["evict: 2 writes + delete", "#ff6b6b"]]);
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 13.9,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 13.9, "LRU cache · map + doubly-linked list"),
    });
  };

  /* =================================================================== */
  /* M19. HASHMAP INTERNALS                                              */
  /* =================================================================== */
  ANIM["hashmap-internals"] = (canvas) => {
    function drawBuckets(ctx, c, u, w, n, opts) {
      const bw = Math.min(150, (w - 80) / n - 14), y = 176, x0 = (w - n * (bw + 14)) / 2;
      for (let b = 0; b < n; b++) {
        const bx = x0 + b * (bw + 14);
        const active = opts.bucket === b;
        u.fillRR(ctx, bx, y, bw, 120, 10, active ? "rgba(0,173,216,0.08)" : c.panel, active ? "#00add8" : c.line, active ? 2 : 1.3);
        u.text(ctx, tr("bucket ") + b, bx + 8, y - 8, { color: active ? "#00add8" : c.dim, size: 10.5, mono: true });
        for (let s = 0; s < 8; s++) {
          const cellW = (bw - 16) / 4 - 4;
          const sx = bx + 8 + (s % 4) * ((bw - 16) / 4), sy = y + 12 + Math.floor(s / 4) * 52;
          const filled = opts.filled && opts.filled[b] > s;
          const isHit = active && opts.hit === s && opts.scanned >= s;
          const isScanned = active && opts.scanned != null && s <= opts.scanned;
          u.fillRR(ctx, sx, sy, cellW, 20, 4, isHit ? "rgba(58,210,159,0.25)" : filled ? "rgba(0,173,216,0.14)" : "transparent", isHit ? c.good : isScanned ? c.warn : c.line, isHit || isScanned ? 1.6 : 1);
          if (filled && active && opts.tops && opts.tops[s] != null) u.text(ctx, opts.tops[s], sx + 5, sy + 14, { color: isHit ? c.good : c.dim, size: 9.5, mono: true });
        }
        u.text(ctx, "8 slots + tophash", bx + 8, y + 148, { color: c.dim, size: 9.5 });
      }
    }
    const STEPS = [
      {
        t: 0,
        title: "One hash, two jobs",
        desc: "hash(\"user:42\") yields 64 bits. Go splits the duty: LOW bits will choose the bucket, the top 8 bits become a one-byte fingerprint (tophash).",
        why: "Reusing one hash for both routing and fingerprinting is why map lookups stay cheap - no second hash function, no full key compare until the last moment.",
        draw(ctx, p, w, h, c, u) {
          u.fillRR(ctx, w / 2 - 200, 130, 400, 46, 10, c.panel, c.line, 1.4);
          u.text(ctx, 'hash("user:42") = 1011 0110 ... 0110 1101', w / 2, 158, { align: "center", color: c.text, size: 12, mono: true });
          u.badge(ctx, w / 2 - 188, 206, "high 8 bits → tophash", c.warn, "#06121f");
          u.badge(ctx, w / 2 + 42, 206, "low bits → bucket", "rgba(0,173,216,.9)", "#06121f");
        },
      },
      {
        t: 2.1,
        title: "Low bits pick the bucket",
        desc: "With 4 buckets, 'low bits' means hash & 3 - a single AND instruction. 0b...01 → bucket 1.",
        why: "This is why the bucket count is always a power of two: modulo becomes a bit-mask, one cycle instead of a division.",
        draw(ctx, p, w, h, c, u) {
          drawBuckets(ctx, c, u, w, 4, { bucket: 1, filled: [3, 5, 2, 4] });
          u.text(ctx, "hash & 0b11 = 01", w / 2, 148, { align: "center", color: "#00add8", size: 12, mono: true });
        },
      },
      {
        t: 4.2,
        title: "tophash: scan 8 bytes, not 8 keys",
        desc: "Inside the bucket, the lookup sweeps eight one-byte tophash stamps first - a single cache line. Full key comparison happens only on a stamp match.",
        why: "String comparison is expensive; byte comparison is nearly free. The tophash array rejects 7 wrong slots without ever touching their keys.",
        draw(ctx, p, w, h, c, u) {
          drawBuckets(ctx, c, u, w, 4, { bucket: 1, filled: [3, 5, 2, 4], scanned: Math.floor(u.clamp(p * 1.4, 0, 1) * 4), hit: 4, tops: ["7c", "e1", "09", "5a", "b6"] });
          if (p > 0.75) u.badge(ctx, w / 2 - 128, 348, "tophash b6 matches → compare full key", "rgba(58,210,159,.9)", "#06121f");
        },
      },
      {
        t: 6.3,
        title: "Collisions land in the same bucket",
        desc: "A different key with the same low bits joins bucket 1 in the next free slot. Eight collisions later, an overflow bucket chains on.",
        why: "Collisions are normal operation, not an error - the design just keeps them within one cache line for as long as possible.",
        draw(ctx, p, w, h, c, u) {
          drawBuckets(ctx, c, u, w, 4, { bucket: 1, filled: [3, p > 0.5 ? 6 : 5, 2, 4] });
          u.badge(ctx, w / 2 - 116, 148, 'hash("user:97") → also bucket 1', c.warn, "#06121f");
        },
      },
      {
        t: 8.4,
        title: "Growth: double and evacuate",
        desc: "Past ~6.5 entries per bucket on average, the table doubles - and entries drift to their new homes INCREMENTALLY, a little on each write, not in one big pause.",
        why: "Incremental evacuation spreads the rehash cost across many operations - the same amortization idea as slice growth, applied to a whole table.",
        draw(ctx, p, w, h, c, u) {
          drawBuckets(ctx, c, u, w, 8, { bucket: 5, filled: [2, 3, 1, 2, 2, 3, 1, 2] });
          u.badge(ctx, w / 2 - 118, 148, "4 → 8 buckets · one more low bit", "rgba(0,173,216,.9)", "#06121f");
        },
      },
      {
        t: 10.5,
        title: "Why iteration order is random",
        desc: "Range starts at a RANDOM bucket and offset on every iteration - deliberately, so no program can accidentally depend on an order that growth would change anyway.",
        why: "This is a favorite interview probe: it checks whether you know maps well enough to never sort-by-iterating. Need order? Collect keys and sort them.",
        draw(ctx, p, w, h, c, u) {
          drawBuckets(ctx, c, u, w, 8, { bucket: Math.floor((u.t || 0) * 1.7) % 8, filled: [2, 3, 1, 2, 2, 3, 1, 2] });
          u.badge(ctx, w / 2 - 108, 148, "range start: random, every time", c.warn, "#06121f");
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 12.7,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 12.7, "map internals · buckets, tophash, growth"),
    });
  };

  /* =================================================================== */
  /* M19. SLICE GROWTH + HEAP                                            */
  /* =================================================================== */
  ANIM["slice-heap"] = (canvas) => {
    function drawSlice(ctx, c, u, w, y, vals, cap, opts) {
      const cw = 52, x0 = w / 2 - (cap * cw) / 2;
      for (let i = 0; i < cap; i++) {
        const filled = i < vals.length, hot = opts && opts.hot === i;
        u.fillRR(ctx, x0 + i * cw, y, cw - 4, 40, 7, filled ? (hot ? "rgba(245,177,76,0.18)" : "rgba(0,173,216,0.10)") : "transparent", filled ? (hot ? c.warn : "#00add8") : c.line, filled ? 1.6 : 1);
        if (filled) u.text(ctx, String(vals[i]), x0 + i * cw + (cw - 4) / 2, y + 25, { align: "center", color: c.text, size: 12.5, weight: 700, mono: true });
      }
      return x0;
    }
    function heapPos(w, i) {
      const row = Math.floor(Math.log2(i + 1)), idxIn = i + 1 - (1 << row);
      const slots = 1 << row;
      return { x: w / 2 + (idxIn - (slots - 1) / 2) * (300 / slots), y: 216 + row * 60 };
    }
    function drawHeap(ctx, c, u, w, vals, opts) {
      vals.forEach((v, i) => {
        if (i > 0) {
          const par = heapPos(w, (i - 1) >> 1), me = heapPos(w, i);
          u.line(ctx, par.x, par.y + 16, me.x, me.y - 16, c.line, 1.2);
        }
      });
      vals.forEach((v, i) => {
        const pos = heapPos(w, i), hot = opts && opts.hot === i;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 17, 0, 7);
        ctx.fillStyle = hot ? "rgba(245,177,76,0.2)" : "rgba(0,173,216,0.12)"; ctx.fill();
        ctx.strokeStyle = hot ? "#f5b14c" : "#00add8"; ctx.lineWidth = 1.7; ctx.stroke();
        u.text(ctx, String(v), pos.x, pos.y + 4.5, { align: "center", color: c.text, size: 12, weight: 700, mono: true });
        u.text(ctx, "[" + i + "]", pos.x + 20, pos.y - 12, { color: c.dim, size: 9, mono: true });
      });
    }
    const STEPS = [
      {
        t: 0,
        title: "A slice is three words",
        desc: "pointer + len + cap, pointing into a backing array. Copying a slice copies these three words - never the elements.",
        why: "Every slice interview question unwinds from this picture: cheap passing, shared mutation, and the growth trap all live in the header.",
        draw(ctx, p, w, h, c, u) {
          u.fillRR(ctx, w / 2 - 150, 116, 300, 40, 9, c.panel, "#a98bff", 1.6);
          u.text(ctx, "ptr · len 3 · cap 5", w / 2, 141, { align: "center", color: "#a98bff", size: 12.5, weight: 700, mono: true });
          const x0 = drawSlice(ctx, c, u, w, 216, [4, 9, 2], 5, {});
          u.arrow(ctx, w / 2 - 120, 156, x0 + 24, 212, "#a98bff", 1.5);
          u.text(ctx, "backing array", w / 2, 292, { align: "center", color: c.dim, size: 11 });
        },
      },
      {
        t: 2.1,
        title: "append with room: just write",
        desc: "len 3, cap 5 - append(s, 7) writes into the existing array and bumps len. No allocation, nothing moves.",
        why: "Within capacity, append is a single store - this is the fast path make([]T, 0, n) buys you when n is known.",
        draw(ctx, p, w, h, c, u) {
          u.text(ctx, "append(s, 7)  →  len 3→4, same array", w / 2, 141, { align: "center", color: c.text, size: 12, mono: true });
          drawSlice(ctx, c, u, w, 216, p > 0.4 ? [4, 9, 2, 7] : [4, 9, 2], 5, { hot: 3 });
        },
      },
      {
        t: 4.2,
        title: "append past cap: reallocate and copy",
        desc: "cap exhausted → allocate a bigger array (double, then ~1.25× for large slices), copy every element, point the NEW slice at it. The old array is abandoned - but anyone still holding it sees stale data.",
        why: "This copy is why append is 'amortized' O(1) - and why two slices that used to share storage silently diverge after one of them grows. The #1 slice interview trap.",
        draw(ctx, p, w, h, c, u) {
          u.text(ctx, "old (cap 5) - abandoned", w / 2, 128, { align: "center", color: c.dim, size: 10.5 });
          ctx.globalAlpha = 0.45;
          drawSlice(ctx, c, u, w, 140, [4, 9, 2, 7, 1], 5, {});
          ctx.globalAlpha = 1;
          u.text(ctx, "new (cap 10)", w / 2, 240, { align: "center", color: c.good, size: 10.5 });
          const shown = Math.ceil(u.clamp(p * 1.5, 0, 1) * 6);
          drawSlice(ctx, c, u, w, 252, [4, 9, 2, 7, 1, 6].slice(0, shown), 10, { hot: 5 });
          if (p > 0.2) u.arrow(ctx, w / 2, 192, w / 2, 244, c.good, 1.6);
        },
      },
      {
        t: 6.6,
        title: "A heap is a slice wearing a tree costume",
        desc: "The same values, two views: slice [1,3,2,9,7] and a complete binary tree. No pointers exist - children of i are 2i+1 and 2i+2, parent is (i-1)/2.",
        why: "Storing the tree as index math makes heaps allocation-free and cache-friendly - and means you can write one on a whiteboard in ten lines.",
        draw(ctx, p, w, h, c, u) {
          drawSlice(ctx, c, u, w, 124, [1, 3, 2, 9, 7], 5, {});
          drawHeap(ctx, c, u, w, [1, 3, 2, 9, 7], {});
          u.text(ctx, "min-heap: every parent ≤ its children", w / 2, h - 36, { align: "center", color: c.dim, size: 11 });
        },
      },
      {
        t: 8.7,
        title: "Push 0: append, then sift up",
        desc: "0 lands at index 5 (a leaf), then swaps with its parent while smaller: 0 < 2 → swap with [2], 0 < 1 → swap with the root. Two hops, done.",
        why: "Sift-up touches one root-to-leaf path - log n swaps worst case, which is the entire cost of insertion.",
        draw(ctx, p, w, h, c, u) {
          const stage = p < 0.35 ? [1, 3, 2, 9, 7, 0] : p < 0.7 ? [1, 3, 0, 9, 7, 2] : [0, 3, 1, 9, 7, 2];
          const hot = p < 0.35 ? 5 : p < 0.7 ? 2 : 0;
          drawSlice(ctx, c, u, w, 124, stage, 6, { hot: hot });
          drawHeap(ctx, c, u, w, stage, { hot: hot });
        },
      },
      {
        t: 10.8,
        title: "Pop the min: last to root, sift down",
        desc: "Take index 0 (always the minimum). Move the LAST element to the root, shrink the slice, and let it sink: swap with the smaller child until both children are bigger.",
        why: "Pop is the other half of every priority queue - 'k largest', 'merge k lists' and heapsort are just push and pop in a loop.",
        draw(ctx, p, w, h, c, u) {
          const stage = p < 0.35 ? [2, 3, 1, 9, 7] : [1, 3, 2, 9, 7];
          const hot = p < 0.35 ? 0 : 2;
          drawSlice(ctx, c, u, w, 124, stage, 6, { hot: hot });
          drawHeap(ctx, c, u, w, stage, { hot: hot });
          u.badge(ctx, w / 2 - 210, 98, "popped: 0", "rgba(58,210,159,.9)", "#06121f");
        },
      },
      {
        t: 12.9,
        title: "Choosing the structure",
        desc: "Need lookup by key? Map. Need repeated access to the extreme? Heap. Need order and cheap append? Slice. Most interview problems are one of these three sentences.",
        why: "Interviewers rarely want exotic structures - they want the right basic one, chosen out loud with its costs. That sentence is the answer.",
        draw(ctx, p, w, h, c, u) {
          u.legend(ctx, w / 2 - 240, 160, [["map: O(1) by key", "#00add8"], ["heap: O(log n) extreme", "#f5b14c"], ["slice: O(1) append*", "#3ad29f"]]);
          u.text(ctx, "* amortized - now you can explain the asterisk", w / 2, 210, { align: "center", color: c.dim, size: 11.5 });
        },
      },
    ];
    return makeTimeline(canvas, {
      duration: 15,
      phases: STEPS.map((s) => ({ t: s.t, title: s.title, desc: s.desc, why: s.why })),
      render: stepRender(STEPS, 15, "slices & heaps · memory layout as an algorithm"),
    });
  };

  /* ------------------------------------------------------------ export */
  window.ANIMATIONS = ANIM;
  window.CANVAS_RU = CANVAS_RU; // reused by app.js to translate step title/desc/why captions
  window.CANVAS_AZ = CANVAS_AZ; // same, for Azerbaijani
  window.addEventListener("resize", () => {
    // Resize every active player (a module page may show several at once).
    const list = window.__activeAnims || (window.__activeAnim ? [window.__activeAnim] : []);
    list.forEach((a) => { if (a && a.resize) a.resize(); });
  });
})();

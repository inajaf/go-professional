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
    ctx.fillText(str, x, y);
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
    const w = ctx.measureText(str).width + 16;
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
        frameCb(t / dur, { index: i, total: phases.length, title: phases[i].title, desc: phases[i].desc });
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
  ANIM["gc-mark-sweep"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 12,
      phases: [
        { t: 0, title: "Heap snapshot", desc: "Objects on the heap. Some are reachable from the roots (live); the cluster on the lower-right is unreachable garbage." },
        { t: 1.6, title: "Grey the roots", desc: "Marking starts from the roots (global variables + goroutine stacks). Objects they point to turn grey = 'reachable, not yet scanned'." },
        { t: 3.6, title: "Scan grey → black", desc: "Each grey object is scanned (→ black = done) and its children are greyed. The reachable wave spreads outward, level by level." },
        { t: 7.2, title: "White = dead", desc: "When no grey objects remain, everything still white is unreachable. Notice the garbage cluster was never touched." },
        { t: 9.2, title: "Sweep", desc: "The collector reclaims every white object; its memory returns to the heap. Live (black) objects are untouched." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "garbage collector · tri-color mark & sweep", 24, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const N = (fx) => 24 + fx * (w - 48);
        const M = (fy) => 56 + fy * (h - 120);
        const nodes = {
          r1: { x: .04, y: .30, lvl: -1, root: true }, r2: { x: .04, y: .66, lvl: -1, root: true },
          A: { x: .26, y: .18, lvl: 1 }, F: { x: .26, y: .70, lvl: 1 },
          B: { x: .46, y: .07, lvl: 2 }, C: { x: .46, y: .33, lvl: 2 }, G: { x: .46, y: .72, lvl: 2 },
          D: { x: .66, y: .05, lvl: 3 }, E: { x: .66, y: .30, lvl: 3 },
          X: { x: .80, y: .60, g: true }, Y: { x: .94, y: .60, g: true }, Z: { x: .87, y: .85, g: true },
        };
        const edges = [["r1", "A"], ["r2", "F"], ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"], ["F", "G"], ["X", "Y"]];
        const marking = t >= 1.6;
        const frontier = u.seg(t, 1.6, 7) * 4; // 0..4
        const sweepA = u.seg(t, 9.2, 11);
        function color(k) {
          const n = nodes[k];
          if (n.g) return "white";
          if (!marking) return "white";
          if (n.root) return "black";
          if (frontier < n.lvl) return "white";
          if (frontier < n.lvl + 1) return "grey";
          return "black";
        }
        // edges
        edges.forEach((e) => {
          const a = nodes[e[0]], b = nodes[e[1]];
          const live = color(e[0]) !== "white" && !a.g;
          u.line(ctx, N(a.x), M(a.y), N(b.x), M(b.y), a.g ? c.line : live ? c.goSoft : c.line, a.g ? 1.3 : live ? 2 : 1.4, a.g ? [4, 4] : null);
        });
        // nodes
        Object.keys(nodes).forEach((k) => {
          const n = nodes[k], col = color(k), gone = n.g && sweepA > 0;
          const x = N(n.x), y = M(n.y), R = n.root ? 17 : 15;
          let fill = c.panel, stroke = c.line, fg = c.dim;
          if (col === "grey") { fill = "rgba(245,177,76,.85)"; stroke = c.warn; fg = "#1c1406"; }
          if (col === "black") { fill = "rgba(0,173,216,.9)"; stroke = c.go; fg = "#04121c"; }
          if (n.g && t >= 7.2 && sweepA === 0) { stroke = c.bad; } // flag garbage
          ctx.globalAlpha = gone ? 1 - sweepA : 1;
          if (n.root) {
            u.fillRR(ctx, x - 26, y - 13, 52, 26, 7, fill === c.panel ? "rgba(0,173,216,.9)" : fill, c.go, 2);
            u.text(ctx, "root", x, y + 4, { align: "center", color: "#04121c", size: 11, weight: 700, mono: true });
          } else {
            ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fillStyle = fill; ctx.fill();
            ctx.lineWidth = n.g && t >= 7.2 && sweepA === 0 ? 2.2 : 1.6; ctx.strokeStyle = stroke; ctx.stroke();
            u.text(ctx, k, x, y + 4, { align: "center", color: fg, size: 11, weight: 700, mono: true });
          }
          ctx.globalAlpha = 1;
        });
        // garbage label
        if (t < 9.2) u.text(ctx, "unreachable", N(.87), M(.99), { align: "center", color: t >= 7.2 ? c.bad : c.dim, size: 10.5, weight: 600 });
        else u.text(ctx, "✓ swept · memory freed", N(.87), M(.99), { align: "center", color: c.good, size: 10.5, weight: 700 });
        // legend
        u.legend(ctx, 24, h - 14, [
          ["white = unreached", c.panel, c.dim],
          ["grey = reachable", c.warn], ["black = live", c.go],
        ]);
      },
    });

  /* =================================================================== */
  /* F2. CPU SAMPLING → FLAME GRAPH                                      */
  /* =================================================================== */
  ANIM["pprof-flame"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 11,
      phases: [
        { t: 0, title: "The program runs", desc: "A request flows through main → handleRequest and several child functions. Some are far hotter than others." },
        { t: 1.6, title: "The sampler ticks", desc: "About 100 times per second, pprof records whatever call stack is executing right now — cheap statistical sampling." },
        { t: 5, title: "Samples become a flame graph", desc: "Stacks aggregate into bars. A box sits inside its caller; box WIDTH is the share of time spent there." },
        { t: 8, title: "Find the widest box", desc: "reflectWalk is the widest leaf — the hotspot. Optimize that first; the tall narrow stacks barely cost anything." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "go tool pprof · CPU flame graph", 24, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const frames = [
          { n: "main", x: 0, w: 1, lvl: 0 },
          { n: "handleRequest", x: 0, w: 1, lvl: 1 },
          { n: "parseJSON", x: 0, w: .5, lvl: 2 },
          { n: "validate", x: .5, w: .3, lvl: 2 },
          { n: "writeLog", x: .8, w: .2, lvl: 2 },
          { n: "reflectWalk", x: 0, w: .4, lvl: 3, hot: true },
          { n: "jsonAlloc", x: .4, w: .1, lvl: 3 },
        ];
        const x0 = 24, plotW = w - 48, rowH = 32, bottomY = h - 70;
        const grow = u.easeOut(u.seg(t, 1.6, 5));
        const cols = [c.go, c.goSoft, c.warn, c.accent];
        frames.forEach((f) => {
          const fw = f.w * plotW * grow, fx = x0 + f.x * plotW * grow;
          const y = bottomY - f.lvl * (rowH + 4);
          const hot = f.hot && t >= 5;
          const base = cols[f.lvl % cols.length];
          u.fillRR(ctx, fx, y, Math.max(fw - 2, 1), rowH, 5,
            hot ? "rgba(255,107,107,.85)" : base, hot ? c.bad : "rgba(0,0,0,.15)", hot ? 2.5 : 1);
          if (fw > 44) u.text(ctx, f.n, fx + 7, y + rowH / 2 + 4, { color: f.lvl === 0 ? "#04121c" : "#06121f", size: 11, weight: 600, mono: true });
          // hot pulse
          if (hot) {
            const pr = 0.5 + 0.5 * Math.sin(t * 5);
            ctx.strokeStyle = "rgba(255,107,107," + (0.2 + 0.3 * pr) + ")"; ctx.lineWidth = 2;
            u.rr(ctx, fx - 2, y - 2, fw + 2, rowH + 4, 6); ctx.stroke();
          }
        });
        // sampler + counter
        if (t >= 1.6 && t < 5.2) {
          const blink = Math.sin(t * 14) > 0;
          u.text(ctx, "sampler", x0, 58, { color: c.warn, size: 12, weight: 700 });
          u.dot(ctx, x0 + 64, 53, 5, blink ? c.warn : c.dim, blink ? "rgba(245,177,76,.5)" : null);
          // a sample dot dropping onto a frame
          const drop = (t * 2) % 1;
          const tx = x0 + ((t * 137) % (plotW * 0.6));
          u.dot(ctx, tx, u.lerp(60, bottomY - 3 * (rowH + 4), drop), 3, c.warn);
        }
        const samples = Math.floor(u.seg(t, 1.6, 5) * 312);
        u.text(ctx, "samples: " + samples, w - 24, 58, { align: "right", color: c.dim, size: 12, mono: true, weight: 600 });
        // hotspot callout
        if (t >= 8) {
          const a = u.seg(t, 8, 8.6);
          ctx.globalAlpha = a;
          u.fillRR(ctx, x0, 70, 300, 30, 8, "rgba(255,107,107,.1)", c.bad, 1.6);
          u.text(ctx, "▲ reflectWalk = 40% of CPU — optimize here first", x0 + 10, 90, { color: c.bad, size: 11.5, weight: 700 });
          ctx.globalAlpha = 1;
        }
        u.text(ctx, "width = time spent   ·   stacked = called-by", x0, h - 24, { color: c.dim, size: 11 });
      },
    });

  /* =================================================================== */
  /* F3. TABLE-DRIVEN TEST RUNNER                                        */
  /* =================================================================== */
  ANIM["test-runner"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 11,
      phases: [
        { t: 0, title: "A table of cases", desc: "Each row is an input pair and the expected (want) value for Add(a, b)." },
        { t: 1.5, title: "go test runs each case", desc: "t.Run executes the cases one at a time as isolated, named subtests." },
        { t: 1.5, title: "Inputs flow in", desc: "For the active case, the inputs travel into the function and it computes a result (got)." },
        { t: 1.5, title: "Compare got vs want", desc: "got is compared to want. Equal → the row passes (green). A mismatch would fail with a clear message." },
        { t: 8, title: "Summary", desc: "go test reports the result. Run it daily as: go test -race -cover ./..." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "go test · table-driven subtests", 24, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const cases = [
          { n: "positives", a: 2, b: 3, want: 5 },
          { n: "with_zero", a: 0, b: 0, want: 0 },
          { n: "negatives", a: -2, b: 2, want: 0 },
          { n: "bigger", a: 10, b: 5, want: 15 },
        ];
        const start = 1.5, per = 1.45;
        const cur = Math.floor((t - start) / per);
        const localT = (t - start) - cur * per; // 0..per within current case
        // function box (center)
        const fx = w / 2 - 70, fy = 70, fw = 140, fh = 52;
        const busy = t >= start && cur < cases.length && localT > 0.3 && localT < 0.75;
        u.fillRR(ctx, fx, fy, fw, fh, 11, busy ? "rgba(0,173,216,.14)" : c.panel, c.go, busy ? 2.2 : 1.6);
        u.text(ctx, "Add(a, b)", fx + fw / 2, fy + 22, { align: "center", color: c.go, size: 13, weight: 700, mono: true });
        u.text(ctx, "return a + b", fx + fw / 2, fy + 40, { align: "center", color: c.dim, size: 11, mono: true });
        // rows (left) + results (right)
        const top = 150, rowH = 46, lx = 24, rw = 200;
        const rx = w - 24 - rw;
        cases.forEach((cs, i) => {
          const y = top + i * rowH;
          const done = t >= start && i < cur;
          const active = t >= start && i === cur;
          const pass = true; // all designed to pass
          let stroke = c.line, fill = c.panel;
          if (active) { stroke = c.warn; fill = "rgba(245,177,76,.08)"; }
          if (done) { stroke = c.good; fill = "rgba(58,210,159,.08)"; }
          // case row (left)
          u.fillRR(ctx, lx, y, rw, 36, 9, fill, stroke, active ? 2 : 1.4);
          u.text(ctx, "t.Run(\"" + cs.n + "\")", lx + 10, y + 15, { color: c.text, size: 10.5, mono: true, weight: 600 });
          u.text(ctx, "Add(" + cs.a + "," + cs.b + ") want " + cs.want, lx + 10, y + 29, { color: c.dim, size: 10.5, mono: true });
          // result (right)
          if (done || (active && localT > 0.78)) {
            u.fillRR(ctx, rx, y, rw, 36, 9, "rgba(58,210,159,.08)", c.good, 1.6);
            u.text(ctx, "got " + (cs.a + cs.b) + " == " + cs.want, rx + 10, y + 16, { color: c.text, size: 10.5, mono: true });
            u.text(ctx, "✓ PASS", rx + rw - 14, y + 24, { align: "right", color: c.good, size: 12, weight: 700 });
          } else if (active) {
            u.fillRR(ctx, rx, y, rw, 36, 9, c.panel, c.line, 1.2);
            u.text(ctx, "running…", rx + 12, y + 22, { color: c.warn, size: 11, mono: true });
          } else {
            u.fillRR(ctx, rx, y, rw, 36, 9, c.panel, c.line, 1.1);
            u.text(ctx, "queued", rx + 12, y + 22, { color: c.dim, size: 11, mono: true, alpha: .6 });
          }
          // animated token for the active case: input -> fn -> result
          if (active && cases.length) {
            const cy = y + 18;
            if (localT < 0.32) {
              const p = localT / 0.32;
              const px = u.lerp(lx + rw, fx, u.easeInOut(p));
              u.dot(ctx, px, u.lerp(cy, fy + fh / 2, p), 5, c.warn, "rgba(245,177,76,.5)");
            } else if (localT > 0.45 && localT < 0.8) {
              const p = (localT - 0.45) / 0.35;
              const px = u.lerp(fx + fw, rx, u.easeInOut(p));
              u.dot(ctx, px, u.lerp(fy + fh / 2, cy, p), 5, c.good, "rgba(58,210,159,.5)");
            }
          }
        });
        u.text(ctx, "test cases", lx + 6, top - 8, { color: c.dim, size: 10.5, weight: 600 });
        u.text(ctx, "results", rx + 6, top - 8, { color: c.dim, size: 10.5, weight: 600 });
        // summary
        if (t >= 8) {
          const a = u.seg(t, 8, 8.6);
          ctx.globalAlpha = a;
          u.fillRR(ctx, w / 2 - 160, h - 52, 320, 34, 9, "rgba(58,210,159,.1)", c.good, 1.6);
          u.text(ctx, "ok   4/4 passed   ·   coverage 100%", w / 2, h - 30, { align: "center", color: c.good, size: 13, weight: 700, mono: true });
          ctx.globalAlpha = 1;
        }
      },
    });

  /* =================================================================== */
  /* F4. WORKER POOL — FAN-OUT / FAN-IN                                  */
  /* =================================================================== */
  ANIM["worker-pool"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 10,
      phases: [
        { t: 0, title: "Jobs on a channel", desc: "Six work items wait on a buffered jobs channel, ready to be processed." },
        { t: 1.2, title: "Fan-out to workers", desc: "Three worker goroutines each pull from the same jobs channel — work spreads across them concurrently." },
        { t: 2.4, title: "Workers process", desc: "Each worker runs its task (highlighted = busy), then emits a result." },
        { t: 3.5, title: "Fan-in the results", desc: "Every worker sends to one shared results channel — their output is merged for the collector." },
        { t: 7.5, title: "Drained", desc: "All six jobs were processed exactly once, with at most three running at a time. No locks, no shared mutable state." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "concurrency · worker pool (fan-out / fan-in)", 24, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const NJOBS = 6, NW = 3, base = 1.2, transit = 0.5, proc = 1.4, cycle = transit + proc + transit;
        const qx = 70, qTop = 70, qSp = 42;
        const wx = w / 2 - 55, wTop = 95, wSp = 78, wW = 110, wH = 52;
        const rx = w - 96, rTop = 70, rSp = 42;
        // lanes / labels
        u.text(ctx, "jobs ch", qx + 18, 56, { color: c.dim, size: 11, weight: 600 });
        u.text(ctx, "workers", wx + wW / 2, 56, { align: "center", color: c.go, size: 11, weight: 700 });
        u.text(ctx, "results ch", rx + 28, 56, { color: c.dim, size: 11, weight: 600 });
        // compute job states
        function jobState(i) {
          const k = i < NW ? 0 : 1, wkr = i % NW;
          const leave = base + k * cycle, reachW = leave + transit, doneP = reachW + proc, reachR = doneP + transit;
          const qSlotY = qTop + i * qSp + 14, wcx = wx + wW / 2, wcy = wTop + wkr * wSp + wH / 2;
          const rSlotY = rTop + i * rSp + 14;
          if (t < leave) return { st: "queued", x: qx + 16, y: qSlotY, wkr };
          if (t < reachW) { const p = u.easeInOut((t - leave) / transit); return { st: "toW", x: u.lerp(qx + 16, wcx, p), y: u.lerp(qSlotY, wcy, p), wkr }; }
          if (t < doneP) return { st: "proc", x: wcx, y: wcy, wkr, prog: (t - reachW) / proc };
          if (t < reachR) { const p = u.easeInOut((t - doneP) / transit); return { st: "toR", x: u.lerp(wcx, rx + 16, p), y: u.lerp(wcy, rSlotY, p), wkr }; }
          return { st: "done", x: rx + 16, y: rSlotY, wkr };
        }
        const states = [];
        for (let i = 0; i < NJOBS; i++) states.push(jobState(i));
        // worker boxes (highlight if a job is processing there)
        for (let wkr = 0; wkr < NW; wkr++) {
          const y = wTop + wkr * wSp, busy = states.some((s) => s.st === "proc" && s.wkr === wkr);
          u.fillRR(ctx, wx, y, wW, wH, 11, busy ? "rgba(0,173,216,.14)" : c.panel, busy ? c.go : c.line, busy ? 2.2 : 1.5);
          u.text(ctx, "worker " + (wkr + 1), wx + wW / 2, y + 22, { align: "center", color: busy ? c.go : c.dim, size: 12, weight: 700, mono: true });
          u.text(ctx, busy ? "busy…" : "idle", wx + wW / 2, y + 39, { align: "center", color: busy ? c.go : c.dim, size: 10.5, mono: true });
        }
        // channel rails
        u.line(ctx, qx + 16, qTop + 6, qx + 16, qTop + NJOBS * qSp, c.line, 1.4, [3, 4]);
        u.line(ctx, rx + 16, rTop + 6, rx + 16, rTop + NJOBS * rSp, c.line, 1.4, [3, 4]);
        // job tokens
        states.forEach((s, i) => {
          const col = s.st === "done" ? c.good : s.st === "queued" ? c.goSoft : s.st === "proc" ? c.go : c.warn;
          u.dot(ctx, s.x, s.y, 9, col, s.st === "proc" ? "rgba(0,173,216,.45)" : null);
          u.text(ctx, "J" + (i + 1), s.x, s.y + 3.5, { align: "center", color: "#04121c", size: 9.5, weight: 800, mono: true });
          if (s.st === "proc") { // progress ring
            ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(s.x, s.y, 13, -1.57, -1.57 + s.prog * 6.28); ctx.stroke();
          }
        });
        // counter
        const done = states.filter((s) => s.st === "done").length;
        u.text(ctx, "processed: " + done + " / " + NJOBS, w / 2, h - 24, { align: "center", color: done === NJOBS ? c.good : c.dim, size: 13, weight: 700, mono: true });
        u.legend(ctx, 24, h - 12, [["queued", c.goSoft], ["processing", c.go], ["done", c.good]]);
      },
    });

  /* =================================================================== */
  /* F5. CONTEXT CANCELLATION TREE                                       */
  /* =================================================================== */
  ANIM["error-context"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 10,
      phases: [
        { t: 0, title: "Root context", desc: "A request creates a root context at the top of the call tree." },
        { t: 1.2, title: "Children derive contexts", desc: "Each goroutine derives a child context via WithCancel / WithTimeout. They form a tree." },
        { t: 4, title: "Timeout fires", desc: "The deadline elapses (or someone calls cancel()) at the root. ctx.Done() closes." },
        { t: 5, title: "Cancellation propagates", desc: "The signal flows down every edge — each child's Done() closes too, and the goroutine returns." },
        { t: 8, title: "Clean shutdown", desc: "Cancellation reached every descendant. No goroutine is left blocked — no leak." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "context · cancellation propagates down the tree", 24, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const N = (fx) => 24 + fx * (w - 48), M = (fy) => 64 + fy * (h - 120);
        const nodes = {
          root: { x: .5, y: .05, d: 0, label: "ctx (root)", sub: "Background" },
          c1: { x: .26, y: .42, d: 1, label: "WithCancel", sub: "child" },
          c2: { x: .74, y: .42, d: 1, label: "WithTimeout 2s", sub: "child" },
          g1: { x: .12, y: .82, d: 2, label: "worker", sub: "goroutine" },
          g2: { x: .38, y: .82, d: 2, label: "worker", sub: "goroutine" },
          g3: { x: .62, y: .82, d: 2, label: "worker", sub: "goroutine" },
          g4: { x: .88, y: .82, d: 2, label: "worker", sub: "goroutine" },
        };
        const edges = [["root", "c1"], ["root", "c2"], ["c1", "g1"], ["c1", "g2"], ["c2", "g3"], ["c2", "g4"]];
        const appear = (d) => u.clamp(u.seg(t, d * 1.2, d * 1.2 + 0.8), 0, 1);
        const cancelled = (n) => {
          if (t < 4) return false;
          if (n.d === 0) return true;
          const wave = u.seg(t, 5, 8) * 2; // reaches depth 2 at t=8
          return wave >= n.d;
        };
        // edges + propagation pulse
        edges.forEach((e) => {
          const a = nodes[e[0]], b = nodes[e[1]];
          const aa = Math.min(appear(a.d), appear(b.d));
          ctx.globalAlpha = aa;
          const childCancelled = cancelled(b);
          u.line(ctx, N(a.x), M(a.y) + 16, N(b.x), M(b.y) - 16, childCancelled ? c.bad : c.good, childCancelled ? 2.2 : 1.8);
          // moving cancel pulse when parent cancelled but along the spreading edge
          if (cancelled(a) && t >= 5 && t < 8.2) {
            const wave = u.seg(t, 5, 8) * 2;
            const localp = u.clamp(wave - (b.d - 1), 0, 1);
            if (localp > 0 && localp < 1) {
              u.dot(ctx, u.lerp(N(a.x), N(b.x), localp), u.lerp(M(a.y) + 16, M(b.y) - 16, localp), 5, c.bad, "rgba(255,107,107,.5)");
            }
          }
          ctx.globalAlpha = 1;
        });
        // nodes
        Object.keys(nodes).forEach((k) => {
          const n = nodes[k], a = appear(n.d); if (a <= 0.02) return;
          const dead = cancelled(n);
          ctx.globalAlpha = a;
          const fill = dead ? "rgba(255,107,107,.12)" : "rgba(58,210,159,.10)";
          const stroke = dead ? c.bad : c.good;
          const x = N(n.x), y = M(n.y), bw = 110, bh = 44;
          // cancel flash on root
          if (k === "root" && t >= 4 && t < 4.7) { const f = 0.5 + 0.5 * Math.sin(t * 26); ctx.globalAlpha = a; ctx.strokeStyle = "rgba(255,107,107," + f + ")"; ctx.lineWidth = 3; u.rr(ctx, x - bw / 2 - 3, y - bh / 2 - 3, bw + 6, bh + 6, 12); ctx.stroke(); }
          u.fillRR(ctx, x - bw / 2, y - bh / 2, bw, bh, 11, fill, stroke, dead ? 2 : 1.7);
          u.text(ctx, n.label, x, y - 2, { align: "center", color: dead ? c.bad : c.text, size: 11, weight: 700, mono: true });
          u.text(ctx, dead ? "ctx.Done() ✓" : "running ●", x, y + 14, { align: "center", color: dead ? c.bad : c.good, size: 10, weight: 600, mono: true });
          ctx.globalAlpha = 1;
        });
        // status
        if (t >= 8.2) u.text(ctx, "✓ every goroutine returned — no leaks", w / 2, h - 22, { align: "center", color: c.good, size: 12.5, weight: 700 });
        else if (t >= 4) u.text(ctx, "cancellation propagating…", w / 2, h - 22, { align: "center", color: c.bad, size: 12, weight: 600 });
        u.legend(ctx, 24, h - 12, [["running", c.good], ["cancelled", c.bad]]);
      },
    });

  /* =================================================================== */
  /* M1. THE MUX TRIE & IO SANDBOX                                       */
  /* =================================================================== */
  ANIM["mux-trie"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 11,
      phases: [
        { t: 0, title: "Request arrives", desc: "GET /api/v1/ledger/42 enters the native net/http ServeMux router." },
        { t: 1, title: "Walk the radix trie", desc: "The router matches each path segment against trie nodes, in order, until it reaches a handler." },
        { t: 4.4, title: "Capture the wildcard", desc: 'The {id} node captures "42". In the handler it is read with r.PathValue("id") — no regexp.' },
        { t: 5.4, title: "Handler resolves", desc: "A handler matching both method and path runs and returns 200 OK." },
        { t: 7.3, title: "os.Root: escape attempt", desc: "On the right, a read of ../../etc/passwd tries to break out of the data/ jail." },
        { t: 9.6, title: "The jail holds", desc: "Traversal is blocked at the boundary; only reads that resolve inside data/ succeed." },
      ],
      render(ctx, t, w, h, c, u) {
        const splitX = w * 0.58;
        const nodes = ["/", "api", "v1", "ledger", "{id}", "audit"];
        const labels = ["/", "/api", "/v1", "/ledger", "{id}", "/audit"];
        const n = nodes.length, x0 = 40, x1 = splitX - 30, y = h * 0.30, step = (x1 - x0) / (n - 1);
        u.text(ctx, "net/http  ServeMux  ·  radix trie", 40, 30, { color: c.go, size: 13, weight: 700, mono: true });
        const matchT = u.seg(t, 1, 5);
        const active = u.clamp(Math.floor(matchT * (n - 1) + 0.0001), -1, n - 1);
        for (let i = 0; i < n - 1; i++) {
          const lit = (t >= 1) && (matchT * (n - 1) > i);
          u.line(ctx, x0 + step * i + 16, y, x0 + step * (i + 1) - 16, y, lit ? c.go : c.line, lit ? 2.5 : 1.5);
        }
        for (let i = 0; i < n; i++) {
          const nx = x0 + step * i, on = t >= 1 && i <= active && active >= 0, wild = nodes[i] === "{id}";
          u.fillRR(ctx, nx - 16, y - 16, 32, 32, 9, on ? (wild ? c.warn : c.go) : c.panel, on ? (wild ? c.warn : c.go) : c.line, on ? 2 : 1.5);
          u.text(ctx, nodes[i], nx, y + 4, { align: "center", color: on ? "#06101f" : c.dim, size: 10, weight: 700, mono: true });
          u.text(ctx, labels[i], nx, y + 32, { align: "center", color: on ? c.text : c.dim, size: 10, mono: true, alpha: on ? 1 : 0.5 });
        }
        if (u.within(t, 0, 6)) {
          const dx = u.lerp(x0 - 10, x0 + step * (n - 1), u.seg(t, 0.6, 5, u.easeInOut));
          u.dot(ctx, dx, y, 5, "#fff", c.go);
        }
        u.fillRR(ctx, 40, 56, 230, 26, 7, c.panel, c.line, 1.5);
        u.text(ctx, "GET /api/v1/ledger/42", 52, 73, { color: c.goSoft, mono: true, size: 12, weight: 600 });
        if (t >= 4.4) {
          const a = u.seg(t, 4.4, 5.2);
          u.fillRR(ctx, x0 + step * 4 - 44, y + 52, 120, 30, 8, c.panel, c.warn, 1.5);
          u.text(ctx, 'id := r.PathValue', x0 + step * 4 - 36, y + 64, { color: c.dim, size: 9.5, mono: true, alpha: a });
          u.text(ctx, '"42"', x0 + step * 4 - 36, y + 77, { color: c.warn, size: 12, mono: true, weight: 700, alpha: a });
        }
        if (t >= 5.4) u.badge(ctx, x1 - 60, y - 70, "200 OK", c.good);
        u.line(ctx, splitX, 20, splitX, h - 20, c.line, 1.5, [4, 6]);
        const jx = splitX + 24, jy = 66, jw = w - jx - 30, jh = h - 110;
        u.text(ctx, 'os.Root("data")  ·  IO jail', jx, 30, { color: c.accent, size: 13, weight: 700, mono: true });
        u.fillRR(ctx, jx, jy, jw, jh, 12, "rgba(206,50,98,0.06)", c.accent, 2);
        u.text(ctx, "jail boundary", jx + jw - 8, jy + 16, { align: "right", color: c.accent, size: 10, weight: 600, alpha: 0.7 });
        const fy = jy + 50;
        ["config.json", "ledger.db"].forEach((f, i) => {
          u.fillRR(ctx, jx + 18, fy + i * 34, jw - 36, 26, 7, c.panel, c.line, 1.2);
          u.text(ctx, "📄 data/" + f, jx + 28, fy + 17 + i * 34, { color: c.text, size: 11, mono: true });
        });
        const cx = jx - 4;
        if (u.within(t, 7.3, 9.4)) {
          const p = u.seg(t, 7.5, 8.4, u.easeOut), bounce = t > 8.5 ? u.seg(t, 8.5, 9.2) : 0;
          const px = u.lerp(cx, cx + 90, p) - bounce * 70;
          u.dot(ctx, px, jy + jh / 2, 6, c.bad, "rgba(255,107,107,.5)");
          u.text(ctx, '../../etc/passwd', cx - 6, jy + jh / 2 - 18, { align: "right", color: c.bad, size: 11, mono: true });
          if (t > 8.4) {
            u.line(ctx, jx, jy + 8, jx, jy + jh - 8, c.bad, 3 + Math.sin(t * 30) * 1.5);
            u.text(ctx, "✗ blocked", cx - 6, jy + jh / 2 + 4, { align: "right", color: c.bad, size: 12, weight: 700 });
          }
        }
        if (t >= 9.6) {
          const p = u.seg(t, 9.7, 10.6, u.easeOut), px = u.lerp(cx - 10, jx + 60, p);
          u.dot(ctx, px, jy + jh / 2 + 30, 6, c.good, "rgba(58,210,159,.5)");
          u.text(ctx, 'root.Open("config.json")', cx - 6, jy + jh / 2 + 56, { align: "right", color: c.good, size: 10.5, mono: true });
          if (p > 0.9) u.text(ctx, "✓ ok", jx + 70, jy + jh / 2 + 34, { color: c.good, size: 12, weight: 700 });
        }
      },
    });

  /* =================================================================== */
  /* M2. SWISS TABLE vs LEGACY MAP                                       */
  /* =================================================================== */
  ANIM["swiss-table"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 9,
      phases: [
        { t: 0, title: "Same lookup, two maps", desc: 'We look up m["USD"] in the old map and in the new Swiss Table, side by side.' },
        { t: 1, title: "Legacy: probe slot by slot", desc: "The old map walks the bucket one entry at a time. Each entry it checks and misses is a separate cache miss." },
        { t: 4.5, title: "Swiss: hash one group of 8", desc: "The Swiss Table jumps to an 8-slot group and loads its 8 control bytes — a single cache line." },
        { t: 5.8, title: "SIMD compares all 8 at once", desc: "One SIMD-style operation checks every control byte in parallel and finds the match immediately." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, 'm["USD"]  →  lookup trace', 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const colW = (w - 80) / 2, lx = 40, sx = 40 + colW + 20, top = 64;
        u.text(ctx, "Legacy map · bucket chaining", lx, 54, { color: c.dim, size: 12, weight: 600 });
        const slots = ["EUR", "GBP", "JPY", "CHF", "USD", "—"];
        const probeT = u.seg(t, 1, 4.2), probe = Math.floor(probeT * slots.length);
        for (let i = 0; i < slots.length; i++) {
          const y = top + i * 34, visited = t >= 1 && i < probe, cur = t >= 1 && i === probe && probe < slots.length, hit = slots[i] === "USD" && t >= 1 && i <= probe;
          let fill = c.panel, stroke = c.line;
          if (visited && !hit) { fill = "rgba(255,107,107,0.14)"; stroke = c.bad; }
          if (cur) { fill = "rgba(245,177,76,0.16)"; stroke = c.warn; }
          if (hit) { fill = "rgba(58,210,159,0.18)"; stroke = c.good; }
          u.fillRR(ctx, lx, y, colW - 20, 26, 7, fill, stroke, 1.6);
          u.text(ctx, slots[i], lx + 12, y + 18, { color: c.text, size: 12, mono: true, weight: 600 });
          if (visited && !hit) u.text(ctx, "cache miss ✗", lx + colW - 32, y + 18, { align: "right", color: c.bad, size: 10, weight: 600 });
          if (hit) u.text(ctx, "match ✓", lx + colW - 32, y + 18, { align: "right", color: c.good, size: 10, weight: 700 });
          if (i < slots.length - 1) u.arrow(ctx, lx + 16, y + 26, lx + 16, y + 34, visited ? c.bad : c.line, 1.3);
        }
        const probes = Math.min(probe + 1, 5);
        u.text(ctx, "cache lines touched: " + (t >= 1 ? probes : 0), lx, top + slots.length * 34 + 20, { color: c.bad, size: 12, weight: 700, mono: true });
        u.line(ctx, sx - 10, 48, sx - 10, h - 20, c.line, 1.5, [4, 6]);
        u.text(ctx, "Swiss Table · group of 8 + control bytes", sx, 54, { color: c.go, size: 12, weight: 700 });
        const ctrl = ["h0", "h1", "USD", "h3", "h4", "h5", "—", "—"], cellW = (colW - 14) / 8, cy = top;
        u.text(ctx, "control bytes (one cache line):", sx, cy - 4, { color: c.dim, size: 10 });
        const scan = t >= 4.5;
        for (let i = 0; i < 8; i++) {
          const x = sx + i * cellW, isHit = ctrl[i] === "USD";
          let fill = c.panel, stroke = c.line;
          if (scan) { fill = "rgba(0,173,216,0.16)"; stroke = c.go; if (t >= 5.8 && isHit) { fill = "rgba(58,210,159,0.22)"; stroke = c.good; } }
          u.fillRR(ctx, x, cy + 14, cellW - 4, 30, 6, fill, stroke, scan ? 1.8 : 1.3);
          u.text(ctx, ctrl[i], x + (cellW - 4) / 2, cy + 33, { align: "center", color: scan ? c.text : c.dim, size: 10, mono: true, weight: 600 });
        }
        if (scan) {
          const by = cy + 56;
          u.line(ctx, sx, by, sx + 8 * cellW - 4, by, c.go, 2);
          for (let i = 0; i < 8; i++) { const x = sx + i * cellW + (cellW - 4) / 2; u.line(ctx, x, cy + 46, x, by, c.go, 1.2, [2, 3]); }
          u.text(ctx, "↓ SIMD compares all 8 tags in one operation", sx, by + 20, { color: c.go, size: 11, weight: 600 });
        }
        if (t >= 5.8) {
          const y = cy + 92;
          u.fillRR(ctx, sx, y, colW - 14, 28, 7, "rgba(58,210,159,0.16)", c.good, 1.8);
          u.text(ctx, '"USD" → 1', sx + 12, y + 19, { color: c.good, size: 12, mono: true, weight: 700 });
          u.text(ctx, "match ✓", sx + colW - 28, y + 19, { align: "right", color: c.good, size: 10, weight: 700 });
        }
        u.text(ctx, "cache lines touched: " + (t >= 4.5 ? 1 : 0), sx, top + slots.length * 34 + 20, { color: c.go, size: 12, weight: 700, mono: true });
      },
    });

  /* =================================================================== */
  /* M3. THE CLEANUP SEQUENCE  (runtime.AddCleanup)                      */
  /* =================================================================== */
  ANIM["cleanup-seq"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 9,
      phases: [
        { t: 0, title: "Object is alive", desc: "A *Conn lives inside a parent span; the stack holds a reference to it, so it stays reachable." },
        { t: 1.4, title: "Reference drops", desc: "The last reference goes away — the object is now unreachable, i.e. eligible for collection." },
        { t: 3, title: "GC mark finds it dead", desc: "The concurrent collector scans live memory; the *Conn is never reached, so it is garbage." },
        { t: 5.7, title: "Cleanup runs once", desc: "runtime.AddCleanup fires exactly once: syscall.Close(fd). It captured fd by value, not the object." },
        { t: 7.4, title: "Memory freed", desc: "The parent span is reclaimed immediately — no finalizer resurrection, no extra GC cycle of delay." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "runtime.AddCleanup · deterministic lifecycle", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const cx = w / 2, midY = h * 0.50;
        u.fillRR(ctx, 40, midY - 22, 110, 44, 9, c.panel, c.line, 1.5);
        u.text(ctx, "stack root", 95, midY + 4, { align: "center", color: c.dim, size: 11, weight: 600 });
        const sx = cx - 110, sy = midY - 70, sw = 220, sh = 140, collected = t >= 6.4, spanA = collected ? 1 - u.seg(t, 6.4, 7.6) : 1;
        ctx.globalAlpha = u.clamp(spanA, 0.15, 1);
        u.fillRR(ctx, sx, sy, sw, sh, 12, "rgba(169,139,255,0.06)", c.purple, 1.8);
        u.text(ctx, "parent span", sx + 12, sy + 20, { color: c.purple, size: 11, weight: 700 });
        ctx.globalAlpha = 1;
        const ox = cx - 50, oy = midY - 26, ow = 100, oh = 52, unreachable = t >= 1.8, gone = t >= 6.4, objA = gone ? 1 - u.seg(t, 6.4, 7.2) : 1;
        if (!gone || objA > 0.05) {
          ctx.globalAlpha = u.clamp(objA, 0, 1);
          const fill = unreachable ? "rgba(107,124,153,0.15)" : "rgba(0,173,216,0.14)", stroke = t >= 5.6 && t < 6.6 ? c.good : unreachable ? c.dim : c.go;
          u.fillRR(ctx, ox, oy, ow, oh, 9, fill, stroke, 2);
          u.text(ctx, "*Conn", cx, oy + 22, { align: "center", color: unreachable ? c.dim : c.go, size: 13, weight: 700, mono: true });
          u.text(ctx, "fd: 7", cx, oy + 40, { align: "center", color: c.dim, size: 11, mono: true });
          ctx.globalAlpha = 1;
        }
        if (t < 1.8) {
          const a = t > 1.4 ? 1 - u.seg(t, 1.4, 1.8) : 1;
          ctx.globalAlpha = a; u.arrow(ctx, 150, midY, ox - 6, midY, c.go, 2);
          u.text(ctx, "ref", 150 + (ox - 150) / 2, midY - 8, { align: "center", color: c.go, size: 10, weight: 600 }); ctx.globalAlpha = 1;
        } else {
          u.line(ctx, 150, midY, 176, midY, c.line, 1.5, [3, 4]);
          u.text(ctx, "ref dropped", 200, midY - 8, { color: c.dim, size: 10 });
        }
        if (t >= 1.8 && !gone) u.badge(ctx, ox + ow / 2 - 42, oy - 30, "unreachable", c.dim, "#fff");
        if (u.within(t, 3, 6.2)) {
          const gx = u.lerp(20, w - 20, u.seg(t, 3, 6, u.easeInOut));
          const grad = ctx.createLinearGradient(gx - 60, 0, gx + 10, 0);
          grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(58,210,159,0.35)");
          ctx.fillStyle = grad; ctx.fillRect(gx - 60, sy - 30, 70, sh + 60);
          u.line(ctx, gx, sy - 30, gx, sy + sh + 30, c.good, 2);
          u.text(ctx, "GC mark", gx, sy - 38, { align: "center", color: c.good, size: 11, weight: 700 });
        }
        if (u.within(t, 5.7, 7.4)) {
          const a = u.seg(t, 5.7, 6.2) * (t > 6.8 ? 1 - u.seg(t, 6.8, 7.4) : 1), flash = 0.5 + 0.5 * Math.sin(t * 24);
          ctx.globalAlpha = u.clamp(a, 0, 1);
          u.fillRR(ctx, cx - 95, midY + 56, 190, 30, 8, "rgba(58,210,159," + (0.1 + 0.12 * flash) + ")", c.good, 2);
          u.text(ctx, "AddCleanup ▶ syscall.Close(7)", cx, midY + 75, { align: "center", color: c.good, size: 12, weight: 700, mono: true });
          ctx.globalAlpha = 1;
        }
        if (t >= 7.4) u.text(ctx, "✓ fd closed · parent span freed without delay", cx, midY + 75, { align: "center", color: c.good, size: 12, weight: 700 });
        u.fillRR(ctx, 40, h - 50, w - 80, 32, 8, c.panel, c.line, 1.2);
        u.text(ctx, "vs SetFinalizer:", 54, h - 30, { color: c.accent, size: 11, weight: 700 });
        u.text(ctx, "finalizers can resurrect objects and delay collection a whole GC cycle. AddCleanup runs once, after the object is truly dead.", 150, h - 30, { color: c.dim, size: 11 });
      },
    });

  /* =================================================================== */
  /* M4. THE SYNCTEST CLOCK BUBBLE                                       */
  /* =================================================================== */
  ANIM["synctest-bubble"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 10,
      phases: [
        { t: 0, title: "Goroutines start", desc: "Three goroutines run inside an isolated synctest bubble that has its own fake clock." },
        { t: 1, title: "They run, then block", desc: "Each one reaches a time.Sleep or a channel receive and parks (blocks)." },
        { t: 3.4, title: "synctest.Wait: all parked", desc: "The test waits until every goroutine is durably blocked — a precise barrier instead of a guessed sleep." },
        { t: 5, title: "Fake clock jumps", desc: "With everyone blocked, the bubble's clock fast-forwards to the next timer instantly. Wall time barely moves." },
        { t: 5.8, title: "Wake & finish", desc: "Goroutines resume, complete, and assertions run on a fully settled state." },
        { t: 7.8, title: "No flakes", desc: "Wall clock ≈ 0s while bubble time advanced 5s. Fully deterministic — no time.Sleep, no CI flake." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "testing/synctest · virtual time bubble", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const wallReal = (t * 0.003).toFixed(3), bubbleVal = t < 5 ? "0.000" : (u.lerp(0, 5, u.seg(t, 5, 5.8, u.easeOut))).toFixed(3);
        u.fillRR(ctx, w - 250, 46, 100, 50, 9, c.panel, c.line, 1.4);
        u.text(ctx, "wall clock", w - 200, 64, { align: "center", color: c.dim, size: 10 });
        u.text(ctx, wallReal + "s", w - 200, 86, { align: "center", color: c.text, size: 15, weight: 700, mono: true });
        u.fillRR(ctx, w - 140, 46, 100, 50, 9, "rgba(0,173,216,0.10)", c.go, 1.6);
        u.text(ctx, "bubble clock", w - 90, 64, { align: "center", color: c.go, size: 10, weight: 600 });
        u.text(ctx, bubbleVal + "s", w - 90, 86, { align: "center", color: c.go, size: 15, weight: 700, mono: true });
        const bx = 40, by = 116, bw = w - 290, bh = h - 156;
        u.fillRR(ctx, bx, by, bw, bh, 18, "rgba(0,173,216,0.05)", c.go, 2);
        u.text(ctx, "synctest.Run( … )", bx + 14, by + 22, { color: c.go, size: 11, weight: 700, mono: true });
        const tlx = bx + 30, tlw = bw - 60, baseY = by + 50;
        const lanes = [{ name: "G1 fetch", sleep: 0.5, color: c.goSoft }, { name: "G2 worker", sleep: 0.8, color: c.warn }, { name: "G3 timeout", sleep: 1.0, color: c.purple }];
        lanes.forEach((g, i) => {
          const ly = baseY + i * ((bh - 80) / 3) + 20;
          u.text(ctx, g.name, bx + 14, ly + 4, { color: g.color, size: 11, weight: 600, mono: true });
          u.line(ctx, tlx, ly, tlx + tlw, ly, c.line, 1.4);
          const blockX = tlx + tlw * 0.35, runP = u.seg(t, 1, 3.2, u.easeInOut), blocked = t >= 3.2 && t < 5.6;
          let dx;
          if (t < 3.2) dx = u.lerp(tlx, blockX, runP);
          else if (t < 5.6) dx = blockX;
          else dx = u.lerp(blockX, tlx + tlw, u.seg(t, 5.8, 7.6, u.easeOut));
          u.line(ctx, tlx, ly, dx, ly, g.color, 3);
          u.line(ctx, blockX, ly - 10, blockX, ly + 10, blocked ? c.dim : c.line, 1.3, [2, 3]);
          if (blocked) u.text(ctx, "⏸ blocked", blockX + 6, ly - 14, { color: c.dim, size: 9.5 });
          u.dot(ctx, dx, ly, 5, blocked ? c.dim : g.color, blocked ? null : g.color + "66");
          u.text(ctx, "+" + g.sleep + "s", tlx + tlw + 6, ly + 4, { color: c.dim, size: 9.5, mono: true });
        });
        if (u.within(t, 3.4, 5.6)) {
          const bX = tlx + tlw * 0.35, a = u.seg(t, 3.4, 3.9);
          ctx.globalAlpha = a;
          u.line(ctx, bX, baseY - 4, bX, baseY + bh - 110, c.good, 2, [5, 4]);
          u.text(ctx, "synctest.Wait → all parked", bX, baseY - 12, { align: "center", color: c.good, size: 11, weight: 700 });
          ctx.globalAlpha = 1;
        }
        if (u.within(t, 5, 5.9)) {
          const a = 0.5 + 0.5 * Math.sin(t * 26);
          u.text(ctx, "⏩ fake clock advances 5s instantly", bx + bw / 2, by + bh - 14, { align: "center", color: c.go, size: 12, weight: 700, alpha: 0.6 + 0.4 * a });
        }
        if (t >= 7.8) u.text(ctx, "✓ deterministic — no time.Sleep, no flake", bx + bw / 2, by + bh - 14, { align: "center", color: c.good, size: 12, weight: 700 });
      },
    });

  /* =================================================================== */
  /* M5. THE SQL TRANSACTION CYCLE  (row-level locks)                    */
  /* =================================================================== */
  ANIM["sql-txn"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 11,
      phases: [
        { t: 0, title: "Two transfers arrive", desc: "T1 and T2 both want to move money through the balance engine at the same time." },
        { t: 1, title: "T1 locks Account A", desc: "T1 runs SELECT … FOR UPDATE and takes a row-level lock on account A." },
        { t: 3.2, title: "T2 waits", desc: "T2 needs the same row, so it blocks behind T1's lock — it cannot read a half-finished balance." },
        { t: 5, title: "Double-entry write", desc: "Inside the transaction, T1 debits A −100 and credits B +100. The two legs always move together." },
        { t: 6.6, title: "Commit releases the lock", desc: "On COMMIT the row lock frees, and T2 is unblocked." },
        { t: 8, title: "T2 proceeds safely", desc: "T2 now runs on fresh, consistent rows. The sum of balances never changed — the invariant held." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "pgxpool · row-level locking · double-entry", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const t1Active = t >= 1;
        u.fillRR(ctx, 40, 56, 150, 40, 9, t1Active ? "rgba(0,173,216,0.12)" : c.panel, c.go, 1.6);
        u.text(ctx, "T1  transfer", 52, 81, { color: c.go, size: 12, weight: 700, mono: true });
        const t2Go = t >= 8;
        u.fillRR(ctx, 40, 106, 150, 40, 9, t2Go ? "rgba(245,177,76,0.14)" : c.panel, c.warn, 1.6);
        u.text(ctx, "T2  transfer", 52, 131, { color: c.warn, size: 12, weight: 700, mono: true });
        if (t >= 3.4 && t < 8) u.badge(ctx, 200, 116, "waiting on lock…", c.warn);
        u.text(ctx, "pgx batch", w / 2 - 30, 52, { color: c.dim, size: 10, weight: 600 });
        u.fillRR(ctx, w / 2 - 50, 60, 100, 28, 7, c.panel, c.line, 1.4);
        u.text(ctx, "BEGIN…COMMIT", w / 2, 78, { align: "center", color: c.dim, size: 9.5, mono: true });
        const tx = w - 280, ty = 66, tw = 240;
        u.fillRR(ctx, tx, ty, tw, 150, 12, c.panel, c.line, 1.6);
        u.text(ctx, "PostgreSQL · accounts", tx + 14, ty + 22, { color: c.goSoft, size: 11, weight: 700 });
        const debit = t >= 5 ? u.lerp(0, 100, u.seg(t, 5, 6.4)) : 0, balA = (500 - debit).toFixed(0), balB = (300 + debit).toFixed(0);
        const rows = [{ id: "A", bal: balA, locked: t >= 2.4 && t < 8 }, { id: "B", bal: balB, locked: false }];
        rows.forEach((r, i) => {
          const ry = ty + 44 + i * 46, lk = r.locked;
          u.fillRR(ctx, tx + 14, ry, tw - 28, 38, 8, lk ? "rgba(0,173,216,0.12)" : c.bg, lk ? c.go : c.line, lk ? 2 : 1.3);
          u.text(ctx, "acct " + r.id, tx + 26, ry + 23, { color: c.text, size: 12, mono: true, weight: 600 });
          u.text(ctx, "$" + r.bal, tx + tw - 70, ry + 23, { color: c.text, size: 13, mono: true, weight: 700 });
          if (lk) u.text(ctx, "🔒", tx + tw - 30, ry + 24, { size: 14 });
        });
        if (u.within(t, 1.6, 8)) {
          const a = t < 2.6 ? u.seg(t, 1.6, 2.4) : 1; ctx.globalAlpha = a;
          u.arrow(ctx, 190, 76, tx + 10, ty + 60, c.go, 2); ctx.globalAlpha = 1;
        }
        if (u.within(t, 3.2, 8)) {
          u.line(ctx, 190, 126, tx - 30, ty + 70, c.warn, 1.6, [4, 4]);
          u.text(ctx, "blocked", (190 + tx) / 2 - 30, ty + 102, { color: c.warn, size: 10, weight: 600 });
        }
        if (t >= 8) { const a = u.seg(t, 8, 8.6); ctx.globalAlpha = a; u.arrow(ctx, 190, 126, tx + 10, ty + 64, c.warn, 2); ctx.globalAlpha = 1; }
        const ly = h - 80;
        u.fillRR(ctx, 40, ly, w - 80, 54, 10, c.panel, c.line, 1.3);
        u.text(ctx, "double-entry", 56, ly + 20, { color: c.accent, size: 11, weight: 700 });
        u.text(ctx, "A: −$" + debit.toFixed(0), 56, ly + 40, { color: c.bad, size: 13, mono: true, weight: 700 });
        u.text(ctx, "B: +$" + debit.toFixed(0), 170, ly + 40, { color: c.good, size: 13, mono: true, weight: 700 });
        const sum = (Number(balA) + Number(balB)).toFixed(0);
        u.text(ctx, "Σ = $" + sum + (Number(sum) === 800 ? "  ✓ invariant held" : "  ✗"), w - 240, ly + 40, { color: c.good, size: 13, mono: true, weight: 700 });
        if (u.within(t, 6.6, 7.6)) u.badge(ctx, w / 2 - 36, 98, "COMMIT ✓", c.good);
      },
    });

  /* =================================================================== */
  /* M6. THE CRYPTOGRAPHIC LATTICE  (hybrid ML-KEM)                      */
  /* =================================================================== */
  ANIM["pqc-lattice"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 11,
      phases: [
        { t: 0, title: "Two key exchanges", desc: "Both channels do a handshake and start sending encrypted ledger data. Left = classic, right = hybrid ML-KEM." },
        { t: 2.4, title: "Attacker harvests ciphertext", desc: "A 'harvest now, decrypt later' adversary records today's encrypted traffic from both channels." },
        { t: 5, title: "Years later: a quantum computer", desc: "A cryptographically-relevant quantum computer comes online and attacks both recordings." },
        { t: 7.5, title: "Classic key falls", desc: "X25519 is broken by Shor's algorithm — the classic channel's recorded session is decrypted." },
        { t: 9, title: "Hybrid ML-KEM holds", desc: "The lattice-based key resists the quantum attack, so the hybrid session stays secret." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "harvest-now-decrypt-later · hybrid PQC", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const colW = (w - 80) / 2;
        function channel(x, label, pqc) {
          const cracked = !pqc && t >= 7.5;
          u.text(ctx, label, x, 56, { color: pqc ? c.go : c.accent, size: 12, weight: 700 });
          u.fillRR(ctx, x, 74, 56, 30, 8, c.panel, c.line, 1.4);
          u.text(ctx, "Alice", x + 28, 94, { align: "center", color: c.text, size: 11 });
          u.fillRR(ctx, x + colW - 86, 74, 56, 30, 8, c.panel, c.line, 1.4);
          u.text(ctx, "Bob", x + colW - 58, 94, { align: "center", color: c.text, size: 11 });
          u.line(ctx, x + 56, 89, x + colW - 86, 89, c.line, 1.5);
          if (t < 2.2) { const p = u.seg(t, 0.4, 1.8, u.easeInOut), kx = u.lerp(x + 60, x + colW - 90, p); u.dot(ctx, kx, 89, 5, pqc ? c.go : c.accent, (pqc ? c.go : c.accent) + "55"); }
          const ky = 126;
          if (pqc) {
            u.text(ctx, "ML-KEM-768 lattice key", x, ky - 4, { color: c.dim, size: 10 });
            const gx = x + 8, gy = ky + 8, cols = 9, rows = 5, sp = 18;
            for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const px = gx + i * sp + (j % 2) * 6, py = gy + j * sp; u.dot(ctx, px, py, 2.2, !cracked ? c.go : c.dim); }
            drawLock(ctx, x + colW - 70, ky + 24, c.good, true, u);
            u.text(ctx, "🛡 quantum-resistant", x + colW - 70, ky + 78, { align: "center", color: c.good, size: 10, weight: 700 });
          } else {
            u.text(ctx, "X25519 classical key", x, ky - 4, { color: c.dim, size: 10 });
            for (let i = 0; i < 26; i++) { const ang = i * 0.6, rr2 = 26 + (i % 4) * 6; u.dot(ctx, x + 50 + Math.cos(ang) * rr2, ky + 44 + Math.sin(ang) * rr2 * 0.6, 2, cracked ? c.bad : c.accent); }
            drawLock(ctx, x + colW - 70, ky + 24, cracked ? c.bad : c.warn, !cracked, u);
            if (cracked) u.text(ctx, "🔓 broken by Shor's", x + colW - 70, ky + 78, { align: "center", color: c.bad, size: 10, weight: 700 });
            else u.text(ctx, "classical only", x + colW - 70, ky + 78, { align: "center", color: c.warn, size: 10 });
          }
        }
        channel(40, "Channel A · Classic TLS", false);
        u.line(ctx, w / 2, 46, w / 2, h - 120, c.line, 1.5, [4, 6]);
        channel(40 + colW + 20, "Channel B · Hybrid ML-KEM", true);
        const band = h - 92;
        u.fillRR(ctx, 40, band, w - 80, 70, 12, c.panel, c.line, 1.4);
        const harv = t >= 2.4;
        if (harv) {
          u.text(ctx, "🛰 harvester — recording ciphertext", 60, band + 26, { color: c.warn, size: 12, weight: 600, alpha: u.clamp(u.seg(t, 2.4, 3), 0, 1) });
          for (let i = 0; i < 6; i++) { const a = u.clamp(u.seg(t, 2.6 + i * 0.08, 3.4 + i * 0.08), 0, 1); u.fillRR(ctx, 70 + i * 26, band + 38, 18, 20, 4, "rgba(245,177,76,0.18)", c.warn, 1); ctx.globalAlpha = a; u.text(ctx, "🔒", 71 + i * 26, band + 53, { size: 12 }); ctx.globalAlpha = 1; }
        }
        if (t >= 5) {
          const a = u.clamp(u.seg(t, 5, 6), 0, 1); ctx.globalAlpha = a;
          u.text(ctx, "⚛ quantum computer online → attacks both captures", w - 60, band + 26, { align: "right", color: c.purple, size: 12, weight: 700 });
          u.text(ctx, "classic key: cracked   ·   lattice key: holds", w - 60, band + 52, { align: "right", color: c.dim, size: 11 });
          ctx.globalAlpha = 1;
        }
      },
    });
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
  ANIM["leak-graph"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 9.5,
      phases: [
        { t: 0, title: "A live goroutine graph", desc: "Goroutines are nodes; the channels and contexts connecting them are the edges." },
        { t: 2.4, title: "G4 is stuck", desc: "G4 is parked forever on <-results — and no goroutine will ever send to it. That's the leak." },
        { t: 3.6, title: "Analyzer traces backward", desc: "The leak analyzer walks the channel graph backward from the blocked goroutine, looking for a sender." },
        { t: 5.8, title: "Root cause found", desc: "G2 never sends on results, and its context had no deadline — the analyzer localizes the fix automatically." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "runtime/pprof · goroutine-leak analyzer", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const cx = w / 2;
        const nodes = {
          main: { x: cx, y: 76, label: "main", state: "ok" },
          g1: { x: cx - 180, y: 166, label: "G1 producer", state: "ok" },
          g2: { x: cx, y: 166, label: "G2 dispatch", state: "missing" },
          g3: { x: cx + 180, y: 166, label: "G3 worker", state: "ok" },
          g4: { x: cx, y: 276, label: "G4 collector", state: "blocked" },
        };
        const edges = [["main", "g1", "jobs ch"], ["main", "g3", "ctx"], ["g1", "g2", "tasks ch"], ["g3", "g4", "results ch"]];
        const traceP = u.seg(t, 3.6, 7);
        edges.forEach((e) => {
          const a = nodes[e[0]], b = nodes[e[1]], isLeakEdge = e[1] === "g4";
          u.line(ctx, a.x, a.y + 18, b.x, b.y - 18, isLeakEdge && t >= 2.6 ? c.bad : c.line, isLeakEdge && t >= 2.6 ? 2.4 : 1.5, isLeakEdge ? [6, 4] : null);
          u.text(ctx, e[2], (a.x + b.x) / 2 + 8, (a.y + b.y) / 2, { color: c.dim, size: 10, mono: true });
        });
        if (u.within(t, 3.6, 7)) {
          const seg1 = u.clamp(traceP * 2, 0, 1), a = nodes.g4, b = nodes.g3;
          u.dot(ctx, u.lerp(a.x, b.x, seg1), u.lerp(a.y - 18, b.y + 18, seg1), 5, c.warn, "rgba(245,177,76,.6)");
        }
        Object.values(nodes).forEach((nd) => {
          let stroke = c.line, fill = c.panel, fg = c.text;
          if (nd.state === "blocked" && t >= 2.4) { stroke = c.bad; fill = "rgba(255,107,107,0.14)"; fg = c.bad; }
          if (nd.state === "missing" && t >= 5.6) { stroke = c.accent; fill = "rgba(206,50,98,0.14)"; }
          if (nd.state === "blocked" && t >= 2.4) { const pr = 26 + 6 * (0.5 + 0.5 * Math.sin(t * 6)); ctx.strokeStyle = "rgba(255,107,107,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nd.x, nd.y, pr, 0, 7); ctx.stroke(); }
          u.fillRR(ctx, nd.x - 56, nd.y - 18, 112, 36, 10, fill, stroke, 1.8);
          u.text(ctx, nd.label, nd.x, nd.y + 4, { align: "center", color: fg, size: 11, weight: 600, mono: true });
        });
        if (t >= 2.4) u.badge(ctx, nodes.g4.x - 70, nodes.g4.y + 26, "⏸ blocked on <-results", c.bad, "#fff");
        if (t >= 5.8) {
          const a = u.seg(t, 5.8, 6.4); ctx.globalAlpha = a;
          u.fillRR(ctx, 40, h - 86, w - 80, 62, 12, "rgba(206,50,98,0.08)", c.accent, 1.8);
          u.text(ctx, "ROOT CAUSE", 58, h - 62, { color: c.accent, size: 11, weight: 800 });
          u.text(ctx, "G2 dispatch never sends on results ch — context had no deadline.", 58, h - 43, { color: c.text, size: 12 });
          u.text(ctx, "fix: ctx, cancel := context.WithTimeout(...) ; defer cancel()", 58, h - 28, { color: c.good, size: 11, mono: true });
          ctx.globalAlpha = 1;
        } else u.text(ctx, "analyzer tracing blockade → root…", 40, h - 34, { color: c.dim, size: 12 });
      },
    });

  /* =================================================================== */
  /* M8. SIMD vs GREEN TEA GC                                            */
  /* =================================================================== */
  ANIM["simd-gc"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 10,
      phases: [
        { t: 0, title: "Same work, two engines", desc: "We process the same array two ways: a plain scalar loop and SIMD vector lanes." },
        { t: 0.5, title: "Scalar: one per cycle", desc: "The plain loop (top) touches a single element each iteration — the orange pointer crawls along." },
        { t: 1.4, title: "SIMD: 16 per cycle", desc: "One vector instruction (middle) loads and processes a whole lane at once — far fewer cycles for the same result." },
        { t: 5, title: "Green Tea GC sweeps spans", desc: "Below: the new GC marks contiguous 8 KiB spans in parallel instead of chasing individual objects." },
        { t: 9, title: "Cache-friendly & parallel", desc: "Sequential span scanning scales with cores and avoids the scattered cache misses of object-by-object marking." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "simd/archsimd  +  Green Tea GC", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const N = 32, cell = (w - 120) / N, gx = 40, half = h / 2;
        u.text(ctx, "scalar — 1 element / cycle", gx, 54, { color: c.warn, size: 11, weight: 600 });
        u.text(ctx, "SIMD — 16 elements / cycle", gx, 112, { color: c.go, size: 11, weight: 700 });
        const scalarDone = Math.floor(u.seg(t, 0.5, 4.2) * N), simdDone = Math.floor(u.seg(t, 0.5, 1.2) * N);
        for (let i = 0; i < N; i++) {
          const x = gx + i * cell, sDone = i < scalarDone, dDone = i < simdDone;
          u.fillRR(ctx, x, 62, cell - 3, 22, 4, sDone ? "rgba(245,177,76,0.5)" : c.panel, sDone ? c.warn : c.line, 1);
          u.fillRR(ctx, x, 120, cell - 3, 22, 4, dDone ? "rgba(0,173,216,0.5)" : c.panel, dDone ? c.go : c.line, 1);
        }
        if (t < 4.4) { const px = gx + scalarDone * cell; u.line(ctx, px, 58, px, 88, c.warn, 2); }
        // cycle counters live on the title rows (right-aligned) so they never overlap the cells
        u.text(ctx, "cycles: " + (t > 4.2 ? N : scalarDone), w - 40, 54, { align: "right", color: c.warn, size: 11.5, mono: true, weight: 700 });
        u.text(ctx, "cycles: " + (t > 1.2 ? 2 : Math.max(1, Math.ceil(simdDone / 16))), w - 40, 112, { align: "right", color: c.go, size: 11.5, mono: true, weight: 700 });
        if (t < 1.4) { for (let l = 0; l < 2; l++) { const lx = gx + l * 16 * cell; u.fillRR(ctx, lx, 116, 16 * cell - 3, 30, 5, "rgba(0,173,216,0.1)", c.go, 1.5); } u.text(ctx, "↓ each vector lane loads + processes 16 elements together", gx, 162, { color: c.go, size: 10.5 }); }
        else u.text(ctx, "↑ one SIMD instruction did the work of 16 — same result, ~16× fewer cycles", gx, 162, { color: c.go, size: 11, weight: 600 });
        u.line(ctx, 40, half + 6, w - 40, half + 6, c.line, 1.5, [4, 6]);
        u.text(ctx, "Green Tea GC · contiguous 8 KiB spans", gx, half + 30, { color: c.good, size: 12, weight: 700 });
        const cols = 16, rows = 4, sp = Math.min(cell + 4, (w - 80) / cols), sw = sp - 5, gy = half + 44;
        const sweepP = u.seg(t, 5, 9, u.easeInOut), totalSpans = cols * rows, swept = Math.floor(sweepP * totalSpans);
        for (let r = 0; r < rows; r++) for (let cI = 0; cI < cols; cI++) {
          const idx = r * cols + cI, x = gx + cI * sp, y = gy + r * (sw + 4), done = idx < swept, front = idx === swept - 1;
          u.fillRR(ctx, x, y, sw, sw - 2, 4, done ? "rgba(58,210,159,0.45)" : c.panel, front ? "#fff" : done ? c.good : c.line, front ? 2 : 1);
        }
        if (u.within(t, 5, 9)) u.text(ctx, "parallel span sweep →", gx, gy + rows * (sw + 4) + 18, { color: c.good, size: 11, weight: 600 });
        u.text(ctx, "sequential, cache-friendly, scales with cores", w - 44, gy + rows * (sw + 4) + 18, { align: "right", color: c.dim, size: 10.5 });
      },
    });

  /* =================================================================== */
  /* M9. THE CONTAINER ROLLOUT                                           */
  /* =================================================================== */
  ANIM["container-rollout"] = (canvas) =>
    makeTimeline(canvas, {
      duration: 11,
      phases: [
        { t: 0, title: "Three healthy v1 pods", desc: "The load balancer spreads incoming traffic across the running v1 pods (all Ready)." },
        { t: 3, title: "A v2 pod starts", desc: "A new v2 pod boots; its readiness probe is still failing, so the LB sends it no traffic yet." },
        { t: 5, title: "Probe passes → Ready", desc: "Once the readiness probe succeeds, the LB adds the v2 pod to rotation and it starts serving." },
        { t: 6, title: "An old pod drains", desc: "An old v1 pod stops receiving new requests and finishes its in-flight ones before terminating." },
        { t: 8.6, title: "The roll continues", desc: "The slot comes back as v2. Repeat pod-by-pod until the whole fleet is upgraded — zero dropped requests." },
      ],
      render(ctx, t, w, h, c, u) {
        u.text(ctx, "Kubernetes · rolling update · readiness probes", 40, 30, { color: c.text, size: 14, weight: 700, mono: true });
        const lbx = w / 2 - 70, lby = 52;
        u.fillRR(ctx, lbx, lby, 140, 38, 10, "rgba(0,173,216,0.12)", c.go, 1.8);
        u.text(ctx, "load balancer", lbx + 70, lby + 24, { align: "center", color: c.go, size: 12, weight: 700 });
        const slotY = 200, podW = 110, gap = (w - 80 - podW * 4) / 3;
        function podState(i) {
          if (i === 3) { if (t < 3) return { ver: "—", status: "empty" }; if (t < 5) return { ver: "v2", status: "starting" }; return { ver: "v2", status: "ready" }; }
          if (i === 0) { if (t < 6) return { ver: "v1", status: "ready" }; if (t < 7.6) return { ver: "v1", status: "draining" }; if (t < 8.6) return { ver: "—", status: "empty" }; if (t < 9.6) return { ver: "v2", status: "starting" }; return { ver: "v2", status: "ready" }; }
          return { ver: "v1", status: "ready" };
        }
        const colors = { ready: c.good, starting: c.warn, draining: c.accent, empty: c.line, gone: c.line };
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * (podW + gap), st = podState(i), col = colors[st.status] || c.line, isReady = st.status === "ready";
          if (st.status === "empty") { u.fillRR(ctx, x, slotY, podW, 64, 12, "transparent", c.line, 1.2); u.text(ctx, "—", x + podW / 2, slotY + 38, { align: "center", color: c.dim, size: 16 }); }
          else {
            u.fillRR(ctx, x, slotY, podW, 64, 12, "rgba(255,255,255,0.02)", col, isReady ? 2 : 1.6);
            u.text(ctx, "pod " + st.ver, x + podW / 2, slotY + 26, { align: "center", color: c.text, size: 13, weight: 700, mono: true });
            const pillTxt = st.status === "ready" ? "● Ready" : st.status === "starting" ? "◌ Starting" : "◍ Draining";
            u.text(ctx, pillTxt, x + podW / 2, slotY + 46, { align: "center", color: col, size: 11, weight: 600 });
            if (st.status === "starting") { const blink = Math.sin(t * 8) > 0; u.text(ctx, blink ? "probe ✗" : "probe …", x + podW / 2, slotY + 80, { align: "center", color: c.warn, size: 10, mono: true }); }
            if (st.status === "ready") u.text(ctx, "probe ✓", x + podW / 2, slotY + 80, { align: "center", color: c.good, size: 10, mono: true, weight: 600 });
            if (st.status === "draining") u.text(ctx, "finishing reqs…", x + podW / 2, slotY + 80, { align: "center", color: c.accent, size: 10, mono: true });
          }
          const fromX = lbx + 70, fromY = lby + 38, toX = x + podW / 2, toY = slotY;
          if (isReady) {
            u.line(ctx, fromX, fromY, toX, toY, "rgba(58,210,159,0.25)", 1.4);
            for (let d = 0; d < 3; d++) { const phase = (t * 0.6 + d / 3 + i * 0.13) % 1; u.dot(ctx, u.lerp(fromX, toX, phase), u.lerp(fromY, toY, phase), 3, c.good); }
          } else if (st.status !== "empty") u.line(ctx, fromX, fromY, toX, toY, c.line, 1, [3, 4]);
        }
        const ly = h - 60;
        u.fillRR(ctx, 40, ly, w - 80, 44, 10, c.panel, c.line, 1.2);
        const lg = [["● Ready — receiving traffic", c.good], ["◌ Starting — probe pending", c.warn], ["◍ Draining — no new traffic", c.accent]];
        let lx = 60; lg.forEach((g) => { u.text(ctx, g[0], lx, ly + 27, { color: g[1], size: 11, weight: 600 }); lx += ctx.measureText(g[0]).width + 36; });
        const pct = Math.round(u.clamp(u.seg(t, 3, 10.5), 0, 1) * 100);
        u.text(ctx, "rollout " + pct + "%", w - 60, ly + 27, { align: "right", color: c.go, size: 12, weight: 700, mono: true });
      },
    });

  /* ------------------------------------------------------------ export */
  window.ANIMATIONS = ANIM;
  window.addEventListener("resize", () => {
    if (window.__activeAnim && window.__activeAnim.resize) window.__activeAnim.resize();
  });
})();

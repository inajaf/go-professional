/* =====================================================================
   APP - routing, persistence, rendering, animation wiring
   Pure vanilla JS. Runs over file:// (no modules, no fetch).
   ===================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------- persistence */
  const LS = "gocourse:v1";
  const defaults = { checks: {}, notes: {}, theme: "dark", last: null, started: {}, answers: {}, solved: {}, lang: "en" };
  let state = load();
  function load() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(LS) || "{}"));
    } catch { return Object.assign({}, defaults); }
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => localStorage.setItem(LS, JSON.stringify(state)), 120);
  }
  // Use this instead of save() right before anything that reloads/navigates away -
  // save() debounces the write by 120ms, so a reload fired right after save() can
  // beat the pending write and silently discard the change (this is exactly what
  // broke the language switcher: state.lang flipped in memory but never hit
  // localStorage before location.reload() reset it).
  function saveNow() {
    clearTimeout(saveTimer);
    localStorage.setItem(LS, JSON.stringify(state));
  }

  /* ---------------------------------------------------------- language
     COURSE_RU is allowed to be PARTIAL: translation is filled in module by
     module. mergeCourse overlays whatever RU has onto the EN base, so any
     not-yet-translated field/module falls back to English instead of
     crashing or rendering blank. */
  function mergeModule(em, rm) {
    if (!rm) return em;
    const out = Object.assign({}, em, rm);
    if (rm.animation) out.animation = Object.assign({}, em.animation, rm.animation);
    // A module can carry multiple visualizations (out.animations). Deep-merge
    // per index so a partial RU translation keeps the EN title/blurb it omits,
    // exactly like the per-step WORKED_EXAMPLES merge below.
    if (em.animations) {
      out.animations = em.animations.map((ea, i) =>
        (rm.animations && rm.animations[i]) ? Object.assign({}, ea, rm.animations[i]) : ea);
    }
    if (rm.ai) out.ai = Object.assign({}, em.ai, rm.ai);
    if (rm.capstone) out.capstone = Object.assign({}, em.capstone, rm.capstone);
    if (rm.practice) {
      out.practice = Object.assign({}, em.practice, rm.practice);
      if (rm.practice.steps) out.practice.steps = rm.practice.steps;
    }
    if (rm.concepts) {
      out.concepts = em.concepts.map((ec, i) => rm.concepts[i] ? Object.assign({}, ec, rm.concepts[i]) : ec);
    }
    return out;
  }
  function mergeCourse(en, ru) {
    if (!ru) return en;
    const out = Object.assign({}, en, ru);
    out.MODULES = en.MODULES.map((em) => {
      const rm = (ru.MODULES || []).find((x) => x.id === em.id);
      return mergeModule(em, rm);
    });
    ["GLOSSARY", "ASSIGNMENTS", "LESSONS"].forEach((key) => {
      out[key] = Object.assign({}, en[key] || {}, ru[key] || {});
    });
    // WORKED_EXAMPLES: deep-merge per module, then per step, so a
    // translated step (title/concept/why) keeps its EN code/lang -
    // the RU file never needs to repeat the (unchanged) Go source.
    const enWE = en.WORKED_EXAMPLES || {}, ruWE = ru.WORKED_EXAMPLES || {};
    out.WORKED_EXAMPLES = {};
    Object.keys(enWE).forEach((id) => {
      const eex = enWE[id], rex = ruWE[id];
      if (!rex) { out.WORKED_EXAMPLES[id] = eex; return; }
      const merged = Object.assign({}, eex, rex);
      if (rex.steps) merged.steps = eex.steps.map((es, i) => rex.steps[i] ? Object.assign({}, es, rex.steps[i]) : es);
      out.WORKED_EXAMPLES[id] = merged;
    });
    return out;
  }
  const LANG = (state.lang === "ru" && window.COURSE_RU) ? "ru" : "en";
  window.__LANG__ = LANG; // read by animations.js to pick translated canvas text
  const COURSE = LANG === "ru" ? mergeCourse(window.COURSE_EN, window.COURSE_RU) : window.COURSE_EN;
  const UI = (window.UI_STRINGS && window.UI_STRINGS[LANG]) || window.UI_STRINGS.en;
  // animation step title/desc/why captions are translated via the same exact-string
  // dictionary animations.js uses for canvas text (window.CANVAS_RU) - see AGENTS.md.
  function trCap(s) { return (LANG === "ru" && window.CANVAS_RU && window.CANVAS_RU[s]) || s; }

  const { COURSE_META, PARTS, MODULES, VERIFICATION, ASSIGNMENTS, GLOSSARY } = COURSE;
  const LESSONS = COURSE.LESSONS || {};
  const WORKED_EXAMPLES = COURSE.WORKED_EXAMPLES || {};
  const moduleById = Object.fromEntries(MODULES.map((m) => [m.id, m]));
  const partById = Object.fromEntries(PARTS.map((p) => [p.id, p]));
  // The course sequence (sidebar order, home order, prev/next) is defined by
  // PARTS + each part's `modules` list - NOT by the physical MODULES array
  // order. Flatten it once so navigation follows the intended learning ramp.
  const ORDERED = PARTS.flatMap((p) => p.modules).map((id) => moduleById[id]).filter(Boolean);
  // Every module renders one or more visualizations. Older data uses a single
  // `animation`; a module may instead (or also) provide an `animations` array.
  const animsOf = (m) => (m.animations && m.animations.length ? m.animations : [m.animation]);

  function checksFor(m) {
    if (!state.checks[m.id]) state.checks[m.id] = m.checklist.map(() => false);
    return state.checks[m.id];
  }
  const moduleDone = (m) => checksFor(m).every(Boolean);
  const moduleProgress = (m) => {
    const c = checksFor(m);
    return c.filter(Boolean).length / c.length;
  };
  const overallDone = () => MODULES.filter(moduleDone).length;

  /* ------------------------------------------------------------ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function copy(txt, btn) {
    const done = () => { if (btn) { const o = btn.textContent; btn.textContent = UI.copied; btn.classList.add("ok"); setTimeout(() => { btn.textContent = o; btn.classList.remove("ok"); }, 1300); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallback(txt, done));
    } else fallback(txt, done);
  }
  function fallback(txt, cb) {
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); cb(); } catch {}
    document.body.removeChild(ta);
  }

  /* ----------------------------------------------- syntax highlighting */
  const GO_KW = new Set("func package import var const type struct interface map chan go defer return if else for range switch case default break continue select fallthrough goto".split(" "));
  const GO_BUILTIN = new Set("nil true false make new len cap append copy delete panic recover error string int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 byte rune bool float32 float64 any comparable".split(" "));
  const SQL_KW = new Set("SELECT INSERT UPDATE DELETE FROM WHERE SET VALUES RETURNING AND OR NOT NULL INTO ON AS ORDER BY GROUP LIMIT JOIN LEFT INNER FOR UPDATE BEGIN COMMIT".split(" "));
  function highlight(codeRaw, lang) {
    const sql = lang === "sql";
    const lineComment = sql ? "--" : "//";
    // token regex: comments | strings | numbers | identifiers | ws/other
    const re = new RegExp(
      `(${sql ? "--" : "//|#"}[^\\n]*)` +              // 1 comment
      "|(\"(?:[^\"\\\\]|\\\\.)*\"|`[^`]*`|'(?:[^'\\\\]|\\\\.)*')" + // 2 string
      "|(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)" +              // 3 number
      "|([A-Za-z_\\$][A-Za-z0-9_\\$]*)" +             // 4 ident
      "|([\\s\\S])",                                   // 5 other
      "g"
    );
    let out = "", m;
    while ((m = re.exec(codeRaw))) {
      if (m[1]) out += `<span class="t-com">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="t-str">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="t-num">${esc(m[3])}</span>`;
      else if (m[4]) {
        const w = m[4];
        const kw = sql ? SQL_KW.has(w.toUpperCase()) : GO_KW.has(w);
        const bi = !sql && GO_BUILTIN.has(w);
        // function call lookahead
        const next = codeRaw[re.lastIndex];
        const isCall = next === "(";
        if (kw) out += `<span class="t-kw">${esc(w)}</span>`;
        else if (bi) out += `<span class="t-bi">${esc(w)}</span>`;
        else if (isCall) out += `<span class="t-fn">${esc(w)}</span>`;
        else out += esc(w);
      } else out += esc(m[5]);
    }
    return out;
  }
  function codeBlock(code, lang) {
    const label = lang === "sql" ? "sql" : "go";
    return `<div class="code">
      <div class="code-head"><span class="code-lang">${label}</span>
      <button class="copy-btn" data-copy="${esc(code)}">${esc(UI.copy)}</button></div>
      <pre><code>${highlight(code, lang)}</code></pre></div>`;
  }

  /* ----------------------------------------------------------- icons */
  const ICONS = {
    route: "M4 7h10M14 7l-3-3M14 7l-3 3M20 17H10M10 17l3-3M10 17l3 3",
    layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
    recycle: "M7 4l-3 5h4M5 9l2 4M17 4l3 5h-4M19 9l-2 4M9 20l-2-4h8l-2 4",
    flask: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7 15h10",
    database: "M12 3c4 0 8 1 8 3s-4 3-8 3-8-1-8-3 4-3 8-3zM4 6v12c0 2 4 3 8 3s8-1 8-3V6M4 12c0 2 4 3 8 3s8-1 8-3",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
    activity: "M3 12h4l3 8 4-16 3 8h4",
    cpu: "M6 6h12v12H6zM9 9h6v6H9M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3",
    ship: "M3 14l9-4 9 4-2 6H5l-2-6zM12 10V4M8 7h8M12 20v-4",
    share: "M2 12a3 3 0 106 0 3 3 0 10-6 0M16 5a3 3 0 106 0 3 3 0 10-6 0M16 19a3 3 0 106 0 3 3 0 10-6 0M7.5 10.8 16.4 6.4M7.5 13.2 16.4 17.6",
    git: "M6 3a3 3 0 106 0 3 3 0 10-6 0M6 21a3 3 0 106 0 3 3 0 10-6 0M9 6v9M18 9a3 3 0 106 0 3 3 0 10-6 0M21 12c0 4-3 6-12 6",
    lock: "M6 11h12v10H6zM9 11V7a3 3 0 016 0v4M12 15v3",
    gauge: "M4 16a8 8 0 0116 0M12 16l4.5-5M12 16a1.4 1.4 0 100 .1M7 16h.01M17 16h.01",
    bolt: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
    lightbulb: "M9 18h6M10 22h4M8 14a5 5 0 118 0c-1.5 1.2-2 2.2-2 4h-4c0-1.8-.5-2.8-2-4",
    landmark: "M3 10h18M5 10l7-5 7 5M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 22h18",
    film: "M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 16h4M16 8h4M16 16h4",
    clipboard: "M9 4h6M9 4a2 2 0 00-2 2v1h10V6a2 2 0 00-2-2M7 7H5v14h14V7h-2",
    alert: "M12 3l10 18H2L12 3zM12 9v5M12 17h.01",
    key: "M15 7a4 4 0 11-2.8 6.8L9 17H6v3H3v-3l5.2-5.2A4 4 0 0115 7zM15 7h.01",
    menu: "M4 6h16M4 12h16M4 18h16",
    moon: "M21 12.8A8 8 0 1111.2 3a6 6 0 009.8 9.8z",
    sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5l-1.4-1.4M20.4 20.4L19 19M19 5l1.4-1.4M3.6 20.4L5 19M12 8a4 4 0 100 8 4 4 0 000-8z",
    rotateCcw: "M3 12a9 9 0 109-9M3 4v8h8",
    chevronLeft: "M15 18l-6-6 6-6",
    chevronRight: "M9 18l6-6-6-6",
    play: "M8 5v14l11-7-11-7z",
    pause: "M8 5v14M16 5v14",
  };
  const ico = (name, size = 18) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${(ICONS[name] || "")
      .split("M").filter(Boolean).map((d) => `<path d="M${d}"/>`).join("")}</svg>`;

  function ring(pct, size = 132, stroke = 10) {
    const r = (size - stroke) / 2, C = 2 * Math.PI * r, off = C * (1 - pct);
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--anim-line)" stroke-width="${stroke}" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="url(#rg)" stroke-width="${stroke}" fill="none"
        stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--go)"/><stop offset="1" stop-color="var(--purple)"/></linearGradient></defs>
    </svg>`;
  }

  /* ------------------------------------------------------- sidebar */
  function renderSidebar() {
    const filter = ($("#nav-filter") && $("#nav-filter").value || "").toLowerCase();
    const cur = currentRoute();
    let html = `<a class="nav-home ${cur === "home" ? "active" : ""}" href="#/home">
      <span class="nav-home-ic">${ico("ship", 16)}</span> ${esc(UI.courseHome)}</a>`;
    PARTS.forEach((p) => {
      const mods = p.modules.map((id) => moduleById[id]);
      const visible = mods.filter((m) => !filter || (m.title + m.short + m.summary).toLowerCase().includes(filter));
      if (!visible.length) return;
      const doneCount = mods.filter(moduleDone).length;
      html += `<div class="nav-part">
        <div class="nav-part-head"><span>${p.label} · ${p.title}</span><span class="nav-part-count">${doneCount}/${mods.length}</span></div>`;
      visible.forEach((m) => {
        const done = moduleDone(m), pr = moduleProgress(m);
        html += `<a class="nav-item ${cur === m.id ? "active" : ""} ${done ? "done" : ""}" href="#/${m.id}">
          <span class="nav-num">${done ? "✓" : m.code}</span>
          <span class="nav-text"><span class="nav-title">${m.short}</span>
          <span class="nav-bar"><span style="width:${pr * 100}%"></span></span></span>
        </a>`;
      });
      html += "</div>";
    });
    $("#nav-list").innerHTML = html;
  }

  /* ---------------------------------------------------------- home */
  function renderHome() {
    const done = overallDone(), pct = done / MODULES.length;
    const cont = state.last && moduleById[state.last] ? state.last : ORDERED[0].id;
    const contM = moduleById[cont];
    const animationCount = new Set(MODULES.flatMap((m) => animsOf(m).map((a) => a.id))).size;
    let cards = "";
    PARTS.forEach((p) => {
      cards += `<div class="part-block">
        <div class="part-head"><div><span class="part-label">${p.label}</span>
        <h3>${p.title}</h3></div><span class="part-level">${p.level}</span></div>
        <div class="card-grid">`;
      p.modules.forEach((id) => {
        const m = moduleById[id], pr = moduleProgress(m), d = moduleDone(m);
        cards += `<a class="mod-card ${d ? "done" : ""}" href="#/${m.id}">
          <div class="mod-card-top"><span class="mod-ic">${ico(m.icon)}</span>
            <span class="mod-card-num">${m.code}</span>
            ${d ? '<span class="mod-check">✓</span>' : ""}</div>
          <h4>${m.title}</h4>
          <p>${m.summary}</p>
          <div class="mod-card-foot">
            <span class="chip">${m.level}</span><span class="chip ghost">${esc(UI.moduleScope)}</span>
            <span class="mod-anim-tag">${ico("film", 13)}${animsOf(m).length > 1 ? animsOf(m).length + " " + esc(UI.animations) : m.animation.title}</span>
          </div>
          <div class="mod-card-bar"><span style="width:${pr * 100}%"></span></div>
        </a>`;
      });
      cards += "</div></div>";
    });

    const verRows = VERIFICATION.map(
      (r) => `<tr><td>${esc(r[0])}</td><td>${highlightInline(r[1])}</td></tr>`
    ).join("");

    $("#main").innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <div class="hero-badges"><span class="chip glow">Go 1.24 · 1.25 · 1.26</span><span class="chip ghost">2026–2030 Horizon</span></div>
          <h1>${COURSE_META.title}</h1>
          <p class="hero-sub">${COURSE_META.subtitle}</p>
          <p class="hero-tag">${COURSE_META.tagline}</p>
          <div class="hero-cta">
            <a class="btn primary" href="#/${cont}">${done ? esc(UI.continue) : esc(UI.start)} · ${contM.short} →</a>
            <a class="btn ghost" href="#/${MODULES[0].id}">${esc(UI.viewFirstModule)}</a>
          </div>
        </div>
        <div class="hero-ring">
          <div class="ring-wrap">${ring(pct)}
            <div class="ring-center"><span class="ring-pct">${Math.round(pct * 100)}%</span><span class="ring-lbl">${done}/${MODULES.length} ${esc(UI.modules)}</span></div>
          </div>
          <div class="hero-stats">
            <div><b>${MODULES.length}</b><span>${esc(UI.modules)}</span></div>
            <div><b>${PARTS.length}</b><span>${esc(UI.tracks)}</span></div>
            <div><b>${animationCount}</b><span>${esc(UI.animations)}</span></div>
          </div>
        </div>
      </section>
      <div class="capstone-banner">
        <span class="cap-ico">${ico("landmark", 24)}</span>
        <div><b>${esc(UI.capstoneProject)}</b> ${esc(UI.capstoneTagline)}
        <b>${COURSE_META.capstone}</b>. ${esc(UI.capstoneFooter)}</div>
      </div>
      ${cards}
      <section class="verify">
        <h3>${esc(UI.productionChecklist)}</h3>
        <table class="verify-table"><tbody>${verRows}</tbody></table>
      </section>
      <footer class="foot">${esc(UI.footer)}</footer>
    `;
    $("#main").scrollTop = 0;
  }
  function highlightInline(s) {
    return esc(s).replace(/`([^`]+)`/g, '<code class="inl">$1</code>');
  }

  /* ----------------------------------------------------- assignments */
  const ASSIGN_LABELS = { mcq: UI.mcq, blank: UI.blank, predict: UI.predict, code: UI.code };
  const normAns = (s) => String(s == null ? "" : s).trim().replace(/\s+/g, " ").toLowerCase();
  function solvedFor(mid) { if (!state.solved[mid]) state.solved[mid] = {}; return state.solved[mid]; }
  function answersFor(mid) { if (!state.answers[mid]) state.answers[mid] = {}; return state.answers[mid]; }

  // grade one assignment -> { ok, details? }  (details for code tasks)
  function gradeAssignment(a, val) {
    if (a.type === "mcq") return { ok: String(val) !== "" && Number(val) === a.answer };
    if (a.type === "blank" || a.type === "predict") {
      const got = normAns(val);
      return { ok: got !== "" && (a.accept || []).some((acc) => normAns(acc) === got) };
    }
    if (a.type === "code") {
      const code = String(val || "");
      const details = (a.checks || []).map((c) => {
        let ok = true;
        if (c.has != null) ok = code.includes(c.has);
        else if (c.not != null) ok = !code.includes(c.not);
        else if (c.re != null) { try { ok = new RegExp(c.re).test(code); } catch { ok = false; } }
        return { ok, msg: c.msg };
      });
      return { ok: details.every((d) => d.ok), details };
    }
    return { ok: false };
  }

  function renderAssignments(m) {
    const list = (ASSIGNMENTS && ASSIGNMENTS[m.id]) || [];
    if (!list.length) return "";
    const saved = answersFor(m.id), solved = solvedFor(m.id);
    const solvedCount = list.reduce((n, _, i) => n + (solved[i] ? 1 : 0), 0);
    const cards = list.map((a, i) => {
      const v = saved[i];
      let input = "";
      if (a.type === "mcq") {
        input = `<div class="opts">${a.options.map((o, oi) =>
          `<label class="opt"><input type="radio" name="q-${m.id}-${i}" value="${oi}" ${String(v) === String(oi) ? "checked" : ""}><span>${esc(o)}</span></label>`).join("")}</div>`;
      } else if (a.type === "code") {
        input = `<textarea class="assign-code" data-i="${i}" spellcheck="false" placeholder="${esc(UI.writeGoHere)}">${esc(v != null ? v : (a.starter || ""))}</textarea>`;
      } else {
        input = `<input class="assign-input" type="text" data-i="${i}" autocomplete="off" spellcheck="false" placeholder="${esc(UI.yourAnswer)}" value="${esc(v != null ? v : "")}">`;
      }
      return `<div class="assign ${solved[i] ? "is-solved" : ""}" data-i="${i}">
        <div class="assign-head">
          <span class="assign-n">${i + 1}</span>
          <span class="assign-kind">${ASSIGN_LABELS[a.type] || ""}</span>
          <span class="assign-state">${solved[i] ? "✓ " + UI.solved : ""}</span>
        </div>
        <p class="assign-q">${esc(a.prompt)}</p>
        ${a.code ? codeBlock(a.code, a.lang || "go") : ""}
        ${input}
        <div class="assign-foot">
          <button class="btn primary small assign-check" data-i="${i}">${esc(UI.checkAnswer)}</button>
          <button class="btn ghost small assign-reveal" data-i="${i}">${esc(UI.explanation)}</button>
        </div>
        <div class="assign-out" data-i="${i}"></div>
        <div class="assign-exp" data-i="${i}" hidden>${esc(a.explain || "")}</div>
      </div>`;
    }).join("");
    return `<section class="block">
      <h2 class="block-h">${esc(UI.assignments)}
        <span class="assign-score" id="assign-score">${solvedCount}/${list.length} ${esc(UI.solved)}</span></h2>
      <p class="assign-intro">${esc(UI.answerIntro)}</p>
      <div class="assigns">${cards}</div>
    </section>`;
  }

  function wireAssignments(m) {
    const list = (ASSIGNMENTS && ASSIGNMENTS[m.id]) || [];
    if (!list.length) return;
    const saved = answersFor(m.id), solved = solvedFor(m.id);
    const readVal = (i) => {
      const a = list[i];
      if (a.type === "mcq") { const sel = $(`input[name="q-${m.id}-${i}"]:checked`); return sel ? sel.value : ""; }
      if (a.type === "code") { const ta = $(`.assign-code[data-i="${i}"]`); return ta ? ta.value : ""; }
      const inp = $(`.assign-input[data-i="${i}"]`); return inp ? inp.value : "";
    };
    const persist = (i, val) => { saved[i] = val; save(); };

    // remember inputs as the user types/picks
    $$(".assign-input").forEach((inp) => inp.addEventListener("input", () => persist(+inp.dataset.i, inp.value)));
    $$(".assign-code").forEach((ta) => ta.addEventListener("input", () => persist(+ta.dataset.i, ta.value)));
    $$('.opts input[type="radio"]').forEach((r) => r.addEventListener("change", () => {
      const i = +r.name.split("-").pop(); persist(i, r.value);
    }));

    $$(".assign-reveal").forEach((b) => b.addEventListener("click", () => {
      const exp = $(`.assign-exp[data-i="${b.dataset.i}"]`);
      if (exp) { exp.hidden = !exp.hidden; b.textContent = exp.hidden ? "Explanation" : "Hide explanation"; }
    }));

    $$(".assign-check").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i, a = list[i], val = readVal(i);
      persist(i, val);
      const res = gradeAssignment(a, val);
      const out = $(`.assign-out[data-i="${i}"]`);
      const card = $(`.assign[data-i="${i}"]`);
      if (a.type === "code" && res.details) {
        out.innerHTML = res.details.map((d) =>
          `<div class="chk ${d.ok ? "ok" : "no"}">${d.ok ? "✓" : "✗"} ${esc(d.msg)}</div>`).join("") +
          `<div class="assign-verdict ${res.ok ? "ok" : "no"}">${res.ok ? "✓ All checks pass - nice." : "Not all checks pass yet - fix the ✗ items above."}</div>`;
      } else {
        out.innerHTML = `<div class="assign-verdict ${res.ok ? "ok" : "no"}">${res.ok ? "✓ Correct!" : "✗ Not quite - try again, then hit Explanation."}</div>`;
      }
      if (res.ok) {
        solved[i] = true; card.classList.add("is-solved");
        const st = card.querySelector(".assign-state"); if (st) st.textContent = "✓ solved";
        const exp = $(`.assign-exp[data-i="${i}"]`); if (exp) exp.hidden = false;
        const rb = card.querySelector(".assign-reveal"); if (rb) rb.textContent = "Hide explanation";
      } else { delete solved[i]; card.classList.remove("is-solved"); }
      save();
      const score = $("#assign-score");
      if (score) score.textContent = list.reduce((n, _, k) => n + (solved[k] ? 1 : 0), 0) + "/" + list.length + " solved";
    }));
  }

  /* -------------------------------------------------------- module */
  let activeAnims = [];
  function renderModule(m) {
    state.last = m.id;
    state.started[m.id] = true;
    save();
    const idx = ORDERED.indexOf(m);
    const prev = ORDERED[idx - 1], next = ORDERED[idx + 1];
    const part = partById[m.part];
    const checks = checksFor(m);

    const concepts = m.concepts.map((c, i) => `
      <div class="concept" data-c="${i}">
        <button class="concept-head" data-toggle="${i}">
          <span class="concept-n">${String(i + 1).padStart(2, "0")}</span>
          <span class="concept-t">${c.title}</span>
          <span class="concept-chev">▾</span>
        </button>
        <div class="concept-body"><div class="concept-inner">
          <p>${c.body}</p>
          ${c.code ? codeBlock(c.code, c.lang) : ""}
        </div></div>
      </div>`).join("");

    const checklist = m.checklist.map((c, i) => `
      <li class="check ${checks[i] ? "on" : ""}" data-check="${i}">
        <span class="check-box">${checks[i] ? "✓" : ""}</span><span>${esc(c)}</span></li>`).join("");

    const plainHtml = m.plain
      ? `<section class="plain"><span class="plain-ic">${ico("lightbulb", 22)}</span>
           <div><span class="plain-k">${esc(UI.inPlainTerms)}</span><p>${esc(m.plain)}</p></div></section>`
      : "";
    const rightCard = m.capstone
      ? `<section class="card cap-card">
           <h3><span class="dot-cap"></span>${m.capstone.title}</h3>
           <p>${esc(m.capstone.body)}</p>
           <div class="cap-tag">${esc(UI.ledgerBuild)} · ${m.code}</div>
         </section>`
      : `<section class="card practice-card">
           <h3><span class="dot-practice"></span>${(m.practice && m.practice.title) || esc(UI.tryItYourself)}</h3>
           <p>${esc((m.practice && m.practice.body) || "")}</p>
           <ol class="practice-steps">${((m.practice && m.practice.steps) || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
         </section>`;
    const pitfallsHtml = (m.pitfalls || []).map((p) => `<li>${esc(p)}</li>`).join("");
    const takeawaysHtml = (m.takeaways || []).map((p) => `<li>${esc(p)}</li>`).join("");
    const lesson = LESSONS[m.id] || [];
    const lessonHtml = lesson.length
      ? `<section class="block lesson">
           <h2 class="block-h">${esc(UI.deepDive)}
             <span class="lesson-meta">${lesson.length} ${esc(UI.sections)} · ${esc(UI.selfPaced)}</span></h2>
           <div class="lesson-body">${lesson.map((s, i) => `
             <div class="lesson-sec">
               <h4><span class="ls-n">${i + 1}</span>${esc(s.h)}</h4>
               ${String(s.p).split(/\n\n+/).map((para) => `<p>${highlightInline(para)}</p>`).join("")}
               ${s.code ? codeBlock(s.code, s.lang || "go") : ""}
             </div>`).join("")}</div>
         </section>`
      : "";

    const example = WORKED_EXAMPLES[m.id];
    const exampleHtml = example
      ? `<section class="block worked-example">
           <h2 class="block-h">${esc(UI.workedExample)}
             <span class="lesson-meta">${example.steps.length} ${esc(UI.steps)} · ${esc(UI.runnableGo)}</span></h2>
           <p class="we-intro">${highlightInline(example.title)} - ${esc(example.intro)}</p>
           <div class="we-steps">${example.steps.map((s, i) => `
             <div class="we-step">
               <div class="we-step-head"><span class="we-n">${i + 1}</span><h4>${esc(s.title)}</h4></div>
               <p class="we-concept">${highlightInline(s.concept)}</p>
               ${s.code ? codeBlock(s.code, s.lang || "go") : ""}
               <p class="we-why"><b>${esc(UI.why)}</b> ${highlightInline(s.why)}</p>
             </div>`).join("")}</div>
         </section>`
      : "";

    const terms = (GLOSSARY && GLOSSARY[m.id]) || [];
    const glossaryHtml = terms.length
      ? `<section class="block">
           <h2 class="block-h">${esc(UI.keyTerms)}</h2>
           <div class="glossary">${terms.map((t) =>
             `<div class="gterm"><span class="gt">${esc(t[0])}</span><span class="gd">${esc(t[1])}</span></div>`).join("")}</div>
         </section>`
      : "";

    $("#main").innerHTML = `
      <article class="module">
        <div class="mod-breadcrumb">
          <a href="#/home">${esc(UI.home)}</a> <span>/</span>
          <span>${part.label} · ${part.title}</span> <span>/</span>
          <span class="bc-cur">${m.code} · ${esc(UI.moduleWord)} ${m.num}</span>
        </div>
        <header class="mod-header">
          <div class="mod-h-ic">${ico(m.icon, 26)}</div>
          <div>
            <div class="mod-h-meta"><span class="chip">${m.level}</span><span class="chip ghost">${esc(UI.moduleScope)}</span>
              ${moduleDone(m) ? `<span class="chip done-chip">✓ ${esc(UI.complete)}</span>` : ""}</div>
            <h1>${m.title}</h1>
            <p>${m.summary}</p>
          </div>
        </header>

        ${plainHtml}

        ${animsOf(m).map((a, i) => vizSectionHtml(a, i, animsOf(m).length)).join("")}

        ${lessonHtml}

        ${exampleHtml}

        <section class="block">
          <h2 class="block-h">${esc(UI.coreConcepts)}</h2>
          <div class="concepts">${concepts}</div>
        </section>

        ${renderAssignments(m)}

        <div class="two-col">
          <section class="card ai-card">
            <h3><span class="dot-ai"></span>${m.ai.title}</h3>
            <p>${m.ai.body}</p>
            <div class="prompt">
              <div class="prompt-head"><span class="prompt-k">${ico("clipboard", 14)}${esc(UI.readyPrompt)}</span>
                <button class="copy-btn small" data-copy="${esc(m.ai.prompt)}">${esc(UI.copyPrompt)}</button></div>
              <p class="prompt-body">${esc(m.ai.prompt)}</p>
            </div>
            <p class="prompt-note">${esc(UI.promptNote)} <em>${esc(UI.promptNoteEm)}</em> ${esc(UI.promptNoteEnd)}</p>
          </section>
          ${rightCard}
        </div>

        <section class="two-col">
          <div class="card pitfalls-card">
            <h3><span class="ic-pill warn">${ico("alert", 14)}</span> ${esc(UI.commonPitfalls)}</h3>
            <ul class="pitfalls">${pitfallsHtml}</ul>
          </div>
          <div class="card takeaways-card">
            <h3><span class="ic-pill key">${ico("key", 14)}</span> ${esc(UI.keyTakeaways)}</h3>
            <ul class="takeaways">${takeawaysHtml}</ul>
          </div>
        </section>

        ${glossaryHtml}

        <section class="two-col">
          <div class="card">
            <h3>${esc(UI.masteryChecklist)}</h3>
            <ul class="checklist">${checklist}</ul>
            <button class="btn ghost small" id="toggle-all">${moduleDone(m) ? esc(UI.resetModule) : esc(UI.markAllComplete)}</button>
          </div>
          <div class="card">
            <h3>${esc(UI.yourNotes)}</h3>
            <textarea id="notes" class="notes" placeholder="${esc(UI.notesPlaceholder)}">${esc(state.notes[m.id] || "")}</textarea>
            <span class="notes-status" id="notes-status"></span>
          </div>
        </section>

        <nav class="mod-nav">
          ${prev ? `<a class="btn ghost" href="#/${prev.id}">← ${prev.short}</a>` : '<span></span>'}
          <a class="btn ghost" href="#/home">${esc(UI.allModules)}</a>
          ${next ? `<a class="btn primary" href="#/${next.id}">${next.short} →</a>` : `<a class="btn primary" href="#/home">${esc(UI.finish)}</a>`}
        </nav>
      </article>`;
    $("#main").scrollTop = 0;

    wireModule(m);
    wireAssignments(m);
    setupAnims(m);
  }

  function wireModule(m) {
    // concept accordions
    $$(".concept-head").forEach((b, i) => {
      if (i === 0) b.parentElement.classList.add("open");
      b.addEventListener("click", () => b.parentElement.classList.toggle("open"));
    });
    // checklist
    $$(".check").forEach((li) => {
      li.addEventListener("click", () => {
        const i = +li.dataset.check, c = checksFor(m);
        c[i] = !c[i]; save();
        renderModule(m); renderSidebar();
      });
    });
    $("#toggle-all").addEventListener("click", () => {
      const c = checksFor(m), all = c.every(Boolean);
      state.checks[m.id] = c.map(() => !all); save();
      renderModule(m); renderSidebar();
    });
    // notes autosave
    const ta = $("#notes"), st = $("#notes-status");
    ta.addEventListener("input", () => {
      state.notes[m.id] = ta.value; save();
      st.textContent = UI.saved; clearTimeout(ta._t);
      ta._t = setTimeout(() => (st.textContent = ""), 1000);
    });
    // copy buttons
    $$("[data-copy]").forEach((b) =>
      b.addEventListener("click", () => copy(b.dataset.copy, b)));
  }

  /* ---------------------------------------------------- animation */
  const SPEEDS = [0.2, 0.4, 0.5, 0.75, 1, 1.5];

  // One viz section per animation. All element ids are suffixed with the
  // animation's index so several players can coexist on one module page.
  function vizSectionHtml(a, i, total) {
    const counter = total > 1
      ? `<span class="viz-count">${i + 1} / ${total}</span>` : "";
    return `
        <section class="viz card">
          <div class="viz-head">
            <div><span class="viz-tag">${ico("film", 13)}${esc(UI.interactiveViz)}</span>
              <h2>${a.title}</h2></div>
            ${counter}
          </div>
          <p class="viz-blurb">${a.blurb}</p>
          <div class="viz-stage">
            <canvas id="viz-canvas-${i}"></canvas>
          </div>
          <div class="viz-steps" id="viz-steps-${i}"></div>
          <div class="viz-caption" id="viz-caption-${i}">-</div>
          <div class="viz-controls">
            <button class="vc-btn" id="vc-reset-${i}" title="${esc(UI.resetToStart)}">${ico("rotateCcw", 17)}</button>
            <button class="vc-btn" id="vc-step-b-${i}" title="${esc(UI.nudgeBack)}">${ico("chevronLeft", 18)}</button>
            <button class="vc-btn play" id="vc-play-${i}" title="${esc(UI.playPause)}">${ico("play", 17)}</button>
            <button class="vc-btn" id="vc-step-f-${i}" title="${esc(UI.nudgeForward)}">${ico("chevronRight", 18)}</button>
            <input type="range" id="vc-scrub-${i}" min="0" max="1000" value="0" aria-label="scrub" />
            <button class="vc-btn speed" id="vc-speed-${i}" title="${esc(UI.playbackSpeed)}">0.4×</button>
          </div>
        </section>`;
  }

  function setupAnims(m) {
    activeAnims.forEach((a) => a.destroy());
    activeAnims = [];
    animsOf(m).forEach((meta, i) => wireViz(meta, i));
    window.__activeAnims = activeAnims;
    window.__activeAnim = activeAnims[0] || null; // back-compat for resize/space
  }

  // Wire a single viz (canvas + controls + step indicator) by its index.
  function wireViz(meta, i) {
    const canvas = $("#viz-canvas-" + i);
    const factory = window.ANIMATIONS[meta.id];
    if (!canvas || !factory) return;
    const anim = factory(canvas);
    activeAnims.push(anim);
    const playBtn = $("#vc-play-" + i), scrub = $("#vc-scrub-" + i), cap = $("#viz-caption-" + i),
      stepsEl = $("#viz-steps-" + i), speedBtn = $("#vc-speed-" + i);
    const phases = anim.getPhases();
    const captionHtml = (ph) => esc(trCap(ph.desc)) +
      (ph.why ? `<span class="viz-why"><b>${esc(UI.why)}</b> ${esc(trCap(ph.why))}</span>` : "");

    // build the step indicator: a clickable dot per phase + current step label
    stepsEl.innerHTML =
      `<div class="steps-dots">${phases.map((p, k) =>
        `<button class="step-dot" data-i="${k}" title="${esc(trCap(p.title))}"><b>${k + 1}</b><span>${esc(trCap(p.title))}</span></button>`).join("")}</div>
       <div class="steps-now"><span class="steps-badge">${UI.step} 1 / ${phases.length}</span>
       <span class="steps-title">${esc(trCap(phases[0].title))}</span></div>`;
    const dots = $$(".step-dot", stepsEl);
    const sBadge = $(".steps-badge", stepsEl), sTitle = $(".steps-title", stepsEl);
    const stepsNow = $(".steps-now", stepsEl);

    function reserveDynamicTextSpace() {
      const currentCaption = cap.innerHTML;
      const currentTitle = sTitle.textContent;
      cap.style.minHeight = "";
      stepsNow.style.minHeight = "";

      let capH = 0;
      phases.forEach((ph) => {
        cap.innerHTML = captionHtml(ph);
        capH = Math.max(capH, cap.offsetHeight);
      });
      cap.style.minHeight = capH + "px";

      let titleH = 0;
      phases.forEach((ph) => {
        sTitle.textContent = trCap(ph.title);
        titleH = Math.max(titleH, stepsNow.offsetHeight);
      });
      stepsNow.style.minHeight = titleH + "px";

      cap.innerHTML = currentCaption || captionHtml(phases[0]);
      sTitle.textContent = currentTitle || trCap(phases[0].title);
    }
    reserveDynamicTextSpace();
    let reserveTimer = 0;
    function onResizeTextSpace() {
      clearTimeout(reserveTimer);
      reserveTimer = setTimeout(reserveDynamicTextSpace, 80);
    }
    window.addEventListener("resize", onResizeTextSpace);
    const destroyAnim = anim.destroy;
    anim.destroy = () => {
      clearTimeout(reserveTimer);
      window.removeEventListener("resize", onResizeTextSpace);
      destroyAnim();
    };

    let dragging = false, speedI = 1; // default 0.4×
    let lastPhase = -1;
    anim.setSpeed(SPEEDS[speedI]);
    speedBtn.textContent = SPEEDS[speedI] + "×";

    anim.onFrame((p, ph) => {
      if (!dragging) scrub.value = Math.round(p * 1000);
      if (ph && ph.index !== lastPhase) {
        lastPhase = ph.index;
        cap.innerHTML = captionHtml(ph);
        sBadge.textContent = UI.step + " " + (ph.index + 1) + " / " + ph.total;
        sTitle.textContent = trCap(ph.title);
        dots.forEach((d, k) => {
          d.classList.toggle("active", k === ph.index);
          d.classList.toggle("done", k < ph.index);
        });
      }
      refresh();
    });
    function refresh() {
      playBtn.innerHTML = anim.isPlaying() ? ico("pause", 17) : ico("play", 17);
      playBtn.classList.toggle("playing", anim.isPlaying());
    }
    playBtn.addEventListener("click", () => { anim.toggle(); refresh(); });
    $("#vc-reset-" + i).addEventListener("click", () => { anim.reset(); refresh(); });
    $("#vc-step-f-" + i).addEventListener("click", () => { anim.step(0.4); refresh(); });
    $("#vc-step-b-" + i).addEventListener("click", () => { anim.step(-0.4); refresh(); });
    scrub.addEventListener("input", () => { dragging = true; anim.seek(+scrub.value / 1000); refresh(); });
    scrub.addEventListener("change", () => { dragging = false; });
    dots.forEach((d) => d.addEventListener("click", () => { anim.seekPhase(+d.dataset.i); refresh(); }));
    speedBtn.addEventListener("click", () => {
      speedI = (speedI + 1) % SPEEDS.length;
      anim.setSpeed(SPEEDS[speedI]);
      speedBtn.textContent = SPEEDS[speedI] + "×";
    });
    // autoplay only the first viz on first view - the rest wait for the user,
    // so several players don't all animate (and burn CPU) at once.
    setTimeout(() => { anim.resize(); if (i === 0) { anim.play(); } refresh(); }, 120);
  }

  /* ------------------------------------------------------- routing */
  function currentRoute() {
    const h = location.hash.replace(/^#\/?/, "") || "home";
    return h;
  }
  function route() {
    const r = currentRoute();
    if (activeAnims.length) { activeAnims.forEach((a) => a.destroy()); activeAnims = []; window.__activeAnim = null; window.__activeAnims = []; }
    if (r === "home" || !moduleById[r]) {
      if (r !== "home" && !moduleById[r]) location.hash = "#/home";
      renderHome();
    } else {
      renderModule(moduleById[r]);
    }
    renderSidebar();
    // close mobile nav
    document.body.classList.remove("nav-open");
  }
  window.addEventListener("hashchange", route);

  /* --------------------------------------------------- theme + chrome */
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const tb = $("#theme-btn");
    if (tb) tb.innerHTML = state.theme === "dark" ? ico("moon", 17) : ico("sun", 17);
  }

  /* -------------------------------------------------- keyboard nav */
  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    const r = currentRoute(), m = moduleById[r];
    if (e.key === "ArrowRight" && m) {
      const n = ORDERED[ORDERED.indexOf(m) + 1]; if (n) location.hash = "#/" + n.id;
    } else if (e.key === "ArrowLeft" && m) {
      const p = ORDERED[ORDERED.indexOf(m) - 1]; if (p) location.hash = "#/" + p.id;
    } else if (e.key === " " && activeAnims[0]) {
      e.preventDefault(); activeAnims[0].toggle();
    }
  });

  /* ------------------------------------------------------------ boot */
  function boot() {
    document.getElementById("app").innerHTML = `
      <header class="topbar">
        <button class="nav-toggle" id="nav-toggle" aria-label="menu">${ico("menu", 18)}</button>
        <a class="brand" href="#/home">
          <span class="brand-mark">go</span>
          <span class="brand-text"><b>Hardcore Go</b><small>${esc(UI.brandSubtitle)}</small></span>
        </a>
        <div class="topbar-right">
          <div class="top-progress" id="top-progress"></div>
          <button class="icon-btn lang-btn" id="lang-btn" title="${esc(UI.toggleLang)}">${LANG === "ru" ? "EN" : "RU"}</button>
          <button class="icon-btn" id="theme-btn" title="${esc(UI.toggleTheme)}">${ico("moon", 17)}</button>
        </div>
      </header>
      <div class="layout">
        <aside class="sidebar" id="sidebar">
          <div class="nav-search"><input id="nav-filter" placeholder="${esc(UI.filterModules)}" /></div>
          <nav id="nav-list"></nav>
          <div class="sidebar-foot" id="sidebar-foot"></div>
        </aside>
        <main id="main"></main>
      </div>
      <div class="nav-scrim" id="nav-scrim"></div>`;

    applyTheme();
    $("#theme-btn").addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark"; save(); applyTheme();
      activeAnims.forEach((a) => a.render());
    });
    $("#lang-btn").addEventListener("click", () => {
      state.lang = LANG === "ru" ? "en" : "ru"; saveNow();
      location.reload();
    });
    $("#nav-toggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    $("#nav-scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));
    $("#nav-filter").addEventListener("input", renderSidebar);
    updateTopProgress();
    route();
    // keep top progress + sidebar foot fresh
    setInterval(() => { updateTopProgress(); }, 1500);
  }
  function updateTopProgress() {
    const done = overallDone(), pct = Math.round((done / MODULES.length) * 100);
    const tp = $("#top-progress");
    if (tp) tp.innerHTML = `<span class="tp-bar"><span style="width:${pct}%"></span></span><span class="tp-num">${pct}%</span>`;
    const sf = $("#sidebar-foot");
    if (sf) sf.innerHTML = `<div class="sf-ring">${ring(done / MODULES.length, 54, 5)}</div>
      <div><b>${done}/${MODULES.length}</b><span>${esc(UI.modulesComplete)}</span></div>`;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

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
     COURSE_RU/COURSE_AZ are allowed to be PARTIAL: translation is filled in
     module by module. mergeCourse overlays whatever the translation has onto
     the EN base, so any not-yet-translated field/module falls back to
     English instead of crashing or rendering blank. */
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
    out.COURSE_META = Object.assign({}, en.COURSE_META || {}, ru.COURSE_META || {});
    out.COURSE_META.ledgerRoadmap = Object.assign(
      {},
      (en.COURSE_META && en.COURSE_META.ledgerRoadmap) || {},
      (ru.COURSE_META && ru.COURSE_META.ledgerRoadmap) || {}
    );
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
  // The cycle a click on the language button advances through: en -> ru -> az -> en.
  const LANG_CYCLE = { en: "ru", ru: "az", az: "en" };
  const TRANSLATED_COURSE = { ru: window.COURSE_RU, az: window.COURSE_AZ };
  const CANVAS_DICT = { ru: window.CANVAS_RU, az: window.CANVAS_AZ };
  const LANG = (TRANSLATED_COURSE[state.lang]) ? state.lang : "en";
  window.__LANG__ = LANG; // read by animations.js to pick translated canvas text
  const COURSE = LANG === "en" ? window.COURSE_EN : mergeCourse(window.COURSE_EN, TRANSLATED_COURSE[LANG]);
  const UI = (window.UI_STRINGS && window.UI_STRINGS[LANG]) || window.UI_STRINGS.en;
  // animation step title/desc/why captions are translated via the same exact-string
  // dictionary animations.js uses for canvas text (window.CANVAS_RU/CANVAS_AZ) - see AGENTS.md.
  function trCap(s) {
    const dict = CANVAS_DICT[LANG];
    return (dict && dict[s]) || s;
  }

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
  const ledgerBuildOf = (m) =>
    (COURSE_META.ledgerRoadmap && COURSE_META.ledgerRoadmap[m.id]) || m.capstone || m.practice || {};

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
  // Turns a plain YouTube/Vimeo watch URL into its embeddable player URL.
  // Only these two hosts are ever used for module videos, and the embed is
  // injected lazily on click (see wireModule) - the page makes zero network
  // calls to either host just from being opened over file://.
  function videoEmbedSrc(url) {
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0`;
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
    return null;
  }
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
    if (lang && lang !== "go" && lang !== "sql") return esc(codeRaw);
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
    const label = lang || "go";
    return `<div class="code">
      <div class="code-head"><span class="code-lang">${label}</span>
      <button class="copy-btn" data-copy="${esc(code)}">${esc(UI.copy)}</button></div>
      <pre><code>${highlight(code, lang)}</code></pre></div>`;
  }
  function bindCopyButtons(root = document) {
    $$("[data-copy]", root).forEach((b) =>
      b.addEventListener("click", () => copy(b.dataset.copy, b)));
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
    map: "M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15",
    wrench: "M14.7 6.3a4 4 0 004.9 4.9L10 20.8a2.2 2.2 0 01-3.1-3.1l9.6-9.6a4 4 0 01-4.9-4.9 4.8 4.8 0 003.1 3.1z",
    github: "M12 2a10 10 0 00-3.2 19c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5A3.9 3.9 0 016.5 8c-.1-.3-.4-1.3.1-2.8 0 0 .9-.3 2.9 1.1A9.8 9.8 0 0112 6c.9 0 1.8.1 2.6.4 2-1.4 2.9-1.1 2.9-1.1.5 1.5.2 2.5.1 2.8a3.9 3.9 0 011 2.7c0 3.9-2.4 4.7-4.7 5 .4.3.8 1 .8 2v2.9c0 .3.2.6.8.5A10 10 0 0012 2z",
    linkedin: "M4 9h4v12H4zM6 4a2 2 0 110 4 2 2 0 010-4zM10 9h4v1.7c.6-1 1.7-1.9 3.5-1.9 3 0 4.5 2 4.5 5.2v7h-4v-6.4c0-1.7-.7-2.7-2-2.7-1.3 0-2 1-2 2.7V21h-4z",
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
    arrowUp: "M12 19V5M5 12l7-7 7 7",
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
    const filter = ($("#nav-filter") && $("#nav-filter").value || "").trim().toLowerCase();
    const cur = currentRoute();
    let matches = 0;
    let html = `<a class="nav-home ${cur === "home" ? "active" : ""}" href="#/home">
      <span class="nav-home-ic">${ico("ship", 16)}</span> ${esc(UI.courseHome)}</a>`;
    PARTS.forEach((p) => {
      const mods = p.modules.map((id) => moduleById[id]);
      const visible = mods.filter((m) => !filter || (m.title + m.short + m.summary).toLowerCase().includes(filter));
      if (!visible.length) return;
      matches += visible.length;
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
    if (filter && matches === 0) {
      html += `<div class="nav-empty">
        <b>${esc(UI.noSearchResults)}</b>
        <button class="btn ghost small" id="nav-clear">${esc(UI.clearFilter)}</button>
      </div>`;
    }
    $("#nav-list").innerHTML = html;
    const clear = $("#nav-clear");
    if (clear) clear.addEventListener("click", () => {
      const input = $("#nav-filter");
      if (input) input.value = "";
      renderSidebar();
      if (input) input.focus();
    });
  }

  /* ---------------------------------------------------------- home */
  function renderHome() {
    const done = overallDone(), pct = done / MODULES.length;
    const first = ORDERED[0];
    const hasLast = state.last && moduleById[state.last];
    const cont = hasLast ? state.last : first.id;
    const contM = moduleById[cont];
    const animationCount = new Set(MODULES.flatMap((m) => animsOf(m).map((a) => a.id))).size;
    let cards = "";
    const capstoneMap = PARTS.map((p) => {
      const items = p.modules.map((id) => {
        const m = moduleById[id];
        const build = ledgerBuildOf(m);
        return `<a class="capstone-step" href="#/${m.id}">
          <span class="capstone-step-code">${esc(m.code)}</span>
          <span class="capstone-step-main">
            <b>${esc(m.short)}</b>
            <span>${esc(build.title || m.title)}</span>
          </span>
          <span class="capstone-step-open">${esc(UI.capstoneRoadmapOpen)} ${ico("chevronRight", 14)}</span>
        </a>`;
      }).join("");
      return `<section class="capstone-part">
        <div class="capstone-part-head">
          <span>${esc(p.label)}</span>
          <b>${esc(p.title)}</b>
        </div>
        <div class="capstone-steps">${items}</div>
      </section>`;
    }).join("");
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
    const finalCode = finalProjectHtml();

    $("#main").innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <div class="hero-badges"><span class="chip glow">Go 1.24 · 1.25 · 1.26</span><span class="chip ghost">2026–2030 Horizon</span></div>
          <h1>${COURSE_META.title}</h1>
          <p class="hero-sub">${COURSE_META.subtitle}</p>
          <p class="hero-tag">${COURSE_META.tagline}</p>
          <div class="hero-cta">
            <a class="btn primary" href="#/${cont}">${hasLast ? esc(UI.continue) : esc(UI.start)} · ${contM.short} →</a>
            <a class="btn ghost" href="#/${first.id}">${esc(UI.viewFirstModule)}</a>
          </div>
        </div>
        <div class="hero-gopher" aria-hidden="true"><canvas id="gopher3d"></canvas></div>
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
      <section class="capstone-map">
        <div class="capstone-map-head">
          <span class="cap-ico">${ico("map", 22)}</span>
          <div>
            <h2>${esc(UI.capstoneRoadmapTitle)}</h2>
            <p>${esc(UI.capstoneRoadmapIntro)}</p>
          </div>
        </div>
        <div class="capstone-map-grid">${capstoneMap}</div>
      </section>
      ${finalCode}
      <h2 class="sr-only">${esc(UI.courseModules)}</h2>
      ${cards}
      <section class="verify">
        <h3>${esc(UI.productionChecklist)}</h3>
        <table class="verify-table"><tbody>${verRows}</tbody></table>
      </section>
      ${footerHtml()}
    `;
    if (window.GOPHER3D) GOPHER3D.mount($("#gopher3d"));
    bindCopyButtons($("#main"));
    // count-up hero stats and draw the progress ring in from zero
    $$(".hero-stats b").forEach((b) => countUp(b, parseInt(b.textContent, 10) || 0, String));
    countUp($(".ring-pct"), Math.round(pct * 100), (v) => v + "%");
    const rc = $(".ring circle + circle");
    if (rc && !REDUCED) {
      const off = rc.getAttribute("stroke-dashoffset");
      rc.setAttribute("stroke-dashoffset", rc.getAttribute("stroke-dasharray"));
      requestAnimationFrame(() => requestAnimationFrame(() => rc.setAttribute("stroke-dashoffset", off)));
    }
    $("#main").scrollTop = 0;
    window.scrollTo(0, 0);
  }
  function highlightInline(s) {
    return esc(s).replace(/`([^`]+)`/g, '<code class="inl">$1</code>');
  }
  function finalProjectHtml() {
    const files = COURSE_META.finalProjectFiles || [];
    if (!files.length) return "";
    return `<section class="final-code">
      <div class="final-code-head">
        <span class="cap-ico">${ico("database", 22)}</span>
        <div>
          <h2>${esc(UI.finalProjectCodeTitle)}</h2>
          <p>${esc(UI.finalProjectCodeIntro)}</p>
          <span class="final-code-meta">${esc(UI.finalProjectCodeMeta)}</span>
        </div>
      </div>
      <div class="project-files">
        ${files.map((f, i) => `<details class="project-file" ${i === 0 ? "open" : ""}>
          <summary><span>${esc(f.path)}</span><b>${esc(f.lang || "go")}</b></summary>
          ${codeBlock(f.code, f.lang)}
        </details>`).join("")}
      </div>
    </section>`;
  }
  function footerHtml() {
    return `<footer class="foot">
      <span>${esc(UI.footer)}</span>
      <span class="foot-links">
        <a href="https://www.linkedin.com/in/inajaf/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">${ico("linkedin", 16)}LinkedIn</a>
        <a href="https://github.com/inajaf" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${ico("github", 16)}GitHub</a>
      </span>
    </footer>`;
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
      if (exp) { exp.hidden = !exp.hidden; b.textContent = exp.hidden ? UI.explanation : UI.hideExplanation; }
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
          `<div class="assign-verdict ${res.ok ? "ok" : "no"}">${esc(res.ok ? UI.allChecksPass : UI.notAllChecksPass)}</div>`;
      } else {
        out.innerHTML = `<div class="assign-verdict ${res.ok ? "ok" : "no"}">${esc(res.ok ? UI.correct : UI.notQuite)}</div>`;
      }
      if (res.ok) {
        solved[i] = true; card.classList.add("is-solved");
        const st = card.querySelector(".assign-state"); if (st) st.textContent = "✓ " + UI.solved;
        const exp = $(`.assign-exp[data-i="${i}"]`); if (exp) exp.hidden = false;
        const rb = card.querySelector(".assign-reveal"); if (rb) rb.textContent = UI.hideExplanation;
      } else { delete solved[i]; card.classList.remove("is-solved"); }
      save();
      const score = $("#assign-score");
      if (score) score.textContent = list.reduce((n, _, k) => n + (solved[k] ? 1 : 0), 0) + "/" + list.length + " " + UI.solved;
    }));
  }

  /* -------------------------------------------------------- module */
  let activeAnims = [];
  let lazyVizObservers = [];
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

    const videos = m.videos || [];
    const videosHtml = videos.length
      ? `<section class="block video-lessons">
           <h2 class="block-h">${esc(UI.videoLessons)}</h2>
           <div class="videos">${videos.map((v, i) => `
             <div class="video-card">
               <button class="video-card-head" type="button" data-play-video="${i}" aria-expanded="false">
                 <span class="video-ic">${ico("film", 18)}</span>
                 <div class="video-card-main">
                   <h4>${esc(v.title)}</h4>
                   <span class="video-card-speaker">${esc(v.speaker)}</span>
                   <p>${esc(v.blurb)}</p>
                 </div>
                 <span class="video-open">${esc(UI.watchOn)} ${ico("play", 14)}</span>
               </button>
               <div class="video-player" id="video-player-${i}"></div>
               <a class="video-ext-link" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(UI.openExternally)}</a>
             </div>`).join("")}</div>
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

        ${videosHtml}

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
    window.scrollTo(0, 0);

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
    // video lessons: inject the iframe only on click, so opening the page
    // never itself reaches out to YouTube/Vimeo - only pressing play does.
    $$(".video-card-head").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = btn.dataset.playVideo;
        const holder = $("#video-player-" + i);
        if (holder.classList.contains("on")) {
          holder.classList.remove("on");
          holder.innerHTML = "";
          btn.setAttribute("aria-expanded", "false");
          return;
        }
        const video = (m.videos || [])[i];
        if (!video) return;
        // YouTube (Error 153) and Vimeo (fails its Cloudflare bot check) both
        // refuse to play inside an iframe whose parent page has a file://
        // (null) origin - confirmed by hand, not a guess. That's exactly how
        // this site is meant to be opened (see AGENTS.md), so embedding would
        // silently show a broken player for every such reader. Embed only
        // when actually served over http(s) (e.g. GitHub Pages); otherwise
        // fall back to opening the real page, same as "Open externally".
        const src = location.protocol !== "file:" && videoEmbedSrc(video.url);
        if (!src) { window.open(video.url, "_blank", "noopener"); return; }
        $$(".video-player.on").forEach((h) => { h.classList.remove("on"); h.innerHTML = ""; });
        $$(".video-card-head[aria-expanded=true]").forEach((b) => b.setAttribute("aria-expanded", "false"));
        holder.innerHTML = `<div class="video-embed"><iframe src="${esc(src)}" title="${esc(video.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
        holder.classList.add("on");
        btn.setAttribute("aria-expanded", "true");
      });
    });
    // checklist
    $$(".check").forEach((li) => {
      li.addEventListener("click", () => {
        const i = +li.dataset.check, c = checksFor(m);
        const wasDone = moduleDone(m);
        c[i] = !c[i]; save();
        renderModule(m); renderSidebar();
        if (!wasDone && moduleDone(m)) celebrate();
      });
    });
    $("#toggle-all").addEventListener("click", () => {
      const c = checksFor(m), all = c.every(Boolean);
      const wasDone = moduleDone(m);
      state.checks[m.id] = c.map(() => !all); save();
      renderModule(m); renderSidebar();
      if (!wasDone && moduleDone(m)) celebrate();
    });
    // notes autosave
    const ta = $("#notes"), st = $("#notes-status");
    ta.addEventListener("input", () => {
      state.notes[m.id] = ta.value; save();
      st.textContent = UI.saved; clearTimeout(ta._t);
      ta._t = setTimeout(() => (st.textContent = ""), 1000);
    });
    bindCopyButtons($("#main"));
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
            <button class="vc-btn" id="vc-reset-${i}" title="${esc(UI.resetToStart)}" aria-label="${esc(UI.resetToStart)}">${ico("rotateCcw", 17)}</button>
            <button class="vc-btn" id="vc-step-b-${i}" title="${esc(UI.nudgeBack)}" aria-label="${esc(UI.nudgeBack)}">${ico("chevronLeft", 18)}</button>
            <button class="vc-btn play" id="vc-play-${i}" title="${esc(UI.playPause)}" aria-label="${esc(UI.playPause)}">${ico("play", 17)}</button>
            <button class="vc-btn" id="vc-step-f-${i}" title="${esc(UI.nudgeForward)}" aria-label="${esc(UI.nudgeForward)}">${ico("chevronRight", 18)}</button>
            <input type="range" id="vc-scrub-${i}" min="0" max="1000" value="0" aria-label="${esc(UI.scrubTimeline)}" />
            <button class="vc-btn speed" id="vc-speed-${i}" title="${esc(UI.playbackSpeed)}" aria-label="${esc(UI.playbackSpeed)}">0.4×</button>
          </div>
        </section>`;
  }

  function setupAnims(m) {
    cleanupAnims();
    animsOf(m).forEach((meta, i) => scheduleViz(meta, i));
    window.__activeAnims = activeAnims;
    window.__activeAnim = activeAnims[0] || null; // back-compat for resize/space
  }

  function cleanupAnims() {
    lazyVizObservers.forEach((o) => o.disconnect());
    lazyVizObservers = [];
    activeAnims.forEach((a) => a.destroy());
    activeAnims = [];
    window.__activeAnim = null;
    window.__activeAnims = [];
  }

  function scheduleViz(meta, i) {
    const canvas = $("#viz-canvas-" + i);
    const section = canvas && canvas.closest(".viz");
    if (!canvas || !section) return;
    let wired = false, io = null;
    const wireOnce = () => {
      if (wired) return;
      wired = true;
      if (io) io.disconnect();
      wireViz(meta, i);
      window.__activeAnims = activeAnims;
      if (!window.__activeAnim) window.__activeAnim = activeAnims[0] || null;
    };
    if (i === 0 || !("IntersectionObserver" in window)) {
      wireOnce();
      return;
    }
    io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting || e.intersectionRatio > 0)) wireOnce();
    }, { rootMargin: "160px 0px" });
    io.observe(section);
    lazyVizObservers.push(io);
    ["pointerdown", "focusin"].forEach((ev) =>
      section.addEventListener(ev, wireOnce, { once: true }));
  }

  // Wire a single viz (canvas + controls + step indicator) by its index.
  function wireViz(meta, i) {
    const canvas = $("#viz-canvas-" + i);
    const factory = window.ANIMATIONS[meta.id];
    if (!canvas || !factory) return;
    const anim = factory(canvas);
    activeAnims.push(anim);
    window.__activeAnims = activeAnims;
    if (!window.__activeAnim) window.__activeAnim = anim;
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
  /* ------------------------------------------------- micro-interactions */
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pageEnter() {
    const m = $("#main");
    m.classList.remove("page-enter");
    void m.offsetWidth; // restart the animation on every route change
    m.classList.add("page-enter");
  }

  // Fade-rise content the first time it scrolls into view. Classes are
  // removed again after the transition so they can never fight the
  // hover/active transforms the revealed elements have of their own.
  let revealIO = null;
  function setupReveals() {
    if (REDUCED || typeof IntersectionObserver === "undefined") return;
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          revealIO.unobserve(en.target);
          en.target.classList.add("revealed");
          setTimeout(() => {
            en.target.classList.remove("reveal", "revealed");
            en.target.style.transitionDelay = "";
          }, 700);
        });
      }, { threshold: 0.08 });
    }
    $$(".part-block, .capstone-banner, .verify, section.viz, .concept, .we-step, .lesson-sec, .assign").forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 50 + "ms";
      revealIO.observe(el);
    });
  }

  function countUp(el, target, fmt, dur = 900) {
    if (!el) return;
    if (REDUCED) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * e));
      if (p < 1 && el.isConnected) requestAnimationFrame(tick);
    })(t0);
  }

  function confettiBurst(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#00add8", "#a98bff", "#3ad29f", "#f5b14c", "#ec4a7d"];
    const parts = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 90,
      y: h / 2 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 13,
      vy: -5 - Math.random() * 9,
      s: 5 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function tick(now) {
      const t = (now - t0) / 1000;
      if (t > 2.6 || !canvas.isConnected) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - t / 2.4);
      parts.forEach((p) => {
        p.x += p.vx * 0.6; p.y += p.vy * 0.6; p.vy += 0.24; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
        ctx.restore();
      });
      requestAnimationFrame(tick);
    })(t0);
  }

  let celebrating = false;
  function celebrate() {
    if (celebrating) return;
    celebrating = true;
    const ov = document.createElement("div");
    ov.className = "celebrate-overlay";
    ov.setAttribute("aria-hidden", "true");
    ov.innerHTML = `<canvas></canvas>
      <div class="celebrate-card">
        ${window.GOPHER_STICKER_URI ? `<img src="${window.GOPHER_STICKER_URI}" alt="" />` : ""}
        <b>${esc(UI.moduleComplete)}</b><span>${esc(UI.moduleCompleteSub)}</span>
      </div>`;
    document.body.appendChild(ov);
    if (!REDUCED) confettiBurst(ov.querySelector("canvas"));
    setTimeout(() => { ov.remove(); celebrating = false; }, 3100);
  }

  function route() {
    const r = currentRoute();
    cleanupAnims();
    if (r === "home" || !moduleById[r]) {
      if (r !== "home" && !moduleById[r]) location.hash = "#/home";
      renderHome();
      document.body.classList.remove("is-module");
    } else {
      renderModule(moduleById[r]);
      document.body.classList.add("is-module");
    }
    renderSidebar();
    pageEnter();
    setupReveals();
    updateReadProgress();
    // close mobile nav
    document.body.classList.remove("nav-open");
  }
  window.addEventListener("hashchange", route);

  /* ------------------------------------------------- reading progress
     A thin bar pinned to the very top of the viewport tracking scroll
     depth through the current module's content, plus a fade-in
     back-to-top button once you've scrolled past the fold. Both are
     no-ops on the home page (toggled via the .is-module body class). */
  function updateReadProgress() {
    const bar = $("#read-progress-bar");
    const btt = $("#back-to-top");
    const isModule = document.body.classList.contains("is-module");
    if (bar) {
      const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = isModule && scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
      bar.style.width = pct + "%";
    }
    if (btt) btt.classList.toggle("show", isModule && window.scrollY > 480);
  }
  window.addEventListener("scroll", updateReadProgress, { passive: true });

  /* --------------------------------------------------- theme + chrome */
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const tb = $("#theme-btn");
    if (tb) tb.innerHTML = state.theme === "dark" ? ico("moon", 17) : ico("sun", 17);
  }
  function applyDocumentChrome() {
    document.documentElement.lang = LANG;
    document.title = UI.docTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", UI.docDescription);
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
      <div class="read-progress"><span id="read-progress-bar"></span></div>
      <header class="topbar">
        <button class="nav-toggle" id="nav-toggle" aria-label="${esc(UI.openMenu)}">${ico("menu", 18)}</button>
        <a class="brand" href="#/home">
          <span class="brand-mark">go</span>
          <span class="brand-text"><b>Hardcore Go</b><small>${esc(UI.brandSubtitle)}</small></span>
        </a>
        <div class="topbar-right">
          <div class="top-progress" id="top-progress"></div>
          <button class="icon-btn lang-btn" id="lang-btn" title="${esc(UI.toggleLang)}" aria-label="${esc(UI.toggleLangAria)}">${LANG_CYCLE[LANG].toUpperCase()}</button>
          <button class="icon-btn" id="theme-btn" title="${esc(UI.toggleTheme)}" aria-label="${esc(UI.toggleTheme)}">${ico("moon", 17)}</button>
        </div>
      </header>
      <div class="layout">
        <aside class="sidebar" id="sidebar">
          <div class="nav-search">
            <label class="sr-only" for="nav-filter">${esc(UI.searchModulesLabel)}</label>
            <input id="nav-filter" placeholder="${esc(UI.filterModules)}" aria-label="${esc(UI.searchModulesLabel)}" />
          </div>
          <nav id="nav-list"></nav>
          <div class="sidebar-foot" id="sidebar-foot"></div>
        </aside>
        <main id="main"></main>
      </div>
      <div class="nav-scrim" id="nav-scrim"></div>
      <button class="back-to-top" id="back-to-top" aria-label="${esc(UI.backToTop)}" title="${esc(UI.backToTop)}">${ico("arrowUp", 18)}</button>`;

    applyDocumentChrome();
    applyTheme();
    $("#theme-btn").addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark"; save(); applyTheme();
      activeAnims.forEach((a) => a.render());
    });
    $("#lang-btn").addEventListener("click", () => {
      state.lang = LANG_CYCLE[LANG]; saveNow();
      location.reload();
    });
    $("#nav-toggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    $("#nav-scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));
    $("#nav-filter").addEventListener("input", renderSidebar);
    $("#back-to-top").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    });
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

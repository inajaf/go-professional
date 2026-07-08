---
name: ui-polish-loop
description: Run one iteration of go-professional's ongoing visual/interaction polish loop - survey the live site with screenshots, find one or two concrete "static where it should feel alive" gaps, implement them, validate, commit. Use whenever the user asks to make the site "more live", "prettier", "nicer to use", or asks to continue the UI polish loop.
---

# go-professional UI polish loop

This course site (see `AGENTS.md` for the full architecture) is a mature, already well-designed product - it is not a neglected page that needs a redesign. The polish loop is therefore small, targeted rounds, not sweeping visual overhauls. Each round should be one or two changes you can point at and explain, not a redesign.

## The loop, one iteration at a time

1. **Survey with real screenshots, not code reading alone.** Launch the site with Puppeteer (`puppeteer-core` + system Chrome, see below), and look at: the home page, a module page scrolled to a few different depths, both dark and light themes, and a mobile viewport (390x844 is a good default). Reading the CSS tells you what rules exist; it does not tell you what's actually missing on the rendered page. Screenshot first, read CSS second to confirm.
2. **Find genuinely static things that look interactive, or genuinely missing affordances** - not "add more animation for its own sake." Good candidates found this way before: a card grid with no hover state while a sibling card grid two sections away has one; a page long enough to need a reading-progress indicator and a back-to-top button, neither of which existed; keyboard focus falling back to the browser default outline because no `:focus-visible` rule was ever added. Bad candidates: decorative motion with no functional point, anything that would fight `prefers-reduced-motion`, restyling something that already has a considered hover/transition treatment just to make it different.
3. **Match the existing design system exactly** - don't invent new colors, easing curves, or spacing scales. Reuse the CSS custom properties already defined at the top of `css/styles.css` (`--go`, `--purple`, `--ease`, `--ease-pop`, `--radius`, etc.) and the transition patterns already established (`.mod-card:hover`, `.opt:hover`, `.icon-btn:hover` are good templates for "what hover looks like here"). A new interaction that doesn't reuse these will look bolted-on even if it's well-crafted in isolation.
4. **Respect what's already deliberate:**
   - `prefers-reduced-motion` is handled by one global override near the bottom of `css/styles.css` that collapses all animation/transition durations to near-zero - new transitions don't need their own reduced-motion escape hatch, they inherit this automatically as long as they're plain CSS `transition`/`animation`, not JS-timed loops.
   - The `REDUCED` flag in `js/app.js` is the JS-side equivalent, checked before anything JS-driven and non-trivial (e.g. smooth vs. instant scroll).
   - Any new visible string needs entries in all three languages - `UI_STRINGS` in `js/strings.js` has `en`/`ru`/`az` blocks that must stay key-for-key identical (see the `i18n-translate` skill).
5. **Validate every round the same way, before committing:**
   - `jsc` syntax/runtime check (see the `validate-js-headless` skill) for `en`, `ru`, and `az` - catches anything a JS change broke.
   - A real Puppeteer pass: screenshot the changed area in both themes, and if the change involves interaction (hover, focus, click), drive that interaction (`page.hover(...)`, `page.keyboard.press("Tab")`, `page.click(...)`) and screenshot the result - a static "it loaded" screenshot proves nothing about a hover state.
   - Confirm nothing regressed: the existing `jsc` shape checks (module counts, `UI_STRINGS` key counts, `ANIMATIONS` count) should be unchanged unless you intentionally added content.
6. **Commit each round separately** with a commit message that names the concrete gap and the concrete fix - not "UI polish" as a single vague message. Small, explainable diffs are what make this a *loop* rather than one large uncontrolled redesign commit.
7. **Stop when a round doesn't turn up a genuine gap.** If a survey pass finds only things that are already well-handled, say so rather than inventing busywork - forcing a change because the loop expects one is exactly the "gimmicky" failure mode to avoid.

## How to screenshot the site (no dev server needed)

The site works over `file://`, so no server is required:

```js
const puppeteer = require("/private/tmp/node_modules/puppeteer-core"); // path may vary by session
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("file:///Users/eldar/Projects/go-professional/index.html", { waitUntil: "networkidle0" });
await page.evaluate(() => { location.hash = "#f1"; }); // route format is #<moduleId>, not #/module/<id>
```

Toggle theme with `page.click("#theme-btn")`, toggle language by clicking `#lang-btn` (cycles en -> ru -> az -> en), and remember `#main`'s content scrolls the whole `window`/document, not an inner scroll container - use `window.scrollTo` / `window.scrollY`, not `element.scrollTop`.

## Rounds completed so far (context for the next one)

- Reading-progress bar (`.read-progress`) + back-to-top button (`.back-to-top`) on module pages, since they run 5000-10000px long with previously no scroll orientation and no fast way back up.
- Hover polish on `.gterm` (glossary term cards), `.check` (checklist rows), and `.video-card` - all three looked interactive but were static, unlike sibling components (`.mod-card`, `.opt`) that already had a hover treatment.
- Site-wide `:focus-visible` outline in `var(--go)` - previously only text inputs had any focus styling, everything else fell back to the browser default.

Before starting a new round, skim this list (and `git log --oneline` for this file's directory) so you don't re-propose something already done.

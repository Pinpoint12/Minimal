# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minimal is a Chrome/Chromium browser extension (Manifest V3) that removes distractions from popular websites by hiding algorithm-driven content, notifications, and attention-grabbing elements. It follows a philosophical framework defined in MANIFESTO.md.

## Architecture

### Extension Structure
- **manifest.json** - Extension configuration (MV3), content script injection rules, permissions
- **main.js** - Service worker handling enable/disable state, tab tracking, messaging
- **scripts/minimal-core.js** - Shared content-script helpers on `window.MinimalCore`. Loaded FIRST in every content_scripts entry (all files in an entry share one isolated-world `window`). See "Shared Core" below.
- **scripts/blocker-tracker.js** - Runs on every supported site: applies user-hidden elements, reports the badge count, and (when disabled) toggles off Minimal's own injected stylesheets.
- **scripts/*.js** - Site-specific content scripts (YouTube, Reddit, Twitter, Facebook, Netflix)
- **styles/minimal-overlay.css** - Shared design system for the homepage/blocked overlays + scroll wall (BEM `minimal-overlay__*` / `minimal-wall__*`). Injected on Tier 1 sites; site CSS no longer duplicates overlay rules.
- **styles/*.css** - Site-specific stylesheets (YouTube, Reddit, Twitter, Facebook, Netflix, Amazon, Google, Yahoo)
- **pages/** - Popup UI for toggling extension per-site (uses messaging API). Full light/dark via `prefers-color-scheme`, localized via `data-i18n`.
- **_locales/** - i18n translations (en, de, es, fr)

### Shared Core (`scripts/minimal-core.js`)
Site scripts MUST build on these instead of re-implementing them (each re-implementation re-introduced the same audited bugs):
- `installFoucPreload()` / `revealPage()` — unconditional `document_start` body-hide + 2s failsafe.
- `onSpaNavigate(cb, {events})` — safe SPA-nav detection (pushState + popstate + site events, gated on pathname change). NEVER patches `replaceState`, NEVER observes `document.body`.
- `mountSearchOverlay({id, appShellSelectors, logoHTML, placeholder, hint, buildSearchUrl})` → `{el, remove}` — non-destructive homepage overlay.
- `createScrollWall({postSelector, limit, container, protect, message, dismissLabel})` → `{destroy}` — IntersectionObserver wall; `destroy()` disconnects BOTH observers (call it on SPA nav so observers never leak).
- `onPageHide(fn)` — teardown on `pagehide` (never the deprecated `unload`).
- `storage(defaults)` → Promise; `debug(...)` — gated on `localStorage.minimalDebug === '1'`.

### Site Tiers

**Tier 1 — Full experience** (custom homepage, FOUC prevention, scroll walls, popup options):
- YouTube - complete
- Reddit - complete
- Twitter/X - **CSS-only by design** (no overlay/scroll wall). React reconciles the DOM constantly, so JS is kept to title/favicon cleanup only; CSS does the heavy lifting. Do NOT add observers/overlays here.
- Facebook - TODO (currently light JS: Messenger relink via event delegation)
- Amazon - TODO

**Tier 2 — Light touch** (CSS hiding, minimal JS):
- Netflix
- Google
- Yahoo
- LinkedIn

### Content Script Patterns
1. **CSS-only** (Google, Yahoo) - Pure display:none hiding
2. **CSS + Light JS** (Netflix) - Interval-based DOM monitoring
3. **Complex JS** (YouTube, Reddit) - MutationObserver, custom homepage replacement, FOUC prevention

### Manifest V3 Architecture
- Service worker (`main.js`) instead of persistent background page
- Uses `chrome.scripting.executeScript/insertCSS` instead of `chrome.tabs.executeScript/insertCSS`
- Popup communicates with service worker via `chrome.runtime.sendMessage`
- Tab state stored in `chrome.storage.session` for service worker persistence
- Uses `chrome.action` API instead of `chrome.pageAction`

### State Management
- Per-site enabled/disabled state stored in `chrome.storage.sync`
- Tab metadata stored in `chrome.storage.session` (survives service worker restarts)
- Messaging-based communication between popup and service worker
- **Disabled state:** all site CSS rules are gated behind `html.minimal-on`. The content scripts add that class only when enabled (`MinimalCore.setEnabled` — set before `revealPage()` on FOUC sites; set by `blocker-tracker.js` on every site incl. Tier 2). Disabled → class absent → rules don't match → full revert. NOTE: manifest-injected content-script CSS does NOT appear in `document.styleSheets`, so it can't be toggled via `sheet.disabled` — the class gate is the reliable mechanism. Rules left ungated: Reddit NSFW-safety (`:root.block-all-content`, `body[data-block-on-url]`) and `html.minimal-vote-*` (only match a JS class added when enabled). JS content scripts additionally self-gate on the stored enabled flag.

## Build & Install

No build system - load directly as unpacked extension:
```bash
# Chrome/Brave: chrome://extensions → Developer Mode → Load Unpacked
# Firefox: about:debugging → Load Temporary Add-on
# Package: zip -r extension.zip .
```

## Code Conventions

### Comment Pattern (Required)
All changes must reference MANIFESTO.md rules:
```javascript
/* - Explanation of change - MANIFESTO_CODE(S) */
```
Example: `/* - Hide recommended videos - C2 P1 */`

### Manifesto Codes
- **U1-U3**: Use (user agency, single purpose, meaningful shortcuts)
- **C1-C3**: Content (focus on main content, no unrelated suggestions)
- **P1-P2**: Platform (informative branding, user-interest curation)

### Fragile Selectors
Mark CSS class selectors that may break on site updates:
```css
/* FRAGILE */ .some-generated-class { display: none; }
```

### FOUC Prevention Pattern
Used on Tier 1 sites. At `document_start`, inject a `<style>` that hides `body` unconditionally (no class needed — body doesn't exist yet at document_start so class-based approaches fail). `revealPage()` removes the style element after the overlay is in place or immediately if disabled. 2-second failsafe timeout.

```javascript
// Outside IIFE — runs first
(function() {
  const s = document.createElement('style');
  s.id = 'minimal-SITE-preload-style';
  s.textContent = 'body { visibility: hidden !important; opacity: 0 !important; }';
  (document.head || document.documentElement).appendChild(s);
  setTimeout(() => document.getElementById(s.id)?.remove(), 2000);
})();
```

### Homepage Overlay Pattern
Used on Tier 1 sites. Non-destructive: hide the site's app shell (e.g. `shreddit-app`, `#page-manager`, `#react-root`), append a `position: fixed; inset: 0; z-index: 2000` overlay with logo + search + hint text. Preserves SPA routing. CSS lives in the static stylesheet, not inline JS.

### SPA Navigation Detection (CRITICAL)
**NEVER intercept `history.replaceState`.** React Router (and similar frameworks) call `replaceState` hundreds of times per second for scroll position, state hydration, and internal bookkeeping. Intercepting it causes runaway CPU usage (144%+ observed on X/Twitter, crashing the shared worker blob).

Safe SPA navigation detection, in order of preference:
1. **Site-specific events** — e.g. YouTube's `yt-navigate-finish` (best: zero overhead)
2. **`popstate` + `pushState` interception** — covers back/forward and link clicks. Always gate the callback on `pathname !== lastPath` to ignore same-page state changes
3. **MutationObserver on a narrow DOM scope** — e.g. `[data-testid="primaryColumn"]`, NOT `document.body`. Throttle the callback with a timer

**NEVER use:**
- `history.replaceState` interception (CPU bomb on React sites)
- `MutationObserver` on `document.body` with `subtree: true` on React/SPA sites (fires on every reconciliation)
- Unguarded `setInterval` polling (runs forever even on background tabs)

### Popup Options System
- Site-specific toggle options appear in popup when on a supported site
- YouTube options: "Hide view counts", "Hide like/dislike counts" (off by default)
- Options stored in `chrome.storage.sync` (e.g., `yt_hideViewCounts`, `yt_hideLikeCounts`)
- Content scripts read these settings and inject optional CSS via `applyOptionalStyles()`
- Toggling an option reloads the page to apply changes

## Key Files

- **scripts/youtube.js** (~370 lines) - Non-destructive homepage overlay, SPA navigation via `yt-navigate-finish`, autoplay removal, subscription manager, optional styles
- **scripts/reddit.js** (~500 lines) - NSFW blocker, non-destructive homepage overlay, sidebar removal, scroll depth wall (IntersectionObserver-based), FOUC prevention
- **scripts/twitter.js** (~280 lines) - Non-destructive homepage overlay on /home, FOUC prevention, scroll depth wall, notification cleanup, SPA nav via pushState+popstate
- **styles/youtube.css** (~340 lines) - Watch page centering, search results centering (800px), playlist sticky positioning, homepage overlay styles
- **styles/reddit.css** (~340 lines) - Homepage overlay styles (matching YouTube design language), scroll depth wall styling, vote count dot replacement, dark mode support
- **styles/twitter.css** (~200 lines) - Homepage overlay, scroll wall, sidebar trending/who-to-follow hiding, dark mode via prefers-color-scheme
- **pages/badgePopup.html/js/css** - Extension popup with per-site toggle, site-specific options, element picker, hidden elements manager
- **main.js** - Resource mapping, enable/disable logic, tab lifecycle, context menus, element picker injection

## Known Issues

- YouTube selectors marked FRAGILE may break on YouTube updates
- Multiple selector fallback strategies in YouTube subscription detection due to evolving DOM
- YouTube keeps `ytd-playlist-panel-renderer` in DOM even without an active playlist — must check for `:not([hidden])` attribute
- Theater mode forcing removed (YouTube changed SVG paths, breaking detection) — user controls theater mode manually via "t" key or button

## Troubleshooting

### Console Queries for Live DOM Inspection
When debugging CSS selector issues on live sites, ask the user to run queries in the browser DevTools console. This is the most effective way to understand site DOM structure when you can't see the page.

**Useful patterns:**
```javascript
// Check if a selector matches
document.querySelector('#secondary').matches(':has(ytd-playlist-panel-renderer)')

// Check computed styles to verify CSS is applying
getComputedStyle(document.querySelector('#columns')).justifyContent
getComputedStyle(document.querySelector('#secondary')).display

// Check element attributes
document.querySelector('#secondary ytd-playlist-panel-renderer')?.hasAttribute('hidden')
document.querySelector('#secondary ytd-playlist-panel-renderer')?.getAttribute('collapsed')

// Check if an element exists in DOM
document.querySelector('ytd-secondary-search-container-renderer') !== null
```

**Why this matters:** Sites like YouTube keep elements in the DOM with `hidden` attributes rather than removing them. CSS `:has()` selectors will match these hidden elements, so always check for `:not([hidden])` when targeting active/visible components.

### Common YouTube DOM Gotchas
- `ytd-playlist-panel-renderer` exists in `#secondary` even without an active playlist — it has a `hidden` attribute when inactive
- `#secondary-inner` may exist regardless of playlist state
- YouTube uses virtual scrolling and SPA navigation — elements persist across page changes
- The theater mode button (`.ytp-size-button`) SVG path changes between YouTube updates — don't rely on SVG path matching

### Reddit DOM Gotchas
- Reddit uses virtual scrolling — never has all posts in DOM at once
- `shreddit-post` elements lack stable ID attributes — use WeakSet for tracking
- Content loaders exist outside the post container — walk ancestor siblings to hide them
- `#right-sidebar-container` must be preserved when hiding content after scroll wall

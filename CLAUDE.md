# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minimal is a Chrome/Chromium browser extension (Manifest V3) that removes distractions from popular websites by hiding algorithm-driven content, notifications, and attention-grabbing elements. It follows a philosophical framework defined in MANIFESTO.md.

## Architecture

### Extension Structure
- **manifest.json** - Extension configuration (MV3), content script injection rules, permissions
- **main.js** - Service worker handling enable/disable state, tab tracking, messaging
- **scripts/*.js** - Site-specific content scripts (YouTube, Reddit, Twitter, Facebook, Netflix)
- **styles/*.css** - Site-specific stylesheets (YouTube, Reddit, Twitter, Facebook, Netflix, Amazon, Google, Yahoo)
- **pages/** - Popup UI for toggling extension per-site (uses messaging API)
- **_locales/** - i18n translations (en, de, es, fr)

### Content Script Patterns
1. **CSS-only** (Amazon, Google, Yahoo) - Pure display:none hiding
2. **CSS + Light JS** (Twitter, Facebook, Netflix) - Interval-based DOM monitoring
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

## Key Files

- **scripts/youtube.js** (507 lines) - Most complex: theater mode, autoplay removal, custom homepage, subscription manager
- **scripts/reddit.js** (332 lines) - NSFW blocker, custom homepage, sidebar removal
- **main.js** - Resource mapping, enable/disable logic, tab lifecycle

## Known Issues

- FOUC (Flash of Unstyled Content) on Reddit homepage needs fixing
- YouTube selectors marked FRAGILE may break on YouTube updates
- Multiple selector fallback strategies in YouTube subscription detection due to evolving DOM

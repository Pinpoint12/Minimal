/* Minimal — Shared core helpers for content scripts.
   Loaded FIRST in every content_scripts entry; all files in an entry share the
   same isolated-world `window`, so site scripts read `window.MinimalCore`.

   These primitives encode the project's hard-won rules so each site stops
   re-implementing them (and re-introducing the same bugs):
   - FOUC preload hides <body> UNCONDITIONALLY at document_start (class-based
     hiding fails — body has no class yet at document_start).
   - SPA navigation is detected via pushState + popstate + site events, never by
     intercepting replaceState or observing document.body subtree (both cause
     runaway CPU on React/SPA sites). */

(function() {
	'use strict';

	if (window.MinimalCore) return;

	const PRELOAD_ID = 'minimal-preload-style';
	const FAILSAFE_MS = 2000;

	/* ---- Debug logging (off unless localStorage.minimalDebug is set) ---- */
	let DEBUG = false;
	try { DEBUG = localStorage.getItem('minimalDebug') === '1'; } catch (e) { /* storage blocked */ }
	function debug(...args) {
		if (DEBUG) console.log('[minimal]', ...args);
	}

	/* ---- FOUC prevention ----
	   Inject a style that hides <body> unconditionally. revealPage() removes it.
	   A failsafe removes it after FAILSAFE_MS so a script error can never leave
	   the page permanently blank. Safe to call at document_start. */
	function installFoucPreload() {
		if (document.getElementById(PRELOAD_ID)) return;
		const s = document.createElement('style');
		s.id = PRELOAD_ID;
		s.textContent = 'body { visibility: hidden !important; opacity: 0 !important; }';
		(document.head || document.documentElement).appendChild(s);
		setTimeout(revealPage, FAILSAFE_MS);
	}

	function revealPage() {
		document.getElementById(PRELOAD_ID)?.remove();
	}

	/* ---- Safe SPA navigation ----
	   Fires `callback(pathname)` only when location.pathname actually changes.
	   Covers programmatic pushState, back/forward (popstate), and any
	   site-specific navigation events passed in opts.events (e.g.
	   'yt-navigate-finish'). NEVER patches replaceState and NEVER observes the
	   DOM. Returns a teardown function. */
	function onSpaNavigate(callback, opts = {}) {
		const events = opts.events || [];
		let lastPath = location.pathname;

		const fire = () => {
			if (location.pathname === lastPath) return;
			lastPath = location.pathname;
			try { callback(location.pathname); } catch (e) { debug('nav callback error', e); }
		};

		const origPush = history.pushState;
		history.pushState = function(...args) {
			const ret = origPush.apply(this, args);
			fire();
			return ret;
		};
		window.addEventListener('popstate', fire);
		for (const ev of events) document.addEventListener(ev, fire);

		return function teardown() {
			/* Only restore if no later patch wrapped ours, to avoid clobbering. */
			history.pushState = origPush;
			window.removeEventListener('popstate', fire);
			for (const ev of events) document.removeEventListener(ev, fire);
		};
	}

	/* ---- Homepage search overlay ----
	   Non-destructive: hides the site's app shell (display:none) and appends a
	   fixed overlay (logo + search + hint). Preserves SPA routing. Uses the
	   shared design-system classes in styles/minimal-overlay.css.

	   config:
	     id              required unique element id for the overlay container
	     appShellSelectors  array of selectors to hide while the overlay is up
	     logoHTML        markup for the brand mark (inline SVG)
	     placeholder     search input placeholder (default 'Search')
	     hint            intentionality prompt below the search (default set)
	     buildSearchUrl  (query) => url to navigate to on submit
	   Returns { el, remove }. Idempotent — re-calling returns the existing overlay. */
	function mountSearchOverlay(config) {
		const existing = document.getElementById(config.id);
		if (existing) return { el: existing, remove: () => removeOverlay(config) };

		const shells = [];
		for (const sel of (config.appShellSelectors || [])) {
			document.querySelectorAll(sel).forEach(node => {
				node.style.setProperty('display', 'none', 'important');
				shells.push(node);
			});
		}

		const overlay = document.createElement('div');
		overlay.className = 'minimal-overlay';
		overlay.id = config.id;
		overlay.innerHTML = `
			<div class="minimal-overlay__logo">${config.logoHTML || ''}</div>
			<div class="minimal-overlay__search">
				<input class="minimal-overlay__input" type="text"
					placeholder="${escapeAttr(config.placeholder || 'Search')}"
					aria-label="${escapeAttr(config.placeholder || 'Search')}" autofocus />
				<button class="minimal-overlay__btn" aria-label="Search">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
				</button>
			</div>
			<p class="minimal-overlay__hint">${escapeHtml(config.hint || 'What are you looking for?')}</p>
		`;
		(document.body || document.documentElement).appendChild(overlay);

		const input = overlay.querySelector('.minimal-overlay__input');
		const btn = overlay.querySelector('.minimal-overlay__btn');
		const submit = () => {
			const q = input?.value.trim();
			if (q && typeof config.buildSearchUrl === 'function') {
				window.location.href = config.buildSearchUrl(q);
			}
		};
		input?.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
		btn?.addEventListener('click', submit);
		input?.focus();

		return { el: overlay, remove: () => removeOverlay(config) };
	}

	function removeOverlay(config) {
		document.getElementById(config.id)?.remove();
		for (const sel of (config.appShellSelectors || [])) {
			document.querySelectorAll(sel).forEach(node => node.style.removeProperty('display'));
		}
	}

	/* ---- Scroll depth wall ----
	   Restores a natural stopping point on infinite feeds. Counts posts the user
	   actually scrolls past (IntersectionObserver), and once the limit is hit
	   inserts a wall and hides everything after it. A single, container-scoped
	   MutationObserver catches virtualised/lazy-loaded posts. destroy()
	   disconnects BOTH observers and removes the wall — call it on SPA nav so
	   observers never accumulate.

	   config:
	     postSelector  required selector for feed items (e.g. 'shreddit-post')
	     limit         posts before the wall (default 25)
	     container     element to scope the MutationObserver to (default body)
	     protect       selectors that must never be hidden by the wall
	     message       wall copy
	     dismissLabel  "keep going" button label
	   Returns { destroy }. */
	function createScrollWall(config) {
		const POST_SEL = config.postSelector;
		const LIMIT = config.limit || 25;
		const container = config.container || document.body;
		const protect = config.protect || [];
		const observed = new WeakSet();
		let seen = 0, wallShowing = false, dismissed = false;
		let io = null, mo = null, scanTimer = null;

		function isProtected(el) {
			return protect.some(sel => el.matches?.(sel) || el.querySelector?.(sel));
		}

		function hideAfterWall() {
			const wall = document.getElementById('minimal-scroll-wall');
			if (!wall) return;
			let el = wall.nextElementSibling;
			while (el) {
				el.style.setProperty('display', 'none', 'important');
				el.dataset.minimalWallHidden = '1';
				el = el.nextElementSibling;
			}
			let parent = wall.parentElement;
			while (parent && parent !== document.body) {
				let sib = parent.nextElementSibling;
				while (sib) {
					if (!isProtected(sib)) {
						sib.style.setProperty('display', 'none', 'important');
						sib.dataset.minimalWallHidden = '1';
					}
					sib = sib.nextElementSibling;
				}
				parent = parent.parentElement;
			}
		}

		function unhideAll() {
			document.querySelectorAll('[data-minimal-wall-hidden]').forEach(el => {
				el.style.removeProperty('display');
				delete el.dataset.minimalWallHidden;
			});
		}

		function showWall(triggerPost) {
			if (wallShowing || dismissed) return;
			wallShowing = true;
			if (io) io.disconnect();

			const wall = document.createElement('div');
			wall.id = 'minimal-scroll-wall';
			wall.innerHTML = `
				<p class="minimal-wall__message">${escapeHtml(config.message || "You've scrolled far enough.")}</p>
				<button class="minimal-wall__dismiss">${escapeHtml(config.dismissLabel || 'Keep going')}</button>
			`;
			triggerPost.insertAdjacentElement('afterend', wall);
			hideAfterWall();

			wall.querySelector('.minimal-wall__dismiss').addEventListener('click', () => {
				dismissed = true;
				wall.remove();
				unhideAll();
			});
		}

		function tryObserve(post) {
			if (observed.has(post)) return;
			observed.add(post);
			if (wallShowing && !dismissed) {
				post.style.setProperty('display', 'none', 'important');
				post.dataset.minimalWallHidden = '1';
			} else if (io) {
				io.observe(post);
			}
		}

		io = new IntersectionObserver((entries) => {
			if (dismissed || wallShowing) return;
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				seen++;
				io.unobserve(entry.target);
				if (seen >= LIMIT) { showWall(entry.target); return; }
			}
		}, { threshold: 0.3 });

		document.querySelectorAll(POST_SEL).forEach(tryObserve);

		/* Single, container-scoped observer. Throttled. Disconnected in destroy(). */
		mo = new MutationObserver(() => {
			if (scanTimer) return;
			scanTimer = setTimeout(() => {
				scanTimer = null;
				if (wallShowing && !dismissed) hideAfterWall();
				document.querySelectorAll(POST_SEL).forEach(tryObserve);
			}, 150);
		});
		mo.observe(container, { childList: true, subtree: true });

		function destroy() {
			if (io) io.disconnect();
			if (mo) mo.disconnect();
			if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
			document.getElementById('minimal-scroll-wall')?.remove();
			unhideAll();
		}

		return { destroy };
	}

	/* ---- Enabled gate ----
	   Site CSS hides/restyles page elements only under `html.minimal-on`. The
	   class is added here when Minimal is enabled and removed when disabled, so
	   turning a site off fully reverts its styling. (Manifest-injected
	   content-script CSS cannot be toggled via document.styleSheets — it doesn't
	   appear there — so a class gate is the reliable mechanism.) Call BEFORE
	   revealPage() on FOUC sites so the styled page is never shown ungated. */
	function setEnabled(on) {
		document.documentElement.classList.toggle('minimal-on', !!on);
	}

	/* ---- Lifecycle ---- */
	function onPageHide(fn) {
		/* Use pagehide, never the deprecated/unreliable unload event. */
		window.addEventListener('pagehide', fn);
	}

	/* ---- chrome.storage.sync promise wrapper ---- */
	function storage(defaults) {
		return new Promise(resolve => {
			try {
				chrome.storage.sync.get(defaults, resolve);
			} catch (e) {
				debug('storage.get failed', e);
				resolve(defaults);
			}
		});
	}

	/* ---- small HTML/attr escapers for overlay content ---- */
	function escapeHtml(str) {
		return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
	}
	function escapeAttr(str) {
		return String(str).replace(/["&<>]/g, c => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
	}

	window.MinimalCore = {
		debug,
		installFoucPreload,
		revealPage,
		setEnabled,
		onSpaNavigate,
		mountSearchOverlay,
		createScrollWall,
		onPageHide,
		storage,
	};
})();

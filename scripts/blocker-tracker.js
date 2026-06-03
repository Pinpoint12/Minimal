/* State Manager & User Hidden Elements Tracker */

(function() {
	'use strict';

	if (window.minimalBlockerTracker) return;
	window.minimalBlockerTracker = true;

	const Core = window.MinimalCore;

	/* Site detection */
	const sitePatterns = {
		youtube: /youtube\.com/,
		facebook: /facebook\.com/,
		twitter: /(twitter\.com|x\.com)/,
		google: /google\./,
		amazon: /amazon\./,
		yahoo: /yahoo\.com/,
		netflix: /netflix\.com/,
		reddit: /reddit\.com/
	};

	function getCurrentSite() {
		const url = window.location.href;
		for (const [name, pattern] of Object.entries(sitePatterns)) {
			if (pattern.test(url)) return name;
		}
		return null;
	}

	const currentSite = getCurrentSite();
	if (!currentSite) return;

	/* Check if Minimal is enabled for this site */
	chrome.storage.sync.get({ [currentSite]: "enabled" }, (data) => {
		const isEnabled = data[currentSite] === "enabled";

		/* - Gate all of Minimal's site CSS behind html.minimal-on so disabling a
		   site fully reverts its styling. Manifest-injected content-script CSS
		   can't be removed/disabled at runtime (it isn't in document.styleSheets),
		   so this class gate is the reliable opt-out mechanism. Runs on every site
		   including Tier 2 ones that have no dedicated site script. - U1 */
		if (Core) Core.setEnabled(isEnabled);
		else document.documentElement.classList.toggle('minimal-on', isEnabled);

		if (!isEnabled) return;

		/* Minimal is enabled - apply user hidden elements and track */
		initUserHiddenElements();
	});

	/* Apply user-hidden elements and report count to badge */
	function initUserHiddenElements() {
		const hostname = window.location.hostname;

		function applyHidden(hidden) {
			for (const selector of hidden) {
				try {
					document.querySelectorAll(selector).forEach(el => {
						if (el.style.display !== 'none') {
							el.style.setProperty('display', 'none', 'important');
						}
					});
				} catch (e) { /* Ignore invalid selectors */ }
			}
		}

		function start() {
			chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
				const hidden = data.hiddenElements[hostname] || [];

				/* - Hide elements the user explicitly chose to remove - U1 C2 */
				applyHidden(hidden);

				/* Report user-hidden count to badge (0 means no badge) */
				try {
					chrome.runtime.sendMessage({
						type: 'updateUserHiddenCount',
						count: hidden.length
					});
				} catch (e) { /* Ignore */ }

				/* Only attach the re-apply observer when the user actually hid
				   something. An always-on document.body subtree observer is a CPU
				   bomb on React/SPA sites; attaching it here is justified because the
				   user opted in by hiding elements, and we tear it down on pagehide. */
				if (hidden.length === 0) return;

				let debounceTimer = null;
				const observer = new MutationObserver(() => {
					if (debounceTimer) return;
					debounceTimer = setTimeout(() => {
						debounceTimer = null;
						chrome.storage.sync.get({ hiddenElements: {} }, (d) => {
							applyHidden(d.hiddenElements[hostname] || []);
						});
					}, 300);
				});
				observer.observe(document.body, { childList: true, subtree: true });

				const teardown = () => {
					if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
					observer.disconnect();
				};
				if (Core?.onPageHide) Core.onPageHide(teardown);
				else window.addEventListener('pagehide', teardown);
			});
		}

		/* document.body may not exist at document_start on Reddit/YouTube — fall
		   back to DOMContentLoaded so the apply + observer attach isn't missed. */
		if (document.body) {
			start();
		} else {
			document.addEventListener('DOMContentLoaded', start, { once: true });
		}
	}

	/* Track right-clicked element for context menu */
	document.addEventListener('contextmenu', (e) => {
		window.minimalLastRightClickedElement = e.target;
	}, true);
})();

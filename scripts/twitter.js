/* Twitter/X Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C1 C2 C3 P1 */

/* ARCHITECTURE NOTE: Twitter/X uses React which constantly reconciles the DOM.
   Any MutationObserver on React-managed DOM or History API interception causes
   runaway CPU (200%+ observed). This script is intentionally minimal — CSS does
   the heavy lifting. JS only handles what CSS cannot: title text and favicon. */

(function() {
	'use strict';

	const SITE_NAME = 'twitter';

	/* - Remove notification count from page title - C3 */
	function removeNotificationsFromTitle() {
		if (/^\(\d+\)\s/.test(document.title)) {
			document.title = document.title.replace(/^\(\d+\)\s*/, '');
		}
	}

	/* - Replace notification favicon with standard one - C3 */
	function keepStandardFavicon() {
		const link = document.querySelector("link[rel='shortcut icon']");
		if (!link) return;
		const href = link.getAttribute('href');
		if (!href) return;
		const clean = href.replace('twitter-pip.ico', 'twitter.ico')
		                   .replace('twitter-pip.2.ico', 'twitter.2.ico');
		if (clean !== href) link.setAttribute('href', clean);
	}

	/* - Notification cleanup via targeted <title> observer - C3 */
	/* IMPORTANT: Only observe the <title> element itself. Never observe <head>
	   or <body> — React mutates those constantly, causing feedback loops. */
	function setupNotificationCleanup() {
		removeNotificationsFromTitle();
		keepStandardFavicon();

		const titleEl = document.querySelector('title');
		if (titleEl) {
			let cleaning = false;
			const obs = new MutationObserver(() => {
				if (cleaning) return;
				cleaning = true;
				removeNotificationsFromTitle();
				cleaning = false;
			});
			obs.observe(titleEl, { childList: true, characterData: true, subtree: true });
			MinimalCore.onPageHide(() => obs.disconnect());
		}

		/* Favicon only needs occasional checks — visibility change is enough */
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) keepStandardFavicon();
		});
	}

	/* Main initialization */
	function init() {
		chrome.storage.sync.get({ [SITE_NAME]: 'enabled' }, (data) => {
			if (data[SITE_NAME] !== 'enabled') {
				MinimalCore.debug('Twitter: Disabled, skipping modifications');
				return;
			}

			MinimalCore.debug('Twitter: Enabled, applying modifications');

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', setupNotificationCleanup);
			} else {
				setupNotificationCleanup();
			}
		});
	}

	init();
})();

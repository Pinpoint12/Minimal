/* Twitter/X Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C3 */

(function() {
	'use strict';

	const SITE_NAME = 'twitter';
	let titleInterval = null;
	let faviconInterval = null;

	/* - Remove the notifier in the page title - C3 */
	function removeNotificationsFromTitle() {
		const reg = /(\(\d+\) )/g;
		let originalPageTitle = document.title;
		let newPageTitle = originalPageTitle.replace(reg, "");
		document.title = newPageTitle;
	}

	/* - Replace the "red bubble" notification twitter favicon with the standard one - C3 */
	function keepStandardFavicon() {
		const faviconLinkTag = document.querySelector("link[rel='shortcut icon']");
		if (!faviconLinkTag) return; /* Guard against null reference */
		const currentFavicon = faviconLinkTag.getAttribute("href");
		if (!currentFavicon) return;
		let standardFavicon = currentFavicon.replace("twitter-pip.ico", "twitter.ico").replace("twitter-pip.2.ico", "twitter.2.ico");
		faviconLinkTag.setAttribute("href", standardFavicon);
	}

	/* Main initialization - checks enabled state */
	function init() {
		chrome.storage.sync.get({ [SITE_NAME]: 'enabled' }, (data) => {
			const isEnabled = data[SITE_NAME] === 'enabled';

			if (!isEnabled) {
				console.log('[minimal] Twitter: Disabled, skipping modifications');
				return;
			}

			console.log('[minimal] Twitter: Enabled, applying modifications');
			titleInterval = setInterval(removeNotificationsFromTitle, 200);
			faviconInterval = setInterval(keepStandardFavicon, 200);
		});
	}

	/* Clean up intervals when page unloads to prevent memory leaks */
	window.addEventListener('unload', () => {
		if (titleInterval) clearInterval(titleInterval);
		if (faviconInterval) clearInterval(faviconInterval);
	});

	init();
})();

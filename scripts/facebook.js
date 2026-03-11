/* Facebook Content Script - Minimal Extension */
/* All modifications gated behind enabled check - U2 */

(function() {
	'use strict';

	const SITE_NAME = 'facebook';
	let messageIconTrigger = false;
	let messengerObserver = null;

	/* - Link the messaging icon in the navbar to the message page. - U2 */
	function linkMessagingIcon() {
		let button = document.querySelector("div[aria-label='Messenger'][role='button'][tabindex='0']");
		if (button) {
			if (messageIconTrigger === false) {
				messageIconTrigger = true;
				button.addEventListener("click", function() { window.location = "https://www.facebook.com/messages/"; });
			}
		} else {
			messageIconTrigger = false;
		}
	}

	/* Main initialization - checks enabled state */
	function init() {
		chrome.storage.sync.get({ [SITE_NAME]: 'enabled' }, (data) => {
			const isEnabled = data[SITE_NAME] === 'enabled';

			if (!isEnabled) {
				console.log('[minimal] Facebook: Disabled, skipping modifications');
				return;
			}

			console.log('[minimal] Facebook: Enabled, applying modifications');

			/* Use MutationObserver instead of deprecated DOMNodeRemoved event */
			function startObserver() {
				if (document.body) {
					messengerObserver = new MutationObserver(linkMessagingIcon);
					messengerObserver.observe(document.body, { childList: true, subtree: true });
				} else {
					document.addEventListener('DOMContentLoaded', () => {
						messengerObserver = new MutationObserver(linkMessagingIcon);
						messengerObserver.observe(document.body, { childList: true, subtree: true });
					});
				}
			}

			startObserver();
		});
	}

	/* Clean up observer on page unload */
	window.addEventListener('unload', () => {
		if (messengerObserver) messengerObserver.disconnect();
	});

	init();
})();

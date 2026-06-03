/* Facebook Content Script - Minimal Extension */
/* All modifications gated behind enabled check - U2 */

(function() {
	'use strict';

	const SITE_NAME = 'facebook';
	const MESSENGER_SELECTOR = "div[aria-label='Messenger'][role='button']"; /* FRAGILE */

	/* - Route the navbar Messenger button straight to the full messages page via a
	   single capturing click listener instead of re-binding handlers as React
	   swaps the node. Event delegation survives React node replacement and removes
	   the document.body subtree observer's CPU hazard. - C1 U2 */
	function handleClick(e) {
		const trigger = e.target.closest?.(MESSENGER_SELECTOR);
		if (!trigger) return;
		window.location = 'https://www.facebook.com/messages/';
	}

	/* Main initialization - checks enabled state */
	function init() {
		MinimalCore.storage({ [SITE_NAME]: 'enabled' }).then((data) => {
			const isEnabled = data[SITE_NAME] === 'enabled';

			if (!isEnabled) {
				MinimalCore.debug('Facebook: Disabled, skipping modifications');
				return;
			}

			MinimalCore.debug('Facebook: Enabled, applying modifications');

			document.addEventListener('click', handleClick, true);
			MinimalCore.onPageHide(() => document.removeEventListener('click', handleClick, true));
		});
	}

	init();
})();

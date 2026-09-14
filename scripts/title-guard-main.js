/* Minimal — Tab-title unread-count guard. Runs in the page's MAIN world.

   Shared by every Tier 0 site that writes an unread count into the tab title
   (X, Instagram). This file is the ONLY place the interception exists; site
   scripts just publish the enabled decision through MinimalCore.

   WHY this one file is not a content script like the rest: content scripts run
   in an isolated world. The DOM is shared, but each world has its own JS view
   of it, so a `document.title` setter override installed from the isolated
   world is invisible to the site's own bundle — it writes the title through
   the main world's descriptor and sails straight past. Overriding the setter
   only works from inside the world doing the writing.

   The flip side is that a MAIN-world script has no chrome.* APIs at all, so it
   cannot ask whether Minimal is enabled here. The isolated-world script does
   that and publishes the answer on <html data-minimal-title-guard>, which both
   worlds can see: 'pending' (asked, waiting on chrome.storage), 'on', 'off'.
   Anything but 'off' strips — the count must never paint during the async
   check, and that window is exactly what used to make it flash. */

/* - Strip the unread count the site prefixes onto the tab title - C3 */
(function() {
	'use strict';

	const COUNT_PREFIX = /^\(\d+\)\s*/;
	const STATE_KEY = 'minimalTitleGuard';
	const STATE_ATTR = 'data-minimal-title-guard';
	const FAILSAFE_MS = 2000;

	const root = document.documentElement;
	if (!root) return;

	let descriptor = null;
	for (let node = document; node; node = Object.getPrototypeOf(node)) {
		descriptor = Object.getOwnPropertyDescriptor(node, 'title');
		if (descriptor) break;
	}
	if (!descriptor || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') return;

	const readTitle = () => descriptor.get.call(document);
	const writeTitle = (value) => descriptor.set.call(document, value);

	/* The last write we altered, kept verbatim so the real count can be handed
	   back if Minimal turns out to be disabled for this tab. */
	let altered = null;

	function isActive() {
		return root.dataset[STATE_KEY] !== 'off';
	}

	function standDown() {
		if (!altered) return;
		const { raw, stripped } = altered;
		altered = null;
		/* Only undo our own edit — if the site has moved on to a different
		   title since, that one is current and wins. */
		if (readTitle() === stripped) writeTitle(raw);
	}

	Object.defineProperty(document, 'title', {
		configurable: true,
		enumerable: descriptor.enumerable,
		get: descriptor.get,
		set(value) {
			if (typeof value !== 'string' || !isActive()) {
				altered = null;
				descriptor.set.call(this, value);
				return;
			}
			const stripped = value.replace(COUNT_PREFIX, '');
			altered = stripped === value ? null : { raw: value, stripped };
			descriptor.set.call(this, stripped);
		},
	});

	/* Single-attribute observer on <html> — no subtree, no body, so it costs
	   nothing on a React site. It exists only to catch the stand-down. */
	new MutationObserver(() => {
		if (!isActive()) standDown();
	}).observe(root, { attributes: true, attributeFilter: [STATE_ATTR] });

	setTimeout(() => {
		const state = root.dataset[STATE_KEY];
		if (state === 'on' || state === 'off') return;
		/* Still unresolved: the isolated-world script died or chrome.storage
		   never answered. Fail open rather than leave the title rewritten for
		   the life of the tab. */
		root.dataset[STATE_KEY] = 'off';
	}, FAILSAFE_MS);
})();

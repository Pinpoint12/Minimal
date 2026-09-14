/* Instagram Content Script - Minimal Extension */
/* Minimal blocks Instagram outright - it's algorithmic feed by design, there's
   nothing to declutter down to - C1 C2 P1 */

/* Prevent flash of unstyled content - inject immediately at document_start - C2 */
MinimalCore.installFoucPreload();

/* Arm the tab-title unread-count guard before the async enabled/disabled check
   below - that check is the race window that lets a "(9) Instagram" prefix
   flash. The interception itself runs in the page's MAIN world
   (title-guard-main.js), since an isolated-world override of document.title is
   invisible to Instagram's own bundle; this only publishes the decision to it. */
const resolveTitleGuard = MinimalCore.guardTitleCount();

(function() {
	'use strict';

	const SITE_NAME = 'instagram';

	/* Monochrome camera glyph, not the brand gradient - P1 */
	const INSTAGRAM_LOGO_HTML = `
		<svg viewBox="0 0 24 24" fill="none" stroke="var(--minimal-ink-strong)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
			<rect x="3" y="3" width="18" height="18" rx="5.5"/>
			<circle cx="12" cy="12" r="4.2"/>
			<circle cx="17.2" cy="6.8" r="0.6" fill="var(--minimal-ink-strong)" stroke="none"/>
		</svg>
	`;

	function mountBlock() {
		MinimalCore.mountBlockOverlay({
			id: 'minimal-instagram-block',
			logoHTML: INSTAGRAM_LOGO_HTML,
			title: 'Instagram is off',
			message: 'Nothing here was worth the scroll.',
		});
		MinimalCore.revealPage();
	}

	/* Main initialization */
	function init() {
		chrome.storage.sync.get({ [SITE_NAME]: 'enabled' }, (data) => {
			if (data[SITE_NAME] !== 'enabled') {
				MinimalCore.debug('Instagram: Disabled, allowing normal use');
				MinimalCore.setEnabled(false);
				resolveTitleGuard(false);
				MinimalCore.revealPage();
				return;
			}

			MinimalCore.debug('Instagram: Enabled, blocking');
			MinimalCore.setEnabled(true);
			resolveTitleGuard(true);

			if (document.body) {
				mountBlock();
			} else {
				document.addEventListener('DOMContentLoaded', mountBlock, { once: true });
			}
		});
	}

	init();
})();

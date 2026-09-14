/* X (Twitter) Content Script - Minimal Extension */
/* Minimal blocks X outright rather than decluttering the feed - C1 C2 P1 */

/* Prevent flash of unstyled content - inject immediately at document_start - C2 */
MinimalCore.installFoucPreload();

/* Arm the tab-title unread-count guard before the async enabled/disabled check
   below - that check is the race window that lets a "(9) X" prefix flash. The
   interception itself runs in the page's MAIN world (title-guard-main.js),
   since an isolated-world override of document.title is invisible to X's own
   bundle; this only publishes the decision to it. */
const resolveTitleGuard = MinimalCore.guardTitleCount();

(function() {
	'use strict';

	const SITE_NAME = 'twitter';

	/* Official X mark. Single glyph, no wordmark needed - P1 */
	const X_LOGO_HTML = `
		<svg viewBox="0 0 1200 1227" fill="var(--minimal-ink-strong)" focusable="false" aria-hidden="true">
			<path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
		</svg>
	`;

	function mountBlock() {
		MinimalCore.mountBlockOverlay({
			id: 'minimal-x-block',
			logoHTML: X_LOGO_HTML,
			title: 'X is off',
			message: 'Nothing here was worth the scroll.',
		});
		MinimalCore.revealPage();
	}

	/* Main initialization */
	function init() {
		chrome.storage.sync.get({ [SITE_NAME]: 'enabled' }, (data) => {
			if (data[SITE_NAME] !== 'enabled') {
				MinimalCore.debug('X: Disabled, allowing normal use');
				MinimalCore.setEnabled(false);
				resolveTitleGuard(false);
				MinimalCore.revealPage();
				return;
			}

			MinimalCore.debug('X: Enabled, blocking');
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

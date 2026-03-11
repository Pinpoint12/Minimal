/* Netflix Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C3 */

(function() {
	'use strict';

	const SITE_NAME = 'netflix';
	let autoplayInterval = null;

	/* - Remove homepage tiles audio and video autoplay - C3 */
	function removeAutoPlayingTrailer() {
		document.querySelectorAll(".previewModal--player_container video").forEach(
			function(player) {
				if (!player.paused || !player.muted) {
					player.muted = true;
					player.pause();
				}
			}
		);
	}

	/* Main initialization - checks enabled state */
	function init() {
		chrome.storage.sync.get({ [SITE_NAME]: 'enabled' }, (data) => {
			const isEnabled = data[SITE_NAME] === 'enabled';

			if (!isEnabled) {
				console.log('[minimal] Netflix: Disabled, skipping modifications');
				return;
			}

			console.log('[minimal] Netflix: Enabled, applying modifications');
			autoplayInterval = setInterval(removeAutoPlayingTrailer, 500);
		});
	}

	/* Clean up interval when page unloads to prevent memory leaks */
	window.addEventListener('unload', () => {
		if (autoplayInterval) clearInterval(autoplayInterval);
	});

	init();
})();

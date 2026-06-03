/* Netflix Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C3 */

(function() {
	'use strict';

	const SITE_NAME = 'netflix';
	const MODAL_VIDEO_SEL = '.previewModal--player_container video';

	let observer = null;
	let pollTimer = null;
	let active = false;

	/* - Mute+pause autoplaying hover-preview trailers - C3 P2 */
	function removeAutoPlayingTrailer() {
		document.querySelectorAll(MODAL_VIDEO_SEL).forEach(function(player) {
			if (!player.paused || !player.muted) {
				player.muted = true;
				player.pause();
			}
		});
	}

	/* The preview modal is injected on hover and a <video> inside it can begin
	   playing without any further DOM mutation, so the scoped observer alone can
	   miss the start of playback. A short poll backstops it, but MUST stay off on
	   background tabs (M6 L4) — it is started only while the tab is visible and is
	   torn down on visibilitychange->hidden. */
	function startPoll() {
		if (pollTimer || document.visibilityState !== 'visible') return;
		pollTimer = setInterval(removeAutoPlayingTrailer, 500);
	}

	function stopPoll() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	function onVisibilityChange() {
		if (!active) return;
		if (document.visibilityState === 'hidden') {
			stopPoll();
		} else {
			removeAutoPlayingTrailer();
			startPoll();
		}
	}

	function start() {
		if (active) return;
		active = true;
		MinimalCore.debug('Netflix: enabled, watching for autoplaying trailers');

		/* Scoped to the app root, not document.body innerHTML — the modal is
		   appended near the top of the tree when a tile is hovered. */
		const root = document.getElementById('appMountPoint') || document.body;
		observer = new MutationObserver(removeAutoPlayingTrailer);
		observer.observe(root, { childList: true, subtree: true });

		document.addEventListener('visibilitychange', onVisibilityChange);

		removeAutoPlayingTrailer();
		startPoll();
	}

	function teardown() {
		active = false;
		stopPoll();
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		document.removeEventListener('visibilitychange', onVisibilityChange);
	}

	/* Main initialization - checks enabled state */
	function init() {
		MinimalCore.storage({ [SITE_NAME]: 'enabled' }).then((data) => {
			if (data[SITE_NAME] !== 'enabled') {
				MinimalCore.debug('Netflix: disabled, skipping modifications');
				return;
			}
			start();
		});
	}

	/* Clean up observers/timers on pagehide (never the deprecated 'unload'). */
	MinimalCore.onPageHide(teardown);

	init();
})();

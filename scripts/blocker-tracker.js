/* State Manager & User Hidden Elements Tracker */

(function() {
	'use strict';

	if (window.minimalBlockerTracker) return;
	window.minimalBlockerTracker = true;

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

		if (!isEnabled) {
			/* Inject reset CSS to undo all Minimal styling */
			injectResetCSS();
			return;
		}

		/* Minimal is enabled - apply user hidden elements and track */
		initUserHiddenElements();
	});

	/* Reset CSS that undoes all Minimal styling when disabled */
	function injectResetCSS() {
		const resetStyle = document.createElement('style');
		resetStyle.id = 'minimal-reset-css';
		resetStyle.textContent = `
			/* Reset all Minimal CSS when disabled */

			/* YouTube resets */
			#related, #ticket-shelf, #merch-shelf,
			.ytd-horizontal-card-list-renderer,
			ytd-reel-shelf-renderer,
			#notification-count, ytd-notification-topbar-button-renderer,
			.videowall-endscreen,
			#guide-button, #voice-search-button, ytd-mini-guide-renderer, tp-yt-app-drawer,
			yt-tab-shape[tab-title="Shorts"],
			#country-code, #logo-container .content-region,
			.iv-branding,
			.ytp-size-button,
			.ytp-miniplayer-button,
			.ytp-next-button,
			.ytd-moving-thumbnail-renderer,
			button[data-tooltip-target-id="ytp-autonav-toggle-button"],
			ytd-two-column-search-results-renderer[is-search="true"] .ytd-item-section-renderer[thumbnail-style=""] {
				display: revert !important;
			}

			.ytp-play-button-playlist+.ytp-next-button {
				display: revert !important;
			}

			#columns {
				width: revert !important;
				max-width: revert !important;
				min-width: revert !important;
				display: revert !important;
				align-items: revert !important;
				justify-content: revert !important;
			}

			#primary {
				max-width: revert !important;
				width: revert !important;
			}

			#secondary {
				width: revert !important;
				max-width: revert !important;
				min-width: revert !important;
			}

			#contents.ytd-rich-grid-renderer {
				--ytd-rich-grid-items-per-row: revert !important;
				display: revert !important;
				grid-template-columns: revert !important;
				grid-gap: revert !important;
				max-width: revert !important;
				margin: revert !important;
				padding: revert !important;
			}

			ytd-rich-item-renderer {
				width: revert !important;
				margin: revert !important;
			}

			ytd-browse[page-subtype="channels"] #primary {
				max-width: revert !important;
				width: revert !important;
			}

			#page-manager {
				margin: revert !important;
			}

			#logo svg, #logo-container .logo, #footer-logo {
				filter: revert !important;
				opacity: revert !important;
			}

			.ytd-thumbnail img.yt-img-shadow,
			.ytp-cued-thumbnail-overlay-image {
				filter: revert !important;
			}

			button.yt-spec-button-shape-next.yt-spec-button-shape-next--filled.yt-spec-button-shape-next--mono {
				background-color: revert !important;
				color: revert !important;
			}

			#logo, #logo-icon, #logo-icon-container, #masthead-logo, .logo, .ytd-logo {
				outline: revert !important;
				-webkit-tap-highlight-color: revert !important;
			}

			#masthead-logo a, #masthead a, #logo a {
				outline: revert !important;
			}

			/* Reddit resets */
			#left-sidebar-container {
				width: revert !important;
				min-width: revert !important;
				display: revert !important;
				--expanded: revert !important;
			}

			#nsfw {
				display: revert !important;
			}

			[data-faceplate-tracking-context*='"type":"nsfw"'] {
				display: revert !important;
			}

			#hamburger-button-tooltip {
				display: revert !important;
			}

			chat-channel-recommendations-wrapper {
				display: revert !important;
			}

			.Rz5N3cHNgTGZsIQJqBfgk {
				display: revert !important;
			}

			.jEUbSHJJx8vISKpWirlfx {
				border: revert !important;
			}

			.jEUbSHJJx8vISKpWirlfx svg {
				display: revert !important;
			}

			._1FUNcfOeszr8eruqLxCMcR._10wb7d3rGvj56Gcs4IQWL5 {
				opacity: revert !important;
				transition: revert !important;
			}

			.pr-lg.flex.gap-xs.items-center.justify-start {
				pointer-events: revert !important;
			}

			/* Twitter resets */
			div.css-901oao.r-1awozwy>svg {
				filter: none !important;
				opacity: 1 !important;
			}

			a[data-testid="AppTabBar_Home_Link"] div div div {
				display: revert !important;
			}

			/* Facebook resets */
			#stories_pagelet_rhc,
			#createNav,
			div[aria-label="Messenger"][role="dialog"],
			a[data-testid="left_nav_item_Watch"],
			a[data-testid="left_nav_item_Marketplace"],
			a[data-testid="left_nav_item_Messenger"] {
				display: revert !important;
			}

			/* Amazon resets */
			#nav-swmslot, #desktop-banner,
			div[data-feature-name="similarities"],
			#sims-consolidated-1_feature_div,
			#sims-consolidated-2_feature_div,
			#rhf {
				display: revert !important;
			}

			#navbar *, #nav-belt, #nav-main, #nav-subnav {
				background-color: revert !important;
				color: revert !important;
			}

			/* Netflix resets */
			.billboard-row, .lolomoBigRow {
				display: revert !important;
			}

			/* Google resets */
			#hplogo, #logo, #navcnt, .cOl4Id {
				filter: none !important;
				opacity: 1 !important;
			}

			/* Yahoo resets */
			#feat-bar, #Stream>*, .stream-items>*,
			.tdv2-wafer-ntk-desktop>*, .aside-sticky-col>*,
			.ntk-filmstrip>ul>*, .ntk-lead {
				opacity: 1 !important;
				filter: none !important;
			}

			/* Hide any Minimal UI elements */
			#minimal-notification-widget,
			#minimal-preload-style,
			#minimal-reddit-js-styles,
			#minimal-reddit-homepage,
			#minimal-youtube-homepage {
				display: none !important;
			}
		`;

		/* Insert at highest priority */
		if (document.head) {
			document.head.appendChild(resetStyle);
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				document.head.appendChild(resetStyle);
			});
		}
	}

	/* Apply user-hidden elements and report count to badge */
	function initUserHiddenElements() {
		const hostname = window.location.hostname;

		function applyAndReport() {
			chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
				const hidden = data.hiddenElements[hostname] || [];

				/* Apply hidden elements */
				for (const selector of hidden) {
					try {
						document.querySelectorAll(selector).forEach(el => {
							el.style.setProperty('display', 'none', 'important');
						});
					} catch (e) { /* Ignore invalid selectors */ }
				}

				/* Report user-hidden count to badge (0 means no badge) */
				try {
					chrome.runtime.sendMessage({
						type: 'updateUserHiddenCount',
						count: hidden.length
					});
				} catch (e) { /* Ignore */ }
			});
		}

		/* Apply on load */
		if (document.body) {
			applyAndReport();
		} else {
			document.addEventListener('DOMContentLoaded', applyAndReport);
		}

		/* Re-apply on DOM changes (for SPAs) - debounced */
		let debounceTimer = null;
		const observer = new MutationObserver(() => {
			if (debounceTimer) return;
			debounceTimer = setTimeout(() => {
				debounceTimer = null;
				chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
					const hidden = data.hiddenElements[hostname] || [];
					for (const selector of hidden) {
						try {
							document.querySelectorAll(selector).forEach(el => {
								if (el.style.display !== 'none') {
									el.style.setProperty('display', 'none', 'important');
								}
							});
						} catch (e) { /* Ignore */ }
					}
				});
			}, 300);
		});

		if (document.body) {
			observer.observe(document.body, { childList: true, subtree: true });
		}
	}

	/* Track right-clicked element for context menu */
	document.addEventListener('contextmenu', (e) => {
		window.minimalLastRightClickedElement = e.target;
	}, true);
})();

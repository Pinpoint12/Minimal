/* Blocked Content Tracker & State Manager */

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

		/* Minimal is enabled - run normal tracking */
		initBlockerTracker();
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
			yt-tab-shape[tab-title="Shorts"] {
				display: revert !important;
			}

			#columns, #primary, #secondary {
				width: revert !important;
				max-width: revert !important;
				min-width: revert !important;
			}

			/* Reddit resets */
			#left-sidebar-container {
				width: revert !important;
				min-width: revert !important;
				display: revert !important;
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
			#minimal-preload-style {
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

	/* Main blocker tracker functionality */
	function initBlockerTracker() {
		let blockedCount = 0;
		let lastReportedCount = 0;
		let notificationWidget = null;
		let hideTimeout = null;

		const blockedSelectors = {
			youtube: ['#related', '#ticket-shelf', '#merch-shelf', 'ytd-reel-shelf-renderer', '#notification-count', '.videowall-endscreen'],
			reddit: ['#left-sidebar-container', 'chat-channel-recommendations-wrapper', 'span[data-part="advertise"]'],
			twitter: ['[data-testid="AppTabBar_Home_Link"] div div div'],
			facebook: ['#stories_pagelet_rhc', '#createNav', 'div[aria-label="Messenger"][role="dialog"]'],
			amazon: ['#nav-swmslot', '#desktop-banner', 'div[data-feature-name="similarities"]', '#rhf'],
			netflix: ['.billboard-row', '.lolomoBigRow'],
			google: [],
			yahoo: []
		};

		function countBlockedElements() {
			if (!blockedSelectors[currentSite]) return 0;
			let count = 0;
			for (const selector of blockedSelectors[currentSite]) {
				try {
					const elements = document.querySelectorAll(selector);
					for (const el of elements) {
						const style = window.getComputedStyle(el);
						if (style.display === 'none' || style.visibility === 'hidden') {
							count++;
						}
					}
				} catch (e) { /* Ignore */ }
			}
			return count;
		}

		function createNotificationWidget() {
			if (notificationWidget) return notificationWidget;

			notificationWidget = document.createElement('div');
			notificationWidget.id = 'minimal-notification-widget';
			notificationWidget.innerHTML = `
				<style>
					#minimal-notification-widget {
						position: fixed;
						bottom: 20px;
						left: 20px;
						background: rgba(0, 0, 0, 0.9);
						color: #fff;
						padding: 12px 16px;
						border-radius: 8px;
						font-family: -apple-system, BlinkMacSystemFont, sans-serif;
						font-size: 13px;
						z-index: 2147483646;
						display: none;
						align-items: center;
						gap: 10px;
						box-shadow: 0 4px 12px rgba(0,0,0,0.3);
						transition: opacity 0.3s, transform 0.3s;
						opacity: 0;
						transform: translateY(10px);
					}
					#minimal-notification-widget.visible {
						display: flex;
						opacity: 1;
						transform: translateY(0);
					}
					#minimal-notification-widget .icon { color: #4CAF50; font-size: 16px; }
					#minimal-notification-widget .count { font-weight: 600; color: #4CAF50; }
					#minimal-notification-widget .close {
						margin-left: 8px;
						background: none;
						border: none;
						color: #666;
						cursor: pointer;
						font-size: 18px;
						padding: 0 4px;
					}
					#minimal-notification-widget .close:hover { color: #fff; }
				</style>
				<span class="icon">✓</span>
				<span>Minimal blocked <span class="count">0</span> distractions</span>
				<button class="close" id="minimal-close-notification">×</button>
			`;

			document.body.appendChild(notificationWidget);

			document.getElementById('minimal-close-notification').addEventListener('click', hideNotification);

			return notificationWidget;
		}

		function showNotification(count) {
			if (count === 0) return;
			const widget = createNotificationWidget();
			widget.querySelector('.count').textContent = count;
			requestAnimationFrame(() => widget.classList.add('visible'));
			if (hideTimeout) clearTimeout(hideTimeout);
			hideTimeout = setTimeout(hideNotification, 4000);
		}

		function hideNotification() {
			if (notificationWidget) notificationWidget.classList.remove('visible');
		}

		function reportBlockedCount(count) {
			if (count === lastReportedCount) return;
			lastReportedCount = count;
			try {
				chrome.runtime.sendMessage({ type: 'updateBlockedCount', count });
			} catch (e) { /* Ignore */ }
		}

		function updateBlockedCount() {
			blockedCount = countBlockedElements();
			reportBlockedCount(blockedCount);
			if (blockedCount > 0 && !sessionStorage.getItem('minimal-notified')) {
				sessionStorage.setItem('minimal-notified', 'true');
				setTimeout(() => showNotification(blockedCount), 1500);
			}
		}

		const observer = new MutationObserver(updateBlockedCount);

		function init() {
			if (document.body) {
				observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
				setTimeout(updateBlockedCount, 1000);
			} else {
				document.addEventListener('DOMContentLoaded', init);
			}
		}

		init();
		window.addEventListener('unload', () => observer.disconnect());

		/* Apply previously hidden elements */
		chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
			const hidden = data.hiddenElements[window.location.hostname] || [];
			for (const selector of hidden) {
				try {
					document.querySelectorAll(selector).forEach(el => {
						el.style.setProperty('display', 'none', 'important');
					});
				} catch (e) { /* Ignore */ }
			}
		});
	}

	/* Track right-clicked element for context menu */
	document.addEventListener('contextmenu', (e) => {
		window.minimalLastRightClickedElement = e.target;
	}, true);
})();

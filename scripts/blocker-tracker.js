/* Blocked Content Tracker - Counts hidden elements and reports to service worker */

(function() {
	'use strict';

	/* Prevent multiple initializations */
	if (window.minimalBlockerTracker) return;
	window.minimalBlockerTracker = true;

	let blockedCount = 0;
	let lastReportedCount = 0;
	let notificationWidget = null;
	let hideTimeout = null;

	/* Selectors for elements we hide (site-agnostic common patterns) */
	const blockedSelectors = {
		youtube: [
			'#related',
			'#ticket-shelf',
			'#merch-shelf',
			'.ytd-horizontal-card-list-renderer',
			'ytd-reel-shelf-renderer',
			'#notification-count',
			'ytd-notification-topbar-button-renderer',
			'.videowall-endscreen',
			'.ytp-ce-element'
		],
		reddit: [
			'#left-sidebar-container',
			'chat-channel-recommendations-wrapper',
			'[data-faceplate-tracking-context*="nsfw"]',
			'span[data-part="advertise"]'
		],
		twitter: [
			'[data-testid="AppTabBar_Home_Link"] div div div'
		],
		facebook: [
			'#stories_pagelet_rhc',
			'#createNav',
			'div[aria-label="Messenger"][role="dialog"]'
		],
		amazon: [
			'#nav-swmslot',
			'#desktop-banner',
			'div[data-feature-name="similarities"]',
			'#sims-consolidated-1_feature_div',
			'#sims-consolidated-2_feature_div',
			'#rhf'
		],
		netflix: [
			'.billboard-row',
			'.lolomoBigRow'
		],
		google: [],
		yahoo: []
	};

	/* Detect current site */
	function getCurrentSite() {
		const hostname = window.location.hostname;
		if (hostname.includes('youtube')) return 'youtube';
		if (hostname.includes('reddit')) return 'reddit';
		if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
		if (hostname.includes('facebook')) return 'facebook';
		if (hostname.includes('amazon')) return 'amazon';
		if (hostname.includes('netflix')) return 'netflix';
		if (hostname.includes('google')) return 'google';
		if (hostname.includes('yahoo')) return 'yahoo';
		return null;
	}

	/* Count blocked elements */
	function countBlockedElements() {
		const site = getCurrentSite();
		if (!site || !blockedSelectors[site]) return 0;

		let count = 0;
		for (const selector of blockedSelectors[site]) {
			try {
				const elements = document.querySelectorAll(selector);
				for (const el of elements) {
					const style = window.getComputedStyle(el);
					if (style.display === 'none' || style.visibility === 'hidden') {
						count++;
					}
				}
			} catch (e) {
				/* Ignore invalid selectors */
			}
		}
		return count;
	}

	/* Create notification widget */
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
					background: rgba(0, 0, 0, 0.85);
					color: #fff;
					padding: 12px 16px;
					border-radius: 8px;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
					font-size: 13px;
					z-index: 2147483646;
					display: none;
					align-items: center;
					gap: 10px;
					box-shadow: 0 4px 12px rgba(0,0,0,0.3);
					transition: opacity 0.3s ease, transform 0.3s ease;
					opacity: 0;
					transform: translateY(10px);
				}
				#minimal-notification-widget.visible {
					display: flex;
					opacity: 1;
					transform: translateY(0);
				}
				#minimal-notification-widget .icon {
					width: 20px;
					height: 20px;
					background: #4CAF50;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 12px;
				}
				#minimal-notification-widget .count {
					font-weight: 600;
					color: #4CAF50;
				}
				#minimal-notification-widget .action {
					margin-left: 8px;
					padding: 4px 10px;
					background: rgba(255,255,255,0.15);
					border: none;
					border-radius: 4px;
					color: #fff;
					cursor: pointer;
					font-size: 12px;
				}
				#minimal-notification-widget .action:hover {
					background: rgba(255,255,255,0.25);
				}
				#minimal-notification-widget .close {
					margin-left: 4px;
					padding: 2px 6px;
					background: transparent;
					border: none;
					color: #888;
					cursor: pointer;
					font-size: 16px;
				}
				#minimal-notification-widget .close:hover {
					color: #fff;
				}
			</style>
			<span class="icon">✓</span>
			<span>Minimal blocked <span class="count">0</span> distractions</span>
			<button class="action" id="minimal-show-blocked">Show</button>
			<button class="close" id="minimal-close-notification">×</button>
		`;

		document.body.appendChild(notificationWidget);

		/* Show blocked content temporarily */
		document.getElementById('minimal-show-blocked').addEventListener('click', () => {
			toggleBlockedContent(true);
			setTimeout(() => toggleBlockedContent(false), 10000); /* Hide again after 10s */
		});

		/* Close notification */
		document.getElementById('minimal-close-notification').addEventListener('click', () => {
			hideNotification();
		});

		return notificationWidget;
	}

	/* Toggle visibility of blocked content */
	function toggleBlockedContent(show) {
		const site = getCurrentSite();
		if (!site || !blockedSelectors[site]) return;

		for (const selector of blockedSelectors[site]) {
			try {
				const elements = document.querySelectorAll(selector);
				for (const el of elements) {
					if (show) {
						el.style.setProperty('display', 'block', 'important');
						el.style.setProperty('visibility', 'visible', 'important');
					} else {
						el.style.removeProperty('display');
						el.style.removeProperty('visibility');
					}
				}
			} catch (e) {
				/* Ignore */
			}
		}
	}

	/* Show notification */
	function showNotification(count) {
		if (count === 0) return;

		const widget = createNotificationWidget();
		widget.querySelector('.count').textContent = count;

		/* Show with animation */
		requestAnimationFrame(() => {
			widget.classList.add('visible');
		});

		/* Auto-hide after 5 seconds */
		if (hideTimeout) clearTimeout(hideTimeout);
		hideTimeout = setTimeout(hideNotification, 5000);
	}

	/* Hide notification */
	function hideNotification() {
		if (notificationWidget) {
			notificationWidget.classList.remove('visible');
		}
	}

	/* Report count to service worker for badge */
	function reportBlockedCount(count) {
		if (count === lastReportedCount) return;
		lastReportedCount = count;

		try {
			chrome.runtime.sendMessage({
				type: 'updateBlockedCount',
				count: count
			});
		} catch (e) {
			/* Extension context may be invalidated */
		}
	}

	/* Main update function */
	function updateBlockedCount() {
		blockedCount = countBlockedElements();
		reportBlockedCount(blockedCount);

		/* Show notification on first significant count */
		if (blockedCount > 0 && !sessionStorage.getItem('minimal-notified')) {
			sessionStorage.setItem('minimal-notified', 'true');
			setTimeout(() => showNotification(blockedCount), 1500);
		}
	}

	/* Observe DOM changes to track new blocked elements */
	const observer = new MutationObserver(() => {
		updateBlockedCount();
	});

	/* Initialize when DOM is ready */
	function init() {
		if (document.body) {
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['style', 'class']
			});
			/* Initial count after a short delay for CSS to apply */
			setTimeout(updateBlockedCount, 1000);
		} else {
			document.addEventListener('DOMContentLoaded', init);
		}
	}

	init();

	/* Clean up on unload */
	window.addEventListener('unload', () => {
		observer.disconnect();
	});

	/* Track right-clicked element for context menu "Hide this element" feature */
	document.addEventListener('contextmenu', (e) => {
		window.minimalLastRightClickedElement = e.target;
	}, true);

	/* Apply previously hidden elements from storage */
	function applyHiddenElements() {
		const hostname = window.location.hostname;
		chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
			const hidden = data.hiddenElements[hostname] || [];
			for (const selector of hidden) {
				try {
					const elements = document.querySelectorAll(selector);
					elements.forEach(el => {
						el.style.setProperty('display', 'none', 'important');
					});
				} catch (e) {
					/* Invalid selector, ignore */
				}
			}
		});
	}

	/* Apply hidden elements after DOM is ready */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', applyHiddenElements);
	} else {
		applyHiddenElements();
	}
})();

/* Manifest V3 Service Worker for Minimal Extension */

/* Badge colors for different states */
const BADGE_COLORS = {
	active: '#4CAF50',      /* Green - extension active */
	disabled: '#9E9E9E',    /* Gray - extension disabled */
	blocked: '#4CAF50',     /* Green - showing blocked count */
	error: '#F44336'        /* Red - error state */
};

/* Badge text for status indicators */
const BADGE_STATUS = {
	active: '✓',
	disabled: '✗',
	error: '!'
};

const resources = [
	{"name": "youtube", "url": "https*:\/\/(www\.)?youtube\.(com)\/.*", "style": "youtube.css", "script": "youtube.js"},
	{"name": "facebook", "url": "https*:\/\/(www\.)?facebook\.(com)\/.*", "style": "facebook.css", "script": "facebook.js"},
	{"name": "twitter", "url": "https*:\/\/(www\.)?(twitter|x)\.(com)\/.*", "style": "twitter.css", "script": "twitter.js"},
	{"name": "google", "url": "https*:\/\/(www\.)?google\.(com|ac|ad|ae|com\.af|com\.ag|com\.ai|al|am|co\.ao|com\.ar|as|at|com\.au|az|ba|com\.bd|be|bf|bg|com\.bh|bi|bj|com\.bn|com\.bo|com\.br|bs|bt|co\.bw|by|com\.bz|ca|com\.kh|cc|cd|cf|cat|cg|ch|ci|co\.ck|cl|cm|cn|com\.co|co\.cr|com\.cu|cv|com\.cy|cz|de|dj|dk|dm|com\.do|dz|com\.ec|ee|com\.eg|es|com\.et|fi|com\.fj|fm|fr|ga|ge|gf|gg|com\.gh|com\.gi|gl|gm|gp|gr|com\.gt|gy|com\.hk|hn|hr|ht|hu|co\.id|iq|ie|co\.il|im|co\.in|io|is|it|je|com\.jm|jo|co\.jp|co\.ke|ki|kg|co\.kr|com\.kw|kz|la|com\.lb|com\.lc|li|lk|co\.ls|lt|lu|lv|com\.ly|co\.ma|md|me|mg|mk|ml|com\.mm|mn|ms|com\.mt|mu|mv|mw|com\.mx|com\.my|co\.mz|com\.na|ne|com\.nf|com\.ng|com\.ni|nl|no|com\.np|nr|nu|co\.nz|com\.om|com\.pk|com\.pa|com\.pe|com\.ph|pl|com\.pg|pn|com\.pr|ps|pt|com\.py|com\.qa|ro|rs|ru|rw|com\.sa|com\.sb|sc|se|com\.sg|sh|si|sk|com\.sl|sn|sm|so|st|sr|com\.sv|td|tg|co\.th|com\.tj|tk|tl|tm|to|tn|com\.tr|tt|com\.tw|co\.tz|com\.ua|co\.ug|co\.uk|com\.uy|co\.uz|com\.vc|co\.ve|vg|co\.vi|com\.vn|vu|ws|co\.za|co\.zm|co\.zw)\/.*", "style": "google.css", "script": "google.js"},
	{"name": "amazon", "url": "https*:\/\/(www\.)?amazon\.(cn|in|co\.jp|com\.sg|com\.tr|fr|de|it|nl|es|co\.uk|ca|com\.mx|com|com\.au|com\.br|com\.be)\/.*", "style": "amazon.css", "script": "amazon.js"},
	{"name": "yahoo", "url": "https*:\/\/([^\W_]([a-zA-Z0-9\-]{0,61}[^\W_])?\.)*yahoo\.(com)\/.*", "style": "yahoo.css", "script": "yahoo.js"},
	{"name": "netflix", "url": "https*:\/\/(www\.)?netflix\.(com)\/.*", "style": "netflix.css", "script": "netflix.js"},
	{"name": "reddit", "url": "https*:\/\/(www\.)?reddit\.(com)\/.*", "style": "reddit.css", "script": "reddit.js"},
];

/* Update badge to show active status */
async function setBadgeActive(tabId) {
	try {
		await chrome.action.setBadgeText({ text: BADGE_STATUS.active, tabId: tabId });
		await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.active, tabId: tabId });
		await chrome.action.setTitle({ title: 'Minimal: Active', tabId: tabId });
	} catch (e) { /* Ignore badge errors */ }
}

/* Update badge to show disabled status */
async function setBadgeDisabled(tabId) {
	try {
		await chrome.action.setBadgeText({ text: BADGE_STATUS.disabled, tabId: tabId });
		await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.disabled, tabId: tabId });
		await chrome.action.setTitle({ title: 'Minimal: Disabled', tabId: tabId });
	} catch (e) { /* Ignore badge errors */ }
}

/* Update badge to show blocked count */
async function setBadgeBlockedCount(tabId, count) {
	try {
		if (count > 0) {
			const text = count > 99 ? '99+' : count.toString();
			await chrome.action.setBadgeText({ text: text, tabId: tabId });
			await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.blocked, tabId: tabId });
			await chrome.action.setTitle({ title: `Minimal: ${count} distractions blocked`, tabId: tabId });
		}
	} catch (e) { /* Ignore badge errors */ }
}

/* Clear badge */
async function clearBadge(tabId) {
	try {
		await chrome.action.setBadgeText({ text: '', tabId: tabId });
	} catch (e) { /* Ignore badge errors */ }
}

/* Enable minimal style for a tab using MV3 scripting API */
async function enable(tabId, tabInfo) {
	try {
		/* Inject CSS */
		await chrome.scripting.insertCSS({
			target: { tabId: tabId, allFrames: false },
			files: [tabInfo.css]
		});

		/* Inject JS */
		await chrome.scripting.executeScript({
			target: { tabId: tabId, allFrames: true },
			files: [tabInfo.js]
		});

		/* Update icon and badge to show enabled state */
		await chrome.action.setIcon({
			path: "./icons/pageAction_on.png",
			tabId: tabId
		});
		await setBadgeActive(tabId);

		return true;
	} catch (error) {
		console.error('[minimal] Error enabling:', error);
		/* Show error badge */
		try {
			await chrome.action.setBadgeText({ text: BADGE_STATUS.error, tabId: tabId });
			await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.error, tabId: tabId });
		} catch (e) { /* Ignore */ }
		return false;
	}
}

/* Disable minimal style for a tab by reloading */
async function disable(tabId) {
	try {
		/* Update icon and badge to show disabled state */
		await chrome.action.setIcon({
			path: "./icons/pageAction.png",
			tabId: tabId
		});
		await setBadgeDisabled(tabId);

		/* Reload the tab to remove injected content */
		await chrome.tabs.reload(tabId);

		return true;
	} catch (error) {
		console.error('[minimal] Error disabling:', error);
		return false;
	}
}

/* Get site info from URL */
function getSiteInfo(url) {
	for (const info of resources) {
		if (url.indexOf(info.name) !== -1 && RegExp(info.url).test(url)) {
			return info;
		}
	}
	return null;
}

/* Handle tab updates */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (tab.status !== "complete" || !tab.url) return;

	const siteInfo = getSiteInfo(tab.url);
	if (!siteInfo) return;

	try {
		/* Get stored state for this site */
		const storage = await chrome.storage.sync.get({ [siteInfo.name]: "enabled" });
		const minimalState = storage[siteInfo.name] || "enabled";

		/* Store tab info for popup communication */
		await chrome.storage.session.set({
			[`tab_${tabId}`]: {
				tabId: tabId,
				tabName: siteInfo.name,
				js: "scripts/" + siteInfo.script,
				css: "styles/" + siteInfo.style
			}
		});

		if (minimalState === "enabled") {
			await enable(tabId, {
				js: "scripts/" + siteInfo.script,
				css: "styles/" + siteInfo.style
			});
		} else {
			/* Update icon and badge to show disabled state */
			await chrome.action.setIcon({
				path: "./icons/pageAction.png",
				tabId: tabId
			});
			await setBadgeDisabled(tabId);
		}
	} catch (error) {
		console.error('[minimal] Error handling tab update:', error);
	}
});

/* Handle messages from popup and content scripts */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	(async () => {
		try {
			/* Handle blocked count updates from content scripts */
			if (message.type === "updateBlockedCount") {
				const tabId = sender.tab?.id;
				if (tabId && message.count > 0) {
					/* Update badge with blocked count */
					await setBadgeBlockedCount(tabId, message.count);
				} else if (tabId) {
					/* Show active checkmark if no blocked count */
					await setBadgeActive(tabId);
				}
				sendResponse({ success: true });
				return;
			}

			if (message.type === "getTabInfo") {
				const tabId = message.tabId;
				const storage = await chrome.storage.session.get(`tab_${tabId}`);
				const tabInfo = storage[`tab_${tabId}`] || null;

				if (tabInfo) {
					const stateStorage = await chrome.storage.sync.get({ [tabInfo.tabName]: "enabled" });
					sendResponse({
						tabInfo: tabInfo,
						enabled: stateStorage[tabInfo.tabName] === "enabled"
					});
				} else {
					sendResponse({ tabInfo: null, enabled: false });
				}
			} else if (message.type === "enable") {
				const tabId = message.tabId;
				const storage = await chrome.storage.session.get(`tab_${tabId}`);
				const tabInfo = storage[`tab_${tabId}`];

				if (tabInfo) {
					await chrome.storage.sync.set({ [tabInfo.tabName]: "enabled" });
					await enable(tabId, tabInfo);
					sendResponse({ success: true });
				} else {
					sendResponse({ success: false, error: "Tab not tracked" });
				}
			} else if (message.type === "disable") {
				const tabId = message.tabId;
				const storage = await chrome.storage.session.get(`tab_${tabId}`);
				const tabInfo = storage[`tab_${tabId}`];

				if (tabInfo) {
					await chrome.storage.sync.set({ [tabInfo.tabName]: "disabled" });
					await disable(tabId);
					sendResponse({ success: true });
				} else {
					sendResponse({ success: false, error: "Tab not tracked" });
				}
			}
		} catch (error) {
			console.error('[minimal] Message handler error:', error);
			sendResponse({ success: false, error: error.message });
		}
	})();

	/* Return true to indicate we'll send response asynchronously */
	return true;
});

/* Clean up session storage when tab is closed */
chrome.tabs.onRemoved.addListener(async (tabId) => {
	try {
		await chrome.storage.session.remove(`tab_${tabId}`);
	} catch (error) {
		/* Ignore errors during cleanup */
	}
});

/* ========== CONTEXT MENU SUPPORT ========== */

/* Create context menus on extension install/update */
chrome.runtime.onInstalled.addListener(() => {
	/* Remove existing menus first */
	chrome.contextMenus.removeAll(() => {
		/* Parent menu */
		chrome.contextMenus.create({
			id: 'minimal-parent',
			title: 'Minimal',
			contexts: ['all']
		});

		/* Hide this element */
		chrome.contextMenus.create({
			id: 'minimal-hide-element',
			parentId: 'minimal-parent',
			title: 'Hide this element',
			contexts: ['all']
		});

		/* Toggle for current site */
		chrome.contextMenus.create({
			id: 'minimal-toggle',
			parentId: 'minimal-parent',
			title: 'Toggle Minimal for this site',
			contexts: ['all']
		});

		/* Separator */
		chrome.contextMenus.create({
			id: 'minimal-separator-1',
			parentId: 'minimal-parent',
			type: 'separator',
			contexts: ['all']
		});

		/* Report as distraction */
		chrome.contextMenus.create({
			id: 'minimal-report',
			parentId: 'minimal-parent',
			title: 'Report as distraction',
			contexts: ['all']
		});

		/* Whitelist domain */
		chrome.contextMenus.create({
			id: 'minimal-whitelist',
			parentId: 'minimal-parent',
			title: 'Whitelist this domain',
			contexts: ['all']
		});
	});
});

/* Handle context menu clicks */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!tab?.id) return;

	try {
		switch (info.menuItemId) {
			case 'minimal-hide-element':
				/* Inject script to hide the clicked element */
				await chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: hideClickedElement,
					args: [info.targetElementId]
				});
				break;

			case 'minimal-toggle':
				/* Toggle minimal for this site */
				const storage = await chrome.storage.session.get(`tab_${tab.id}`);
				const tabInfo = storage[`tab_${tab.id}`];

				if (tabInfo) {
					const stateStorage = await chrome.storage.sync.get({ [tabInfo.tabName]: "enabled" });
					const currentState = stateStorage[tabInfo.tabName] || "enabled";

					if (currentState === "enabled") {
						await chrome.storage.sync.set({ [tabInfo.tabName]: "disabled" });
						await disable(tab.id);
					} else {
						await chrome.storage.sync.set({ [tabInfo.tabName]: "enabled" });
						await enable(tab.id, tabInfo);
					}
				}
				break;

			case 'minimal-report':
				/* Open issue reporter with pre-filled info */
				const url = new URL(tab.url);
				const reportUrl = `https://gitlab.com/aupya/minimal/-/issues/new?issue[title]=Distraction%20report%20for%20${encodeURIComponent(url.hostname)}&issue[description]=URL:%20${encodeURIComponent(tab.url)}%0A%0AElement%20to%20hide:%20%0A%0ADescription:%20`;
				await chrome.tabs.create({ url: reportUrl });
				break;

			case 'minimal-whitelist':
				/* Add domain to whitelist (disable for this domain) */
				const hostname = new URL(tab.url).hostname.replace('www.', '');
				const siteInfo = getSiteInfo(tab.url);

				if (siteInfo) {
					await chrome.storage.sync.set({ [siteInfo.name]: "disabled" });
					await disable(tab.id);

					/* Show notification */
					await chrome.scripting.executeScript({
						target: { tabId: tab.id },
						func: showWhitelistNotification,
						args: [hostname]
					});
				}
				break;
		}
	} catch (error) {
		console.error('[minimal] Context menu error:', error);
	}
});

/* Function to hide clicked element (injected into page) */
function hideClickedElement(targetElementId) {
	/* Find element under cursor or use last right-clicked element */
	let element = null;

	/* Try to find by targetElementId if available (Chrome 92+) */
	if (targetElementId) {
		/* targetElementId is not directly usable, we need to find another way */
	}

	/* Fallback: Use the element that was right-clicked (stored by content script) */
	element = window.minimalLastRightClickedElement;

	if (element) {
		/* Generate a unique selector for this element */
		const selector = generateUniqueSelector(element);

		/* Hide the element */
		element.style.setProperty('display', 'none', 'important');

		/* Store the hidden element selector for persistence */
		const hostname = window.location.hostname;
		chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
			const hidden = data.hiddenElements;
			if (!hidden[hostname]) hidden[hostname] = [];
			if (!hidden[hostname].includes(selector)) {
				hidden[hostname].push(selector);
				chrome.storage.sync.set({ hiddenElements: hidden });
			}
		});

		/* Show confirmation */
		showHideConfirmation(element);
	}

	function generateUniqueSelector(el) {
		if (el.id) return `#${el.id}`;

		const path = [];
		while (el && el.nodeType === Node.ELEMENT_NODE) {
			let selector = el.nodeName.toLowerCase();
			if (el.id) {
				selector = `#${el.id}`;
				path.unshift(selector);
				break;
			} else {
				let sibling = el;
				let nth = 1;
				while (sibling = sibling.previousElementSibling) {
					if (sibling.nodeName.toLowerCase() === selector) nth++;
				}
				if (nth > 1) selector += `:nth-of-type(${nth})`;
			}
			path.unshift(selector);
			el = el.parentNode;
		}
		return path.join(' > ');
	}

	function showHideConfirmation(el) {
		const rect = el.getBoundingClientRect();
		const toast = document.createElement('div');
		toast.textContent = 'Element hidden by Minimal';
		toast.style.cssText = `
			position: fixed;
			top: ${Math.max(10, rect.top)}px;
			left: ${Math.max(10, rect.left)}px;
			background: rgba(0,0,0,0.8);
			color: #4CAF50;
			padding: 8px 16px;
			border-radius: 4px;
			font-family: sans-serif;
			font-size: 13px;
			z-index: 2147483647;
			animation: minimalFadeOut 2s forwards;
		`;

		const style = document.createElement('style');
		style.textContent = `
			@keyframes minimalFadeOut {
				0%, 70% { opacity: 1; }
				100% { opacity: 0; }
			}
		`;
		document.head.appendChild(style);
		document.body.appendChild(toast);

		setTimeout(() => {
			toast.remove();
			style.remove();
		}, 2000);
	}
}

/* Function to show whitelist notification (injected into page) */
function showWhitelistNotification(hostname) {
	const toast = document.createElement('div');
	toast.innerHTML = `
		<div style="display:flex;align-items:center;gap:10px;">
			<span style="font-size:18px;">✓</span>
			<span>${hostname} whitelisted</span>
		</div>
		<div style="font-size:11px;color:#aaa;margin-top:4px;">
			Minimal is now disabled for this site
		</div>
	`;
	toast.style.cssText = `
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(0,0,0,0.9);
		color: #fff;
		padding: 16px 20px;
		border-radius: 8px;
		font-family: -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 14px;
		z-index: 2147483647;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		animation: minimalSlideIn 0.3s ease;
	`;

	const style = document.createElement('style');
	style.textContent = `
		@keyframes minimalSlideIn {
			from { transform: translateX(100px); opacity: 0; }
			to { transform: translateX(0); opacity: 1; }
		}
	`;
	document.head.appendChild(style);
	document.body.appendChild(toast);

	setTimeout(() => {
		toast.style.animation = 'minimalSlideIn 0.3s ease reverse';
		setTimeout(() => {
			toast.remove();
			style.remove();
		}, 300);
	}, 3000);
}

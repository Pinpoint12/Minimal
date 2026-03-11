/* Manifest V3 Service Worker for Minimal Extension */

/* Badge colors for different states */
const BADGE_COLORS = {
	disabled: '#9E9E9E',
	userHidden: '#4CAF50'
};

const resources = [
	{"name": "youtube", "url": /youtube\.com/, "style": "styles/youtube.css", "script": "scripts/youtube.js"},
	{"name": "facebook", "url": /facebook\.com/, "style": "styles/facebook.css", "script": "scripts/facebook.js"},
	{"name": "twitter", "url": /(twitter\.com|x\.com)/, "style": "styles/twitter.css", "script": "scripts/twitter.js"},
	{"name": "google", "url": /google\./, "style": "styles/google.css", "script": null},
	{"name": "amazon", "url": /amazon\./, "style": "styles/amazon.css", "script": null},
	{"name": "yahoo", "url": /yahoo\.com/, "style": "styles/yahoo.css", "script": null},
	{"name": "netflix", "url": /netflix\.com/, "style": "styles/netflix.css", "script": "scripts/netflix.js"},
	{"name": "reddit", "url": /reddit\.com/, "style": "styles/reddit.css", "script": "scripts/reddit.js"},
];

/* Get site info from URL */
function getSiteInfo(url) {
	if (!url) return null;
	for (const info of resources) {
		if (info.url.test(url)) {
			return info;
		}
	}
	return null;
}

/* Update badge to show active status (no badge text, just icon) */
async function setBadgeActive(tabId) {
	try {
		await chrome.action.setBadgeText({ text: '', tabId });
		await chrome.action.setTitle({ title: 'Minimal: Active', tabId });
		await chrome.action.setIcon({ path: "./icons/pageAction_on.png", tabId });
	} catch (e) { /* Ignore */ }
}

/* Update badge to show disabled status */
async function setBadgeDisabled(tabId) {
	try {
		await chrome.action.setBadgeText({ text: '\u2717', tabId });
		await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.disabled, tabId });
		await chrome.action.setTitle({ title: 'Minimal: Disabled', tabId });
		await chrome.action.setIcon({ path: "./icons/pageAction.png", tabId });
	} catch (e) { /* Ignore */ }
}

/* Update badge to show user-hidden element count */
async function setBadgeUserHiddenCount(tabId, count) {
	try {
		if (count > 0) {
			const text = count > 99 ? '99+' : count.toString();
			await chrome.action.setBadgeText({ text, tabId });
			await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.userHidden, tabId });
			await chrome.action.setTitle({ title: `Minimal: ${count} element${count > 1 ? 's' : ''} hidden by you`, tabId });
			await chrome.action.setIcon({ path: "./icons/pageAction_on.png", tabId });
		} else {
			/* No user-hidden elements - just show active icon without badge */
			await setBadgeActive(tabId);
		}
	} catch (e) { /* Ignore */ }
}

/* Disable minimal for a tab - reloads the page */
async function disableForTab(tabId) {
	try {
		await setBadgeDisabled(tabId);
		await chrome.tabs.reload(tabId);
		return true;
	} catch (error) {
		console.error('[minimal] Error disabling:', error);
		return false;
	}
}

/* Enable minimal for a tab - the content scripts handle the rest via storage check */
async function enableForTab(tabId) {
	try {
		await setBadgeActive(tabId);
		await chrome.tabs.reload(tabId);
		return true;
	} catch (error) {
		console.error('[minimal] Error enabling:', error);
		return false;
	}
}

/* Handle tab updates - set badge state based on storage */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status !== "complete" || !tab.url) return;

	const siteInfo = getSiteInfo(tab.url);
	if (!siteInfo) return;

	try {
		const storage = await chrome.storage.sync.get({ [siteInfo.name]: "enabled" });
		const isEnabled = storage[siteInfo.name] === "enabled";

		if (isEnabled) {
			await setBadgeActive(tabId);
		} else {
			await setBadgeDisabled(tabId);
		}
	} catch (error) {
		console.error('[minimal] Tab update error:', error);
	}
});

/* Handle messages from popup and content scripts */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	(async () => {
		try {
			if (message.type === "updateUserHiddenCount") {
				const tabId = sender.tab?.id;
				if (tabId) {
					await setBadgeUserHiddenCount(tabId, message.count);
				}
				sendResponse({ success: true });
			} else if (message.type === "enable") {
				await enableForTab(message.tabId);
				sendResponse({ success: true });
			} else if (message.type === "disable") {
				await disableForTab(message.tabId);
				sendResponse({ success: true });
			} else if (message.type === "getState") {
				const siteInfo = getSiteInfo(message.url);
				if (siteInfo) {
					const storage = await chrome.storage.sync.get({ [siteInfo.name]: "enabled" });
					sendResponse({
						enabled: storage[siteInfo.name] === "enabled",
						siteName: siteInfo.name
					});
				} else {
					sendResponse({ enabled: false, siteName: null });
				}
			} else if (message.type === "startElementPicker") {
				await chrome.scripting.executeScript({
					target: { tabId: message.tabId },
					func: startElementPicker
				});
				sendResponse({ success: true });
			}
		} catch (error) {
			console.error('[minimal] Message error:', error);
			sendResponse({ success: false, error: error.message });
		}
	})();
	return true;
});

/* ========== CONTEXT MENU ========== */

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.removeAll(() => {
		chrome.contextMenus.create({
			id: 'minimal-parent',
			title: 'Minimal',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-hide-element',
			parentId: 'minimal-parent',
			title: 'Hide this element',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-clear-hidden',
			parentId: 'minimal-parent',
			title: 'Clear hidden elements for this site',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-separator-1',
			parentId: 'minimal-parent',
			type: 'separator',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-toggle',
			parentId: 'minimal-parent',
			title: 'Toggle Minimal for this site',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-enable-site',
			parentId: 'minimal-parent',
			title: 'Enable for this site',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-disable-site',
			parentId: 'minimal-parent',
			title: 'Disable for this site',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-separator-2',
			parentId: 'minimal-parent',
			type: 'separator',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-enable-all',
			parentId: 'minimal-parent',
			title: 'Enable for all sites',
			contexts: ['all']
		});

		chrome.contextMenus.create({
			id: 'minimal-disable-all',
			parentId: 'minimal-parent',
			title: 'Disable for all sites',
			contexts: ['all']
		});
	});
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!tab?.id || !tab?.url) return;

	const siteInfo = getSiteInfo(tab.url);
	let hostname;
	try {
		hostname = new URL(tab.url).hostname;
	} catch (e) {
		hostname = null;
	}

	try {
		switch (info.menuItemId) {
			case 'minimal-hide-element':
				await chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: hideClickedElement
				});
				break;

			case 'minimal-clear-hidden':
				if (hostname) {
					const data = await chrome.storage.sync.get({ hiddenElements: {} });
					const hidden = data.hiddenElements;
					if (hidden[hostname]) {
						delete hidden[hostname];
						await chrome.storage.sync.set({ hiddenElements: hidden });
						await showToast(tab.id, 'Hidden elements cleared');
						await chrome.tabs.reload(tab.id);
					}
				}
				break;

			case 'minimal-toggle':
				if (siteInfo) {
					const storage = await chrome.storage.sync.get({ [siteInfo.name]: "enabled" });
					const isEnabled = storage[siteInfo.name] === "enabled";

					if (isEnabled) {
						await chrome.storage.sync.set({ [siteInfo.name]: "disabled" });
						await disableForTab(tab.id);
					} else {
						await chrome.storage.sync.set({ [siteInfo.name]: "enabled" });
						await enableForTab(tab.id);
					}
				}
				break;

			case 'minimal-enable-site':
				if (siteInfo) {
					await chrome.storage.sync.set({ [siteInfo.name]: "enabled" });
					await enableForTab(tab.id);
				}
				break;

			case 'minimal-disable-site':
				if (siteInfo) {
					await chrome.storage.sync.set({ [siteInfo.name]: "disabled" });
					await disableForTab(tab.id);
				}
				break;

			case 'minimal-enable-all':
				const enableAll = {};
				for (const resource of resources) {
					enableAll[resource.name] = "enabled";
				}
				await chrome.storage.sync.set(enableAll);
				if (siteInfo) {
					await enableForTab(tab.id);
				}
				await showToast(tab.id, 'Minimal enabled for all sites');
				break;

			case 'minimal-disable-all':
				const disableAll = {};
				for (const resource of resources) {
					disableAll[resource.name] = "disabled";
				}
				await chrome.storage.sync.set(disableAll);
				if (siteInfo) {
					await disableForTab(tab.id);
				}
				await showToast(tab.id, 'Minimal disabled for all sites');
				break;
		}
	} catch (error) {
		console.error('[minimal] Context menu error:', error);
	}
});

/* Ensure toast animation style exists (shared, not duplicated) */
function ensureToastStyle(doc) {
	if (!doc.getElementById('minimal-toast-style')) {
		const style = doc.createElement('style');
		style.id = 'minimal-toast-style';
		style.textContent = '@keyframes minimalFade { 0%,70% { opacity:1 } 100% { opacity:0 } }';
		doc.head.appendChild(style);
	}
}

/* Show toast notification in tab */
async function showToast(tabId, message) {
	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			func: (msg) => {
				if (!document.getElementById('minimal-toast-style')) {
					const style = document.createElement('style');
					style.id = 'minimal-toast-style';
					style.textContent = '@keyframes minimalFade { 0%,70% { opacity:1 } 100% { opacity:0 } }';
					document.head.appendChild(style);
				}
				const toast = document.createElement('div');
				toast.textContent = msg;
				toast.style.cssText = `
					position: fixed; top: 20px; right: 20px; z-index: 2147483647;
					background: rgba(0,0,0,0.9); color: #4CAF50; padding: 12px 20px;
					border-radius: 6px; font: 14px sans-serif;
					animation: minimalFade 2s forwards;
				`;
				document.body.appendChild(toast);
				setTimeout(() => { toast.remove(); }, 2000);
			},
			args: [message]
		});
	} catch (e) { /* Ignore */ }
}

/* Injected function to hide clicked element (from context menu) */
function hideClickedElement() {
	const element = window.minimalLastRightClickedElement;
	if (!element) return;

	function generateSelector(el) {
		if (el.id) return `#${el.id}`;
		const path = [];
		while (el && el.nodeType === Node.ELEMENT_NODE) {
			let selector = el.nodeName.toLowerCase();
			if (el.id) {
				path.unshift(`#${el.id}`);
				break;
			}
			let sibling = el, nth = 1;
			while (sibling = sibling.previousElementSibling) {
				if (sibling.nodeName.toLowerCase() === selector) nth++;
			}
			if (nth > 1) selector += `:nth-of-type(${nth})`;
			path.unshift(selector);
			el = el.parentNode;
		}
		return path.join(' > ');
	}

	const selector = generateSelector(element);
	element.style.setProperty('display', 'none', 'important');

	const hostname = window.location.hostname;
	chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
		const hidden = data.hiddenElements;
		if (!hidden[hostname]) hidden[hostname] = [];
		if (!hidden[hostname].includes(selector)) {
			hidden[hostname].push(selector);
			chrome.storage.sync.set({ hiddenElements: hidden });
		}
	});

	/* Toast notification */
	if (!document.getElementById('minimal-toast-style')) {
		const style = document.createElement('style');
		style.id = 'minimal-toast-style';
		style.textContent = '@keyframes minimalFade { 0%,70% { opacity:1 } 100% { opacity:0 } }';
		document.head.appendChild(style);
	}
	const toast = document.createElement('div');
	toast.textContent = 'Element hidden';
	toast.style.cssText = `
		position: fixed; top: 20px; right: 20px; z-index: 2147483647;
		background: rgba(0,0,0,0.9); color: #4CAF50; padding: 12px 20px;
		border-radius: 6px; font: 14px sans-serif;
		animation: minimalFade 2s forwards;
	`;
	document.body.appendChild(toast);
	setTimeout(() => { toast.remove(); }, 2000);
}

/* Injected function to start element picker mode (uBlock style) */
function startElementPicker() {
	/* Prevent multiple pickers */
	if (window.minimalPickerActive) return;
	window.minimalPickerActive = true;

	let hoveredElement = null;
	let overlay = null;
	let infoBox = null;

	/* Create overlay for highlighting */
	function createOverlay() {
		overlay = document.createElement('div');
		overlay.id = 'minimal-picker-overlay';
		overlay.style.cssText = `
			position: fixed;
			pointer-events: none;
			z-index: 2147483646;
			border: 2px solid #4CAF50;
			background: rgba(76, 175, 80, 0.15);
			box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.3);
			transition: all 0.05s ease-out;
		`;
		document.body.appendChild(overlay);
	}

	/* Create info box showing element tag/selector */
	function createInfoBox() {
		infoBox = document.createElement('div');
		infoBox.id = 'minimal-picker-info';
		infoBox.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			z-index: 2147483647;
			background: rgba(0, 0, 0, 0.95);
			color: #fff;
			padding: 12px 20px;
			border-radius: 8px;
			font: 13px -apple-system, BlinkMacSystemFont, sans-serif;
			box-shadow: 0 4px 20px rgba(0,0,0,0.4);
			display: flex;
			flex-direction: column;
			gap: 8px;
			max-width: 500px;
		`;
		infoBox.innerHTML = `
			<div style="display: flex; align-items: center; gap: 10px;">
				<span style="color: #4CAF50; font-weight: 600;">\u25ce Element Picker</span>
				<span style="color: #888;">Click to hide \u2022 ESC to cancel \u2022 Scroll to select parent</span>
			</div>
			<div id="minimal-picker-selector" style="color: #4CAF50; font-family: monospace; font-size: 12px; word-break: break-all;"></div>
		`;
		document.body.appendChild(infoBox);
	}

	/* Generate CSS selector for element */
	function generateSelector(el) {
		if (el.id) return `#${el.id}`;
		const path = [];
		while (el && el.nodeType === Node.ELEMENT_NODE) {
			let selector = el.nodeName.toLowerCase();
			if (el.id) {
				path.unshift(`#${el.id}`);
				break;
			}
			let sibling = el, nth = 1;
			while (sibling = sibling.previousElementSibling) {
				if (sibling.nodeName.toLowerCase() === selector) nth++;
			}
			if (nth > 1) selector += `:nth-of-type(${nth})`;
			path.unshift(selector);
			el = el.parentNode;
		}
		return path.join(' > ');
	}

	/* Get className as string, handling SVG elements */
	function getClassString(el) {
		if (typeof el.className === 'string') return el.className;
		if (el.className?.baseVal !== undefined) return el.className.baseVal;
		return '';
	}

	/* Update overlay position */
	function updateOverlay(el) {
		if (!el || !overlay) return;
		const rect = el.getBoundingClientRect();
		overlay.style.top = rect.top + 'px';
		overlay.style.left = rect.left + 'px';
		overlay.style.width = rect.width + 'px';
		overlay.style.height = rect.height + 'px';

		/* Update selector display */
		const selectorDisplay = document.getElementById('minimal-picker-selector');
		if (selectorDisplay) {
			const selector = generateSelector(el);
			const tag = el.tagName.toLowerCase();
			const classStr = getClassString(el);
			const classes = classStr ? '.' + classStr.split(' ').filter(c => c).join('.') : '';
			selectorDisplay.textContent = `<${tag}${el.id ? '#' + el.id : ''}${classes.substring(0, 50)}> \u2192 ${selector.substring(0, 80)}${selector.length > 80 ? '...' : ''}`;
		}
	}

	/* Mouse move handler */
	function onMouseMove(e) {
		const el = document.elementFromPoint(e.clientX, e.clientY);
		if (el && el !== overlay && el !== infoBox && !infoBox?.contains(el)) {
			hoveredElement = el;
			updateOverlay(el);
		}
	}

	/* Scroll handler to select parent element */
	function onScroll(e) {
		if (!hoveredElement) return;
		e.preventDefault();
		e.stopPropagation();

		if (e.deltaY > 0 && hoveredElement.parentElement && hoveredElement.parentElement !== document.body) {
			/* Scroll down = select parent */
			hoveredElement = hoveredElement.parentElement;
		} else if (e.deltaY < 0) {
			/* Scroll up = try to select child (first child) */
			const firstChild = hoveredElement.firstElementChild;
			if (firstChild) hoveredElement = firstChild;
		}
		updateOverlay(hoveredElement);
	}

	/* Click handler to hide element */
	function onClick(e) {
		e.preventDefault();
		e.stopPropagation();

		if (!hoveredElement) {
			cleanup();
			return;
		}

		/* Hide the element */
		const selector = generateSelector(hoveredElement);
		hoveredElement.style.setProperty('display', 'none', 'important');

		/* Save to storage */
		const hostname = window.location.hostname;
		chrome.storage.sync.get({ hiddenElements: {} }, (data) => {
			const hidden = data.hiddenElements;
			if (!hidden[hostname]) hidden[hostname] = [];
			if (!hidden[hostname].includes(selector)) {
				hidden[hostname].push(selector);
				chrome.storage.sync.set({ hiddenElements: hidden });
			}
		});

		/* Show toast */
		if (!document.getElementById('minimal-toast-style')) {
			const style = document.createElement('style');
			style.id = 'minimal-toast-style';
			style.textContent = '@keyframes minimalFade { 0%,70% { opacity:1 } 100% { opacity:0 } }';
			document.head.appendChild(style);
		}
		const toast = document.createElement('div');
		toast.textContent = 'Element hidden';
		toast.style.cssText = `
			position: fixed; top: 20px; right: 20px; z-index: 2147483647;
			background: rgba(0,0,0,0.9); color: #4CAF50; padding: 12px 20px;
			border-radius: 6px; font: 14px sans-serif;
			animation: minimalFade 2s forwards;
		`;
		document.body.appendChild(toast);
		setTimeout(() => { toast.remove(); }, 2000);

		cleanup();
	}

	/* Escape key handler */
	function onKeyDown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			cleanup();
		}
	}

	/* Cleanup and exit picker mode */
	function cleanup() {
		window.minimalPickerActive = false;
		document.removeEventListener('mousemove', onMouseMove, true);
		document.removeEventListener('click', onClick, true);
		document.removeEventListener('keydown', onKeyDown, true);
		document.removeEventListener('wheel', onScroll, { capture: true });
		if (overlay) overlay.remove();
		if (infoBox) infoBox.remove();
	}

	/* Initialize */
	createOverlay();
	createInfoBox();
	document.addEventListener('mousemove', onMouseMove, true);
	document.addEventListener('click', onClick, true);
	document.addEventListener('keydown', onKeyDown, true);
	document.addEventListener('wheel', onScroll, { passive: false, capture: true });
}

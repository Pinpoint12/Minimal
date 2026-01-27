/* Manifest V3 Service Worker for Minimal Extension */

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

		/* Update icon to show enabled state */
		await chrome.action.setIcon({
			path: "./icons/pageAction_on.png",
			tabId: tabId
		});

		return true;
	} catch (error) {
		console.error('[minimal] Error enabling:', error);
		return false;
	}
}

/* Disable minimal style for a tab by reloading */
async function disable(tabId) {
	try {
		/* Update icon to show disabled state */
		await chrome.action.setIcon({
			path: "./icons/pageAction.png",
			tabId: tabId
		});

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
			/* Just update icon to show disabled state */
			await chrome.action.setIcon({
				path: "./icons/pageAction.png",
				tabId: tabId
			});
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
					await chrome.action.setBadgeText({
						text: message.count.toString(),
						tabId: tabId
					});
					await chrome.action.setBadgeBackgroundColor({
						color: '#4CAF50',
						tabId: tabId
					});
				} else if (tabId) {
					/* Clear badge if count is 0 */
					await chrome.action.setBadgeText({
						text: '',
						tabId: tabId
					});
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

/* Manifest V3 Popup - Uses messaging instead of getBackgroundPage() */

const enable_button = document.getElementById("enable");
let currentTabId = null;
let currentTabName = null;

/* Initialize popup */
async function init() {
	try {
		/* Get current tab */
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab) {
			enable_button.disabled = true;
			return;
		}

		currentTabId = tab.id;

		/* Request tab info from service worker */
		const response = await chrome.runtime.sendMessage({
			type: "getTabInfo",
			tabId: currentTabId
		});

		if (!response || !response.tabInfo) {
			console.warn('[minimal] Tab not tracked');
			enable_button.disabled = true;
			return;
		}

		currentTabName = response.tabInfo.tabName;
		enable_button.checked = response.enabled;
		enable_button.disabled = false;

	} catch (error) {
		console.error('[minimal] Popup init error:', error);
		enable_button.disabled = true;
	}
}

/* Handle toggle change */
enable_button.addEventListener("change", async function() {
	if (!currentTabId || !currentTabName) return;

	try {
		if (this.checked) {
			await chrome.runtime.sendMessage({
				type: "enable",
				tabId: currentTabId
			});
		} else {
			await chrome.runtime.sendMessage({
				type: "disable",
				tabId: currentTabId
			});
		}
	} catch (error) {
		console.error('[minimal] Toggle error:', error);
	}
});

/* i18n */
const to_i18n = document.querySelectorAll('*[data-i18n]');
for (const el of to_i18n) {
	el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
}

/* Initialize on load */
init();

/* Manifest V3 Popup - Uses messaging and direct storage access */

const enableCheckbox = document.getElementById("enable");
const statusDiv = document.getElementById("status");

let currentTabId = null;
let currentSiteName = null;

/* Site detection patterns (must match main.js resources) */
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

/* Detect site from URL */
function detectSite(url) {
	for (const [name, pattern] of Object.entries(sitePatterns)) {
		if (pattern.test(url)) {
			return name;
		}
	}
	return null;
}

/* Update status display */
function updateStatus(message, className) {
	statusDiv.textContent = message;
	statusDiv.className = 'status ' + (className || '');
}

/* Initialize popup */
async function init() {
	try {
		/* Get current tab */
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab || !tab.url) {
			enableCheckbox.disabled = true;
			updateStatus('Cannot access this page', 'unsupported');
			return;
		}

		currentTabId = tab.id;
		currentSiteName = detectSite(tab.url);

		if (!currentSiteName) {
			enableCheckbox.disabled = true;
			updateStatus('Site not supported', 'unsupported');
			return;
		}

		/* Get stored state directly from sync storage */
		const storage = await chrome.storage.sync.get({ [currentSiteName]: "enabled" });
		const isEnabled = storage[currentSiteName] === "enabled";

		enableCheckbox.checked = isEnabled;
		enableCheckbox.disabled = false;

		if (isEnabled) {
			updateStatus(`Active on ${currentSiteName}`, 'active');
		} else {
			updateStatus(`Disabled on ${currentSiteName}`, 'disabled');
		}

	} catch (error) {
		console.error('[minimal] Popup init error:', error);
		enableCheckbox.disabled = true;
		updateStatus('Error loading state', 'disabled');
	}
}

/* Handle toggle change */
enableCheckbox.addEventListener("change", async function() {
	if (!currentTabId || !currentSiteName) return;

	const newState = this.checked ? "enabled" : "disabled";

	try {
		/* Save state to sync storage */
		await chrome.storage.sync.set({ [currentSiteName]: newState });

		/* Send message to service worker to handle the toggle */
		if (this.checked) {
			await chrome.runtime.sendMessage({
				type: "enable",
				tabId: currentTabId
			});
			updateStatus(`Active on ${currentSiteName}`, 'active');
		} else {
			await chrome.runtime.sendMessage({
				type: "disable",
				tabId: currentTabId
			});
			updateStatus(`Disabled on ${currentSiteName}`, 'disabled');
			/* Close popup since page will reload */
			setTimeout(() => window.close(), 100);
		}
	} catch (error) {
		console.error('[minimal] Toggle error:', error);
		/* Revert checkbox on error */
		this.checked = !this.checked;
		updateStatus('Error toggling', 'disabled');
	}
});

/* i18n */
const to_i18n = document.querySelectorAll('*[data-i18n]');
for (const el of to_i18n) {
	const message = chrome.i18n.getMessage(el.dataset.i18n);
	if (message) el.textContent = message;
}

/* Initialize on load */
init();

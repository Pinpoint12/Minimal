/* Manifest V3 Popup - Toggle & Hidden Elements Manager */

const enableCheckbox = document.getElementById("enable");
const statusDiv = document.getElementById("status");
const hiddenSection = document.getElementById("hidden-section");
const hiddenHeader = document.getElementById("hidden-header");
const hiddenContent = document.getElementById("hidden-content");
const hiddenList = document.getElementById("hidden-list");
const hiddenCount = document.getElementById("hidden-count");
const clearAllBtn = document.getElementById("clear-all-hidden");

let currentTabId = null;
let currentSiteName = null;
let currentHostname = null;

/* Site detection patterns */
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

function detectSite(url) {
	for (const [name, pattern] of Object.entries(sitePatterns)) {
		if (pattern.test(url)) return name;
	}
	return null;
}

function updateStatus(message, className) {
	statusDiv.textContent = message;
	statusDiv.className = 'status ' + (className || '');
}

/* Truncate selector for display */
function truncateSelector(selector, maxLen = 40) {
	if (selector.length <= maxLen) return selector;
	return selector.substring(0, maxLen - 3) + '...';
}

/* Load hidden elements for current hostname */
async function loadHiddenElements() {
	if (!currentHostname) {
		hiddenSection.style.display = 'none';
		return;
	}

	try {
		const data = await chrome.storage.sync.get({ hiddenElements: {} });
		const hidden = data.hiddenElements[currentHostname] || [];

		hiddenCount.textContent = hidden.length;

		if (hidden.length === 0) {
			hiddenList.innerHTML = '<div class="empty-state">No hidden elements</div>';
			clearAllBtn.disabled = true;
		} else {
			hiddenList.innerHTML = '';
			clearAllBtn.disabled = false;

			hidden.forEach((selector, index) => {
				const item = document.createElement('div');
				item.className = 'hidden-item';
				item.innerHTML = `
					<span class="hidden-item-selector" title="${selector}">${truncateSelector(selector)}</span>
					<button class="hidden-item-remove" data-index="${index}" title="Unhide">×</button>
				`;
				hiddenList.appendChild(item);
			});

			/* Add click handlers for remove buttons */
			hiddenList.querySelectorAll('.hidden-item-remove').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					const index = parseInt(e.target.dataset.index);
					await removeHiddenElement(index);
				});
			});
		}

		hiddenSection.style.display = 'block';
	} catch (error) {
		console.error('[minimal] Error loading hidden elements:', error);
		hiddenSection.style.display = 'none';
	}
}

/* Remove a hidden element by index */
async function removeHiddenElement(index) {
	try {
		const data = await chrome.storage.sync.get({ hiddenElements: {} });
		const hidden = data.hiddenElements;

		if (hidden[currentHostname] && hidden[currentHostname][index] !== undefined) {
			hidden[currentHostname].splice(index, 1);

			/* Clean up empty arrays */
			if (hidden[currentHostname].length === 0) {
				delete hidden[currentHostname];
			}

			await chrome.storage.sync.set({ hiddenElements: hidden });

			/* Reload the page to show the element again */
			await chrome.tabs.reload(currentTabId);

			/* Refresh the list */
			await loadHiddenElements();
		}
	} catch (error) {
		console.error('[minimal] Error removing hidden element:', error);
	}
}

/* Clear all hidden elements for current hostname */
async function clearAllHiddenElements() {
	try {
		const data = await chrome.storage.sync.get({ hiddenElements: {} });
		const hidden = data.hiddenElements;

		if (hidden[currentHostname]) {
			delete hidden[currentHostname];
			await chrome.storage.sync.set({ hiddenElements: hidden });

			/* Reload the page to show all elements */
			await chrome.tabs.reload(currentTabId);

			/* Refresh the list */
			await loadHiddenElements();
		}
	} catch (error) {
		console.error('[minimal] Error clearing hidden elements:', error);
	}
}

/* Toggle hidden section visibility */
hiddenHeader.addEventListener('click', () => {
	hiddenHeader.classList.toggle('expanded');
	hiddenContent.classList.toggle('visible');
});

/* Clear all button */
clearAllBtn.addEventListener('click', clearAllHiddenElements);

/* Initialize popup */
async function init() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab || !tab.url) {
			enableCheckbox.disabled = true;
			updateStatus('Cannot access this page', 'unsupported');
			hiddenSection.style.display = 'none';
			return;
		}

		currentTabId = tab.id;
		currentSiteName = detectSite(tab.url);

		try {
			currentHostname = new URL(tab.url).hostname;
		} catch (e) {
			currentHostname = null;
		}

		if (!currentSiteName) {
			enableCheckbox.disabled = true;
			updateStatus('Site not supported', 'unsupported');
			/* Still show hidden elements for unsupported sites */
			await loadHiddenElements();
			return;
		}

		const storage = await chrome.storage.sync.get({ [currentSiteName]: "enabled" });
		const isEnabled = storage[currentSiteName] === "enabled";

		enableCheckbox.checked = isEnabled;
		enableCheckbox.disabled = false;

		if (isEnabled) {
			updateStatus(`Active on ${currentSiteName}`, 'active');
		} else {
			updateStatus(`Disabled on ${currentSiteName}`, 'disabled');
		}

		/* Load hidden elements */
		await loadHiddenElements();

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
		await chrome.storage.sync.set({ [currentSiteName]: newState });

		if (this.checked) {
			await chrome.runtime.sendMessage({ type: "enable", tabId: currentTabId });
			updateStatus(`Active on ${currentSiteName}`, 'active');
		} else {
			await chrome.runtime.sendMessage({ type: "disable", tabId: currentTabId });
			updateStatus(`Disabled on ${currentSiteName}`, 'disabled');
			setTimeout(() => window.close(), 100);
		}
	} catch (error) {
		console.error('[minimal] Toggle error:', error);
		this.checked = !this.checked;
		updateStatus('Error toggling', 'disabled');
	}
});

/* i18n */
document.querySelectorAll('*[data-i18n]').forEach(el => {
	const message = chrome.i18n.getMessage(el.dataset.i18n);
	if (message) el.textContent = message;
});

init();

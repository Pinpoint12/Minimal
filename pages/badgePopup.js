/* Manifest V3 Popup - Toggle & Hidden Elements Manager */

const enableCheckbox = document.getElementById("enable");
const statusDiv = document.getElementById("status");
const hiddenSection = document.getElementById("hidden-section");
const hiddenHeader = document.getElementById("hidden-header");
const hiddenContent = document.getElementById("hidden-content");
const hiddenList = document.getElementById("hidden-list");
const hiddenCount = document.getElementById("hidden-count");
const clearAllBtn = document.getElementById("clear-all-hidden");
const pickElementBtn = document.getElementById("pick-element");

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

/* Internal site key -> human display name shown in the status line. The raw key
   (e.g. "twitter") is never user-facing — branding stays informative. - P1 */
const siteDisplayNames = {
	youtube: "YouTube",
	facebook: "Facebook",
	twitter: "X",
	google: "Google",
	amazon: "Amazon",
	yahoo: "Yahoo",
	netflix: "Netflix",
	reddit: "Reddit"
};

function displayName(siteName) {
	return siteDisplayNames[siteName] || siteName;
}

/* i18n helper — returns empty string for a missing key so callers can fall back
   to existing DOM text and never blank a control. - U2 */
function t(key, substitutions) {
	return chrome.i18n.getMessage(key, substitutions) || "";
}

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
		hiddenSection.hidden = true;
		return;
	}

	try {
		const data = await chrome.storage.sync.get({ hiddenElements: {} });
		const hidden = data.hiddenElements[currentHostname] || [];

		hiddenCount.textContent = hidden.length;

		if (hidden.length === 0) {
			hiddenList.innerHTML = '';
			const empty = document.createElement('div');
			empty.className = 'empty-state';
			empty.textContent = t('noHidden') || 'No hidden elements';
			hiddenList.appendChild(empty);
			clearAllBtn.disabled = true;
		} else {
			hiddenList.innerHTML = '';
			clearAllBtn.disabled = false;

			const unhideLabel = t('unhide') || 'Unhide';

			hidden.forEach((selector, index) => {
				const item = document.createElement('div');
				item.className = 'hidden-item';
				const span = document.createElement('span');
				span.className = 'hidden-item-selector';
				span.setAttribute('title', selector);
				span.textContent = truncateSelector(selector);
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'hidden-item-remove';
				btn.dataset.index = index;
				btn.setAttribute('title', unhideLabel);
				btn.setAttribute('aria-label', unhideLabel + ': ' + selector);
				btn.textContent = '×';
				btn.addEventListener('click', async () => {
					await removeHiddenElement(index);
				});
				item.appendChild(span);
				item.appendChild(btn);
				hiddenList.appendChild(item);
			});
		}

		hiddenSection.hidden = false;
	} catch (error) {
		console.error('[minimal] Error loading hidden elements:', error);
		hiddenSection.hidden = true;
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

/* Toggle hidden section visibility — header is a real button, so keyboard
   activation comes for free; aria-expanded reflects state to assistive tech. - U1 */
hiddenHeader.addEventListener('click', () => {
	const expanded = hiddenHeader.getAttribute('aria-expanded') === 'true';
	hiddenHeader.setAttribute('aria-expanded', String(!expanded));
	hiddenContent.classList.toggle('visible', !expanded);
});

/* Clear all button */
clearAllBtn.addEventListener('click', clearAllHiddenElements);

/* Pick element button */
pickElementBtn.addEventListener('click', async () => {
	if (!currentTabId) return;

	try {
		await chrome.runtime.sendMessage({
			type: "startElementPicker",
			tabId: currentTabId
		});
		window.close();
	} catch (error) {
		console.error('[minimal] Error starting element picker:', error);
	}
});

/* Site-specific options */
const siteOptionsDiv = document.getElementById("site-options");
const ytHideViewCounts = document.getElementById("yt-hide-view-counts");
const ytHideLikeCounts = document.getElementById("yt-hide-like-counts");
const ytHideComments = document.getElementById("yt-hide-comments");

/* Reddit vote style segmented control — radiogroup semantics: arrow keys move
   between options, click/space/enter selects. Roving tabindex keeps only the
   selected radio in the tab order. - C3 P1 U1 */
const voteStyleBtns = Array.from(document.querySelectorAll('#reddit-vote-style .seg-btn'));

function markVoteStyle(value) {
	let matched = false;
	voteStyleBtns.forEach(b => {
		const on = b.dataset.value === value;
		if (on) matched = true;
		b.classList.toggle('active', on);
		b.setAttribute('aria-checked', String(on));
		b.tabIndex = on ? 0 : -1;
	});
	/* Keep one stop in the tab order even if the stored value is unknown. */
	if (!matched && voteStyleBtns[0]) voteStyleBtns[0].tabIndex = 0;
}

async function selectVoteStyle(btn) {
	markVoteStyle(btn.dataset.value);
	btn.focus();
	await chrome.storage.sync.set({ reddit_voteStyle: btn.dataset.value });
	if (currentTabId) await chrome.tabs.reload(currentTabId);
}

voteStyleBtns.forEach((btn, i) => {
	btn.addEventListener('click', () => selectVoteStyle(btn));
	btn.addEventListener('keydown', (e) => {
		let next = null;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			next = voteStyleBtns[(i + 1) % voteStyleBtns.length];
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			next = voteStyleBtns[(i - 1 + voteStyleBtns.length) % voteStyleBtns.length];
		}
		if (next) {
			e.preventDefault();
			selectVoteStyle(next);
		}
	});
});

/* Load and show site-specific options */
async function loadSiteOptions() {
	if (currentSiteName === 'youtube') {
		siteOptionsDiv.hidden = false;
		document.getElementById('opt-hide-view-counts').hidden = false;
		document.getElementById('opt-hide-like-counts').hidden = false;
		document.getElementById('opt-hide-comments').hidden = false;

		const data = await chrome.storage.sync.get({
			yt_hideViewCounts: false,
			yt_hideLikeCounts: false,
			yt_hideComments: false
		});
		ytHideViewCounts.checked = data.yt_hideViewCounts;
		ytHideLikeCounts.checked = data.yt_hideLikeCounts;
		ytHideComments.checked = data.yt_hideComments;
	} else if (currentSiteName === 'reddit') {
		siteOptionsDiv.hidden = false;
		document.getElementById('opt-reddit-vote-style').hidden = false;

		const data = await chrome.storage.sync.get({ reddit_voteStyle: 'dots' });
		markVoteStyle(data.reddit_voteStyle || 'dots');
	} else {
		siteOptionsDiv.hidden = true;
	}
}

/* Handle YouTube option toggles - C3 P1 */
ytHideViewCounts.addEventListener('change', async function() {
	await chrome.storage.sync.set({ yt_hideViewCounts: this.checked });
	if (currentTabId) await chrome.tabs.reload(currentTabId);
});

ytHideLikeCounts.addEventListener('change', async function() {
	await chrome.storage.sync.set({ yt_hideLikeCounts: this.checked });
	if (currentTabId) await chrome.tabs.reload(currentTabId);
});

ytHideComments.addEventListener('change', async function() {
	await chrome.storage.sync.set({ yt_hideComments: this.checked });
	if (currentTabId) await chrome.tabs.reload(currentTabId);
});

/* Initialize popup */
async function init() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab || !tab.url) {
			enableCheckbox.disabled = true;
			updateStatus(t('statusNoAccess') || 'Cannot access this page', 'unsupported');
			hiddenSection.hidden = true;
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
			updateStatus(t('statusUnsupported') || 'Site not supported', 'unsupported');
			/* Still show hidden elements for unsupported sites */
			await loadHiddenElements();
			return;
		}

		const storage = await chrome.storage.sync.get({ [currentSiteName]: "enabled" });
		const isEnabled = storage[currentSiteName] === "enabled";

		enableCheckbox.checked = isEnabled;
		enableCheckbox.disabled = false;

		const name = displayName(currentSiteName);
		if (isEnabled) {
			updateStatus(t('statusActive', [name]) || ('Active on ' + name), 'active');
		} else {
			updateStatus(t('statusDisabled', [name]) || ('Disabled on ' + name), 'disabled');
		}

		/* Load hidden elements */
		await loadHiddenElements();

		/* Load site-specific options */
		await loadSiteOptions();

	} catch (error) {
		console.error('[minimal] Popup init error:', error);
		enableCheckbox.disabled = true;
		updateStatus(t('statusError') || 'Error loading state', 'error');
	}
}

/* Handle toggle change */
enableCheckbox.addEventListener("change", async function() {
	if (!currentTabId || !currentSiteName) return;

	const newState = this.checked ? "enabled" : "disabled";
	const name = displayName(currentSiteName);

	try {
		await chrome.storage.sync.set({ [currentSiteName]: newState });

		if (this.checked) {
			await chrome.runtime.sendMessage({ type: "enable", tabId: currentTabId });
			updateStatus(t('statusActive', [name]) || ('Active on ' + name), 'active');
		} else {
			await chrome.runtime.sendMessage({ type: "disable", tabId: currentTabId });
			updateStatus(t('statusDisabled', [name]) || ('Disabled on ' + name), 'disabled');
			setTimeout(() => window.close(), 100);
		}
	} catch (error) {
		console.error('[minimal] Toggle error:', error);
		this.checked = !this.checked;
		updateStatus(t('statusError') || 'Error toggling', 'error');
	}
});

/* Translate all static labels carrying data-i18n; keep DOM fallback text when a
   locale key is missing. - U2 */
function applyStaticI18n() {
	document.querySelectorAll('[data-i18n]').forEach(el => {
		const message = t(el.dataset.i18n);
		if (message) el.textContent = message;
	});
}

/* Footer version reads the manifest so it never drifts from the real build. - P1 */
function applyVersion() {
	const versionEl = document.getElementById('version');
	if (versionEl) {
		versionEl.textContent = 'v' + chrome.runtime.getManifest().version;
	}
}

applyStaticI18n();
applyVersion();
init();

/* Reddit Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C1 C2 P1 */

/* Prevent flash of unstyled content - inject immediately at document_start - C2 */
MinimalCore.installFoucPreload();

(function() {
	'use strict';

	const SITE_NAME = 'reddit';

	/* Shared brand mark — Reddit snoo icon + wordmark. Wordmark path inherits ink
	   colour from the shared overlay system via .minimal-logo-text. - P1 */
	const REDDIT_LOGO_HTML = `
		<svg class="minimal-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 216">
			<path fill="#ff4500" d="M108,0C48.35,0,0,48.35,0,108c0,29.82,12.09,56.82,31.63,76.37l-20.57,20.57c-4.08,4.08-1.19,11.06,4.58,11.06h92.36c59.65,0,108-48.35,108-108C216,48.35,167.65,0,108,0Z"/>
			<circle fill="white" cx="169.22" cy="106.98" r="25.22"/>
			<circle fill="white" cx="46.78" cy="106.98" r="25.22"/>
			<ellipse fill="white" cx="108.06" cy="128.64" rx="72" ry="54"/>
			<ellipse fill="#fc4301" cx="73.22" cy="118.82" rx="13" ry="14"/>
			<ellipse fill="#fc4301" cx="142.9" cy="118.82" rx="13" ry="14"/>
			<ellipse fill="#ffc49c" cx="79.63" cy="116.37" rx="2.8" ry="3.05"/>
			<ellipse fill="#ffc49c" cx="146.21" cy="116.37" rx="2.8" ry="3.05"/>
			<path fill="black" d="M108.06,142.92c-8.76,0-17.16.43-24.92,1.22c-1.33.13-2.17,1.51-1.65,2.74c4.35,10.39,14.61,17.69,26.57,17.69s22.23-7.3,26.57-17.69c.52-1.23-.33-2.61-1.65-2.74C125.22,143.35,116.82,142.92,108.06,142.92Z"/>
			<circle fill="white" cx="147.49" cy="49.43" r="17.87"/>
		</svg>
		<svg class="minimal-logo-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 514 149">
			<g>
				<path d="M71.62,45.92l-12.01,28.56c-1.51-.76-5.11-1.61-8.51-1.61s-6.81.85-10.12,2.46c-6.53,3.31-11.35,9.93-11.35,19.48v52.3H-.26V45.35h29.04v14.28h.57c6.81-9.08,17.21-15.79,30.74-15.79c4.92,0,9.65.95,11.54,2.08Z"/>
				<path d="M65.84,96.52c0-29.41,20.15-52.68,50.32-52.68c27.33,0,46.91,19.96,46.91,48.05c0,4.92-.47,9.55-1.51,14h-68.48c3.12,10.69,12.39,19.01,26.29,19.01c7.66,0,18.54-2.74,24.4-7.28l9.27,22.32c-8.61,5.86-21.75,8.7-33.29,8.7c-32.25,0-53.91-20.81-53.91-52.11Zm26.67-9.36h43.03c0-13.05-8.89-19.96-19.77-19.96c-12.3,0-20.62,7.94-23.27,19.96Z"/>
				<path d="M419.53-.37c10.03,0,18.25,8.23,18.25,18.25s-8.23,18.25-18.25,18.25s-18.25-8.23-18.25-18.25S409.51-.37,419.53-.37Zm14.94,147.49h-29.89V45.35h29.89v101.77Z"/>
				<path d="M246,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.42,121.39h-.99l-6.67-6.93c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
				<path d="M360.15,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.28,121.39h-.99l-6.67-6.93c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
				<path d="M492.44,45.35h21.85v25.44h-21.85v76.33h-29.89v-76.33h-21.75v-25.44h21.75v-27.66h29.89v27.66Z"/>
			</g>
		</svg>
	`;

	/* Map a query string to Reddit's search URL. - C2 */
	function buildSearchUrl(q) {
		return '/search/?q=' + encodeURIComponent(q);
	}

	/* NSFW URL blocklist - runs regardless of enabled state for safety */
	const PORN_BLOCKLIST_RE = /(nsfw|porn|porno|pornography|pr0n|p0rn|\bsex(?!y)|sexy|s3x|xxx|xvideos|xhamster|xnx|xnxx|goon|gooning|naked|nude|nud3|nudes|butt|booty|nalgas|nipple|nippl|areola|breast|boob|boobs|boobies|booby|bazongas|\btits?\b|\bt1ts\b|\bt!ts\b|\bcum\b|cumming|c\*m|k\*m|orgasm|orgasim|orgazm|ejaculat|masturbat|masturb8|fap|fapping|f4p|jerkoff|jerkin|cock|c0ck|kawk|dick|d1ck|d!ck|penis|phallus|dong|schlong|shaft|puss(?:y|ies)|pussi|vagina|vajayjay|clit|clitoris|cl1t|asshole|a-hole|a55hole|assfuck(?:ing|ed)?|(?:^|[^a-z0-9])ass\b|bootyhole|brownstar|backdoor|anilingus|rimming|rimjob|dildo|\banal(?!ysis|ytics|ogue|ogues)|buttplug|buttsex|milf|gilf|teen\b|blowjob|blowie|bl0wj0b|bj\b|bjs|bjob|gagging|deepthroat|handjob|hand[-_]?job|hand%20 job|fuck(?:ing|er|ed)?|fucking|fuk|fuking|f\*ck|screw(?:ing)?|rawdog|rawdogging|suck(?:ing)?|suckoff|sucked|dps|dp\b|doublepenetration|double[-_]?penetration|gangbang|grouphump|grouplove|creampie|creampied|threesome|foursome|orgy|bdsm|bondage|shibari|fetish|kink|spank(?:ing)?|whip(?:ping)?|slut|sl00t|sloot|whore|h0e|\bhoe\b|cumslut|cumdump|busty|bimbo|hotwife|cuckold|cuckquean|cuck\b|cucking|incest|inbreeding|stepsis|stepbro|stepmom|stepdad|stepbro(?:ther)?|stepfather|stepmother|stepparent|taboo|forbidden|gaysex|gayporn|lesbiansex|lesbianporn|homosex|homosexual|samesex|transsexual|tranny|shemale|futa(?:nari)?|ladyboy|\btgirl|hentai|h3ntai|ecchi|yaoi|yuri|lewd|lewdies|strip(?:per|ping)?|striptease|pissing|peeing|piss|goldenshower|watersports|scat\b|scatplay|cumshot|bukkake|facial\b|spitroast|bbw\b|chubbysex|thicc|th1cc|creaming|titfuck|boobjob|titty|titties|t1tties|bangbus|cameltoe|milking|lactat(?:e|ing)|nursingfetish|edging|chok(?:e|ing)|facesit(?:ting)?|smothering|publicsex|publicfuck|outdoorsex|exhibition|voyeur(?:ism)?|amateur(?!-radio)|prostitute|escort|callgirl|hooker|sugarbaby|sugardaddy|onlyfans|ofgirl|ofleak|prostitution|69ing|\b69\b|sixty[-_]?nine|cunnilingus|tonguejob|raping|rapist|molest(?:er|ation)?|sexual\s+predator|child\s+predator|nonconsensual|non[-_]?con|ncsex|flasher|flashing|exhibition(?:ist)?|pant(?:ies|y|yhose)|panty|pantie|pantyhose|crotchless|lingerie|thong|gstring|g-string|latex(?:girl)?|fetishwear|fingering|fisting|playboy|centerfold|playmate|genitals?|sodomy|doggystyle|doggy-style|suckjob|blowjobs?|fucktoy|fuckhole|fuckdoll|wank(?:ing)?|jerk(?:ing|off|\-off)?|pegging|strap[-_]?ons?|straponsex|strap[-_]?on|cumloads?|splooge|poon(?:ani|any)?|vajayjay|vaj\b|muff|snatch|beaver|twat|minge|g-?spot|felch(?:ing)?|snowball(?:ing)?|spankbank|moneyshot|money[-_]?shot|balls\b|testicles?|scrotum|taint|gooch|perineum|vibrator|sex[-_]?toy|dild0|d1ldo|sexshop|adult[-_]?toy|adultvideo|sextape|sex[-_]?tape|fleshlight|prolapse|rosebud|anal[-_]?beads|cumtribute|tributevid|cum[-_]?tribute|tittydrop|pegged|queef(?:ing)?|wetdream|wet[-_]?dream|sensual|nippleplay|analplay|oralplay|oralsex|sensualmassage|dirtytalk|talkdirty|camgirl|camwhore|webcamsex|livesex|pornvid|pornclip|faphouse|faptube|rule34|r34|deepfakeporn|vrporn|\berp\b|sext|sexting|freakytext|bootycall|slidein|nsfl|clussy|boink|humpday|smut|smutt|smexy)/i;

	/* True when the current URL (or its search query) matches the blocklist. - C2 */
	function urlIsBlocked() {
		const url = window.location.href;
		if (PORN_BLOCKLIST_RE.test(url)) return true;
		try {
			const params = new URL(url).searchParams;
			const query = params.get('q') || params.get('query') || '';
			if (query && PORN_BLOCKLIST_RE.test(query)) return true;
		} catch (e) { /* Ignore URL parse errors */ }
		return false;
	}

	/* - Build the blocked content overlay using the shared design system - C2 */
	function ensureBlockedOverlay() {
		if (document.getElementById('minimal-blocked-overlay')) return;
		const target = document.body || document.documentElement;
		const overlay = document.createElement('div');
		overlay.className = 'minimal-overlay';
		overlay.id = 'minimal-blocked-overlay';
		overlay.innerHTML = `
			<div class="minimal-overlay__logo">${REDDIT_LOGO_HTML}</div>
			<svg class="minimal-overlay__shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5Z"/>
				<path d="M9 12l2 2 4-4"/>
			</svg>
			<p class="minimal-overlay__title">Content Blocked</p>
			<p class="minimal-overlay__desc">This content was blocked by Minimal</p>
			<div class="minimal-overlay__search">
				<input class="minimal-overlay__input" type="text" placeholder="Search Reddit..." aria-label="Search Reddit" autofocus />
				<button class="minimal-overlay__btn" aria-label="Search">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/>
						<line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
				</button>
			</div>
			<button class="minimal-overlay__back">Go back</button>
		`;
		target.appendChild(overlay);

		/* Wire up search - identical to homepage */
		const searchInput = overlay.querySelector('.minimal-overlay__input');
		const searchBtn = overlay.querySelector('.minimal-overlay__btn');
		const performSearch = () => {
			const query = searchInput.value.trim();
			if (query) window.location.href = buildSearchUrl(query);
		};
		searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') performSearch();
		});
		searchBtn.addEventListener('click', performSearch);

		/* Go back — history.back() navigates away; reddit.com/ will show Minimal homepage */
		overlay.querySelector('.minimal-overlay__back').addEventListener('click', () => {
			history.back();
		});
	}

	function removeBlockedOverlay() {
		document.getElementById('minimal-blocked-overlay')?.remove();
	}

	/* Apply or clear the block state for the current URL. - C2 */
	function applyBlockState() {
		if (urlIsBlocked()) {
			document.documentElement.classList.add('block-all-content');
			if (document.body) {
				document.body.setAttribute('data-block-on-url', '1');
				ensureBlockedOverlay();
			} else {
				document.addEventListener('DOMContentLoaded', () => {
					if (document.body) {
						document.body.setAttribute('data-block-on-url', '1');
						ensureBlockedOverlay();
					}
				}, { once: true });
			}
		} else {
			document.documentElement.classList.remove('block-all-content');
			document.body?.removeAttribute('data-block-on-url');
			removeBlockedOverlay();
		}
	}

	/* Setup layout modifications - only when enabled */
	function setupLayout() {
		const style = document.createElement('style');
		style.id = 'minimal-reddit-js-styles';
		style.textContent = `
			/* Hide content settings components - C2 */
			settings-preferences-nsfw-modal,
			[data-testid="is-nsfw-shown"],
			[data-testid="safe-browsing-mode"],
			[data-testid="enable-feed-recommendation"],
			[data-testid="muted-communities"] {
				display: none !important;
			}

			/* Hide preferences page content settings - C2 */
			label[for="nsfw_content"],
			#nsfw_content,
			.content-settings-group,
			div.content-settings {
				display: none !important;
			}
		`;
		document.head.appendChild(style);

		/* Collapse sidebar - C1 */
		const sidebarContainer = document.getElementById('left-sidebar-container');
		if (sidebarContainer) {
			sidebarContainer.setAttribute('expanded', '0');
		}

		/* Handle preferences page - C2 */
		if (window.location.pathname.includes('/preferences')) {
			setupPreferencesObserver();
		}
	}

	/* The preferences page renders its content-settings controls asynchronously,
	   so a short-lived observer is needed to hide them. It is scoped to the
	   settings region (not document.body) and disconnects on pagehide. - C2 */
	function setupPreferencesObserver() {
		function hideContentSettings() {
			document.querySelectorAll('h2').forEach(heading => {
				if (heading.textContent.includes('Content')) {
					const container = heading.parentElement;
					if (container) container.style.display = 'none';
				}
			});

			const elementsToHide = document.querySelectorAll(`
				[data-testid="is-nsfw-shown"],
				[data-testid="safe-browsing-mode"],
				[data-testid="enable-feed-recommendation"],
				input[name*="nsfw"],
				input[id*="nsfw"],
				label[for*="nsfw"]
			`);

			elementsToHide.forEach(el => {
				el.style.display = 'none';
				if (el.parentElement) {
					el.parentElement.style.display = 'none';
					if (el.parentElement.parentElement) {
						el.parentElement.parentElement.style.display = 'none';
					}
				}
			});
		}

		hideContentSettings();

		/* Scope to the settings scroll region when present; never observe body. */
		const scope = document.querySelector('main') || document.getElementById('main-content');
		if (!scope) return;

		let scanTimer = null;
		const observer = new MutationObserver(() => {
			if (scanTimer) return;
			scanTimer = setTimeout(() => {
				scanTimer = null;
				hideContentSettings();
			}, 150);
		});
		observer.observe(scope, { childList: true, subtree: true });
		MinimalCore.onPageHide(() => {
			observer.disconnect();
			if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
		});
	}

	/* Reddit's homepage is served at /, /home and /home/. - C2 */
	function isRedditHomepage() {
		const p = window.location.pathname;
		return p === '/' || p === '/home' || p === '/home/';
	}

	/* Shared config so mount and remove stay in sync — remove() restores
	   shreddit-app's display via appShellSelectors. */
	const HOMEPAGE_CONFIG = {
		id: 'minimal-reddit-homepage',
		appShellSelectors: ['shreddit-app'],
		logoHTML: REDDIT_LOGO_HTML,
		placeholder: 'Search Reddit...',
		buildSearchUrl,
	};

	/* - Replace the homepage feed with the shared minimal search overlay - C2 P1 */
	/* Non-destructive: hides shreddit-app, appends overlay (preserves SPA routing). */
	function showHomepageOverlay() {
		if (!isRedditHomepage()) return;
		/* Don't override NSFW block */
		if (document.documentElement.classList.contains('block-all-content')) return;
		MinimalCore.mountSearchOverlay(HOMEPAGE_CONFIG);
	}

	function hideHomepageOverlay() {
		/* Only act when the overlay is up — otherwise mountSearchOverlay would create
		   a throwaway overlay (and hide shreddit-app) just to remove it. */
		if (!document.getElementById(HOMEPAGE_CONFIG.id)) return;
		MinimalCore.mountSearchOverlay(HOMEPAGE_CONFIG).remove();
	}

	/* - Vote count styling based on user preference - C3 P1 U1 */
	/* Static CSS (html.minimal-vote-*) covers light-DOM faceplate-number rendering.
	   Reddit renders many vote counts inside web-component shadow roots, which the
	   page stylesheet can't reach — so JS injects the same hiding CSS into each
	   shadow root exactly once (tracked in a WeakSet) and tags faceplate-numbers
	   for dots/click-to-reveal. It never re-walks the whole document per tick. */
	function applyVoteStyle(mode) {
		document.documentElement.classList.remove('minimal-vote-dots', 'minimal-vote-hidden');
		if (mode === 'dots') {
			document.documentElement.classList.add('minimal-vote-dots');
		} else if (mode === 'hidden') {
			document.documentElement.classList.add('minimal-vote-hidden');
		}

		/* "visible" leaves counts untouched. */
		if (mode === 'visible') return;

		const DOTS_CSS = `
			faceplate-number { font-size: 0 !important; cursor: pointer; }
			faceplate-number::after { content: '···'; font-size: 12px; letter-spacing: 1px; opacity: 0.4; }
			faceplate-number[data-minimal-dots]::after { content: attr(data-minimal-dots); }
			faceplate-number.minimal-revealed { font-size: inherit !important; cursor: default; }
			faceplate-number.minimal-revealed::after { display: none; }
		`;

		const HIDDEN_CSS = `
			faceplate-number { font-size: 0 !important; }
			faceplate-number::after { display: none; }
			/* - Collapse icon margin when count is hidden - C3 */
			.me-\\[var\\(--rem6\\)\\]:has(+ span faceplate-number) { margin-inline-end: 0 !important; }
		`;

		const SHADOW_CSS = mode === 'dots' ? DOTS_CSS : HIDDEN_CSS;

		/* Map number to dot count to prevent layout shift. */
		function getDots(num) {
			if (num < 10) return '·';
			if (num < 100) return '··';
			if (num < 10000) return '···';
			return '····';
		}

		/* Shadow roots already given the hiding <style>, so we don't re-inject. */
		const injectedRoots = new WeakSet();

		const tagFaceplate = (root) => {
			root.querySelectorAll('faceplate-number:not([data-minimal-processed])').forEach(el => {
				el.setAttribute('data-minimal-processed', '1');
				if (mode === 'dots') {
					const num = parseInt(el.getAttribute('number'), 10);
					if (!isNaN(num)) el.setAttribute('data-minimal-dots', getDots(num));
					el.addEventListener('click', () => el.classList.add('minimal-revealed'));
				}
			});
		};

		const injectShadow = (host) => {
			if (!host.shadowRoot || injectedRoots.has(host.shadowRoot)) return;
			injectedRoots.add(host.shadowRoot);
			if (!host.shadowRoot.querySelector('#minimal-hide-counts')) {
				const style = document.createElement('style');
				style.id = 'minimal-hide-counts';
				style.textContent = SHADOW_CSS;
				host.shadowRoot.appendChild(style);
			}
			tagFaceplate(host.shadowRoot);
			/* Recurse into nested shadow hosts within this root. */
			host.shadowRoot.querySelectorAll('*').forEach(injectShadow);
		};

		/* Process a single newly-added node subtree: inject CSS into any shadow
		   roots it contains and tag faceplate-numbers for dots/reveal. - U1 */
		function processNode(node) {
			if (node.nodeType !== Node.ELEMENT_NODE) return;
			tagFaceplate(node);
			if (node.shadowRoot) injectShadow(node);
			node.querySelectorAll('*').forEach(injectShadow);
		}

		/* One-time pass over what's already in the document. */
		processNode(document.documentElement);

		/* Process ONLY added nodes — never re-scan the whole document per tick. */
		const observer = new MutationObserver((mutations) => {
			for (const m of mutations) {
				for (const node of m.addedNodes) processNode(node);
			}
		});
		if (document.body) {
			observer.observe(document.body, { childList: true, subtree: true });
			MinimalCore.onPageHide(() => observer.disconnect());
		}
	}

	/* - Scroll depth wall to restore a natural stopping point on feeds - C2 U1 */
	/* The wall is meaningless on the homepage feed (replaced by the overlay) and on
	   comment threads, so it only mounts on actual subreddit/listing feeds. */
	function shouldApplyWall() {
		const path = window.location.pathname;
		if (path === '/') return false;
		if (path.includes('/comments/')) return false;
		return true;
	}

	let scrollWall = null;

	function mountScrollWall() {
		if (!shouldApplyWall()) return;
		scrollWall = MinimalCore.createScrollWall({
			postSelector: 'shreddit-post',
			limit: 25,
			container: document.body,
			protect: ['#right-sidebar-container'],
			message: "You've scrolled far enough.",
			dismissLabel: 'Keep going',
		});
	}

	/* On SPA navigation the previous wall's observers must be torn down before a
	   new one mounts, or observers leak across page changes. */
	function resetScrollWall() {
		if (scrollWall) {
			scrollWall.destroy();
			scrollWall = null;
		}
		mountScrollWall();
	}

	/* Main initialization - checks enabled state before running modifications */
	function init() {
		/* NSFW blocking always runs for safety, enabled or not. */
		applyBlockState();

		MinimalCore.storage({ [SITE_NAME]: 'enabled', reddit_voteStyle: 'dots' }).then((data) => {
			const isEnabled = data[SITE_NAME] === 'enabled';

			if (!isEnabled) {
				MinimalCore.debug('Reddit: Disabled, skipping modifications');
				MinimalCore.revealPage();
				/* Re-run the NSFW check on SPA navigation even when disabled. - C2 */
				MinimalCore.onSpaNavigate(() => applyBlockState());
				return;
			}

			MinimalCore.debug('Reddit: Enabled, applying modifications');
			const voteStyle = data.reddit_voteStyle || 'dots';

			function applyAll() {
				setupLayout();
				showHomepageOverlay();
				MinimalCore.revealPage();
				applyVoteStyle(voteStyle);
				mountScrollWall();

				/* Single nav handler drives NSFW recheck, homepage overlay toggle,
				   and scroll-wall teardown/recreate. NEVER a body-subtree observer. - C2 */
				MinimalCore.onSpaNavigate(() => {
					applyBlockState();
					if (isRedditHomepage()) {
						showHomepageOverlay();
					} else {
						hideHomepageOverlay();
					}
					resetScrollWall();
				});
			}

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', applyAll, { once: true });
			} else {
				applyAll();
			}
		});
	}

	init();
})();

/* Reddit Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C1 C2 P1 */

/* Prevent flash of unstyled content - inject immediately at document_start */
/* Hides body unconditionally — no class needed, so no gap between body
   appearing and class being added. revealPage() removes this style. */
(function() {
	const preloadStyle = document.createElement('style');
	preloadStyle.id = 'minimal-reddit-preload-style';
	preloadStyle.textContent = `
		body {
			visibility: hidden !important;
			opacity: 0 !important;
		}
	`;
	(document.head || document.documentElement).appendChild(preloadStyle);

	/* Failsafe: reveal after 2s regardless */
	setTimeout(() => {
		document.getElementById('minimal-reddit-preload-style')?.remove();
	}, 2000);
})();

(function() {
	'use strict';

	const SITE_NAME = 'reddit';

	/* Reveal page - removes the preload style that hides body */
	function revealPage() {
		document.getElementById('minimal-reddit-preload-style')?.remove();
	}

	/* NSFW URL blocklist - runs regardless of enabled state for safety */
	const PORN_BLOCKLIST_RE = /(nsfw|porn|porno|pornography|pr0n|p0rn|\bsex(?!y)|sexy|s3x|xxx|xvideos|xhamster|xnx|xnxx|goon|gooning|naked|nude|nud3|nudes|butt|booty|nalgas|nipple|nippl|areola|breast|boob|boobs|boobies|booby|bazongas|\btits?\b|\bt1ts\b|\bt!ts\b|\bcum\b|cumming|c\*m|k\*m|orgasm|orgasim|orgazm|ejaculat|masturbat|masturb8|fap|fapping|f4p|jerkoff|jerkin|cock|c0ck|kawk|dick|d1ck|d!ck|penis|phallus|dong|schlong|shaft|puss(?:y|ies)|pussi|vagina|vajayjay|clit|clitoris|cl1t|asshole|a-hole|a55hole|assfuck(?:ing|ed)?|(?:^|[^a-z0-9])ass\b|bootyhole|brownstar|backdoor|anilingus|rimming|rimjob|dildo|\banal(?!ysis|ytics|ogue|ogues)|buttplug|buttsex|milf|gilf|teen\b|blowjob|blowie|bl0wj0b|bj\b|bjs|bjob|gagging|deepthroat|handjob|hand[-_]?job|hand%20 job|fuck(?:ing|er|ed)?|fucking|fuk|fuking|f\*ck|screw(?:ing)?|rawdog|rawdogging|suck(?:ing)?|suckoff|sucked|dps|dp\b|doublepenetration|double[-_]?penetration|gangbang|grouphump|grouplove|creampie|creampied|threesome|foursome|orgy|bdsm|bondage|shibari|fetish|kink|spank(?:ing)?|whip(?:ping)?|slut|sl00t|sloot|whore|h0e|\bhoe\b|cumslut|cumdump|busty|bimbo|hotwife|cuckold|cuckquean|cuck\b|cucking|incest|inbreeding|stepsis|stepbro|stepmom|stepdad|stepbro(?:ther)?|stepfather|stepmother|stepparent|taboo|forbidden|gaysex|gayporn|lesbiansex|lesbianporn|homosex|homosexual|samesex|transsexual|tranny|shemale|futa(?:nari)?|ladyboy|tgirl|hentai|h3ntai|ecchi|yaoi|yuri|lewd|lewdies|strip(?:per|ping)?|striptease|pissing|peeing|piss|goldenshower|watersports|scat\b|scatplay|cumshot|bukkake|facial\b|spitroast|bbw\b|chubbysex|thicc|th1cc|creaming|titfuck|boobjob|titty|titties|t1tties|bangbus|cameltoe|milking|lactat(?:e|ing)|nursingfetish|edging|chok(?:e|ing)|facesit(?:ting)?|smothering|publicsex|publicfuck|outdoorsex|exhibition|voyeur(?:ism)?|amateur(?!-radio)|prostitute|escort|callgirl|hooker|sugarbaby|sugardaddy|onlyfans|ofgirl|ofleak|prostitution|69ing|\b69\b|sixty[-_]?nine|cunnilingus|tonguejob|raping|rapist|molest(?:er|ation)?|sexual\s+predator|child\s+predator|nonconsensual|non[-_]?con|ncsex|flasher|flashing|exhibition(?:ist)?|pant(?:ies|y|yhose)|panty|pantie|pantyhose|crotchless|lingerie|thong|gstring|g-string|latex(?:girl)?|fetishwear|fingering|fisting|playboy|centerfold|playmate|genitals?|sodomy|doggystyle|doggy-style|suckjob|blowjobs?|fucktoy|fuckhole|fuckdoll|wank(?:ing)?|jerk(?:ing|off|\-off)?|pegging|strap[-_]?ons?|straponsex|strap[-_]?on|cumloads?|splooge|poon(?:ani|any)?|vajayjay|vaj\b|muff|snatch|beaver|twat|minge|g-?spot|felch(?:ing)?|snowball(?:ing)?|spankbank|moneyshot|money[-_]?shot|balls\b|testicles?|scrotum|taint|gooch|perineum|vibrator|sex[-_]?toy|dild0|d1ldo|sexshop|adult[-_]?toy|adultvideo|sextape|sex[-_]?tape|fleshlight|prolapse|rosebud|anal[-_]?beads|cumtribute|tributevid|cum[-_]?tribute|tittydrop|pegged|queef(?:ing)?|wetdream|wet[-_]?dream|sensual|nippleplay|analplay|oralplay|oralsex|sensualmassage|dirtytalk|talkdirty|camgirl|camwhore|webcamsex|livesex|pornvid|pornclip|faphouse|faptube|rule34|r34|deepfakeporn|vrporn|\berp\b|sext|sexting|freakytext|bootycall|slidein|nsfl|clussy|boink|humpday|smut|smutt|smexy)/i;

	/* Block NSFW URLs and search queries immediately - runs regardless of enabled state */
	function blockNSFWContent() {
		try {
			const url = window.location.href;
			const pathname = window.location.pathname;

			/* Check the full URL (catches subreddit names, post titles in URL) */
			let isBlocked = PORN_BLOCKLIST_RE.test(url);

			/* Also check search query parameters */
			if (!isBlocked) {
				try {
					const params = new URL(url).searchParams;
					const query = params.get('q') || params.get('query') || '';
					if (query && PORN_BLOCKLIST_RE.test(query)) {
						isBlocked = true;
					}
				} catch (e) { /* Ignore URL parse errors */ }
			}

			if (isBlocked) {
				document.documentElement.classList.add('block-all-content');
				document.addEventListener('DOMContentLoaded', function() {
					if (document.body) {
						document.body.setAttribute('data-block-on-url', '1');
					}
				});
			}

			/* Watch for SPA navigation (Reddit uses client-side routing) */
			let lastUrl = url;
			const navObserver = new MutationObserver(() => {
				const currentUrl = window.location.href;
				if (currentUrl !== lastUrl) {
					lastUrl = currentUrl;
					let shouldBlock = PORN_BLOCKLIST_RE.test(currentUrl);
					if (!shouldBlock) {
						try {
							const params = new URL(currentUrl).searchParams;
							const query = params.get('q') || params.get('query') || '';
							if (query && PORN_BLOCKLIST_RE.test(query)) {
								shouldBlock = true;
							}
						} catch (e) { /* Ignore */ }
					}
					if (shouldBlock) {
						document.documentElement.classList.add('block-all-content');
						if (document.body) {
							document.body.setAttribute('data-block-on-url', '1');
						}
					} else {
						document.documentElement.classList.remove('block-all-content');
						if (document.body) {
							document.body.removeAttribute('data-block-on-url');
						}
					}
				}
			});
			if (document.body) {
				navObserver.observe(document.body, { childList: true, subtree: true });
			} else {
				document.addEventListener('DOMContentLoaded', () => {
					navObserver.observe(document.body, { childList: true, subtree: true });
				});
			}
		} catch (e) {
			console.error('[minimal] NSFW URL blocker error', e);
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
			const observer = new MutationObserver(() => {
				document.querySelectorAll('h2').forEach(heading => {
					if (heading.textContent.includes('Content')) {
						let container = heading.parentElement;
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
			});

			if (document.body) {
				observer.observe(document.body, { childList: true, subtree: true });
			}
		}
	}

	/* Replace homepage with minimal search overlay - C2 P1 */
	/* Non-destructive: hides shreddit-app, appends overlay (like YouTube pattern) */
	function replaceRedditHomePage() {
		if (window.location.pathname !== "/") return;

		/* Don't override NSFW block */
		if (document.documentElement.classList.contains('block-all-content')) return;

		/* Already showing */
		if (document.getElementById('minimal-reddit-homepage')) return;

		/* Hide Reddit's content non-destructively */
		const app = document.querySelector('shreddit-app');
		if (app) app.style.display = 'none';

		/* Build overlay */
		const overlay = document.createElement('div');
		overlay.id = 'minimal-reddit-homepage';
		overlay.innerHTML = `
			<div class="minimal-reddit-logo">
				<svg class="minimal-reddit-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 216">
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
				<svg class="minimal-reddit-logo-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 514 149">
					<g>
						<path d="M71.62,45.92l-12.01,28.56c-1.51-.76-5.11-1.61-8.51-1.61s-6.81.85-10.12,2.46c-6.53,3.31-11.35,9.93-11.35,19.48v52.3H-.26V45.35h29.04v14.28h.57c6.81-9.08,17.21-15.79,30.74-15.79c4.92,0,9.65.95,11.54,2.08Z"/>
						<path d="M65.84,96.52c0-29.41,20.15-52.68,50.32-52.68c27.33,0,46.91,19.96,46.91,48.05c0,4.92-.47,9.55-1.51,14h-68.48c3.12,10.69,12.39,19.01,26.29,19.01c7.66,0,18.54-2.74,24.4-7.28l9.27,22.32c-8.61,5.86-21.75,8.7-33.29,8.7c-32.25,0-53.91-20.81-53.91-52.11Zm26.67-9.36h43.03c0-13.05-8.89-19.96-19.77-19.96c-12.3,0-20.62,7.94-23.27,19.96Z"/>
						<path d="M419.53-.37c10.03,0,18.25,8.23,18.25,18.25s-8.23,18.25-18.25,18.25s-18.25-8.23-18.25-18.25S409.51-.37,419.53-.37Zm14.94,147.49h-29.89V45.35h29.89v101.77Z"/>
						<path d="M246,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.42,121.39h-.99l-6.67-6.93c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
						<path d="M360.15,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.28,121.39h-.99l-6.67-6.93c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
						<path d="M492.44,45.35h21.85v25.44h-21.85v76.33h-29.89v-76.33h-21.75v-25.44h21.75v-27.66h29.89v27.66Z"/>
					</g>
				</svg>
			</div>
			<div class="minimal-reddit-search">
				<input class="minimal-reddit-search-input" type="text" placeholder="Search Reddit..." autofocus />
				<button class="minimal-reddit-search-btn" aria-label="Search">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/>
						<line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
				</button>
			</div>
			<p class="minimal-reddit-hint">What are you looking for?</p>
		`;

		document.body.appendChild(overlay);

		/* Wire up search */
		const searchInput = overlay.querySelector('.minimal-reddit-search-input');
		const searchBtn = overlay.querySelector('.minimal-reddit-search-btn');
		const performSearch = () => {
			const query = searchInput.value.trim();
			if (query) window.location.href = `/search/?q=${encodeURIComponent(query)}`;
		};
		searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') performSearch();
		});
		searchBtn.addEventListener('click', performSearch);
	}

	/* Remove homepage overlay and restore Reddit - for SPA navigation away from / */
	function removeRedditHomePage() {
		const overlay = document.getElementById('minimal-reddit-homepage');
		if (overlay) overlay.remove();
		const app = document.querySelector('shreddit-app');
		if (app) app.style.removeProperty('display');
	}

	/* - Vote count styling based on user preference - C3 P1 U1 */
	function applyVoteStyle(mode) {
		/* Add mode class to <html> for static CSS rules */
		document.documentElement.classList.remove('minimal-vote-dots', 'minimal-vote-hidden');
		if (mode === 'dots') {
			document.documentElement.classList.add('minimal-vote-dots');
		} else if (mode === 'hidden') {
			document.documentElement.classList.add('minimal-vote-hidden');
		}

		/* "visible" needs no further work — static CSS handles nothing */
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

		/* Map number to appropriate dot count to prevent layout shift */
		function getDots(num) {
			if (num < 10) return '·';
			if (num < 100) return '··';
			if (num < 10000) return '···';
			return '····';
		}

		/* Set data-minimal-dots on faceplate-number elements and wire click-to-reveal - U1 */
		function processElements(root) {
			root.querySelectorAll('faceplate-number:not([data-minimal-processed])').forEach(el => {
				el.setAttribute('data-minimal-processed', '1');
				if (mode === 'dots') {
					const num = parseInt(el.getAttribute('number'), 10);
					if (!isNaN(num)) {
						el.setAttribute('data-minimal-dots', getDots(num));
					}
					el.addEventListener('click', () => el.classList.add('minimal-revealed'));
				}
			});
		}

		/* Inject hiding CSS into shadow roots */
		function processTree(root) {
			processElements(root);
			root.querySelectorAll('*').forEach(el => {
				if (el.shadowRoot) {
					if (!el.shadowRoot.querySelector('#minimal-hide-counts')) {
						const style = document.createElement('style');
						style.id = 'minimal-hide-counts';
						style.textContent = SHADOW_CSS;
						el.shadowRoot.appendChild(style);
					}
					processElements(el.shadowRoot);
					processTree(el.shadowRoot);
				}
			});
		}

		/* Process existing elements */
		processTree(document);

		/* Watch for new elements (SPA navigation, infinite scroll) */
		let scanTimer = null;
		const observer = new MutationObserver(() => {
			if (scanTimer) return;
			scanTimer = setTimeout(() => {
				scanTimer = null;
				processTree(document);
			}, 200);
		});

		if (document.body) {
			observer.observe(document.body, { childList: true, subtree: true });
		}
	}

	/* - Scroll depth wall to restore natural stopping point on feeds - C2 U1 */
	function addScrollDepthWall() {
		const POST_LIMIT = 25;
		const POST_SEL = 'shreddit-post';
		const observed = new WeakSet();
		let seenCount = 0;
		let wallShowing = false;
		let dismissed = false;
		let lastPath = window.location.pathname;
		let io = null;
		let mo = null;

		function shouldApply() {
			const path = window.location.pathname;
			if (path === '/') return false;
			if (path.includes('/comments/')) return false;
			return true;
		}

		/* Hide everything after the wall — posts, loaders, spacers — but not the sidebar */
		function hideContentAfterWall() {
			const wall = document.getElementById('minimal-scroll-wall');
			if (!wall) return;
			let el = wall.nextElementSibling;
			while (el) {
				el.style.setProperty('display', 'none', 'important');
				el.dataset.minimalWallHidden = '1';
				el = el.nextElementSibling;
			}
			/* Walk up and hide siblings of ancestors to catch loaders,
			   but skip the right sidebar and major layout containers */
			let parent = wall.parentElement;
			while (parent && parent !== document.body) {
				let sib = parent.nextElementSibling;
				while (sib) {
					if (sib.id !== 'right-sidebar-container' && !sib.querySelector('#right-sidebar-container')) {
						sib.style.setProperty('display', 'none', 'important');
						sib.dataset.minimalWallHidden = '1';
					}
					sib = sib.nextElementSibling;
				}
				parent = parent.parentElement;
			}
		}

		function reset() {
			seenCount = 0;
			wallShowing = false;
			dismissed = false;
			if (io) io.disconnect();
			io = null;
			const existing = document.getElementById('minimal-scroll-wall');
			if (existing) existing.remove();
			document.querySelectorAll(`${POST_SEL}[data-minimal-wall-hidden]`).forEach(p => {
				p.style.removeProperty('display');
				delete p.dataset.minimalWallHidden;
			});
		}

		function showWall(triggerPost) {
			if (wallShowing || dismissed) return;
			wallShowing = true;
			if (io) io.disconnect();

			const wall = document.createElement('div');
			wall.id = 'minimal-scroll-wall';
			wall.innerHTML = `
				<p class="minimal-wall-message">You've scrolled far enough.</p>
				<button class="minimal-wall-dismiss">Keep going</button>
			`;

			/* Insert inline after the triggering post */
			triggerPost.insertAdjacentElement('afterend', wall);

			/* Hide all content after the wall */
			hideContentAfterWall();

			wall.querySelector('.minimal-wall-dismiss').addEventListener('click', () => {
				dismissed = true;
				wall.remove();
				if (mo) mo.disconnect();
				/* Unhide everything */
				document.querySelectorAll('[data-minimal-wall-hidden]').forEach(el => {
					el.style.removeProperty('display');
					delete el.dataset.minimalWallHidden;
				});
			});
		}

		function startObserving() {
			if (!shouldApply()) return;

			io = new IntersectionObserver((entries) => {
				if (dismissed || wallShowing) return;

				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					seenCount++;
					io.unobserve(entry.target);

					if (seenCount >= POST_LIMIT) {
						showWall(entry.target);
						return;
					}
				}
			}, { threshold: 0.3 });

			function tryObserve(post) {
				if (observed.has(post)) return;
				observed.add(post);
				if (wallShowing && !dismissed) {
					/* Wall is up — hide this new post immediately */
					post.style.setProperty('display', 'none', 'important');
					post.dataset.minimalWallHidden = '1';
				} else {
					io.observe(post);
				}
			}

			document.querySelectorAll(POST_SEL).forEach(tryObserve);

			mo = new MutationObserver(() => {
				if (window.location.pathname !== lastPath) {
					lastPath = window.location.pathname;
					reset();
					startObserving();
					return;
				}
				if (wallShowing && !dismissed) {
					hideContentAfterWall();
				}
				document.querySelectorAll(POST_SEL).forEach(tryObserve);
			});

			if (document.body) {
				mo.observe(document.body, { childList: true, subtree: true });
			}
		}

		startObserving();
	}

	/* Main initialization - checks enabled state before running modifications */
	function init() {
		/* NSFW blocking always runs for safety */
		blockNSFWContent();

		/* Check if Minimal is enabled for Reddit */
		chrome.storage.sync.get({ [SITE_NAME]: "enabled", reddit_voteStyle: "dots" }, (data) => {
			const isEnabled = data[SITE_NAME] === "enabled";

			if (!isEnabled) {
				/* Minimal is disabled - reveal page and skip modifications */
				console.log('[minimal] Reddit: Disabled, skipping modifications');
				revealPage();
				return;
			}

			/* Minimal is enabled - run all modifications */
			console.log('[minimal] Reddit: Enabled, applying modifications');
			const voteStyle = data.reddit_voteStyle || 'dots';

			function applyAll() {
				setupLayout();
				replaceRedditHomePage();
				revealPage();
				applyVoteStyle(voteStyle);
				addScrollDepthWall();
			}

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', applyAll);
			} else {
				applyAll();
			}
		});
	}

	init();
})();

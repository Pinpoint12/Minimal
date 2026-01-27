/* Reddit Content Script - Minimal Extension */
/* All modifications gated behind enabled check - C1 C2 P1 */

(function() {
	'use strict';

	const SITE_NAME = 'reddit';

	/* NSFW URL blocklist - runs regardless of enabled state for safety */
	const PORN_BLOCKLIST_RE = /(nsfw|porn|porno|pornography|pr0n|p0rn|\bsex(?!y)|sexy|s3x|xxx|xvideos|xhamster|xnx|xnxx|goon|gooning|naked|nude|nud3|nudes|butt|booty|nalgas|nipple|nippl|areola|breast|boob|boobs|boobies|booby|bazongas|\btits?\b|\bt1ts\b|\bt!ts\b|\bcum\b|cumming|c\*m|k\*m|orgasm|orgasim|orgazm|ejaculat|masturbat|masturb8|fap|fapping|f4p|jerkoff|jerkin|cock|c0ck|kawk|dick|d1ck|d!ck|penis|phallus|dong|schlong|shaft|puss(?:y|ies)|pussi|vagina|vajayjay|clit|clitoris|cl1t|asshole|a-hole|a55hole|assfuck(?:ing|ed)?|(?:^|[^a-z0-9])ass\b|bootyhole|brownstar|backdoor|anilingus|rimming|rimjob|dildo|\banal(?!ysis|ytics|ogue|ogues)|buttplug|buttsex|milf|gilf|teen\b|blowjob|blowie|bl0wj0b|bj\b|bjs|bjob|gagging|deepthroat|handjob|hand[-_]?job|hand%20 job|fuck(?:ing|er|ed)?|fucking|fuk|fuking|f\*ck|screw(?:ing)?|rawdog|rawdogging|suck(?:ing)?|suckoff|sucked|dps|dp\b|doublepenetration|double[-_]?penetration|gangbang|grouphump|grouplove|creampie|creampied|threesome|foursome|orgy|bdsm|bondage|shibari|fetish|kink|spank(?:ing)?|whip(?:ping)?|slut|sl00t|sloot|whore|h0e|\bhoe\b|cumslut|cumdump|busty|bimbo|hotwife|cuckold|cuckquean|cuck\b|cucking|incest|inbreeding|stepsis|stepbro|stepmom|stepdad|stepbro(?:ther)?|stepfather|stepmother|stepparent|taboo|forbidden|gaysex|gayporn|lesbiansex|lesbianporn|homosex|homosexual|samesex|transsexual|tranny|shemale|futa(?:nari)?|ladyboy|tgirl|hentai|h3ntai|ecchi|yaoi|yuri|lewd|lewdies|strip(?:per|ping)?|striptease|pissing|peeing|piss|goldenshower|watersports|scat\b|scatplay|cumshot|bukkake|facial\b|spitroast|bbw\b|chubbysex|thicc|th1cc|creaming|titfuck|boobjob|titty|titties|t1tties|bangbus|cameltoe|milking|lactat(?:e|ing)|nursingfetish|edging|chok(?:e|ing)|facesit(?:ting)?|smothering|publicsex|publicfuck|outdoorsex|exhibition|voyeur(?:ism)?|amateur(?!-radio)|prostitute|escort|callgirl|hooker|sugarbaby|sugardaddy|onlyfans|ofgirl|ofleak|prostitution|69ing|\b69\b|sixty[-_]?nine|cunnilingus|tonguejob|raping|rapist|molest(?:er|ation)?|sexual\s+predator|child\s+predator|nonconsensual|non[-_]?con|ncsex|flasher|flashing|exhibition(?:ist)?|pant(?:ies|y|yhose)|panty|pantie|pantyhose|crotchless|lingerie|thong|gstring|g-string|latex(?:girl)?|fetishwear|fingering|fisting|playboy|centerfold|playmate|genitals?|sodomy|doggystyle|doggy-style|suckjob|blowjobs?|fucktoy|fuckhole|fuckdoll|wank(?:ing)?|jerk(?:ing|off|\-off)?|pegging|strap[-_]?ons?|straponsex|strap[-_]?on|cumloads?|splooge|poon(?:ani|any)?|vajayjay|vaj\b|muff|snatch|beaver|twat|minge|g-?spot|felch(?:ing)?|snowball(?:ing)?|spankbank|moneyshot|money[-_]?shot|balls\b|testicles?|scrotum|taint|gooch|perineum|vibrator|sex[-_]?toy|dild0|d1ldo|sexshop|adult[-_]?toy|adultvideo|sextape|sex[-_]?tape|fleshlight|prolapse|rosebud|anal[-_]?beads|cumtribute|tributevid|cum[-_]?tribute|tittydrop|pegged|queef(?:ing)?|wetdream|wet[-_]?dream|sensual|nippleplay|analplay|oralplay|oralsex|sensualmassage|dirtytalk|talkdirty|camgirl|camwhore|webcamsex|livesex|pornvid|pornclip|faphouse|faptube|rule34|r34|deepfakeporn|vrporn|\berp\b|sext|sexting|freakytext|bootycall|slidein|nsfl|clussy|boink|humpday|smut|smutt|smexy)/i;

	/* Block NSFW URLs immediately - this runs regardless of enabled state */
	function blockNSFWContent() {
		try {
			if (PORN_BLOCKLIST_RE.test(window.location.href)) {
				document.documentElement.classList.add('block-all-content');
				document.addEventListener('DOMContentLoaded', function() {
					if (document.body) {
						document.body.setAttribute('data-block-on-url', '1');
					}
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

	/* Replace homepage with minimal search - C2 P1 */
	function replaceRedditHomePage() {
		if (window.location.pathname !== "/") return;

		document.head.insertAdjacentHTML('beforeend', `
			<style id="minimal-reddit-homepage">
				body {
					margin: 0; padding: 0;
					font-family: Arial, sans-serif;
					background: #0f0f0f;
					color: #fff;
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100vh;
				}
				.reddit-home-container {
					display: flex;
					flex-direction: column;
					align-items: center;
				}
				.logo-link {
					display: flex;
					align-items: center;
					text-decoration: none;
					color: #fff;
					margin-bottom: 40px;
				}
				.reddit-icon { width: 40px; height: 40px; }
				.reddit-text { height: 28px; margin-left: 8px; }
				.search-wrapper { position: relative; width: 400px; }
				.search-input {
					width: 100%;
					padding: 12px 50px 12px 15px;
					font-size: 16px;
					border: none;
					border-radius: 24px;
					outline: none;
					background: #272727;
					color: #fff;
				}
				.search-icon {
					position: absolute;
					right: 15px;
					top: 42%;
					transform: translateY(-50%);
					cursor: pointer;
					fill: #ccc;
					width: 20px;
					height: 20px;
				}
			</style>
		`);

		document.body.innerHTML = `
			<div class="reddit-home-container">
				<a class="logo-link" href="/" aria-label="Home">
					<span class="reddit-icon">
						<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 216">
							<defs>
								<radialGradient id="snoo-gradient" cx="169.75" cy="92.19" r="50.98" gradientTransform="translate(0 11.64) scale(1 .87)" gradientUnits="userSpaceOnUse">
									<stop offset="0" stop-color="#feffff"/>
									<stop offset=".9" stop-color="#ffebef"/>
								</radialGradient>
							</defs>
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
					</span>
					<span class="reddit-text">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 514 149" style="color: currentColor;">
							<g fill="currentColor">
								<path d="M71.62,45.92l-12.01,28.56c-1.51-.76-5.11-1.61-8.51-1.61s-6.81.85-10.12,2.46c-6.53,3.31-11.35,9.93-11.35,19.48v52.3H-.26V45.35h29.04v14.28h.57c6.81-9.08,17.21-15.79,30.74-15.79c4.92,0,9.65.95,11.54,2.08Z"/>
								<path d="M65.84,96.52c0-29.41,20.15-52.68,50.32-52.68c27.33,0,46.91,19.96,46.91,48.05c0,4.92-.47,9.55-1.51,14h-68.48c3.12,10.69,12.39,19.01,26.29,19.01c7.66,0,18.54-2.74,24.4-7.28l9.27,22.32c-8.61,5.86-21.75,8.7-33.29,8.7c-32.25,0-53.91-20.81-53.91-52.11Zm26.67-9.36h43.03c0-13.05-8.89-19.96-19.77-19.96c-12.3,0-20.62,7.94-23.27,19.96Z"/>
								<path d="M419.53-.37c10.03,0,18.25,8.23,18.25,18.25s-8.23,18.25-18.25,18.25s-18.25-8.23-18.25-18.25S409.51-.37,419.53-.37Zm14.94,147.49h-29.89V45.35h29.89v101.77Z"/>
								<path d="M246,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.42,121.39h-.99l-6.67-6.93c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
								<path d="M360.15,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.28,121.39h-.99l-6.67-6.93c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
								<path d="M492.44,45.35h21.85v25.44h-21.85v76.33h-29.89v-76.33h-21.75v-25.44h21.75v-27.66h29.89v27.66Z"/>
							</g>
						</svg>
					</span>
				</a>
				<div class="search-wrapper">
					<input class="search-input" type="text" placeholder="Search Reddit..." autofocus />
					<svg class="search-icon" viewBox="0 0 24 24">
						<path d="M20.87,20.17l-5.59-5.59C16.35,13.35,17,11.75,17,10c0-3.87-3.13-7-7-7s-7,3.13-7,7s3.13,7,7,7c1.75,0,3.35-0.65,4.58-1.71l5.59,5.59L20.87,20.17z M10,16c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6S13.31,16,10,16z"/>
					</svg>
				</div>
			</div>
		`;

		setTimeout(() => {
			const searchInput = document.querySelector('.search-input');
			const searchIcon = document.querySelector('.search-icon');
			const performSearch = () => {
				const query = searchInput.value.trim();
				if (query) window.location.href = `/search/?q=${encodeURIComponent(query)}`;
			};
			searchInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') performSearch();
			});
			searchIcon.addEventListener('click', performSearch);
		}, 100);
	}

	/* Main initialization - checks enabled state before running modifications */
	function init() {
		/* NSFW blocking always runs for safety */
		blockNSFWContent();

		/* Check if Minimal is enabled for Reddit */
		chrome.storage.sync.get({ [SITE_NAME]: "enabled" }, (data) => {
			const isEnabled = data[SITE_NAME] === "enabled";

			if (!isEnabled) {
				/* Minimal is disabled - don't run any modifications */
				console.log('[minimal] Reddit: Disabled, skipping modifications');
				return;
			}

			/* Minimal is enabled - run all modifications */
			console.log('[minimal] Reddit: Enabled, applying modifications');

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => {
					setupLayout();
					replaceRedditHomePage();
				});
			} else {
				setupLayout();
				replaceRedditHomePage();
			}
		});
	}

	init();
})();

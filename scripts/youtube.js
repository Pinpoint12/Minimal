if (typeof browser === 'undefined') {
	browser = chrome
}

/* - Prevent flash of unstyled content - P1 */
(function() {
  // Create and inject a style element immediately to hide content until our scripts are ready
  const style = document.createElement('style');
  style.id = 'minimal-preload-style';
  style.textContent = `
    body { 
      visibility: hidden !important; 
      opacity: 0 !important;
      transition: opacity 0.1s ease-in !important;
    }
    
    body.minimal-ready {
      visibility: visible !important;
      opacity: 1 !important;
    }
  `;
  
  // Insert the style as early as possible
  (document.head || document.documentElement).appendChild(style);
  
  // Set up a function to reveal the page once our extension has processed it
  window.revealPage = function() {
    document.body.classList.add('minimal-ready');
    // Remove the preload style after a short delay to ensure everything is visible
    setTimeout(() => {
      const preloadStyle = document.getElementById('minimal-preload-style');
      if (preloadStyle) preloadStyle.remove();
    }, 300);
  };
  
  // If for some reason our scripts don't complete, ensure content becomes visible
  // after a reasonable timeout
  setTimeout(window.revealPage, 2000);
})();

/* - Use theater mode - C1 */
function activateTheaterMode(){
  if(document.getElementsByClassName('ytp-size-button')[0] != undefined){
    let theaterModeButton = document.getElementsByClassName('ytp-size-button')[0];
    if(theaterModeButton.getElementsByTagName("path")[0].getAttribute("d") === "m 28,11 0,14 -20,0 0,-14 z m -18,2 16,0 0,10 -16,0 0,-10 z"){
      theaterModeButton.click();
    }
  }
}

/* - Intercept "t" key to prevent toggling theater mode - U2 */
function interceptTheaterModeKeypress() {
  document.addEventListener('keydown', function(e) {
    // Check if the key is "t" (lowercase or uppercase)
    if (e.key === 't' || e.key === 'T') {
      // Only prevent on video pages
      if (window.location.pathname === "/watch") {
        // Check if user is typing in an input field, textarea, or contenteditable element
        const activeElement = document.activeElement;
        const isTypingInField = activeElement.tagName === 'INPUT' || 
                                activeElement.tagName === 'TEXTAREA' || 
                                activeElement.isContentEditable || 
                                activeElement.getAttribute('role') === 'textbox';
        
        // Only intercept if NOT typing in a field
        if (!isTypingInField) {
          // Prevent default behavior and stop propagation
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    }
  }, true); // Use capturing phase to intercept before YouTube handlers
}

/* - Remove autoplay "feature" - U1 */
function deactivateAutoplay(){
	let autoplayButton = document.getElementsByClassName('ytp-autonav-toggle-button')[0];
	if(autoplayButton){
		if(autoplayButton.getAttribute("aria-checked") == "true"){
			autoplayButton.click();
			return true;
		}
	}
	return false;
}

if(!deactivateAutoplay()){

	const autoplayButtonContainer = document.getElementsByClassName("ytp-autonav-toggle-button-container")[0];

	const deactivateAutoplayObserver = new MutationObserver((mutationList, observer) => {
		for (const mutation of mutationList) {
			if(deactivateAutoplay()){
				deactivateAutoplayObserver.disconnect();
			}
		}
	});
	if(autoplayButtonContainer){
		deactivateAutoplayObserver.observe(autoplayButtonContainer, { attributes: true, childList: true, subtree: true, attributeFilter:["aria-checked"] });
	}
}

/* - Replace the subscription list from the side menu by a link to the subscription manager - U3 */
function replaceSubscriptionManager(){
	if(document.getElementById("avatar-btn") || document.getElementById("yt-masthead-account-picker")){
		let subGuide =
			document.getElementsByTagName("ytd-guide-section-renderer").length ?
				document.getElementsByTagName("ytd-guide-section-renderer")[1] :
				document.getElementById("guide-subscriptions-section");

		let subManagerLink = document.createElement('a');
		subManagerLink.setAttribute('href', 'https://www.youtube.com/subscription_manager');
		subGuide.getElementsByTagName("div")[0].style.display="none";

		let subGuideTitle = subGuide.getElementsByTagName("h3")[0];

		if(subGuideTitle.getElementsByTagName("yt-formatted-string").length > 0){
			subGuideTitle.getElementsByTagName("yt-formatted-string")[0].style.textTransform="capitalize";
		} else{
			subGuideTitle.style.textTransform = "capitalize";
			subGuideTitle.style.color = "dimgrey";
		}

		subManagerLink.appendChild(subGuideTitle);

		if(subGuide.getElementsByTagName("hr").length){
			subGuide.insertBefore(subManagerLink, subGuide.getElementsByTagName("hr")[0]);
		} else {
			subGuide.appendChild(subManagerLink);
		}
	}
}

/* - Hide the live chat from the user and replace it with its button - U2 */
function hideLiveChat(){
  if(document.getElementById("chat") !== null){
    let iteration = 0;
    let clicked = false;

    if(document.getElementById("chatframe")){
      var checkInterval = setInterval(function(){
        let chatFrame = document.getElementById("chatframe");
        iteration++;

        // Prevent the interval from running too much time
        if(iteration > 20){
          console.error("[minimal] YT live chat error: Loading time exceeded 10s");
          clearInterval(checkInterval);
          return false;
        }

        // Check the load status of the live frame
        if(chatFrame.contentDocument.readyState == "complete"){
          if(document.getElementById("show-hide-button")){
            let chatButton = document.getElementById("show-hide-button").getElementsByTagName("button")[0];

            // Do a click once on the chat button if the chat is not hidden
            if(chatButton.hasAttribute("aria-pressed")){
              if(chatButton.getAttribute("aria-pressed") == "false"){
                chatButton.click();
              }
              else{
                clicked = true;
                clearInterval(checkInterval);
              }
            }
            else{
              if(chatFrame.contentDocument.body.childElementCount > 0 && !clicked){
                chatButton.click();
                clearInterval(checkInterval);
              }
            }
          }
        }
      },500);
    }
  }
}

/* - Add toggle for homepage recommended videos - U2 */
function addRecommendedVideoToggle(){
	console.log("[minimal] Add toggle for homepage recommended videos");
	let home_page = document.querySelector('[page-subtype="home"]');
	let home_page_children = document.querySelectorAll('[page-subtype="home"]>*');
	home_page_children.forEach(function(child){
		child.style.visibility = "hidden";
		child.style.height = "0";
	});
	let show_videos_button = document.createElement("button");

	show_videos_button.appendChild(document.createTextNode(browser.i18n.getMessage("toggleOn") + " " + browser.i18n.getMessage("videoRecommendations")));
	show_videos_button.style.position="fixed";
	show_videos_button.style.bottom="1em";
	show_videos_button.style.right="1em";
	show_videos_button.addEventListener("click", function(event){
		if(event.target.textContent == browser.i18n.getMessage("toggleOn") + " " + browser.i18n.getMessage("videoRecommendations")){
				home_page_children.forEach(function(child){
					child.style.visibility = "";
					child.style.height = "";
				});
			event.target.textContent = browser.i18n.getMessage("toggleOff") + " " + browser.i18n.getMessage("videoRecommendations");
		} else {
				home_page_children.forEach(function(child){
					child.style.visibility = "hidden";
					child.style.height = "0";
				});
			event.target.textContent = browser.i18n.getMessage("toggleOn") + " " + browser.i18n.getMessage("videoRecommendations");
		}
	})
	home_page.appendChild(show_videos_button);
}

function addRecommendedVideoToggleTry(){
	let home_page = document.querySelector('[page-subtype="home"]');
	if(home_page){
		addRecommendedVideoToggle();
		return true;
	}
	setTimeout(addRecommendedVideoToggleTry, 500);
}

addRecommendedVideoToggleTry();

/* - Replace YouTube homepage with minimal search-only version - U2 C2 */
function replaceHomePage() {
  if (window.location.pathname === "/") {
    // Preserve the theme before replacing the body content
    let isDarkTheme = document.documentElement.hasAttribute('dark') || 
                      document.querySelector('html[dark]') !== null || 
                      (document.querySelector('ytd-app') && 
                       getComputedStyle(document.querySelector('ytd-app')).getPropertyValue('--yt-spec-general-background-a') === '#0f0f0f');
    
    // Save the original body content
    const originalBodyContent = document.body.innerHTML;
    
    // Create minimal homepage
    document.querySelector("body").innerHTML = `
    <div class="home-container">
      <div class="logo">
        <svg viewBox="0 0 90 20" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon youtube-logo" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g viewBox="0 0 90 20" preserveAspectRatio="xMidYMid meet" class="style-scope yt-icon"><g class="style-scope yt-icon"><path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000" class="style-scope yt-icon"></path><path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white" class="style-scope yt-icon"></path></g><g class="style-scope yt-icon logo-text"><g id="youtube-paths" class="style-scope yt-icon"><path d="M34.6024 13.0036L31.3945 1.41846H34.1932L35.3174 6.6701C35.6043 7.96361 35.8136 9.06662 35.95 9.97913H36.0323C36.1264 9.32532 36.3381 8.22937 36.665 6.68892L37.8291 1.41846H40.6278L37.3799 13.0036V18.561H34.6001V13.0036H34.6024Z" class="style-scope yt-icon"></path><path d="M41.4697 18.1937C40.9053 17.8127 40.5031 17.22 40.2632 16.4157C40.0257 15.6114 39.9058 14.5437 39.9058 13.2078V11.3898C39.9058 10.0422 40.0422 8.95805 40.315 8.14196C40.5878 7.32588 41.0135 6.72851 41.592 6.35457C42.1706 5.98063 42.9302 5.79248 43.871 5.79248C44.7976 5.79248 45.5384 5.98298 46.0981 6.36398C46.6555 6.74497 47.0647 7.34234 47.3234 8.15137C47.5821 8.96275 47.7115 10.0422 47.7115 11.3898V13.2078C47.7115 14.5437 47.5845 15.6161 47.3329 16.4251C47.0812 17.2365 46.672 17.8292 46.1075 18.2031C45.5431 18.5771 44.7764 18.7652 43.8098 18.7652C42.8126 18.7675 42.0342 18.5747 41.4697 18.1937ZM44.6353 16.2323C44.7905 15.8231 44.8705 15.1575 44.8705 14.2309V10.3292C44.8705 9.43077 44.7929 8.77225 44.6353 8.35833C44.4777 7.94206 44.2026 7.7351 43.8074 7.7351C43.4265 7.7351 43.156 7.94206 43.0008 8.35833C42.8432 8.77461 42.7656 9.43077 42.7656 10.3292V14.2309C42.7656 15.1575 42.8408 15.8254 42.9914 16.2323C43.1419 16.6415 43.4123 16.8461 43.8074 16.8461C44.2026 16.8461 44.4777 16.6415 44.6353 16.2323Z" class="style-scope yt-icon"></path><path d="M56.8154 18.5634H54.6094L54.3648 17.03H54.3037C53.7039 18.1871 52.8055 18.7656 51.6061 18.7656C50.7759 18.7656 50.1621 18.4928 49.767 17.9496C49.3719 17.4039 49.1743 16.5526 49.1743 15.3955V6.03751H51.9942V15.2308C51.9942 15.7906 52.0553 16.188 52.1776 16.4256C52.2999 16.6631 52.5045 16.783 52.7914 16.783C53.036 16.783 53.2712 16.7078 53.497 16.5573C53.7228 16.4067 53.8874 16.2162 53.9979 15.9858V6.03516H56.8154V18.5634Z" class="style-scope yt-icon"></path><path d="M64.4755 3.68758H61.6768V18.5629H58.9181V3.68758H56.1194V1.42041H64.4755V3.68758Z" class="style-scope yt-icon"></path><path d="M71.2768 18.5634H69.0708L68.8262 17.03H68.7651C68.1654 18.1871 67.267 18.7656 66.0675 18.7656C65.2373 18.7656 64.6235 18.4928 64.2284 17.9496C63.8333 17.4039 63.6357 16.5526 63.6357 15.3955V6.03751H66.4556V15.2308C66.4556 15.7906 66.5167 16.188 66.639 16.4256C66.7613 16.6631 66.9659 16.783 67.2529 16.783C67.4974 16.783 67.7326 16.7078 67.9584 16.5573C68.1842 16.4067 68.3488 16.2162 68.4593 15.9858V6.03516H71.2768V18.5634Z" class="style-scope yt-icon"></path><path d="M80.609 8.0387C80.4373 7.24849 80.1621 6.67699 79.7812 6.32186C79.4002 5.96674 78.8757 5.79035 78.2078 5.79035C77.6904 5.79035 77.2059 5.93616 76.7567 6.23014C76.3075 6.52412 75.9594 6.90747 75.7148 7.38489H75.6937V0.785645H72.9773V18.5608H75.3056L75.5925 17.3755H75.6537C75.8724 17.7988 76.1993 18.1304 76.6344 18.3774C77.0695 18.622 77.554 18.7443 78.0855 18.7443C79.038 18.7443 79.7412 18.3045 80.1904 17.4272C80.6396 16.5476 80.8653 15.1765 80.8653 13.3092V11.3266C80.8653 9.92722 80.7783 8.82892 80.609 8.0387ZM78.0243 13.1492C78.0243 14.0617 77.9867 14.7767 77.9114 15.2941C77.8362 15.8115 77.7115 16.1808 77.5328 16.3971C77.3564 16.6158 77.1165 16.724 76.8178 16.724C76.585 16.724 76.371 16.6699 76.1734 16.5594C75.9759 16.4512 75.816 16.2866 75.6937 16.0702V8.96062C75.7877 8.6196 75.9524 8.34209 76.1852 8.12337C76.4157 7.90465 76.6697 7.79646 76.9401 7.79646C77.2271 7.79646 77.4481 7.90935 77.6034 8.13278C77.7609 8.35855 77.8691 8.73485 77.9303 9.26636C77.9914 9.79787 78.022 10.5528 78.022 11.5335V13.1492H78.0243Z" class="style-scope yt-icon"></path><path d="M84.8657 13.8712C84.8657 14.6755 84.8892 15.2776 84.9363 15.6798C84.9833 16.0819 85.0821 16.3736 85.2326 16.5594C85.3831 16.7428 85.6136 16.8345 85.9264 16.8345C86.3474 16.8345 86.639 16.6699 86.7942 16.343C86.9518 16.0161 87.0365 15.4705 87.0506 14.7085L89.4824 14.8519C89.4965 14.9601 89.5035 15.1106 89.5035 15.3011C89.5035 16.4582 89.186 17.3237 88.5534 17.8952C87.9208 18.4667 87.0247 18.7536 85.8676 18.7536C84.4777 18.7536 83.504 18.3185 82.9466 17.446C82.3869 16.5735 82.1094 15.2259 82.1094 13.4008V11.2136C82.1094 9.33452 82.3987 7.96105 82.9772 7.09558C83.5558 6.2301 84.5459 5.79736 85.9499 5.79736C86.9165 5.79736 87.6597 5.97375 88.1771 6.32888C88.6945 6.684 89.059 7.23433 89.2707 7.98457C89.4824 8.7348 89.5882 9.76961 89.5882 11.0913V13.2362H84.8657V13.8712ZM85.2232 7.96811C85.0797 8.14449 84.9857 8.43377 84.9363 8.83593C84.8892 9.2381 84.8657 9.84722 84.8657 10.6657V11.5641H86.9283V10.6657C86.9283 9.86133 86.9001 9.25221 86.846 8.83593C86.7919 8.41966 86.6931 8.12803 86.5496 7.95635C86.4062 7.78702 86.1851 7.7 85.8864 7.7C85.5854 7.70235 85.3643 7.79172 85.2232 7.96811Z" class="style-scope yt-icon"></path></g></g></g></svg>
      </div>
      <div class="search-group">
        <input class="search-input" placeholder="Search" autofocus />
        <button class="search-btn">
          <div class="search-icon-container">
            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M20.87,20.17l-5.59-5.59C16.35,13.35,17,11.75,17,10c0-3.87-3.13-7-7-7s-7,3.13-7,7s3.13,7,7,7c1.75,0,3.35-0.65,4.58-1.71 l5.59,5.59L20.87,20.17z M10,16c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6S13.31,16,10,16z" class="style-scope yt-icon"></path></g></svg>
          </div>
        </button>
      </div>
    </div>
    `;
    
    // Apply the appropriate theme
    if (isDarkTheme) {
      document.documentElement.setAttribute('dark', '');
      // For dark theme, get all logo text elements and make them white
      const logoTextElements = document.querySelectorAll('.logo-text path');
      logoTextElements.forEach(path => {
        path.setAttribute('fill', '#FFFFFF');
      });
    } else {
      document.documentElement.removeAttribute('dark');
    }
    
    // Copy YouTube's color variables from the original page to our minimal page
    // This ensures that we use the exact same colors as YouTube
    if (document.querySelector('ytd-app')) {
      const ytdAppStyles = getComputedStyle(document.querySelector('ytd-app'));
      const importantColors = [
        '--yt-spec-general-background-a',
        '--yt-spec-general-background-b',
        '--yt-spec-text-primary',
        '--yt-spec-text-secondary',
        '--yt-spec-10-percent-layer',
        '--yt-spec-touch-response',
        '--yt-spec-icon-inactive'
      ];
      
      let styleElement = document.createElement('style');
      let cssRules = ':root {';
      
      importantColors.forEach(colorVar => {
        const colorValue = ytdAppStyles.getPropertyValue(colorVar);
        if (colorValue) {
          cssRules += `${colorVar}: ${colorValue};`;
        }
      });
      
      cssRules += '}';
      styleElement.textContent = cssRules;
      document.head.appendChild(styleElement);
    }
    
    // Add event listeners for the search functionality
    setTimeout(() => {
      const searchInput = document.querySelector('.search-input');
      const searchBtn = document.querySelector('.search-btn');
      
      if (searchInput && searchBtn) {
        // Function to handle search navigation
        const performSearch = (e) => {
          if (e) e.preventDefault();
          
          const query = searchInput.value.trim();
          if (query) {
            // Create a link and use it to navigate without triggering form-based focus behaviors
            const a = document.createElement('a');
            a.href = `/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
            a.setAttribute('data-navigation', 'manual');
            
            // Add a flag to suppress focus-setting code
            window.minimalYTNoAutoFocus = true;
            // Store the flag in session storage in case the page loads fresh
            sessionStorage.setItem('minimalYT_noAutoFocus', 'true');
            
            // Add a specific class to identify our navigation
            a.className = 'minimal-yt-nav';
            
            // Append, click, and remove to avoid leaving elements in the DOM
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          return false;
        };
        
        // Handle Enter key on search input
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            performSearch();
          }
        });
        
        // Handle search button click
        searchBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          performSearch();
        });
      }
    }, 100);
  }
}

/* - Remove the notifier in the page title - C3 */
function removeUnreadCountFromTitle() {
  const title = document.title;
  // Check if title has unread count
  if (title.match(/^\(\d+\)\s*/) === null) {
    return;
  }
  // Remove unread count from title
  const newTitle = title.replace(/^\(\d+\)\s*/, "");
  document.title = newTitle;
}

// Set up title observer to watch for changes
function setupTitleObserver() {
  // Create a MutationObserver to monitor the title for changes
  let titleObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.tagName === "TITLE") {
        removeUnreadCountFromTitle();
      }
    });
  });

  // Observe the head for title changes
  let headElement = document.querySelector("head");
  if (headElement) {
    titleObserver.observe(headElement, {
      childList: true,
      subtree: true
    });
  }
  
  // Also check the title immediately
  removeUnreadCountFromTitle();
}

// Execute all the functions here
function execute(){
  if(document.readyState === "complete"){
    // Remove the flash of unstyled content style
    window.revealPage();
    
    // Replace homepage if we're on the YouTube homepage
    replaceHomePage();
    
    // Set up title observer
    setupTitleObserver();
    
    activateTheaterMode();
    interceptTheaterModeKeypress();
    
    // hide live chat if present
    if(document.getElementById("chat") !== null){
      hideLiveChat();
    }
    
    replaceSubscriptionManager();
    
    // If we're on video page, create observer to activate theatre mode
    if(window.location.pathname === "/watch") {
      let video_page = document.getElementsByClassName("html5-video-container")[0];
      if(video_page){
        let observer = new MutationObserver(function(mutations) {
          activateTheaterMode();
          deactivateAutoplay();
        });
        observer.observe(video_page, { childList: true });
      }
    }

  } else {
    setTimeout(execute, 500);
  }
}

execute();

var observer = new MutationObserver(
	function(mutationList){
		observed = mutationList[0].target.attributes["aria-valuenow"];
		if(observed.nodeValue == "100"){execute()}
	});

var domInterval = setInterval(function(){
  var targetNode = document.querySelector("yt-page-navigation-progress");
  if(targetNode){
    observer.observe(targetNode, {childList:true, attributes:true, characterData:true, subtree:false, attributeFilter:["aria-valuenow"]});
		clearInterval(domInterval);
  }
}, 500);

setTimeout(execute, 500);

window.addEventListener("load", execute);

// Simple Reddit sidebar controller - Set collapsed state once

// Function to close the sidebar and handle preferences page
function setupLayout() {
  // Add CSS to handle layout permanently - only include what's needed in JS
  const style = document.createElement('style');
  style.textContent = `
    /* Hide by specific content settings components */
    settings-preferences-nsfw-modal,
    [data-testid="is-nsfw-shown"],
    [data-testid="safe-browsing-mode"],
    [data-testid="enable-feed-recommendation"],
    [data-testid="muted-communities"] {
      display: none !important;
    }
    
    /* Specifically target reddit.com/preferences page content */
    label[for="nsfw_content"],
    #nsfw_content,
    .content-settings-group,
    div.content-settings {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // Set the expanded attribute to 0 once for good measure
  const sidebarContainer = document.getElementById('left-sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.setAttribute('expanded', '0');
  }
  
  // Special handling for reddit.com/preferences page
  if (window.location.pathname.includes('/preferences')) {
    // Use JavaScript to find and remove elements on preferences page
    const observer = new MutationObserver(() => {
      // Look for content section by heading text
      document.querySelectorAll('h2').forEach(heading => {
        if (heading.textContent.includes('Content')) {
          // Found the Content section, hide its container
          let container = heading.parentElement;
          if (container) {
            container.style.display = 'none';
          }
        }
      });
      
      // Look for elements by testid or other attributes
      const elementsToHide = document.querySelectorAll(`
        [data-testid="is-nsfw-shown"],
        [data-testid="safe-browsing-mode"],
        [data-testid="enable-feed-recommendation"],
        input[name*="nsfw"],
        input[id*="nsfw"],
        label[for*="nsfw"]
      `);
      
      elementsToHide.forEach(el => {
        // Hide the element
        el.style.display = 'none';
        // Also try to hide parent container
        if (el.parentElement) {
          el.parentElement.style.display = 'none';
          if (el.parentElement.parentElement) {
            el.parentElement.parentElement.style.display = 'none';
          }
        }
      });
      
      // Manually find and hide content sections
      const contentSections = [];
      document.querySelectorAll('h2, .text-18.font-bold').forEach(heading => {
        if (heading.textContent.includes('Content')) {
          contentSections.push(heading);
          
          // Also add parent elements
          let parent = heading.parentElement;
          if (parent) {
            contentSections.push(parent);
            // Also try siblings
            let nextSibling = heading.nextElementSibling;
            while (nextSibling) {
              contentSections.push(nextSibling);
              nextSibling = nextSibling.nextElementSibling;
            }
          }
        }
      });
      
      // Hide all found elements
      contentSections.forEach(el => {
        el.style.display = 'none';
      });
    });
    
    // Run once immediately and then watch for DOM changes
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function replaceRedditHomePage() {
  if (window.location.pathname === "/") {
    // Minimal styling
    document.head.insertAdjacentHTML('beforeend', `
      <style>
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
        .reddit-icon {
          width: 40px;
          height: 40px;
        }
        .reddit-text {
          height: 28px;
          margin-left: 8px;
        }
        .search-wrapper {
          position: relative;
          width: 400px;
        }
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

    // Replace the body with a minimal homepage
    document.body.innerHTML = `
      <div class="reddit-home-container">
        <a class="logo-link" href="/" aria-label="Home">
          <!-- Reddit icon (Snoo) -->
          <span class="reddit-icon">
            <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 216" xml:space="preserve" xmlns:xlink="http://www.w3.org/1999/xlink">
              <defs>
                <style>
                  .snoo-cls-1 { fill: url(#snoo-radial-gragient) white; }
                  .snoo-cls-1, .snoo-cls-2, .snoo-cls-3, .snoo-cls-4, .snoo-cls-5, 
                  .snoo-cls-6, .snoo-cls-7, .snoo-cls-8, .snoo-cls-9, .snoo-cls-10, 
                  .snoo-cls-11 { stroke-width: 0px; }
                  .snoo-cls-2 { fill: url(#snoo-radial-gragient-2) white; }
                  .snoo-cls-3 { fill: url(#snoo-radial-gragient-3) white; }
                  .snoo-cls-4 { fill: url(#snoo-radial-gragient-4) #fc4301; }
                  .snoo-cls-5 { fill: url(#snoo-radial-gragient-6) black; }
                  .snoo-cls-6 { fill: url(#snoo-radial-gragient-8) black; }
                  .snoo-cls-7 { fill: url(#snoo-radial-gragient-5) #fc4301; }
                  .snoo-cls-8 { fill: url(#snoo-radial-gragient-7) white; }
                  .snoo-cls-9 { fill: #842123; }
                  .snoo-cls-10 { fill: #ff4500; }
                  .snoo-cls-11 { fill: #ffc49c; }
                </style>
                <radialGradient id="snoo-radial-gragient" cx="169.75" cy="92.19" fx="169.75" fy="92.19" r="50.98" gradientTransform="translate(0 11.64) scale(1 .87)" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#feffff"/>
                  <stop offset=".4" stop-color="#feffff"/>
                  <stop offset=".51" stop-color="#f9fcfc"/>
                  <stop offset=".62" stop-color="#edf3f5"/>
                  <stop offset=".7" stop-color="#dee9ec"/>
                  <stop offset=".72" stop-color="#d8e4e8"/>
                  <stop offset=".76" stop-color="#ccd8df"/>
                  <stop offset=".8" stop-color="#c8d5dd"/>
                  <stop offset=".83" stop-color="#ccd6de"/>
                  <stop offset=".85" stop-color="#d8dbe2"/>
                  <stop offset=".88" stop-color="#ede3e9"/>
                  <stop offset=".9" stop-color="#ffebef"/>
                </radialGradient>
                <radialGradient id="snoo-radial-gragient-2" cx="47.31" fx="47.31" r="50.98" xlink:href="#snoo-radial-gragient"/>
                <radialGradient id="snoo-radial-gragient-3" cx="109.61" cy="85.59" fx="109.61" fy="85.59" r="153.78" gradientTransform="translate(0 25.56) scale(1 .7)" xlink:href="#snoo-radial-gragient"/>
                <radialGradient id="snoo-radial-gragient-4" cx="-6.01" cy="64.68" fx="-6.01" fy="64.68" r="12.85" gradientTransform="translate(81.08 27.26) scale(1.07 1.55)" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#f60"/>
                  <stop offset=".5" stop-color="#ff4500"/>
                  <stop offset=".7" stop-color="#fc4301"/>
                  <stop offset=".82" stop-color="#f43f07"/>
                  <stop offset=".92" stop-color="#e53812"/>
                  <stop offset="1" stop-color="#d4301f"/>
                </radialGradient>
                <radialGradient id="snoo-radial-gragient-5" cx="-73.55" cy="64.68" fx="-73.55" fy="64.68" r="12.85" gradientTransform="translate(62.87 27.26) rotate(-180) scale(1.07 -1.55)" xlink:href="#snoo-radial-gragient-4"/>
                <radialGradient id="snoo-radial-gragient-6" cx="107.93" cy="166.96" fx="107.93" fy="166.96" r="45.3" gradientTransform="translate(0 57.4) scale(1 .66)" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#172e35"/>
                  <stop offset=".29" stop-color="#0e1c21"/>
                  <stop offset=".73" stop-color="#030708"/>
                  <stop offset="1" stop-color="#000"/>
                </radialGradient>
                <radialGradient id="snoo-radial-gragient-7" cx="147.88" cy="32.94" fx="147.88" fy="32.94" r="39.77" gradientTransform="translate(0 .54) scale(1 .98)" xlink:href="#snoo-radial-gragient"/>
                <radialGradient id="snoo-radial-gragient-8" cx="131.31" cy="73.08" fx="131.31" fy="73.08" r="32.6" gradientUnits="userSpaceOnUse">
                  <stop offset=".48" stop-color="#7a9299"/>
                  <stop offset=".67" stop-color="#172e35"/>
                  <stop offset=".75" stop-color="#000"/>
                  <stop offset=".82" stop-color="#172e35"/>
                </radialGradient>
              </defs>
              <path class="snoo-cls-10" d="M108,0C48.35,0,0,48.35,0,108c0,29.82,12.09,56.82,31.63,76.37l-20.57,20.57
                c-4.08,4.08-1.19,11.06,4.58,11.06h92.36c59.65,0,108-48.35,108-108C216,48.35,167.65,0,108,0Z"/>
              <circle class="snoo-cls-1" cx="169.22" cy="106.98" r="25.22"/>
              <circle class="snoo-cls-2" cx="46.78" cy="106.98" r="25.22"/>
              <ellipse class="snoo-cls-3" cx="108.06" cy="128.64" rx="72" ry="54"/>
              <path class="snoo-cls-4" d="M86.78,123.48c-.42,9.08-6.49,12.38-13.56,12.38s-12.46-4.93-12.04-14.01
                c.42-9.08,6.49-15.02,13.56-15.02s12.46,7.58,12.04,16.66Z"/>
              <path class="snoo-cls-7" d="M129.35,123.48c.42,9.08,6.49,12.38,13.56,12.38s12.46-4.93,12.04-14.01
                c-.42-9.08-6.49-15.02-13.56-15.02s-12.46,7.58-12.04,16.66Z"/>
              <ellipse class="snoo-cls-11" cx="79.63" cy="116.37" rx="2.8" ry="3.05"/>
              <ellipse class="snoo-cls-11" cx="146.21" cy="116.37" rx="2.8" ry="3.05"/>
              <path class="snoo-cls-5" d="M108.06,142.92c-8.76,0-17.16.43-24.92,1.22c-1.33.13-2.17,1.51-1.65,2.74
                c4.35,10.39,14.61,17.69,26.57,17.69s22.23-7.3,26.57-17.69c.52-1.23-.33-2.61-1.65-2.74C125.22,143.35,116.82,142.92,108.06,142.92
                Z"/>
              <circle class="snoo-cls-8" cx="147.49" cy="49.43" r="17.87"/>
              <path class="snoo-cls-6" d="M107.8,76.92c-2.14,0-3.87-.89-3.87-2.27c0-16.01,13.03-29.04,29.04-29.04
                c2.14,0,3.87,1.73,3.87,3.87s-1.73,3.87-3.87,3.87c-11.74,0-21.29,9.55-21.29,21.29c0,1.38-1.73,2.27-3.87,2.27Z"/>
              <path class="snoo-cls-9" d="M62.82,122.65c.39-8.56,6.08-14.16,12.69-14.16c6.26,0,11.1,6.39,11.28,14.33
                c.17-8.88-5.13-15.99-12.05-15.99s-13.14,6.05-13.56,15.2c-.42,9.15,4.97,13.83,12.04,13.83c.17,0,.35,0,.52,0
                c-6.44-.16-11.3-4.79-10.91-13.2Z"/>
              <path class="snoo-cls-9" d="M153.3,122.65c-.39-8.56-6.08-14.16-12.69-14.16c-6.26,0-11.1,6.39-11.28,14.33
                c-.17-8.88,5.13-15.99,12.05-15.99c7.07,0,13.14,6.05,13.56,15.2c.42,9.15-4.97,13.83-12.04,13.83c-.17,0-.35,0-.52,0
                c6.44-.16,11.3-4.79,10.91-13.2Z"/>
            </svg>
          </span>

          <!-- Reddit text (wordmark) -->
          <span class="reddit-text">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 514 149" style="color: currentColor;">
              <g style="fill: currentColor">
                <path d="M71.62,45.92l-12.01,28.56c-1.51-.76-5.11-1.61-8.51-1.61s-6.81.85-10.12,2.46
                  c-6.53,3.31-11.35,9.93-11.35,19.48v52.3H-.26V45.35h29.04v14.28h.57c6.81-9.08,17.21-15.79,30.74-15.79
                  c4.92,0,9.65.95,11.54,2.08Z"/>
                <path d="M65.84,96.52c0-29.41,20.15-52.68,50.32-52.68c27.33,0,46.91,19.96,46.91,48.05
                  c0,4.92-.47,9.55-1.51,14h-68.48c3.12,10.69,12.39,19.01,26.29,19.01c7.66,0,18.54-2.74,24.4-7.28l9.27,22.32
                  c-8.61,5.86-21.75,8.7-33.29,8.7c-32.25,0-53.91-20.81-53.91-52.11Zm26.67-9.36h43.03c0-13.05-8.89-19.96-19.77-19.96
                  c-12.3,0-20.62,7.94-23.27,19.96Z"/>
                <path d="M419.53-.37c10.03,0,18.25,8.23,18.25,18.25s-8.23,18.25-18.25,18.25s-18.25-8.23-18.25-18.25
                  S409.51-.37,419.53-.37Zm14.94,147.49h-29.89V45.35h29.89v101.77Z"/>
                <path d="M246,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3
                  s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.42,121.39h-.99l-6.67-6.93
                  c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
                <path d="M360.15,1.47l-.09,53.53h-.57c-8.23-7.85-17.12-11.07-28.75-11.07c-28.66,0-47.67,23.08-47.67,52.3
                  s17.78,52.4,46.72,52.4c12.11,0,23.55-4.16,30.93-13.62h.85v12.11h28.47V1.47h-29.89Zm1.28,121.39h-.99l-6.67-6.93
                  c-4.34,4.33-10.28,6.93-17.22,6.93c-14.64,0-24.88-11.58-24.88-26.6s10.24-26.6,24.88-26.6s24.88,11.58,24.88,26.6v26.6Z"/>
                <path d="M492.44,45.35h21.85v25.44h-21.85v76.33h-29.89v-76.33h-21.75v-25.44h21.75v-27.66h29.89v27.66Z"/>
              </g>
            </svg>
          </span>
        </a>
        
        <!-- Search bar -->
        <div class="search-wrapper">
          <input class="search-input" type="text" placeholder="Search Reddit..." autofocus />
          <svg class="search-icon" viewBox="0 0 24 24">
            <path d="M20.87,20.17l-5.59-5.59C16.35,13.35,17,11.75,17,10
                     c0-3.87-3.13-7-7-7s-7,3.13-7,7s3.13,7,7,7c1.75,0,3.35-0.65,4.58-1.71
                     l5.59,5.59L20.87,20.17z M10,16c-3.31,0-6-2.69-6-6s2.69-6,6-6
                     s6,2.69,6,6S13.31,16,10,16z"/>
          </svg>
        </div>
      </div>
    `;

    // Attach a simple search handler
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
}

// Run once when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLayout);
} else {
  setupLayout();
  replaceRedditHomePage();
}
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

// Run once when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLayout);
} else {
  setupLayout();
}
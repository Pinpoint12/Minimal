/* - Remove the notifier in the page title - C3 */
function removeNotificationsFromTitle(){
    const reg = /(\(\d\) )/g;
    let originalPageTitle = document.title;
    let newPageTitle = originalPageTitle.replace(reg, "");
    document.title = newPageTitle;
}
let titleInterval = setInterval(removeNotificationsFromTitle, 200); /* 200ms was arbitrary chosen */

/* - Replace the "red bubble" notification twitter favicon with the standard one - C3 */
function keepStandardFavicon(){
    const faviconLinkTag = document.querySelector("link[rel='shortcut icon']");
    if (!faviconLinkTag) return; /* Guard against null reference */
    const currentFavicon = faviconLinkTag.getAttribute("href");
    if (!currentFavicon) return;
    let standardFavicon = currentFavicon.replace("twitter-pip.ico", "twitter.ico").replace("twitter-pip.2.ico", "twitter.2.ico"); /* replace the red bubble favicon with the standard favicon */
    faviconLinkTag.setAttribute("href", standardFavicon);
}

let faviconInterval = setInterval(keepStandardFavicon, 200); /* 200ms was arbitrary chosen */

/* Clean up intervals when page unloads to prevent memory leaks */
window.addEventListener('unload', () => {
    clearInterval(titleInterval);
    clearInterval(faviconInterval);
});

/* - Link the messaging icon in the navbar to the message page. - U2 */
let messageIconTrigger = false;

function linkMessagingIcon(){
	let button = document.querySelector("div[aria-label='Messenger'][role='button'][tabindex='0']");
	if(button){
		if(messageIconTrigger === false){
			messageIconTrigger = true;
			button.addEventListener("click", function(){window.location = "https://www.facebook.com/messages/"});
		}
	}
	else{
		messageIconTrigger = false;
	}
}

/* Use MutationObserver instead of deprecated DOMNodeRemoved event */
const messengerObserver = new MutationObserver(linkMessagingIcon);
messengerObserver.observe(document.body, { childList: true, subtree: true });

/* Clean up observer on page unload */
window.addEventListener('unload', () => {
	messengerObserver.disconnect();
});

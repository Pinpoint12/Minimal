if (typeof browser === 'undefined') {
	browser = chrome
}

let enable_button = document.getElementById("enable");
let background = browser.extension.getBackgroundPage();

let tabName = background.tabs[background.current_tab_id].tabName // todo if tab object doesn't exist

browser.storage.sync.get(tabName, function(storage) {
	let minimalState = storage[tabName] || "enabled"; //todo default state
	
	if(minimalState == "enabled") {
		enable_button.checked = true
	} else {
		enable_button.checked = false
	}
});

enable_button.addEventListener("change", function(e){
	
	if(this.checked){
	
		let keys = {}
		keys[tabName] = "enabled"
		browser.storage.sync.set(keys)
	
		background.enable(tabName);
	}
	else {
	
		let keys = {}
		keys[tabName] = "disabled"
		browser.storage.sync.set(keys)
		
		background.disable(tabName);
	}
});

// i18n
var to_i18n = document.querySelectorAll('*[data-i18n]');

for(let i = 0; i < to_i18n.length; ++i) {
	to_i18n[i].textContent = browser.i18n.getMessage(to_i18n[i].dataset.i18n);
}

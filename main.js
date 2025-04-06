let resources = [
	{"name": "youtube", "url": "https*:\/\/(www\.)?youtube\.(com)\/.*", "style": "youtube.css", "script": "youtube.js"},
	{"name": "facebook", "url": "https*:\/\/(www\.)?facebook\.(com)\/.*", "style": "facebook.css", "script": "facebook.js"},
	{"name": "twitter", "url": "https*:\/\/(www\.)?twitter\.(com)\/.*", "style": "twitter.css", "script": "twitter.js"},
	{"name": "google", "url": "https*:\/\/(www\.)?google\.(com|ac|ad|ae|com\.af|com\.ag|com\.ai|al|am|co\.ao|com\.ar|as|at|com\.au|az|ba|com\.bd|be|bf|bg|com\.bh|bi|bj|com\.bn|com\.bo|com\.br|bs|bt|co\.bw|by|com\.bz|ca|com\.kh|cc|cd|cf|cat|cg|ch|ci|co\.ck|cl|cm|cn|com\.co|co\.cr|com\.cu|cv|com\.cy|cz|de|dj|dk|dm|com\.do|dz|com\.ec|ee|com\.eg|es|com\.et|fi|com\.fj|fm|fr|ga|ge|gf|gg|com\.gh|com\.gi|gl|gm|gp|gr|com\.gt|gy|com\.hk|hn|hr|ht|hu|co\.id|iq|ie|co\.il|im|co\.in|io|is|it|je|com\.jm|jo|co\.jp|co\.ke|ki|kg|co\.kr|com\.kw|kz|la|com\.lb|com\.lc|li|lk|co\.ls|lt|lu|lv|com\.ly|co\.ma|md|me|mg|mk|ml|com\.mm|mn|ms|com\.mt|mu|mv|mw|com\.mx|com\.my|co\.mz|com\.na|ne|com\.nf|com\.ng|com\.ni|nl|no|com\.np|nr|nu|co\.nz|com\.om|com\.pk|com\.pa|com\.pe|com\.ph|pl|com\.pg|pn|com\.pr|ps|pt|com\.py|com\.qa|ro|rs|ru|rw|com\.sa|com\.sb|sc|se|com\.sg|sh|si|sk|com\.sl|sn|sm|so|st|sr|com\.sv|td|tg|co\.th|com\.tj|tk|tl|tm|to|tn|com\.tr|tt|com\.tw|co\.tz|com\.ua|co\.ug|co\.uk|com\.uy|co\.uz|com\.vc|co\.ve|vg|co\.vi|com\.vn|vu|ws|co\.za|co\.zm|co\.zw)\/.*", "style": "google.css", "script": "google.js"},
	{"name": "amazon", "url": "https*:\/\/(www\.)?amazon\.(cn|in|co\.jp|com\.sg|com\.tr|fr|de|it|nl|es|co\.uk|ca|com\.mx|com|com\.au|com\.br|com\.be)\/.*", "style": "amazon.css", "script": "amazon.js"},
	{"name": "yahoo", "url": "https*:\/\/([^\W_]([a-zA-Z0-9\-]{0,61}[^\W_])?\.)*yahoo\.(com)\/.*", "style": "yahoo.css", "script": "yahoo.js"},
	{"name": "netflix", "url": "https*:\/\/(www\.)?netflix\.(com)\/.*", "style": "netflix.css", "script": "netflix.js"},
	{"name": "reddit", "url": "https*:\/\/(www\.)?reddit\.(com)\/.*", "style": "reddit.css", "script": "reddit.js"},
]

tabs = {}

if (typeof browser === 'undefined') {
	browser = chrome
}

function enable(tabName) {
	for(const [tabId, tabInfo] of Object.entries(tabs)) {
		if(tabInfo.tabName == tabName){
			if(!("enable" in tabInfo) || !tabInfo.enable){
				tabInfo["enable"] = true
				let executing = browser.tabs.executeScript(
					tabInfo.tabId,
					{
						file: tabInfo.js,
						allFrames: true
					}
				)
				let inserting = browser.tabs.insertCSS(
					tabInfo.tabId,
					{
						file: tabInfo.css
					}
				)
			}
			console.log(tabInfo)
			
			browser.pageAction.setIcon({"path": "./icons/pageAction_on.png", "tabId": parseInt(tabId)});
		}
	}
}
function disable(tabName) {
	for(const [tabId, tabInfo] of Object.entries(tabs)) {
		if(tabInfo.tabName == tabName){
			console.log(tabInfo)
			
			tabInfo.enable = false
			browser.tabs.reload(tabInfo.tabId)
			
			browser.pageAction.setIcon({"path": "./icons/pageAction.png", "tabId": parseInt(tabId)});
		}
	}
}

var current_tab_id = 0;

function logTab(tabId, changeInfo, tab) {

	console.log(tabId)
	console.log(changeInfo)
	console.log(tab)
	
	if(tab.status == "complete" && "url" in tab){
		for(let info of resources) {
			if(tab.url.indexOf(info.name) !== -1 && RegExp(info.url).test(tab.url)){
				
				console.log("TRYING TO INIT")
				
				let keys = {}
				keys[info.name] = "enabled" // Todo default value

				browser.storage.sync.get(keys, function(storage) {
					console.log(storage)
					let minimalState = storage[info.name] || "enabled"; // Todo default value
					
					browser.pageAction.show(tabId)
					
					tabs[tabId] = {
						"tabId": tabId,
						"tabName": info.name,
						"enable": false,
						"js": "/scripts/" + info.script,
						"css": "/styles/" + info.style
					}
					
					if(minimalState == "enabled") {
						enable(info.name)
					}
				});
				
				break
			}
		}
	}
}

browser.tabs.onUpdated.addListener(logTab)

function handleActivated(activeInfo) {
	current_tab_id = activeInfo.tabId;
}

browser.tabs.onActivated.addListener(handleActivated);


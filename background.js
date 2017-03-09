chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        console.log("This is a first install!");

		generateUniqueID();

		chrome.runtime.openOptionsPage();
    }else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});
chrome.storage.onChanged.addListener(function(changes, areaName) {
	console.log("Detected storage change, reloading extension");

	//We can't update the alarm with changes, so we need to clear and re-setup.
	chrome.alarms.clearAll(function(wasCleared) {
		init();
	});
});

init();
function init() {
	chrome.storage.sync.get({
		interval: 60
	}, function (options) {
		chrome.alarms.create('mainAlarm', {
			when: 1, //Start alarm right away
			periodInMinutes: parseInt(options.interval) //every 30minutes
		});
		chrome.alarms.onAlarm.addListener(function (alarm) {
			saveTabs();
		});
	});
}

function saveTabs() {
	var tabObj = {};
	chrome.tabs.query({}, function(tabs) {
		tabs.forEach(function(tab) {
			tabObj[tab.windowId] = tabObj[tab.windowId] || {};

			tabObj[tab.windowId][tab.title] = tab.url;
		});


		chrome.storage.sync.get({
			encryption      : 'text',
			human_timestamp : false
		}, function (options) {
			let jsonData = JSON.stringify(tabObj, null, '\t'),
			    args = {
				//FIXME: This filename should be PC specific
				'path': '/'+getTimestamp(options.human_timestamp)+'.{ENCRYPTION}.json',
				'mode': 'overwrite',
				'autorename': false,
				'mute': true
			};

			switch(options.encryption) {
				case 'text':
					args.path = args.path.replace('{ENCRYPTION}', 'text');
					break;

				case 'obfuscate':
					jsonData  = btoa(unescape(encodeURIComponent(jsonData)));
					args.path = args.path.replace('{ENCRYPTION}', 'base64');
					break;

				case 'encrypt':
					args.path = args.path.replace('{ENCRYPTION}', 'encrypt');
					break;
			}

			$.ajax({
				url: 'https://content.dropboxapi.com/2/files/upload',
				type: 'POST',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + '#');
					xhr.setRequestHeader('Content-Type', 'application/octet-stream');
					xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify(args));
				},
				data: jsonData,
				success: function( response ) {
					console.log('Data saved to Dropbox!');
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					console.log(XMLHttpRequest.responseText);
				}
			});
		});
	});
}

function getTimestamp(humanReadable) {
	if(!humanReadable) {
		var timestamp = Date.now();
	} else {
		let now  = new Date(),
		    YYYY = now.getFullYear(),
		    DD   = now.getDate(),
		    MM   = now.getMonth()+1, //January is 0!
			hh   = now.getHours(),
		    mm   = now.getMinutes(),
		    ss   = now.getSeconds();

		if(DD<10) DD = '0'+DD;
		if(MM<10) MM = '0'+MM;
		if(hh<10) hh = '0'+hh;
		if(mm<10) mm = '0'+mm;
		if(ss<10) ss = '0'+ss;

		var timestamp = YYYY+'-'+MM+'-'+DD+'_'+hh+mm+ss;
	}

	return timestamp
}
//Mostly taken from: http://stackoverflow.com/a/23854032/1168377
function generateUniqueID() {
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }

	chrome.storage.local.set({
		unique_id : hex.substr(0, 6)
	}, function () {
		callback();
	});
}

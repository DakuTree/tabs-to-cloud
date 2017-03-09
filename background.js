"use strict";

chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        console.log("This is a first install!");

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

chrome.browserAction.onClicked.addListener(function() {
	saveTabs();
	//TODO: Show txt format?
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
			unix_timestamp : false
		}, function (options) {
			let jsonData = JSON.stringify(tabObj, null, '\t'),
			    args = {
				//FIXME: This filename should be PC specific
				'path': '/'+getTimestamp(options.unix_timestamp)+'.{ENCRYPTION}.json',
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

function getTimestamp(useTimestamp) {
	if(useTimestamp) {
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

		var timestamp = YYYY+'/'+MM+'/'+DD+'_'+hh+mm+ss;
	}

	return timestamp
}

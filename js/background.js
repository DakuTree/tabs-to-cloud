"use strict";

chrome.runtime.onInstalled.addListener(function(details){
	if(details.reason === "install"){
		console.log("This is a first install!");

		chrome.runtime.openOptionsPage();
	} else if(details.reason === "update") {
		let thisVersion = chrome.runtime.getManifest().version;

		//TODO: Handle version upgrades
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
	}
});
chrome.storage.onChanged.addListener(function(/*changes, areaName*/) {
	console.log("Detected storage change, reloading extension");

	//We can't update the alarm with changes, so we need to clear and re-setup.
	chrome.alarms.clearAll(function(/*wasCleared*/) {
		init();
	});
});

chrome.browserAction.onClicked.addListener(function() {
	saveTabs(function() {
		chrome.browserAction.setBadgeText({text: 'Saved!'});
		setTimeout(function () {
			chrome.browserAction.setBadgeText({text: ""});
		}, 3000);
	});

	//TODO: Show txt format?
});

init();
function init() {
	chrome.storage.local.get({
		interval      : 60,
		cloud_service : ''
	}, function (options) {
		if(options['cloud_service'] !== 'DropBox') return; //Only DropBox can automatically update.

		chrome.alarms.create('mainAlarm', {
			when: 1, //Start alarm right away
			periodInMinutes: parseInt(options.interval) //every 30minutes
		});
		chrome.alarms.onAlarm.addListener(function (/*alarm*/) {
			saveTabs();
		});
	});
}

function saveTabs(successCallback) {
	successCallback = successCallback || function(){};

	let tabObj = {};
	chrome.tabs.query({}, function(tabs) {
		tabs.forEach(function(tab) {
			tabObj[tab.windowId] = tabObj[tab.windowId] || {};

			tabObj[tab.windowId][tab.title] = tab.url;
		});


		chrome.storage.local.get({
			device_label       : 'Default',
			cloud_service      : '',
			encryption         : 'text',
			use_unix_timestamp : false
		}, function (options) {
			if(options['cloud_service'] === '') return; //Cloud service hasn't been set yet so just return
			let cloud_service = options['cloud_service'];

			let filename = options['device_label'] + '/' + getTimestamp(options['use_unix_timestamp'])+'.{ENCRYPTION}.json',
			    jsonData = JSON.stringify(tabObj, null, '\t');
			switch(options['encryption']) {
				case 'text':
					filename = filename.replace('{ENCRYPTION}', 'text');
					break;

				case 'obfuscate':
					filename = filename.replace('{ENCRYPTION}', 'base64');
					//FIXME: unescape is apparently deprecated but the alternative doesn't work the same?
					jsonData  = btoa(unescape(encodeURIComponent(jsonData)));
					break;

				case 'encrypt':
					filename = filename.replace('{ENCRYPTION}', 'encrypt');
					break;
			}

			cloudServices[cloud_service].upload(filename, jsonData, successCallback);
		});
	});
}

function getTimestamp(useTimestamp) {
	let timestamp = Date.now();
	if(!useTimestamp) {
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

		timestamp = YYYY+'/'+MM+'/'+DD+'/'+hh+mm+ss;
	}

	return timestamp
}

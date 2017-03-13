"use strict";

const oAuthProvider = "https://aemimmdlklmldbogfjajnkegdlngcggi.chromiumapp.org";
let cloudServices  = {};

const authDropbox = "https://www.dropbox.com/1/oauth2/authorize?client_id=jh7n0dgb996vizn&response_type=token&redirect_uri="+oAuthProvider;
cloudServices['DropBox'] = {
	authorize: function(successCallback) {
		chrome.identity.launchWebAuthFlow({
			'url'           : authDropbox,
			'interactive'   : true
		}, function(redirect_url){
			//URL returns oAuthProvider/#P&A&R&A&M&S
			let params = getParams(redirect_url.substr(oAuthProvider.length + 2));

			chrome.storage.sync.set({
				dropbox_token : params['access_token']
			}, function () {
				successCallback();
			});
		});
	},

	upload : function(filename, jsonData, successCallback) {
		chrome.storage.sync.get({
			dropbox_token: ''
		}, function (options) {
			if(options['dropbox_token'] === '') return; //Dropbox token hasn't been set yet so just return

			let args = {
				'path'       : '/'+filename,
				'mode'       : 'overwrite',
				'autorename' : false,
				'mute'       : true
			};

			$.ajax({
				url: 'https://content.dropboxapi.com/2/files/upload',
				type: 'POST',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + options['dropbox_token']);
					xhr.setRequestHeader('Content-Type', 'application/octet-stream');
					xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify(args));
				},
				data: jsonData,
				success: function(/*response*/) {
					console.log('Data saved to Dropbox!');
					successCallback();
				},
				error: function(XMLHttpRequest/*, textStatus, errorThrown*/) {
					/** @namespace XMLHttpRequest.responseText */
					console.log(XMLHttpRequest.responseText);
				}
			});
		});
	}
};

cloudServices['GoogleDrive'] = {
	authorize : function(successCallback) {},
	upload : function(filename, jsonData, successCallback) {}
};

cloudServices['OneDrive'] = {
	authorize : function(successCallback) {},
	upload : function(filename, jsonData, successCallback) {}
};


//http://stackoverflow.com/a/3855394/1168377
const getParams = query => {
	if (!query) {
		return { };
	}

	return (/^[?#]/.test(query) ? query.slice(1) : query)
		.split('&')
		.reduce((params, param) => {
			let [ key, value ] = param.split('=');
			params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
			return params;
		}, { });
};
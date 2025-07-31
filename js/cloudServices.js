"use strict";

const oAuthProvider = "https://aemimmdlklmldbogfjajnkegdlngcggi.chromiumapp.org";
let cloudServices = {};

const authDropbox = "https://www.dropbox.com/1/oauth2/authorize?client_id=jh7n0dgb996vizn&response_type=token&redirect_uri=" + oAuthProvider;
cloudServices['DropBox'] = {
	//Dropbox has a really simple authorization flow. Once you grab the token is <seemingly> lasts forever, so no hassle.
	authorize: function (successCallback) {
		chrome.identity.launchWebAuthFlow({
			'url': authDropbox,
			'interactive': true
		}, function (redirect_url) {
			console.log(redirect_url);
			//URL returns oAuthProvider/#P&A&R&A&M&S
			let params = getParams(redirect_url.substr(oAuthProvider.length + 2));

			if (params['access_token']) {
				chrome.storage.local.set({
					dropbox_token: params['access_token']
				}, function () {
					successCallback();
				});
			} else {
				//errorCallback();
			}
		});
	},

	upload: function (filename, jsonData, successCallback, saveAttempted) {
		saveAttempted = saveAttempted || false;

		chrome.storage.local.get({
			dropbox_token: ''
		}, function (options) {
			if (options['dropbox_token'] === '') return; //Dropbox token hasn't been set yet so just return

			let args = {
				'path': '/' + filename,
				'mode': 'overwrite',
				'autorename': false,
				'mute': true
			};

			fetch('https://content.dropboxapi.com/2/files/upload', {
				method: 'POST',
				headers: {
					'Authorization': 'Bearer ' + options.dropbox_token,
					'Content-Type': 'application/octet-stream',
					'Dropbox-API-Arg': JSON.stringify(args)
				},
				body: jsonData
			}).then(response => {
				if (!response.ok) {
					return response.text().then(text => {
						console.error('Error uploading to Dropbox:', text);
						throw new Error(text);
					});
				}
				console.log('Data saved to Dropbox!');
				successCallback();
			}).catch(error => {
				console.error('Fetch error:', error);
			});
		});
	}
};

cloudServices['GoogleDrive'] = {
	authorize: function (successCallback) { },
	upload: function (filename, jsonData, successCallback, saveAttempted) {
		saveAttempted = saveAttempted || false;
	}
};

const authOneDrive = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=626a1669-c13f-4558-8603-88b49c383147&scope=files.readwrite.appfolder offline_access&response_type=token&redirect_uri=" + oAuthProvider + "";
cloudServices['OneDrive'] = {
	//OneDrive has a really annoying authorization flow, probably due to having access to (possibly) more things.
	//We can't effectively do an automatic update with OneDrive (as far as I can tell) due it it requiring us to use the "Code flow" method, which we can't use since we can't make our client_secret public.
	//This means we need to do the "Token flow" method, which is very similar to DropBox, but expires after 1HR. This pretty much means we're limited to manual saves, and we need to re-auth nearly every time we upload.
	//More info: https://dev.onedrive.com/auth/msa_oauth.htm#token-flow
	authorize: function (successCallback) {
		chrome.identity.launchWebAuthFlow({
			'url': authOneDrive,
			'interactive': true
		}, function (redirect_url) {
			//URL returns oAuthProvider/#P&A&R&A&M&S
			let params = getParams(redirect_url.substr(oAuthProvider.length + 2));

			if (params['access_token']) {
				chrome.storage.local.set({
					onedrive_token: params['access_token']
				}, function () {
					successCallback();
				});
			} else {
				//errorCallback();
			}
		});
	},
	upload: function (filename, jsonData, successCallback, saveAttempted) {
		saveAttempted = saveAttempted || false;

		let _this = this;

		chrome.storage.local.get({
			onedrive_token: ''
		}, function (options) {
			if (options['onedrive_token'] === '') return; //OneDrive token hasn't been set yet so just return

			fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${filename}:/content`, {
				method: 'PUT',
				headers: {
					'Authorization': 'Bearer ' + options.onedrive_token,
					'Content-Type': 'application/octet-stream'
				},
				body: jsonData
			}).then(async response => {
				if (!response.ok) {
					// Read error text for debugging
					const text = await response.text();
					console.error('OneDrive upload error:', text);

					try {
						const jsonResponse = JSON.parse(text);
						const errorCode = jsonResponse?.error?.code;

						if (errorCode === 'InvalidAuthenticationToken' && saveAttempted === false) {
							// Retry logic for expired token
							_this.authorize(_this.upload(filename, jsonData, successCallback, true));
						}
					} catch (e) {
						console.error('Error response was not JSON:', text);
					}
					return;
				}

				// Success path
				console.log('Data saved to OneDrive!');
				successCallback();
			}).catch(error => {
				console.error('Fetch failed:', error);
			});
		});
	}
};


//http://stackoverflow.com/a/3855394/1168377
const getParams = query => {
	if (!query) {
		return {};
	}

	return (/^[?#]/.test(query) ? query.slice(1) : query)
		.split('&')
		.reduce((params, param) => {
			let [key, value] = param.split('=');
			params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
			return params;
		}, {});
};

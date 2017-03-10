"use strict";

function save_options() {
	let dropbox_token  = $('#dropbox-token').val(),
	    interval       = parseInt($('#interval').val()),
	    encryption     = $('#encryption').val(),
	    use_unix_timestamp = $("#use-unix-timestamp").is(':checked');

	//Just incase something goes horribly wrong, let's not break the users browser with infinite requests..
	if(interval < 30) interval = 60;

	chrome.storage.sync.set({
		dropbox_token  : dropbox_token,
		interval       : interval,
		encryption     : encryption,
		use_unix_timestamp : use_unix_timestamp
	}, function () {
		let status = $('#status');
		status.text('Options saved.');

		setTimeout(function () {
			status.text('');
		}, 3000);
	});
}

function restore_options() {
	/**
	 * @param {{dropbox_token:string}} options
	 */
	chrome.storage.sync.get({
		dropbox_token   : '',
		interval        : 60,
		encryption      : 'text',
		use_unix_timestamp  : false
	}, function (options) {

		$('#dropbox-token').val(options.dropbox_token);
		$('#interval').val(options.interval);
		$('#encryption').val(options.encryption);
		$('#use_unix-timestamp').prop('checked', options.use_unix_timestamp);
	});
}

$(document).on('DOMContentLoaded', restore_options);
$('#save').click(save_options);

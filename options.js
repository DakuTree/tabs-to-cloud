function save_options() {
	let interval        = parseInt($('#interval').val()),
	    encryption      = $('#encryption').val(),
	    human_timestamp = $("#human-timestamp").is(':checked');

	//Just incase something goes horribly wrong, let's not break the users browser with infinite requests..
	if(interval < 30) interval = 60;

	chrome.storage.sync.set({
		interval       : interval,
		encryption     : encryption,
		human_timestamp : human_timestamp
	}, function () {
		let status = $('#status');
		status.text('Options saved.');

		setTimeout(function () {
			status.text('');
		}, 3000);
	});
}

function restore_options() {
	chrome.storage.sync.get({
		dropbox_token  : '',
		interval       : 60,
		encryption     : 'text',
		human_timestamp : false
	}, function (options) {
		$('#dropbox-token').val(options.dropbox_token);
		$('#interval').val(options.interval);
		$('#encryption').val(options.encryption);
		$('#human-timestamp').prop('checked', options.human_timestamp);
	});
}

$(document).on('DOMContentLoaded', restore_options);
$('#save').click(save_options);

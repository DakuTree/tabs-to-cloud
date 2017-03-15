"use strict";

$(document).on('DOMContentLoaded', restore_options);
$('#save').click(save_options);

$(document).on("click", '#authorize', function(e) {
	e.preventDefault();

	chrome.storage.sync.get({
		cloud_service       : ''
	}, function (options) {
		if(options['cloud_service'] === '') { alert('Please select a Cloud Service first'); return;}
		let cloud_service = options['cloud_service'];

		cloudServices[cloud_service].authorize(function() {
			$('#authorize-container').text('Authorized');
		});
	});
});

$('input[name=cloud-service]:radio').change(function(){
	check_authorization($(this).val());
});

function save_options() {
	let cloud_service      = $('input[name=cloud-service]:checked').val(),
	    interval           = parseInt($('#interval').val()),
	    encryption         = $('#encryption').val(),
	    use_unix_timestamp = $("#use-unix-timestamp").is(':checked');

	//Just incase something goes horribly wrong, let's not break the users browser with infinite requests..
	if(interval < 30) interval = 60;

	chrome.storage.sync.set({
		cloud_service      : cloud_service,
		interval           : interval,
		encryption         : encryption,
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
	chrome.storage.sync.get({
		cloud_service       : '',

		interval            : 60,
		encryption          : 'text',
		use_unix_timestamp  : false
	}, function (options) {
		$('input[name=cloud-service][value='+options['cloud_service']+']').prop('checked', true);
		check_authorization(options['cloud_service']);

		$('#interval').val(options['interval']);
		$('#encryption').val(options['encryption']);
		$('#use-unix-timestamp').prop('checked', options['use_unix_timestamp']);
	});
}

function check_authorization(cloud_service) {
	let token_name = cloud_service.toLowerCase()+'_token';

	let getOptions = {};
	getOptions[token_name] = '';
	chrome.storage.sync.get(getOptions, function (options) {
		let current_token = options[token_name];
		if(current_token !== '') {
			$('#authorize-container').html('').append('Authorized | ').append(
				$('<a/>', {href: '#', id: 'authorize', text: 'Reauthorize?'})
			);
		} else {
			$('#authorize-container').html('').append(
				$('<a/>', {href: '#', id: 'authorize', text: 'Authorize'})
			)
		}
	});
}

"use strict";

$(document).on('DOMContentLoaded', restore_options);
$('#save').click(save_options);

$(document).on("click", '#authorize', function(e) {
	e.preventDefault();

	let cloud_service = $('input[name=cloud-service]:checked').val();

	if(cloud_service === '') { alert('Please select a Cloud Service first'); return;}
	cloudServices[cloud_service].authorize(function() {
		$('#authorize-container').text('Authorized');
	});
});

$('input[name=cloud-service]:radio').change(function(){
	check_authorization($(this).val());
});

function save_options() {
	let device_label       = $('#device').val().trim(),
	    cloud_service      = $('input[name=cloud-service]:checked').val(),
	    interval           = parseInt($('#interval').val()),
	    encryption         = $('#encryption').val(),
	    use_unix_timestamp = $("#use-unix-timestamp").is(':checked');

	//Just incase something goes horribly wrong, let's not break the users browser with infinite requests..
	if(interval < 30) interval = 60;
	if(! /^[a-zA-Z0-9]{1,12}$/.test(device_label)) device_label = 'Default';

	chrome.storage.local.set({
		device_label       : device_label,
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
	chrome.storage.local.get({
		device_label        : 'Default',
		cloud_service       : '',

		interval            : 60,
		encryption          : 'text',
		use_unix_timestamp  : false
	}, function (options) {
		$('#device').val(options['device_label']);

		if(options['cloud_service'] !== '') {
			$('input[name=cloud-service][value='+options['cloud_service']+']').prop('checked', true);
			check_authorization(options['cloud_service']);
		}

		$('#interval').val(options['interval']);
		$('#encryption').val(options['encryption']);
		$('#use-unix-timestamp').prop('checked', options['use_unix_timestamp']);
	});
}

function check_authorization(cloud_service) {
	let token_name = cloud_service.toLowerCase()+'_token';

	let getOptions = {};
	getOptions[token_name] = '';
	chrome.storage.local.get(getOptions, function (options) {
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

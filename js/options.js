"use strict";


document.addEventListener('DOMContentLoaded', restore_options);

// Save button click
document.getElementById('save').addEventListener('click', save_options);

// Authorize button click (delegated, since it’s dynamically added)
document.addEventListener('click', e => {
	if (e.target && e.target.id === 'authorize') {
		e.preventDefault();
		const cloud_service = document.querySelector('input[name="cloud-service"]:checked')?.value;

		if (!cloud_service) {
			alert('Please select a Cloud Service first');
			return;
		}

		cloudServices[cloud_service].authorize(() => {
			document.getElementById('authorize-container').textContent = 'Authorized';
		});
	}
});

// Cloud service radio change
document.querySelectorAll('input[name="cloud-service"]').forEach(radio => {
	radio.addEventListener('change', e => {
		check_authorization(e.target.value);
	});
});

function save_options() {
	let device_label = document.getElementById('device').value.trim();
	let cloud_service = document.querySelector('input[name="cloud-service"]:checked')?.value || '';
	let interval = parseInt(document.getElementById('interval').value, 10);
	let encryption = document.getElementById('encryption').value;
	let use_unix_timestamp = document.getElementById('use-unix-timestamp').checked;

	// Safety checks
	if (interval < 30) interval = 60;
	if (!/^[a-zA-Z0-9]{1,12}$/.test(device_label)) device_label = 'Default';

	chrome.storage.local.set({
		device_label,
		cloud_service,
		interval,
		encryption,
		use_unix_timestamp
	}, () => {
		const status = document.getElementById('status');
		status.textContent = 'Options saved.';

		// This is safe here (only an issue for service workers)
		setTimeout(() => {
			status.textContent = '';
		}, 3000);
	});
}

function restore_options() {
	chrome.storage.local.get({
		device_label: 'Default',
		cloud_service: '',
		interval: 60,
		encryption: 'text',
		use_unix_timestamp: false
	}, options => {
		document.getElementById('device').value = options.device_label;
		document.getElementById('interval').value = options.interval;
		document.getElementById('encryption').value = options.encryption;
		document.getElementById('use-unix-timestamp').checked = options.use_unix_timestamp;

		if (options.cloud_service) {
			const radio = document.querySelector(`input[name="cloud-service"][value="${options.cloud_service}"]`);
			if (radio) radio.checked = true;
			check_authorization(options.cloud_service);
		}
	});
}

function check_authorization(cloud_service) {
	const token_name = cloud_service.toLowerCase() + '_token';
	chrome.storage.local.get({ [token_name]: '' }, options => {
		const current_token = options[token_name];
		const container = document.getElementById('authorize-container');
		container.innerHTML = '';

		if (current_token) {
			container.appendChild(document.createTextNode('Authorized | '));

			const link = document.createElement('a');
			link.href = '#';
			link.id = 'authorize';
			link.textContent = 'Reauthorize?';
			container.appendChild(link);
		} else {
			const link = document.createElement('a');
			link.href = '#';
			link.id = 'authorize';
			link.textContent = 'Authorize';
			container.appendChild(link);
		}
	});
}

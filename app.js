'use strict';

var platform = require('./platform'),
	firebaseClient;

/*
 * Listen for the data event.
 */
platform.on('data', function (data) {
	if (!data.id) {
		var uuid = require('node-uuid');
		data.id = uuid.v4();
	}

	firebaseClient.child(data.id).set(data, function (error) {
		if (error) {
			console.error('Error inserting data to Firebase.', error);
			platform.handleException(error);
		}
		else {
			platform.log(JSON.stringify({
				title: 'Inserted data into Firebase',
				data: data
			}));
		}
	});
});

/*
 * Event to listen to in order to gracefully release all resources bound to this service.
 */
platform.on('close', function () {
	var domain = require('domain');
	var d = domain.create();

	d.on('error', function(error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
	});

	d.run(function() {
		firebaseClient.unauth();
		platform.notifyClose();
	});
});

/*
 * Listen for the ready event.
 */
platform.once('ready', function (options) {
	var Firebase = require('firebase');

	firebaseClient = new Firebase(options.firebase_url);

	firebaseClient.authWithCustomToken(options.token, function () {
		platform.notifyReady();
	});
});
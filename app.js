'use strict';

var uuid     = require('node-uuid'),
	platform = require('./platform'),
	isPlainObject = require('lodash.isplainobject'),
	isArray = require('lodash.isarray'),
	async = require('async'),
	firebaseClient;

let sendData = (data) => {
	if (!data.id)
		data.id = uuid.v4();

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
};

platform.on('data', function (data) {
	if(isPlainObject(data)){
		sendData(data);
	}
	else if(isArray(data)){
		async.each(data, function(datum){
			sendData(datum);
		});
	}
	else
		platform.handleException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`));
});

/*
 * Event to listen to in order to gracefully release all resources bound to this service.
 */
platform.on('close', function () {
	var domain = require('domain');
	var d = domain.create();

	d.on('error', function (error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
		d.exit();
	});

	d.run(function () {
		firebaseClient.unauth();
		platform.notifyClose();
		d.exit();
	});
});

/*
 * Listen for the ready event.
 */
platform.once('ready', function (options) {
	var Firebase = require('firebase');

	firebaseClient = new Firebase(options.firebase_url);

	firebaseClient.authWithCustomToken(options.token, function () {
		platform.log('Firebase Storage initialized.');
		platform.notifyReady();
	});
});
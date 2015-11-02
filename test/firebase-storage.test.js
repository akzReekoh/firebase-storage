'use strict';

const FIREBASE_URL = 'https://glaring-heat-342.firebaseio.com/devicedata',
	  TOKEN        = 'Y6oNickI1xLiJHRfIeDaGLTvjlVe8SPIlZ02GHat';

var cp       = require('child_process'),
	should   = require('should'),
	recordId = require('node-uuid').v4(),
	firebaseStorage;

describe('Firebase Storage', function () {
	this.slow(5000);

	after('terminate child process', function () {
		setTimeout(function () {
			firebaseStorage.kill('SIGKILL');
		}, 5000);
	});

	describe('#spawn', function () {
		it('should spawn a child process', function () {
			should.ok(firebaseStorage = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(5000);

			firebaseStorage.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			firebaseStorage.send({
				type: 'ready',
				data: {
					options: {
						firebase_url: FIREBASE_URL,
						token: TOKEN
					}
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process the data', function (done) {
			firebaseStorage.send({
				type: 'data',
				data: {
					id: recordId,
					co2_1hr: '11%',
					co2_8hr: '8%',
					n_1hr: '70%',
					n_8hr: '72%',
					o2_1hr: '19%',
					o2_8hr: '20%'
				}
			}, done);
		});
	});

	describe('#data', function () {
		it('should have inserted the data', function (done) {
			this.timeout(5000);

			var Firebase = require('firebase');
			var firebaseClient = new Firebase(FIREBASE_URL);

			firebaseClient.authWithCustomToken(TOKEN, function () {
				firebaseClient.on('value', function (snapshot) {
					should.ok(snapshot.exists());
					should.ok(snapshot.hasChild(recordId));

					var record = snapshot.child(recordId).val();

					should.equal(record.id, recordId, 'Data validation failed. Field: id');
					should.equal(record.co2_1hr, '11%', 'Data validation failed. Field: co2_1hr');
					should.equal(record.co2_8hr, '8%', 'Data validation failed. Field: co2_8hr');
					should.equal(record.n_1hr, '70%', 'Data validation failed. Field: n_1hr');
					should.equal(record.n_8hr, '72%', 'Data validation failed. Field: n_8hr');
					should.equal(record.o2_1hr, '19%', 'Data validation failed. Field: o2_1hr');
					should.equal(record.o2_8hr, '20%', 'Data validation failed. Field: o2_8hr');

					done();
				});
			});
		});
	});
});
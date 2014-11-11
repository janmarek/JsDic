var assert = require('assert');
var JsDic = require('../jsdic');

describe('DIC', function () {
	var dic;
	beforeEach(function () {
		dic = new JsDic();
	});

	describe('getArguments', function () {
		it('recognizes empty array', function () {
			var args = dic.getArguments(function () {});
			assert.deepEqual([], args);
		});
		it('recognizes empty array with space', function () {
			var args = dic.getArguments(function ( ) {});
			assert.deepEqual([], args);
		});
		it('recognizes one arg', function () {
			var args = dic.getArguments(function (a) {});
			assert.deepEqual(['a'], args);
		});
		it('recognizes one arg with space', function () {
			var args = dic.getArguments(function ( a ) {});
			assert.deepEqual(['a'], args);
		});
		it('recognizes multiple args with whitespace', function () {
			var args = dic.getArguments(function (
				a,
				b,
				c
			) {});
			assert.deepEqual(['a', 'b', 'c'], args);
		});
		it('removes inline comments', function () {
			var fnc = function (/* com */ a, /* m, m, ent */ b /* c */) {};
			var args = dic.getArguments(fnc);
			assert.deepEqual(['a', 'b'], args);
		});
	});

	it('can instantiate service', function () {
		function Cls(a, b) {
			this.a = a;
			this.b = b;
		}

		var obj = dic.instantiateService(Cls, [1, 2]);
		assert.equal(1, obj.a);
		assert.equal(2, obj.b);
	});

	it('handles values', function () {
		dic
			.value('a', 1)
			.value('b', 2);

		assert.equal(2, dic.get('b'));
	});

	it('handles factories without params', function () {
		dic
			.factory('factory', function () {
				return 3;
			});

		assert.equal(3, dic.get('factory'));
	});

	it('handles factories with params', function () {
		dic
			.value('a', 1)
			.value('b', 2)
			.factory('factory', function (a, b) {
				return a + b;
			});

		assert.equal(3, dic.get('factory'));
	});

	it('handles factories with defined dependencies', function () {
		dic
			.value('_a', 1)
			.value('_b', 2)
			.factory('factory', ['_a', '_b', function (a, b) {
				return a + b;
			}]);

		assert.equal(3, dic.get('factory'));
	});

	it('get returns always the same instance for factories', function () {
		function Cls() {

		}

		dic
			.factory('factory', function () {
				return new Cls();
			});

		var a = dic.get('factory');
		var b = dic.get('factory');
		assert.equal(a, b);
	});

	it('handles services', function () {
		function Cls(a, b) {
			this.a = a;
			this.b = b;
		}

		dic
			.value('a', 1)
			.value('b', 2)
			.service('cls', Cls);

		var obj = dic.get('cls');
		assert.equal(1, obj.a);
		assert.equal(2, obj.b);
	});

	it('handles services with defined dependencies', function () {
		function Cls(a, b) {
			this.a = a;
			this.b = b;
		}

		dic
			.value('_a', 1)
			.value('_b', 2)
			.service('cls', ['_a', '_b', Cls]);

		var obj = dic.get('cls');
		assert.equal(1, obj.a);
		assert.equal(2, obj.b);
	});

	it('get returns always the same instance for services', function () {
		function Cls() {

		}

		dic
			.factory('cls', Cls);

		var a = dic.get('cls');
		var b = dic.get('cls');
		assert.equal(a, b);
	});

	it('throws exception if service is not registered', function () {
		assert.throws(function () {
			dic.get('a');
		}, /a is not registered in container/);
	});

	it('throws exception if service is not registered', function () {
		assert.throws(function () {
			dic
				.factory('b', function (a) {})
				.get('b');
		}, /a <- b is not registered in container/);
	});

	it('throws circular dependency', function () {
		assert.throws(function () {
			dic
				.factory('a', function (b) {})
				.factory('b', function (c) {})
				.factory('c', function (a) {});

			dic.get('b');
		}, /Circular dependency detected: b <- c <- a <- b/);
	});

	it('can depend on one service multiple times', function () {
		dic
			.factory('a', function () {})
			.factory('b', function (a) {})
			.factory('c', function (b) {})
			.factory('d', function (b, c) {});

		dic.get('d');
	});

	it('validates input for factory', function () {
		assert.throws(function () {
			dic.factory('a', 1);
		}, /a: second argument should be an array or function/);
	});

	it('validates input for service', function () {
		assert.throws(function () {
			dic.service('a', 1);
		}, /a: second argument should be an array or function/);
	});
});

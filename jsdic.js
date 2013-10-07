(function () {
	function JsDic() {
		this.values = {};
		this.factories = {};
		this.services = {};
		this.instances = {};
	}

	JsDic.prototype = {
		get: function (name, history) {
			history = history || [];

			for (var i = 0; i < history.length; i++) {
				if (history[i] === name) {
					history.unshift(name);
					throw 'Circular dependency detected: ' + history.reverse().join(' <- ');
				}
			}

			history.unshift(name);

			if (typeof this.instances[name] !== 'undefined') {
				return this.instances[name];
			}

			if (typeof this.values[name] !== 'undefined') {
				return this.values[name];
			}

			if (typeof this.services[name] !== 'undefined') {
				var constructor = this.services[name];
				var args = this.getDependencies(constructor, history);
				return this.instances[name] = this.instantiateService(constructor, args);
			}

			if (typeof this.factories[name] !== 'undefined') {
				var factory = this.factories[name];
				var args = this.getDependencies(factory, history);
				return this.instances[name] = factory.apply(null, args);
			}

			throw history.join(' <- ') + ' is not registered in container';
		},

		instantiateService: function (constructor, args) {
			var wrapper = function (f, args) {
				return function () {
					f.apply(this, args);
				};
			};

			return new (wrapper(constructor, args));
		},

		getArguments: function (target) {
			var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			var text = target.toString();
			var argsTxt = text.match(FN_ARGS)[1]
				.replace(/\s+/g, '')
				.replace(STRIP_COMMENTS, '');

			if (argsTxt === '') {
				return [];
			}

			var args = argsTxt.split(',');

			return args;
		},

		getDependencies: function (fnc, history) {
			var self = this;
			var arr = this.getArguments(fnc);
			return arr.map(function (value) {
				return self.get(value, history);
			});
		},

		value: function (name, dependency) {
			this.values[name] = dependency;
			return this;
		},

		factory: function (name, fnc) {
			if (typeof fnc !== 'function') {
				throw name + ' is not function';
			}

			this.factories[name] = fnc;
			return this;
		},

		service: function (name, cls) {
			if (typeof cls !== 'function') {
				throw name + ' is not function';
			}

			this.services[name] = cls;
			return this;
		}
	};

	// export
	if (typeof window !== 'undefined') {
		window.JsDic = JsDic;
	} else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = JsDic;
	}
})();
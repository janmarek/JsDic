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
					throw 'Circular dependency detected: ' +
						[name].concat(history).reverse().join(' <- ');
				}
			}

			history = [name].concat(history);

			if (typeof this.instances[name] !== 'undefined') {
				return this.instances[name];
			}

			if (typeof this.values[name] !== 'undefined') {
				return this.values[name];
			}

			if (typeof this.services[name] !== 'undefined') {
				var definition = this.services[name];
				var args = this.getDependencies(definition, history);
				return this.instances[name] = this.instantiateService(definition.fnc, args);
			}

			if (typeof this.factories[name] !== 'undefined') {
				var definition = this.factories[name];
				var args = this.getDependencies(definition, history);
				return this.instances[name] = definition.fnc.apply(null, args);
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

		getDependencies: function (definition, history) {
			var self = this;
			var names = definition.dependencies || this.getArguments(definition.fnc);
			return names.map(function (value) {
				return self.get(value, history);
			});
		},

		value: function (name, dependency) {
			this.values[name] = dependency;
			return this;
		},

		factory: function (name, dependencies, fnc) {
			if (typeof dependencies === 'function') {
				fnc = dependencies;
				dependencies = null;
			} else if (dependencies.constructor !== Array) {
				throw new Error(name + ': second argument should be an array of dependencies or factory function');
			}

			if (typeof fnc !== 'function') {
				throw new Error(name + ' is not a function');
			}

			this.factories[name] = {fnc: fnc, dependencies: dependencies};
			return this;
		},

		service: function (name, dependencies, cls) {
			if (typeof dependencies === 'function') {
				cls = dependencies;
				dependencies = null;
			} else if (dependencies.constructor !== Array) {
				throw new Error(name + ': second argument should be an array of dependencies or class constructor');
			}

			if (typeof cls !== 'function') {
				throw new Error(name + ' is not a function');
			}

			this.services[name] = {fnc: cls, dependencies: dependencies};
			return this;
		}
	};

	// export
	if (typeof window !== 'undefined') {
		window.JsDic = JsDic;
	}

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = JsDic;
	}
})();

(function () {
	function JsDic() {
		this.values = {};
		this.factories = {};
		this.services = {};
		this.instances = {};
	}

	JsDic.prototype = {

		/**
		 * Get service instance
		 * @param {String} name
		 * @return {*}
		 */
		get: function (name) {
			return this.getWithHistory(name, []);
		},

		/**
		 * Set value to container
		 * @param {String} name
		 * @param {*} value
		 * @return {JsDic}
		 */
		value: function (name, value) {
			this.values[name] = value;
			return this;
		},

		/**
		 * Set service factory to container
		 * @param {String} name
		 * @param {(Array|Function)} definition
		 * @return {JsDic}
		 */
		factory: function (name, definition) {
			this.factories[name] = this.parseDefinition(name, definition);
			return this;
		},

		/**
		 * Set service definition
		 * @param {String} name
		 * @param {(Array|Function)} definition
		 * @return {JsDic}
		 */
		service: function (name, definition) {
			this.services[name] = this.parseDefinition(name, definition);
			return this;
		},

		/**
		 * @private
		 */
		getWithHistory: function (name, history) {
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

		/**
		* @private
		*/
		instantiateService: function (constructor, args) {
			var wrap = function (c) {
				var wrapped = function (args) {
					c.apply(this, args);
				};
				wrapped.prototype = c.prototype;
				return wrapped;
			};

			return new (wrap(constructor))(args);
		},

		/**
		* @private
		*/
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

		/**
		 * @private
		 */
		getDependencies: function (definition, history) {
			var self = this;
			var names = definition.dependencies || this.getArguments(definition.fnc);
			return names.map(function (value) {
				return self.getWithHistory(value, history);
			});
		},

		/**
		 * @private
		 */
		parseDefinition: function (name, definition) {
			if (definition.constructor === Array) {
				var fnc = definition.pop();
				return {fnc: fnc, dependencies: definition};
			}

			if (typeof definition === 'function') {
				return {fnc: definition, dependencies: null};
			}

			throw new Error(name + ': second argument should be an array or function');
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

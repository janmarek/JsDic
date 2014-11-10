JsDic
=====

Dependecy injection container for javascript inspired by AngularJS

License: MIT

Example
-------

```js
function AjaxService(ajaxUrl) {
	this.ajaxUrl = ajaxUrl;
	// ...
}

function AjaxController(service, data) {
	this.service = service;
	this.data = data;
	// ...
}

var JsDic = require('jsdic');
var dic = new JsDic();
dic
	.value('ajaxUrl', '/some-ajax-action')
	.value('initialData', [1, 2, 3])
	.service('ajaxService', AjaxService)
	.factory('ajaxController', function (ajaxService, initialData) {
		return new AjaxController(ajaxService, initialData);
	});

var ctrl = dic.get('ajaxController');

// dependecies can be defined explicitly
dic
	.value('ajaxUrl', '/some-ajax-action')
	.value('initialData', [1, 2, 3])
	.service('ajaxService', ['ajaxUrl'], AjaxService)
	.factory('ajaxController', ['ajaxService', 'initialData'], function (as, id) {
		return new AjaxController(as, id);
	});
```

Sources
-------

* http://docs.angularjs.org/guide/di
* http://merrickchristensen.com/articles/javascript-dependency-injection.html

/*
---
script: Utility.js

name: Utility

description: Utility functions

license: MIT-style license.

authors:
  - Adrian Föder <adrian@foeder.de>

requires:

provides: [MooView.Utility]

...
*/

var MooView = MooView || {};

(function(){

var hasOwnProperty = Object.prototype.hasOwnProperty;

MooView.Utility = {
	/**
	 * Parses an Internet Media Type string like application/rss+xml or application/vnd.mozilla.xul+xml into an accessible object.
	 * @param String internetMediaType
	 * @return Object Parsed object, e.g. {type: 'application', subtype: 'vnd.mozilla.xul+xml', tree: 'vnd.mozilla.xul', suffix: 'xml'
	 * @see RFC 2046, and RFC 4288, sections 3 and 4.2.
	 */
	parseInternetMediaType: function(internetMediaType) {
		var ret = { 'type': undefined, 'subtype': undefined, 'tree': undefined, 'suffix': undefined};
		var typeSubtypeSplit = internetMediaType.split('/', 2);

		ret.type = typeSubtypeSplit[0];
		ret.subtype = typeSubtypeSplit[1];

		var treeSuffixSplit = ret.subtype.split('+', 2);
		ret.tree = treeSuffixSplit[0];
		ret.suffix = treeSuffixSplit[1];

		return ret;
	},

	/**
	 * implementation of https://github.com/mootools/mootools-core/pull/2191
	 * @TODO refactor to deprecated when it's in MooTools core release
	 */
	'Object': {
		get: function(object, path) {
			if (typeof path == 'string') path = path.split('.');
			for (var i = 0, l = path.length; i < l; i++){
				if (hasOwnProperty.call(object, path[i])) object = object[path[i]];
				else return null;
			}
			return object;
		},

		set: function(object, path, value) {
			var path = path.split ? path.split('.') : path,
				key = path.pop(),
				len = path.length,
				i = 0,
				current;
			while (len--){
				current = path[i++];
				object = current in object ? object[current] : (object[current] = {});
			}
			object[key] = value;
			return object;
		}
	}
};
})();
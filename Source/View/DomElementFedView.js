/*
---

script: DomElementFedView.js

name: DomElementFedView

description: An view, with its template being fed from an Element of the DOM

provides: [MooView.View.DomElementFedView]

requires:
  - MooView.View.AbstractView

...
*/
define('MooView/View/DomElementFedView', function() {
	return new Class({ Extends: MooView.View.AbstractView,

		/**
		 * @var currently an Element, but could be transformed to be a selectable string or so
		 */
		initialize: function(templateElement) {
			this.templateElement = templateElement;
		},

		/**
		 * @return mixed
		 */
		render: function() {
			return this.templateElement;
		}
	});
});
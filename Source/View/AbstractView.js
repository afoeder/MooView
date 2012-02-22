/*
---

script: AbstractView.js

name: AbstractView

description: An abstract view

provides: [MooView.View.AbstractView]

requires:
  - MooView.Utility

...
*/
MooView.Utility.Object.set(window, 'MooView.View.AbstractView');
MooView.View.AbstractView = new Class({
	/**
	 * @access protected
	 */
	variableContainer: {},

	/**
	 * @param String
	 * @param mixed value
	 * @access public
	 */
	assign: function(key, value) {
		this.variableContainer[key] = value;
	},

	render: function() {
		throw 'You need to implement your render() method of your View on your own.';
	}
});
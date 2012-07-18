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

	/**
	 * Clears the VariableContainer
	 */
	clearVariableContainer: function() {
		this.variableContainer = {};
	},

	/**
	 * @return mixed
	 */
	render: function() {
		throw 'You need to implement your render() method of your View on your own.';
	},

	/**
	 * renders and returns a single element no matter if it should be actually more elements.
	 * @return Element
	 */
	renderElement: function() {
		var rendered = this.render.apply(this, arguments);
		switch (typeOf(rendered)) {
			case 'element': return rendered;
				break;
			case 'elements': return (new Element('div')).adopt(rendered);
				break;
			case 'string': return new Element('div', {html: rendered});
				break;
			default: throw 'Rendered View output is neither string, elements not element and cannot be casted to Element.';
		}
	}
});
/*
---

script: AbstractController.js

name: AbstractController

description: An abstract controller

provides: [MooView.Controller.AbstractController]

requires:
  - MooView.Utility

...
*/
MooView.Utility.Object.set(window, 'MooView.Controller.AbstractController');
MooView.Controller.AbstractController = new Class({
	/**
	 * holds this controller's full name like Acme.Package.Controller.FooController
	 * Unfortunate workaround to hold the class's original name.
	 * This property must be populated at the concrete class.
	 * @var String
	 */
	controllerClass: undefined,

	/**
	 * The scope of this controller. May be "prototype" or "singleton".
	 */
	scope: 'prototype',

	/**
	 * @var Object MooView.View.AbstractView
	 */
	view: undefined,

	/**
	 * The container the view content will be populated with. Will be set during runtime by the RoutingService
	 * and can be set via controller actions.
	 * @var Element
	 */
	viewContainer: undefined,

	/**
	 * Set via the routing service to the element that initially was responsible to trigger the controller's request
	 * @var Element
	 */
	bootstrapElement: undefined,

	/**
	 * Calls an action
	 * @param String actionName lower- or UpperCamelCased action name, like 'show'
	 * @param Array actionArguments the arguments to pass to the actual action method
	 * @access public
	 */
	delegate: function(actionName, actionArguments) {
			// lowerCase the first char of actionName
		var actionName = actionName.replace(/^[A-Z]/, function(match){return match.toLowerCase();});
		var initializeActionMethodName = 'initialize'
				+ actionName.replace(/^[a-z]/, function(match){return match.toUpperCase();})
				+ 'Action';

		this.view = this.resolveView(actionName);
		if (!this[actionName + 'Action']) {
			throw 'Method "' + actionName + 'Action" not found in ' + this.controllerClass;
		}
		if (this[initializeActionMethodName]) {
			this[initializeActionMethodName].call(this);
		}

		return this[actionName + 'Action'].apply(this, actionArguments);
	},

	/**
	 * Fetches the responsible View object for the requested action
	 * @param String actionName lowerCamelCased action name
	 * @return Object MooView.View.AbstractView
	 * @access protected
	 */
	resolveView: function(actionName) {
		var viewPath = this.controllerClass.replace(/Controller$/, '').split('.');
		var controllerName = viewPath.pop();
		if ('Controller' !== viewPath.pop()) {
			throw 'Unable to resolve view for action "' + actionName + '", controller class "" does not satisfy the pattern Vendor.Package.Foo.Controller.XyzController';
		}
		var attemptedViewObject = viewPath.join('.') + '.Template.' + controllerName + '.' + actionName.capitalize();

		var viewObject = MooView.Utility.Object.get(window, attemptedViewObject);
		if (viewObject) {
			return viewObject;
		} else if(console && console.info) {
			console.info('Attempted view object "' + attemptedViewObject + '" could not be found.');
		}
		return undefined;
	}.protect()
});
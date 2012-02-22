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
	 */
	controllerClass: undefined,

	/**
	 * Calls an action
	 * @param String actionName lower- or UpperCamelCased action name, like 'show'
	 * @param Array actionArguments the arguments to pass to the actual action method
	 * @access public
	 */
	delegate: function(actionName, actionArguments) {
			// lowerCase the first char of actionName
		var actionName = actionName.replace(/^[A-Z]/, function(match){return match.toLowerCase();});

		this.view = this.resolveView(actionName);
		if (!this[actionName + 'Action']) {
			throw 'Method "' + actionName + 'Action" not found in ' + this.controllerClass;
		}

		return this[actionName + 'Action'].apply(this, actionArguments);
	},

	/**
	 * Fetches the responsible View object for the requested action
	 * @param String actionName lowerCamelCased action name
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
		if (!viewObject) {
			throw 'Attempted view object "' + attemptedViewObject + '" could not be found.';
		} else {
			return viewObject;
		}
	}.protect()
});
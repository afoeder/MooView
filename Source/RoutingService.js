/*
---
script: ElementPopulatorService.js

name: ElementPopulatorService

description: Populates HTML elements with (existing) data.

license: MIT-style license.

authors:
  - Adrian Föder <adrian@foeder.de>

requires:
  - Core/String
  - Core/Element.Event
  - MooView.Utility

provides: [MooView.RoutingService]

...
*/
var MooView = MooView || {};
MooView.Error = new Class({Extends: Error, name: 'MooView.Error'});
MooView.Error.InvalidViewRenderOutput = new Class({Extends: MooView.Error, name: 'MooView.Error.InvalidViewRenderOutput'});

MooView.RoutingService = {
	/**
	 * Iterates through elements having a data-mooview-action attribute set and attempts to run these.
	 *
	 * @access public
	 */
	routeDomByActionAnnotation: function() {
		var elements = document.getElements('[data-mooview-action],[data-mooview-controller]');
		elements.each(this.routeElement.bind(this));
		if (elements) {
			window.fireEvent('MooView:possiblyDomChange');
		}
	},

	routeElement: function(element) {
		var controller,
			routing = element.get('data-mooview-action') || element.get('data-mooview-controller'),
			routingInformation = this.splitRoutingPattern(routing);

		var controllerAndActionName = this.getControllerAndActionName(routingInformation),
			controllerName = controllerAndActionName.controllerName,
			actionName = controllerAndActionName.actionName;

		var controllerClass = MooView.Utility.Object.get(window, controllerName);
		if (!controllerClass) {
			var moduleName = MooView.Utility.getSlashedModuleName(controllerName);
			var self = this;
			require([moduleName], function(controllerClass){
				self.initializeForElement(element, controllerClass, actionName);
			})
		} else {
			this.initializeForElement(element, controllerClass, actionName);
		}
	},

	/**
	 * Gets element's action annotation and invokes it using the appropriate controller
	 * @param element Element with attribute 'data-mooview-action' set, e.g. Acme.Comments.Thread@Show
	 * @access protected
	 */
	initializeForElement: function(element, controllerClass, actionName) {
		var controllerInstance;
		if (controllerClass.prototype['scope'] === 'singleton') {
			controllerInstance = element.retrieve('MooView.Routing.Controller');
		}
		if (!controllerInstance) {
			controllerInstance = new controllerClass();
		}
		controllerInstance.bootstrapElement = element;
		controllerInstance.viewContainer = element;
		element.store('MooView.Routing.Controller', controllerInstance);
		if (controllerInstance.initializeObject) controllerInstance.initializeObject();

		var modelModuleNameAndData = this.getModelModuleNameAndDataForElement(element);
		if (modelModuleNameAndData !== undefined) {
			require([modelModuleNameAndData.moduleName], function(ModelClass) {
				var modelInstance = new ModelClass(modelModuleNameAndData.data);
				this.execute(element, controllerInstance, actionName, modelInstance);
			}.bind(this));
		} else {
			this.execute(element, controllerInstance, actionName);
		}
	},

	execute: function(element, controllerInstance, actionName, modelInstance) {
		var deferrableInvokation = function() {
			if ('domevent' === typeOf(arguments[0])) controllerInstance.bootstrapElement.store('MooView.Routing.deferEvent', arguments[0]);
			controllerInstance.delegate(actionName, (modelInstance !== undefined ? [modelInstance] : undefined));
			try {
				this.processOutput(controllerInstance, actionName);
			} catch(exception) {
				if (exception.name === 'MooView.View.InvalidViewRenderOutput') {
					throw new Error(exception.message.replace(/\%s/, element.get('data-mooview-action')));
				} else throw exception;
			}
		}.bind(this);
		if (element.get('data-mooview-defer')) {
			this.setDeferredInvokation(element, deferrableInvokation);
		} else {
			deferrableInvokation();
		}
	},

	setDeferredInvokation: function(element, deferrableInvokation) {
		var parts = element.get('data-mooview-defer').split('@');
		var event = parts[0];
		var target = (parts[1] === 'self' ? element : null);

		target.addEvent(event, deferrableInvokation);
	},

	/**
	 * Processes the actual View itself
	 * @param Object controller
	 * @param Element element
	 * @param string actionName
	 */
	processOutput: function (controller, actionName) {
		if (!controller.view || !controller.viewContainer) return;

			// and render the output
		var renderedOutput = controller.view.render();
		switch (typeOf(renderedOutput)) {
			case 'element':
			case 'elements':
				controller.viewContainer.adopt(renderedOutput);
				break;
			case 'string':
				controller.viewContainer.set('html', renderedOutput);
				break;
			case 'null':
					// just do nothing, the controller did its stuff on its own
				break;
			default:
				throw new MooView.Error.InvalidViewRenderOutput('Output type ' + typeOf(renderedOutput) + ' not handled by "%s".');
		}

		var postInjectMethodName = 'postInject' + (actionName + 'Action').capitalize();
		if (controller[postInjectMethodName]) {
			controller[postInjectMethodName](controller.viewContainer);
		}
	},

	/**
	 * @param Object routingPattern the
	 * @return Object Object with controller path and action name, e.g. { controllerName: Acme.Comments.Controller.ThreadController, actionMethodName: showAction }
	 */
	getControllerAndActionName: function(routingInformation) {
		var controllerName = routingInformation['package'] + '.Controller.' + routingInformation.controller + 'Controller';
		var actionName = routingInformation.action;
		return { controllerName: controllerName, actionName: actionName };
	},

	/**
	 * Splits a routing pattern like Acme.Comments.Thread@Show to its appropriate parts
	 * @param pattern
	 * @return Object { package: Acme.Comments, controller: Thread, action: Show }
	 */
	splitRoutingPattern: function(pattern) {
		var controllerActionParts = pattern.split('@');
		if (controllerActionParts.length > 2) throw 'Controller and action designation must have no or one @ char, "' + pattern + '" given.';

		var controllerParts = controllerActionParts[0].capitalize().split('.');
		var controller = controllerParts.pop();
		var packageName = controllerParts.join('.');
		var action = controllerActionParts[1] ? controllerActionParts[1].capitalize() : undefined;

		return { 'package': packageName, controller: controller, action: action };
	},

	/**
	 * Fetches the JSON reponsible for an element and resolves the data
	 * @param element
	 * @return Object
	 */
	getModelModuleNameAndDataForElement: function(element) {
		var dataSourceSelector = element.get('data-mooview-data-source');
		if (!dataSourceSelector) {
			return undefined;
		}
		var dataSourceElement = document.getElement(dataSourceSelector);
		var mediaType = dataSourceElement.get('type');
		var data = JSON.decode(dataSourceElement.get('text').trim());
		var ret = {
			moduleName: this.getModelModuleNameByMediaType(mediaType),
			data: data
		};
		return ret;
	},

	/**
	 * Gets the object name by the provided media type tree
	 * Per convention (!) the first element is popped of if it's "vnd", then the view object is expected to be located under e.g. MooView.Conventional.Vendor.[Acme].[CommentCollection]View
	 * Note the tree is transformed to be Uppercasefirst on each item.
	 * @param String mediaType The media type, e.g. 'model/vnd.acme.commentCollection+json'
	 * @return String The module name, with slashes
	 * @TODO allow injecting a resolver that doesn't need the conventional object tree
	 */
	getModelModuleNameByMediaType: function(mediaType) {
		var mediaTypeParts = MooView.Utility.parseInternetMediaType(mediaType);
		if (mediaTypeParts.type !== 'model') {
			throw 'Internet media type must be "model", "' + mediaTypeParts.type + '" given, in "' + mediaType + '".';
		}

		var objectPath = mediaTypeParts.tree.capitalize();
			// strip optional vnd-Prefix
		objectPath = objectPath.replace(/^Vnd\./, '');

		return MooView.Utility.getSlashedModuleName(objectPath);
	}
};

window.addEvent('domready', function() {
	/**
	 * route/bind annotated HTML elements with their action
	 * TODO #1: assure elements can only be applied once
	 */
	MooView.RoutingService.routeDomByActionAnnotation();
});
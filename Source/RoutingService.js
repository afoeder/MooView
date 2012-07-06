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
		var elements = document.getElements('[data-mooview-action]');
		elements.each(this.routeElement.bind(this));
		if (elements) {
			window.fireEvent('MooView:possiblyDomChange');
		}
	},

	/**
	 * Gets element's action annotation and invokes it using the appropriate controller
	 * @param element Element with attribute 'data-mooview-action' set, e.g. Acme.Comments.Thread@Show
	 * @access protected
	 */
	routeElement: function(element) {
		var controller;
		var routing = element.get('data-mooview-action');
		var routingInformation = this.splitRoutingPattern(routing);

		var controllerAndActionName = this.getControllerAndActionName(routingInformation);
		var controllerName = controllerAndActionName.controllerName;
		var controllerClass = MooView.Utility.Object.get(window, controllerName);
		if (controllerClass.prototype['scope'] === 'singleton') {
			controller = element.retrieve('Mooview.Routing.Controller');
		}
		if (!controller) {
			controller = new controllerClass();
		}
		controller.bootstrapElement = element;
		controller.viewContainer = element;
		element.store('Mooview.Routing.Controller', controller);
		if (controller.initializeObject) controller.initializeObject();

		var actionName = controllerAndActionName.actionName;
		var modelInstance = this.getModelInstanceForElement(element);

		var deferrableInvokation = function() {
			controller.delegate(actionName, (modelInstance !== undefined ? [modelInstance] : undefined));
			try {
				this.processOutput(controller, actionName);
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

		if (!MooView.Utility.Object.get(window, controllerName)) {
			throw 'Object "' + controllerName + '" does not exist.';
		}

		return { controllerName: controllerName, actionName: actionName };
	},

	/**
	 * Splits a routing pattern like Acme.Comments.Thread@Show to its appropriate parts
	 * @param pattern
	 * @return Object { package: Acme.Comments, controller: Thread, action: Show }
	 */
	splitRoutingPattern: function(pattern) {
		var controllerActionParts = pattern.split('@');
		if (controllerActionParts.length !== 2) throw 'Controller and action designation must have exactly one @ char, "' + pattern + '" given.';

		var controllerParts = controllerActionParts[0].capitalize().split('.');
		var controller = controllerParts.pop();
		var packageName = controllerParts.join('.');
		var action = controllerActionParts[1].capitalize();

		return { 'package': packageName, controller: controller, action: action };
	},

	/**
	 * Fetches the JSON reponsible for an element and resolves the data
	 * @param element
	 * @return Object
	 */
	getModelInstanceForElement: function(element) {
		var dataSourceSelector = element.get('data-mooview-data-source');
		if (!dataSourceSelector) {
			return undefined;
		}
		var dataSourceElement = document.getElement(dataSourceSelector);
		var mediaType = dataSourceElement.get('type');
		var data = JSON.decode(dataSourceElement.get('text').trim());
		var modelInstance = this.getModelInstanceByMediaType(mediaType, data);
		return modelInstance;
	},

	/**
	 *
	 * @param mediaType
	 * @param dataJson
	 */
	getModelInstanceByMediaType: function(mediaType, data) {
		var modelObjectName = this.getModelClassByMediaType(mediaType);
		return new modelObjectName(data);
	},

	/**
	 * Gets the object by the provided media type tree
	 * Per convention (!) the first element is popped of if it's "vnd", then the view object is expected to be located under e.g. MooView.Conventional.Vendor.[Acme].[CommentCollection]View
	 * Note the tree is transformed to be Uppercasefirst on each item.
	 * @param String mediaType The media type, e.g. 'model/vnd.acme.commentCollection+json'
	 * @return Object
	 * @TODO allow injecting a resolver that doesn't need the conventional object tree
	 */
	getModelClassByMediaType: function(mediaType) {
		var mediaTypeParts = MooView.Utility.parseInternetMediaType(mediaType);
		if (mediaTypeParts.type !== 'model') {
			throw 'Internet media type must be "model", "' + mediaTypeParts.type + '" given, in "' + mediaType + '".';
		}

		var objectPath = mediaTypeParts.tree.capitalize();
			// strip optional vnd-Prefix
		objectPath = objectPath.replace(/^Vnd\./, '');

		var attemptedObject = MooView.Utility.Object.get(window, objectPath);
		if (!attemptedObject) {
			throw 'Object not found in "' + objectPath + '"';
		} else {
			return attemptedObject;
		}
	}
};


window.addEvent('domready', function() {
	/**
	 * rout/bind annotated HTML elements with their action
	 * TODO #1: assure elements can only be applied once
	 */
	MooView.RoutingService.routeDomByActionAnnotation();
});
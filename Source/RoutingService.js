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
			window.fireEvent('MooView.RoutingService.routeDomByActionAnnotation:complete');
		}
	},

	/**
	 * Gets element's action annotation and invokes it using the appropriate controller
	 * @param element Element with attribute 'data-mooview-action' set, e.g. Acme.Comments.Thread@Show
	 * @access protected
	 */
	routeElement: function(element) {
		var routing = element.get('data-mooview-action');
		var routingInformation = this.splitRoutingPattern(routing);

		var controllerAndActionName = this.getControllerAndActionName(routingInformation);
		var modelInstance = this.getModelInstanceForElement(element);

		var controller = MooView.Utility.Object.get(window, controllerAndActionName.controllerName);
		controller.view = this.getViewObject(routingInformation);
		controller.view.controller = controller;

			// invoke the action with the model as parameter:
		controller[controllerAndActionName.actionMethodName](modelInstance);

			// and render the output
		var renderedOutput = controller.view.render();
		switch (typeOf(renderedOutput)) {
			case 'element':
				element.grab(renderedOutput);
				break;
			case 'string':
				element.set('html', renderedOutput);
				break;
			default:
				throw 'Output type ' + typeOf(renderedOutput) + ' not handled by "' + routing + '".';
		}
	},

	/**
	 * @param Object routingPattern the
	 * @return Object Object with controller path and action name, e.g. { controllerName: Acme.Comments.Controller.ThreadController, actionMethodName: showAction }
	 */
	getControllerAndActionName: function(routingInformation) {
		var controllerName = routingInformation.package + '.Controller.' + routingInformation.controller + 'Controller';
		var actionMethodName = routingInformation.action.toLowerCase() + 'Action';

		if (!MooView.Utility.Object.get(window, controllerName)) {
			throw 'Object "' + controllerName + '" does not exist.';
		} else if (!MooView.Utility.Object.get(window, controllerName)[actionMethodName]) {
			throw 'Method "' + actionMethodName + '" does not exist in object "' + controllerName + '".';
		}

		return { controllerName: controllerName, actionMethodName: actionMethodName };
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
		var package = controllerParts.join('.');
		var action = controllerActionParts[1].toLowerCase().capitalize();

		return { package: package, controller: controller, action: action };
	},

	/**
	 * Fetches the JSON reponsible for an element and resolves the data
	 * @param element
	 * @return Object
	 */
	getModelInstanceForElement: function(element) {
		var dataSourceSelector = element.get('data-mooview-data-source');
		if (!dataSourceSelector) {
			throw 'Currently only data source by an element selector are supported.';
		}
		var dataSourceElement = document.getElement(dataSourceSelector);
		var mediaType = dataSourceElement.get('type');
		var data = JSON.decode(dataSourceElement.get('text'));
		var modelInstance = this.getModelInstanceByMediaType(mediaType, data);
		return modelInstance;
	},

	/**
	 * Retrieves the object responsible for a view
	 * @param routingInformation
	 */
	getViewObject: function(routingInformation) {
		var attemptedObject = MooView.Utility.Object.get(window, routingInformation.package + '.Template.' + routingInformation.controller + '.' + routingInformation.action);
		if (!attemptedObject) {
			throw 'ViewObject "' + attemptedObject + '" could not be found.';
		} else {
			return attemptedObject;
		}
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
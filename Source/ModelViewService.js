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
  - MooView.Utility

provides: [MooView.ElementPopulatorService]

...
*/

var MooView = MooView || {};

MooView.ModelViewService = {
	/**
	 * Iterates through elements having a data-mooview-data-source attribute set and attempts to populate/stock these.
	 *
	 * @param element Element
	 * @access public
	 */
	stockByAttributes: function() {
		document.getElements('[data-mooview-data-source][data-mooview-view]').each(this.stockElement.bind(this));
	},

	/**
	 * Fetches a data source that is present in DOM via e.g. a <script> tag containing JSON
	 * @param element Element with attribute 'data-mooview-data-source' set
	 * @access protected
	 */
	stockElement: function(element) {
		var dataSourceSelector = element.get('data-mooview-data-source');
		if (dataSourceSelector) {
			var dataSourceElement = document.getElement(dataSourceSelector);
			var mediaType = dataSourceElement.get('type');
			var data = JSON.decode(dataSourceElement.get('text'));
			var modelInstance = this.getModelInstanceByMediaType(mediaType, data);
			console.log(modelInstance);

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
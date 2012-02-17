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

MooView.ElementPopulatorService = {
	/**
	 * Iterates through elements having a data-mooview-data-source attribute set and attempts to populate these.
	 *
	 * @param element Element
	 * @access public
	 */
	initialDomPopulation: function() {
		document.getElements('[data-mooview-data-source]').each(this.populateBySeparateDataSource.bind(this));
	},

	/**
	 * Fetches a data source that is present in DOM via e.g. a <script> tag containing JSON
	 * @param populateableElement Element with attribute 'data-mooview-data-source' set
	 * @access protected
	 */
	populateBySeparateDataSource: function(populateableElement) {
		var dataSourceSelector = populateableElement.get('data-mooview-data-source');
		var dataSourceElement = document.getElement(dataSourceSelector);
		var dataSourceText = dataSourceElement.get('text');
		var dataSourceJson = JSON.decode(dataSourceText);

		var mediaType = MooView.Utility.parseInternetMediaType(dataSourceElement.get('type'));

		var viewObject = this.resolveViewObject(mediaType.tree);
		populateableElement.set('html', viewObject.render(dataSourceJson));
	},

	/**
	 * Gets the object by the provided media type tree
	 * Per convention (!) the first element is popped of if it's "vnd", then the view object is expected to be located under e.g. MooView.Conventional.Vendor.[Acme].[CommentCollection]View
	 * Note the tree is transformed to be Uppercasefirst on each item.
	 * @param String mediaTypeTree The media type, e.g. 'vnd.acme.commentCollection'
	 * @return Object
	 * @TODO allow injecting a resolver that doesn't need the conventional object tree
	 */
	resolveViewObject: function(mediaTypeTree) {
		var treeArray = mediaTypeTree.capitalize().split('.');
		if (treeArray.shift() !== 'Vnd') {
			throw 'Automatic view resolving works only with "vnd" vendor prefixed Internet Media Type, actual is "' + mediaTypeTree + '".';
		}

		var objectPath = 'MooView.Conventional.Vendor.' + treeArray.join('.') + 'View';
		var attemptedObject = MooView.Utility.Object.get(window, objectPath);
		if (!attemptedObject) {
			throw 'View object not found in "' + objectPath + '"';
		} else if ('function' !== typeof attemptedObject.render) {
			throw 'View object "' + objectPath + '" does not provide a render() method.';
		} else {
			return attemptedObject;
		}
	}
};
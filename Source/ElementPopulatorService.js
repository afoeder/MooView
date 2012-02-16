/*
---
script: ElementPopulatorService.js

name: ElementPopulatorService

description: Populates HTML elements with (existing) data.

license: MIT-style license.

authors:
  - Adrian Föder <adrian@foeder.de>

requires:
  - #Core/Class

provides: [MooView.ElementPopulatorService]

...
*/

MooView = MooView || {};

MooView.ElementPopulatorService = {
	/**
	 * Iterates through elements having a data-mooview-data-source attribute set and attempts to populate these.
	 *
	 * @param element Element
	 * @access private
	 */
	initialDomPopulation: function() {
		document.getElements('[data-mooview-data-source]').each(this.populateByExternalDataSource.bind(this));
	},

	populateByExternalDataSource: function(populateableElement) {
		var dataSourceSelector = populateableElement.get('data-mooview-data-source');
		var dataSourceText = document.getElement(dataSourceSelector).get('text');
		var dataSourceJson = JSON.decode(dataSourceText);

		console.log(dataSourceJson);
	}
};
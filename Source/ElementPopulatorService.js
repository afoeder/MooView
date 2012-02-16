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

var MooView = MooView || {};

MooView.ElementPopulatorService = {
	/**
	 * Iterates through elements having a data-mooview-data-source attribute set and attempts to populate these.
	 *
	 * @param element Element
<<<<<<< HEAD
	 * @access private
=======
	 * @access public
>>>>>>> Initial commit
	 */
	initialDomPopulation: function() {
		document.getElements('[data-mooview-data-source]').each(this.populateByExternalDataSource.bind(this));
	},

	/**
	 * Fetches a data source that is present in DOM via e.g. a <script> tag containing JSON
	 * @param populateableElement Element with attribute 'data-mooview-data-source' set
	 * @access protected
	 */
	populateByExternalDataSource: function(populateableElement) {
		var dataSourceSelector = populateableElement.get('data-mooview-data-source');
		var dataSourceText = document.getElement(dataSourceSelector).get('text');
		var dataSourceJson = JSON.decode(dataSourceText);

		console.log(dataSourceJson);
	}
};
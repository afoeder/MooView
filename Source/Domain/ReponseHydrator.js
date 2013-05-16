/*
---

script: Hydrator.js

name: Hydrator

description: A JSON API response hydrator

provides: [MooView.Domain.ResponseHydrator]

...
*/
define('MooView/Domain/ResponseHydrator', function() {

	return new Class({

		_currentResponse: {},

		persistenceManager: undefined,

		/**
		 * Hydrates a JSON response according to the JSON API
		 * @see http://jsonapi.org/
		 * @param jsonResponse A complete response with probably containing multiple documents
		 */
		hydrate: function(jsonResponse) {
			this._currentResponse = jsonResponse;
			var hydrationResponse = {};

			Object.each(jsonResponse, function(resourceDocument, resourceName){
				if (resourceName === 'rels') {
					return;
				}
				var currentHydrationValue;
				if (typeOf(resourceDocument) === 'array') {
					currentHydrationValue = [];
					resourceDocument.each(function(singleDocument){
						var hydratedInstance = this.hydrateResource(resourceName, singleDocument);
						currentHydrationValue.push(hydratedInstance);
					}.bind(this));
				} else {
					currentHydrationValue = this.hydrateResource(resourceName, resourceDocument);
				}
				hydrationResponse[resourceName] = currentHydrationValue;
			}, this);

			this.resolveRelations(hydrationResponse);
			return hydrationResponse;
		},

		/**
		 * Hydrates the given instance
		 * @param resourceName
		 * @param data
		 * @return object
		 */
		hydrateResource: function(resourceName, data) {
			var className = this.persistenceManager.getClassNameForResourceName(resourceName);
			if (!className) throw 'No instantiable class for resource "' + resourceName + '" could be found.';

			var classTemplate = require(className);
			var modelInstance = new classTemplate();
			Object.each(data, function(value, key) {
				if (key === 'rels') {
					modelInstance['$rels'] = value;
				}
				var setterMethodName = this._getSetterNameForProperty(key);
				if (typeof modelInstance[setterMethodName] === 'function') {
					modelInstance[setterMethodName](value);
				} else if (modelInstance.$constructor.prototype.hasOwnProperty(key) || modelInstance.$constructor.parent && modelInstance.$constructor.parent.prototype.hasOwnProperty(key)) {
					modelInstance[key] = value;
				}
			}, this);

			require('MooView/Domain/Repository/AbstractRepository').prototype.getRepositoryForEntity(className).add(modelInstance);

			return modelInstance;
		},

		/**
		 * Resolves relations, if any
		 */
		resolveRelations: function(prehydratedResponse) {
			Object.each(prehydratedResponse, function(resource, resourceName) {
				if (typeOf(resource) === 'array') {
					resource.each(function(singleDocument) {
						singleDocument.$rels && Object.each(singleDocument.$rels, function(relValue, relKey){
							singleDocument[relKey] = this.fetchSingleRelation(resourceName + '.' + relKey, relValue);
						}, this);
						delete singleDocument.$rels;
					}.bind(this));
				} else {
					resource.$rels && Object.each(resource.$rels, function(relValue, relKey){
						resource[relKey] = this.fetchSingleRelation(resourceName + '.' + relKey, relValue);
					}, this);
					delete resource.$rels;
				}
			}, this);
		},

		/**
		 *
		 */
		fetchSingleRelation: function(path, relationValue) {
			var resourceName = this._currentResponse['rels'][path].type;
			var className = this.persistenceManager.getClassNameForResourceName(resourceName);
			if (!className) throw 'No instantiable class for resource "' + resourceName + '" could be found.';
			var repository = require('MooView/Domain/Repository/AbstractRepository').prototype.getRepositoryForEntity(className);

			var result;
			if (typeOf(relationValue) === 'array') {
				result = relationValue.map(function(value){ return this.fetchSingleRelation(path, value)}.bind(this));
			} else {
				result = repository.findByIdentifier(relationValue);
			}
			return result;
		},

		_getSetterNameForProperty: function(propertyName) {
			return 'set' + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
		}
	});
});
/*
---

script: AbstractRepository.js

name: AbstractRepository

description: An abstract view


requires:
  - MooView.PersistenceManager

provides: [MooView.Domain.Repository.AbstractRepository]


...
*/
define('MooView/Domain/Repository/AbstractRepository', ['MooView/PersistenceManager'], function(PersistenceManager){

	/**
	 * Contains a resolution to the Repository which is responsible for a particular entity.
	 * @type {{}}
	 */
	var repositoryManager = {};

	return new Class({

		/**
		 * The full qualified entity name this Repository is responsible for.
		 * Must be overridden in the concrete Repository class.
		 */
		entityName: undefined,

		/**
		 * A local cache where each method's return value can be cached in order to avoid hydration overhead etc
		 */
		resultCache: {},

		/**
		 */
		initialize: function() {
			Array.from(this.entityName).each(function(entityName){
				repositoryManager[entityName] = this;
			}.bind(this));
		},

		/**
		 *
		 */
		getRepositoryForEntity: function(entity) {
			return repositoryManager[entity];
		},

		/**
		 * Returns a single, hydrated Entity of the given identifier.
		 * Implement this in the concrete class.
		 * @param identifier
 		 * @param callback Optional callback to be invoked; must be used for asynchronously fetching of data
		 */
		findByIdentifier: function(identifier, callback) {
			var object = PersistenceManager.getObjectByIdentifier(identifier);
			callback && callback(object);
			return object;
		},

		/**
		 * Adds an object
		 */
		add: function(object) {
			console.log('adding to PM:', object);
			PersistenceManager.add(object);
		}
	});

});
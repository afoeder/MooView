/*
---

script: PersistenceManager.js

name: PersistenceManager

description: A persistence manager

requires:
  - MooView.Domain.ResponseHydrator

provides: [MooView.PersistenceManager]


...
*/
define('MooView/PersistenceManager', ['MooView/Domain/ResponseHydrator'], function(ResponseHydrator){

	return {

		/**
		 * This is a wrapper making sure sessionStorage is available and falling back to a local solution
		 */
		rawStorage: {
			_data: {},
			setItem: function(key, data) {
				if (sessionStorage) {
					var storageKey = 'MooViewRepositoryStorage:' + key;
					sessionStorage.setItem(storageKey, data);
					var expiryEntries = JSON.decode(sessionStorage.getItem('wishbase.expiries') || '{}');
					expiryEntries[storageKey] = new Date();
					sessionStorage.setItem('wishbase.expiries', JSON.encode(expiryEntries));
				} else {
					this._data[key] = data;
				}
			},
			getItem: function(key) {
				if (sessionStorage) {
					var storageKey = 'MooViewRepositoryStorage:' + key;
					var expiryEntries = JSON.decode(sessionStorage.getItem('wishbase.expiries') || '{}');
					if (expiryEntries[storageKey] && (new Date()).getTime() - (new Date(expiryEntries[storageKey])).getTime() > 1000 * 60 * 5) {
						sessionStorage.removeItem(storageKey);
					} else {
						return sessionStorage.getItem(storageKey) || undefined;
					}
				} else {
					return this._data[key];
				}
				return undefined;
			}
		},

		/**
		 * @type {{}}
		 */
		objectByIdentifierStorage: {},

		/**
		 * A key/value object where the entity names in document are resolved into the appropriate Class name, for example {posts: 'Foo.Acme.Post'}, and vice versa.
		 */
		resourceNameToClassMapping: {resources: {}, classNames: {}},

		/**
		 *
		 */
		registerResourceNameToClassMapping: function(resourceName, className) {
			this.resourceNameToClassMapping.resources[resourceName] = className;
			this.resourceNameToClassMapping.classNames[className] = resourceName;
		},

		getClassNameForResourceName: function(resourceName) {
			return this.resourceNameToClassMapping.resources[resourceName];
		},

		getObjectByIdentifier: function(identifier){
			return this.objectByIdentifierStorage[identifier];
		},

		add: function(object) {
			if (!object.id) throw 'The object given to add had no identifier';
			this.objectByIdentifierStorage[object.id] = object;
		},

		/**
		 * @param uri
		 * @param callback
		 */
		getData: function(uri, callback) {
			var data = this.rawStorage.getItem(uri);
			var responseHydrator = new ResponseHydrator();
			responseHydrator.persistenceManager = this;

			if (data === undefined && callback) {
				new Request.JSON({
					url: uri,
					onSuccess: function(responseJson, responseText) {
						this.rawStorage.setItem(uri, responseText);
						callback(responseHydrator.hydrate(responseJson));
					}.bind(this)
				}).get();
			} else if (data !== undefined) {
				var result = responseHydrator.hydrate(JSON.decode(data, true));
				callback && callback(result);
				return result;
			}
		},

		/**
		 * @param uri
		 * @param document
		 * @private
		 */
		setData: function(uri, data) {
			this.rawStorage.setItem(uri, JSON.encode(data));
		}
	}

});
/*
	All dependencies
 */
const Promise = require("promise");

/*
	Require other models
 */
const Facebook  = require("./Facebook").getInstance(),
      Pipedrive = require("./Pipedrive").getInstance(),
      Persons   = require("./Persons");


var Deals = (function () {
	
	return {
		create : create
	}
	
	// ------------------
	
	function create (data) {
		
		/*
			use a promise to get deals fields so we wait for the response before continuing.
		 */
		Pipedrive.get('/dealFields', {})
			.then(function (res) {
				/*console.log(JSON.stringify(res));*/
				/*console.log(JSON.stringify(res.data));*/
				if (res.data) {
					var keys = inArrayAtIndex('description', res.data, 'name');
					console.log(keys);	
				}
			})
			.catch(function (err) {
				console.error("dealFields error -- ",err);
			});
		
		
		/*var postdata = {
			title       : Object.keys(data.title)[0] + ", " + data.title[Object.keys(data.title)[0]],
			description : data.description,
			person_id   : Persons.personsList[data.sender_id],
			status      : "open"
		};
		
		Pipedrive.Deals.add(postdata, function (err, res) {
			if (err) {
				console.error(err);
			} else {
				console.log(res);
			}
		});*/
	}
	
	/**
	 * 
	 * @private
	 */
	function _getDealFields ()
	{
		return Pipedrive.get('/dealFields', {});
	}
	
	/**
	 *  This will return all array containing a specific value at an index.
	 *
	 * @param value
	 * @param list
	 * @param index
	 *
	 * @returns {*}
	 */
	function inArrayAtIndex (value, list, index)
	{
		var found = [];
		
		for (var i = 0; i < list.length; i++) {
			var e = list[i];
			
			if (e[index] == value) {
				found.push(e);
			}
		}
		
		return found;
	}
	
})();

module.exports = Deals;
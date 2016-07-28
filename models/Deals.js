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
	/*
 	 * There should be a function here to pass every message from fb to the description field 
 	 * inside PipedDrive. Note the field's description has a fixed id when using put, 
 	 * so use the API add field or update field to add something or create a new on with a different id
 	 * 
 	 * an options filed  filled with a JSON object. This are the field to mod:
 	 * {name: description (type string), field_type: text (type: enumerated), options" [' '] 'JSON string'}   
 	 * 
 	 * Result is a modified payload in id 12467 for PUT or 12470 for POST containing an extra object;
 	 *   "options": [
            {
                "id": 0,
                "label": "New Item" -> Can This label be used to pass the description we need?
            }
        ],

   * https://console.api.ai/api-client/#/agent/988c9e0b-0366-4080-82ec-0ce59ed8ac12/fulfillment
   * https://docs.api.ai/docs/webhook

   * Check the above and see if there is a way to post directly the api.ai data on the options field
   * for pipe drive
   * try to hook the  parameters coming from api.ai and pass them into options as array
   * it would be nice to pass the resolved queries, it contains all the info from the user's needs.      
	*/	

	// function addToDescription (data) {
	// 		Facebook
	// 		getSentMessages(response)
	// 		// .getUserProfile(data.sender_id)
	// 		.then(function (response) {
	// });

 //-------------------------


	function create (data) {
		
		/*
			* use a promise to get deals fields so we wait for the response before continuing.
			* Why are we getting the fields from deal, isn't the idea to post something in 
			* PipeDrive?
			* 
			* Should we get it first, transform it and then post it?
	  */
		Pipedrive.get('/dealFields', {})
			.then(function (res) {
				/*console.log(JSON.stringify(res));*/
				/*console.log(JSON.stringify(res.data));*/
				if (res.data) {
					var keys = inArrayAtIndex('description', res.data, 'name');
					var values = keys.value;
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
		// console.log(found);
	}
	
})();

module.exports = Deals;
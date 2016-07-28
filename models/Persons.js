/*
	All dependencies
 */
const Facebook  = require("./Facebook").getInstance(),
      Pipedrive = require("./Pipedrive").getInstance();


/**
 * @name Persons
 * @desc Allow to manage Persons (aka contacts) in pipedrive
 * 
 * @type {{create}}
 */
var Persons = (function () {
	
	var self = {
		personsList: {},
		create     : create,
		getPersons : getPersons
	}
	
	return self;
	
	// -------------------------------------
	
	/**
	 *
	 * @param data
	 */
	function create (data) {
		
		/*
			Get user facebook profile.
		 */
		Facebook
			.getUserProfile(data.sender_id)
			.then(function (response) {
				
				/*
				 * With response form Facebook's instance defined on top and 
				 * it's get user profile function defined in Facebook.js, let's
				 * create an object to create a persons inside PipeDrive
				 */
				var postdata = {
					name : response.first_name + " " + response.last_name

				};
				//console.log(postdata);
				// Create a person inside PipeDrive
				Pipedrive.post("/persons", {}, {}, postdata)
				         .then(function (res) {

					         self.personsList[data.sender_id] = res.id;
				         })
				         .catch(function (err) {
					        console.err(err); 
				         });
			})
			.catch(function (err) {
				console.err(err);
			});
	}
	
	/**
	 * 
	 * @param idPerson
	 */
	function getPersons (idPerson)
	{
		
	}
	
})();

module.exports = Persons;
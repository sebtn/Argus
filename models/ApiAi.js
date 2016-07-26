/*
	All dependencies
 */
const config = require("config"),
      apiai  = require("apiai");

/**
 * 
 * @type {{getInstance}}
 */
var ApiAi = (function () {
	
	var INSTANCE;
	
	function createInstance () {
		
		const LANGUAGE     = config.get("APIAI_LANGUAGE");
		const ACCESS_TOKEN = config.get("APIAI_ACCESS_TOKEN");
		
		var self = {
			LANGUAGE     : LANGUAGE.value,
			ACCESS_TOKEN : ACCESS_TOKEN.value,
			
			createService : createService,
		};
		
		return self;
		
		// ------------------------------
		
		/**
		 * 
		 */
		function createService () {
			self.service = apiai(ACCESS_TOKEN.value, { language : LANGUAGE.value, requestSource : "fb" });
		}
		
	}
	
	/**
	 * If INSTANCE isn't defined, then create an instance of ApiAi.
	 * If it is, then return the already existing instance.
	 * 
	 * @returns {*}
	 */
	function getInstance () {
		if (!INSTANCE) {
			INSTANCE = createInstance();
			
			INSTANCE.createService();
		}
		
		return INSTANCE;
	}
	
	/*
		Return ApiAi instance	
	 */
	return {
		getInstance : getInstance
	}
})();

module.exports = ApiAi;
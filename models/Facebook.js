/*
	All dependencies
 */
const config  = require("config"),
      request = require("request-promise");

/**
 * @name Facebook
 * @desc Singleton for Facebook. It will handle any request that needs to be made to Facebook.
 * 
 * @type {{getInstance}}
 */
var Facebook = (function () {
	// Why do we instantiate?
	var INSTANCE;
	
	function createInstance () {
		
		/*
			VARIABLES 
		 */
		const PAGE_ACCESS_TOKEN = config.get("FB_PAGE_ACCESS_TOKEN");
		const APP_SECRET        = config.get("FB_APP_SECRET");
		const VERIFY_TOKEN      = config.get("FB_VERIFY_TOKEN");
		
		var self = {
			// -- variables
			APP_SECRET        : APP_SECRET.value,
			PAGE_ACCESS_TOKEN : PAGE_ACCESS_TOKEN.value,
			VERIFY_TOKEN      : VERIFY_TOKEN.value,
			
			// -- functions
			getUserProfile   : getUserProfile,
			sendMessage      : sendMessage,
			getSentMessages  : getSentMessages,
			subscribeRequest : subscribeRequest
		};
		
		return self;
		
		// ------------------------------
		
		/**
		 *  Get the facebook profile of a user. 
		 * 
		 * @param idSender
		 */
		function getUserProfile (idSender) {
			return request(
				{
					method : "GET",
					uri    : "https://graph.facebook.com/v2.6/" + idSender,
					qs     : {
						fields       : "first_name,last_name,profile_pic,locale,timezone,gender",
						access_token : PAGE_ACCESS_TOKEN.value
					},
					json   : true
				}
			);
		}
		
		/**
		 * Send a message to facebook. 
		 * 
		 * @param postdata: { recipient : { id : VALUE }, message : VALUE }
		 *
		 * is the callSendAPI in fb app.js code, but is also similar to the function SndFBMessage
		 * in the api.ai code.
		 * here we are adding a form to the json object: postdata which is also the params.
		 * 
		 * postdata is defined in Persons.js -> name : response.first_name + " " + response.last_name
		 * Is postdata the same?
		 */
		function sendMessage (postdata) {
			return request(
				{
					method : "POST",
					url    : "https://graph.facebook.com/v2.6/me/messages",
					qs     : {
						access_token : PAGE_ACCESS_TOKEN.value
					},
					form   : postdata,
					json   : true
				}
			);
		}		

		function getSentMessages (postdata) {
			return request(
				{
					method : "GET",
					url    : "https://graph.facebook.com/v2.6/me/messages",
					qs     : {
						access_token : PAGE_ACCESS_TOKEN.value
					},
					form   : postdata,
					json   : true
				}
			);
		}
		
		/**
		 *  Will subscribe our Bot to the facebook page
		 *  This is replacing the curl we used to do.
		 */
		function subscribeRequest () {
			return request(
				{
					method : "POST",
					uri    : "https://graph.facebook.com/v2.6/me/subscribed_apps",
					qs     : {
						access_token : PAGE_ACCESS_TOKEN.value
					},
					json   : true
				}
			);
		}
		
	}
	
	/**
	 * Handle Instance subscription
	 * 
	 * @private
	 */
	function _doSubscription() {
		var req = INSTANCE.subscribeRequest();
		
		req.then(function (res) {
			if (res.success) {
				console.log("Application is subscribe to facebook");
			} else {
				console.log("Application couldn't be subscribe");
			}
		});
	}
	
	/**
	 * Get Facebook instance
	 * 
	 * @returns {*}
	 */
	function getInstance () {
		if (!INSTANCE) {
			INSTANCE = createInstance();
			
			_doSubscription();
		}
		
		return INSTANCE;
	}
	
	/*
		Return getInstance function
	 */
	return {
		getInstance : getInstance
	};
})();

module.exports = Facebook;
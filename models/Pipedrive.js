/*
	All dependencies
 */
const config    = require("config"),
      request   = require("request-promise");

var Pipedrive = (function () {
	
	var INSTANCE;
	
	function createInstance () {
		
		var API_TOKEN = config.get("PIPEDRIVE_ACCESS_TOKEN");
		var BASE_URL  = "https://api.pipedrive.com/v1";
		
		var self = {
			API_TOKEN : API_TOKEN.value,
			
			get    : getRequest,
			post   : postRequest,
			put    : putRequest,
			delete : deleteRequest
		};
		
		return self;
		
		// --------------------------------
		
		function deleteRequest ()
		{
			
		}
		
		/**
		 * 
		 * @param uri
		 * @param uriparams
		 * @param qsparams
		 */
		function getRequest (uri, uriparams, qsparams)
		{
			return request(
				{
					method : "GET",
					uri    : _buildUri(uri, uriparams),
					qs     : _buildQsParam(qsparams),
					json   : true
				}
			);
		}
		
		/**
		 * 
		 * @param uri
		 * @param uriparams
		 * @param qsparams
		 * @param postdata
		 */
		function postRequest (uri, uriparams, qsparams, postdata)
		{
			var fullUri    = _buildUri(uri, uriparams);
			var fullParams = _buildQsParam(qsparams);
			
			return request(
				{
					method : "POST",
					uri    : fullUri,
					qs     : fullParams,
					json   : true,
					body   : postdata
				}
			);
		}
		
		function putRequest ()
		{
			
		}
		
		/**
		 * 
		 * @param uri
		 * @param params
		 * @returns {*}
		 * params is an object api_token : API_TOKEN.value
		 * @private
		 */
		function _buildUri (uri, params) 
		{
			var uri = BASE_URL + uri;
			
			for (var _i in params) {
				var el = params[_i];
				
				uri.replace(":" + _i, el);
			}
			
			return uri;
		}
		
		/**
		 * 
		 * @param params
		 * @returns {*}
		 * @private
		 */
		function _buildQsParam (params) 
		{
			if (_isObject(params)) {
				params.api_token = API_TOKEN.value;
			} else {
				params = {
					api_token : API_TOKEN.value
				};
			}
			
			return params;
		}
		
		/**
		 * Check if variable is an object
		 * 
		 * @param variable
		 * @returns {boolean}
		 * @private
		 */
		function _isObject (variable)
		{
			if (variable !== null && typeof variable === 'object') {
				return true;
			}
			
			return false;
		}
	}
	
	/**
	 * Get Pipedrive instance
	 *
	 * @returns {*}
	 */
	function getInstance () {
		if (!INSTANCE) {
			INSTANCE = createInstance();
		}
		
		return INSTANCE;
	}
	
	/*
		
	 */
	return {
		getInstance : getInstance
	};
})();

module.exports = Pipedrive;
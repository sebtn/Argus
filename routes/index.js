
module.exports = function (app) {
	
	/**
	 *  Default route 
	 */
	app.get(
		'/', function (req, res) {
			res.send("Pipedrive Bot server up & running");
		}
	);
	
}
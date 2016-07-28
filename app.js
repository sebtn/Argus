/*
	Require all dependencies
 */

const config     = require("config");
const express    = require("express");
const bodyParser = require("body-parser");
const crypto     = require("crypto");
const request    = require('request');
const async      = require("async");

/*
	Get Facebook instance. 
	It will also subscribe our application to the facebook page.
	Note that all facebook related configuration can be took from the Facebook object.
 */
const Facebook = require("./models/Facebook").getInstance();

/*
	Set up application
 */
const app = express();

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json({ verify : verifyRequestSignature }));

/*
 | ------------------------------------------------------------------------------
 |  ROUTING
 | ------------------------------------------------------------------------------
 */
require("./routes/index")(app);
require("./routes/webhook")(app);

/*
 | ------------------------------------------------------------------------------
 |  USEFULL FUNCTIONS
 | ------------------------------------------------------------------------------
 */
/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 */
function verifyRequestSignature (req, res, buf) {
	var signature = req.headers["x-hub-signature"];
	
	if (!signature) {
		// For testing, let's log an error. In production, you should throw an 
		// error.
		console.error("Couldn't validate the signature.");
	} else {
		var elements      = signature.split('=');
		var method        = elements[0];
		var signatureHash = elements[1];
		
		var expectedHash = crypto.createHmac('sha1', Facebook.APP_SECRET)
		                         .update(buf)
		                         .digest('hex');
		
		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

/*
 | ------------------------------------------------------------------------------
 |  START SERVER
 | ------------------------------------------------------------------------------
 */

app.listen(
	app.get('port'), function () {
		console.log('Node app is running on port', app.get('port'));
	}
);

module.exports = app;
/*
	Require dependencies
 */
const async     = require("async"),
      uuid      = require("node-uuid"),
      request   = require('request');

const sessionIds = new Map();

/*
	Require models
 */
const 
// Facebook     = require("../models/Facebook").getInstance(),
      ApiAi        = require("../models/ApiAi").getInstance(),
      ApiAiService = ApiAi.service,
      Persons      = require("../models/Persons"),
      config       = require("config"),
      Deals        = require("../models/Deals");

const PAGE_ACCESS_TOKEN = config.get("FB_PAGE_ACCESS_TOKEN");

/*
	Module
 */
module.exports = function (app) {
	
	app.get(
		"/webhook", function (req, res) {
			if (req.query['hub.mode'] === 'subscribe' &&
				req.query['hub.verify_token'] === Facebook.VERIFY_TOKEN) {
				
				res.status(200).send(req.query['hub.challenge']);
				
				setTimeout(function () {
					Facebook.subscribeRequest();
				}, 3000);
			} else {
				console.error("Failed validation. Make sure the validation tokens match.");
				res.sendStatus(403);
			}
		}
	);
	
	app.post(
		"/webhook", function (req, res) {
			var data = req.body;
			
			if (data.object == 'page') {
				data.entry.forEach(function (pageEntry) {
					
					pageEntry.messaging.forEach(function (messagingEvent) {
						processFbEvent(messagingEvent);
					});
				});
				
				return res.status(200).json({ status: "ok" });
			}
		}
	);
	
	/**
	 *
	 * @param event
	 */

	function processFbEvent (event)
	{
		var sender = event.sender.id.toString();

	    if ((event.message && event.message.text) || (event.postback && event.postback.payload)) {
	    var text = event.message ? event.message.text : event.postback.payload;
	    // Handle a text message from this sender

	    if (!sessionIds.has(sender)) {
	        sessionIds.set(sender, uuid.v1());
	    }
			console.log("Text", text);

			// create request
			var apiaiRequest = ApiAiService.textRequest(text,
            {
                sessionId: sessionIds.get(sender)
            });
			
			apiaiRequest.on("response", function (response) {
				var result = response.result;
				
				//Api.ai defined
				if (result) {
					var responseText = result.fulfillment.speech;
					var responseData = result.fulfillment.data;
					var action       = result.action;
					
					if (isDefined(responseData) && isDefined(responseData.facebook)) {
                    if (!Array.isArray(responseData.facebook)) {
                        try {
                            console.log('Response as formatted message');
                            sendFBMessage(sender, responseData.facebook);
                        } catch (err) {
                            sendFBMessage(sender, {text: err.message});
                        }
                    } else {
                        responseData.facebook.forEach((facebookMessage) => {
                            try {
                                if (facebookMessage.sender_action) {
                                    console.log('Response as sender action');
                                    sendFBSenderAction(sender, facebookMessage.sender_action);
                                }
                                else {
                                    console.log('Response as formatted message');
                                    sendFBMessage(sender, facebookMessage);
                                }
                            } catch (err) {
                                sendFBMessage(sender, {text: err.message});
                            }
                        });
                    }
                } else if (isDefined(responseText)) {
                    console.log('Response as text message');
                    // facebook API limit for text length is 320,
                    // so we must split message if needed
                    var splittedText = splitResponse(responseText);

                    async.eachSeries(splittedText, (textPart, callback) => {
                        sendFBMessage(sender, {text: textPart}, callback);
                    });
                }

            }
        });

        apiaiRequest.on('error', (error) => console.error(error));
        apiaiRequest.end();
    }
}

function sendFBMessage(sender, messageData, callback) {
    return request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: PAGE_ACCESS_TOKEN.value},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, (error, response, body) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }

        if (callback) {
            callback();
        }
    });
}

unction sendFBMessage(sender, messageData, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: PAGE_ACCESS_TOKEN.value},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, (error, response, body) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }

        if (callback) {
            callback();
        }
    });
}

function sendFBSenderAction(sender, action, callback) {
    setTimeout(() => {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: PAGE_ACCESS_TOKEN.value},
            method: 'POST',
            json: {
                recipient: {id: sender},
                sender_action: action
            }
        }, (error, response, body) => {
            if (error) {
                console.log('Error sending action: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            if (callback) {
                callback();
            }
        });
    }, 1000);
}

function doSubscribeRequest() {
    request({
            method: 'POST',
            uri: "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + PAGE_ACCESS_TOKEN.value
        },
        (error, response, body) => {
            if (error) {
                console.error('Error while subscription: ', error);
            } else {
                console.log('Subscription result: ', response.body);
            }
        });
}
	
function splitResponse(str) {
	if (str.length <= 320)
	{
		return [str];
	}
	
	var result = chunkString(str, 300);
	
	return result;
	
}
	
function chunkString(s, len) {
	var curr = len, prev = 0;
	
	var output = [];
	
	while(s[curr]) {
		if(s[curr++] == ' ') {
			output.push(s.substring(prev,curr));
			prev = curr;
			curr += len;
		}
		else
		{
			var currReverse = curr;
			do {
				if(s.substring(currReverse - 1, currReverse) == ' ')
				{
					output.push(s.substring(prev,currReverse));
					prev = currReverse;
					curr = currReverse + len;
					break;
				}
				currReverse--;
			} while(currReverse > prev)
		}
	}
	output.push(s.substr(prev));
	return output;
}

function isDefined(obj) {
  if (typeof obj == 'undefined') { return false;}
  if (!obj) { return false; }
  return obj != null;
	}
}
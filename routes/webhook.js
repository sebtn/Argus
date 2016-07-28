/*
	Require dependencies
 */
const async     = require("async"),
      uuid      = require("node-uuid");

/*
	Require models
 */
const Facebook     = require("../models/Facebook").getInstance(),
      ApiAi        = require("../models/ApiAi").getInstance(),
      ApiAiService = ApiAi.service,
      Persons      = require("../models/Persons"),
      Deals        = require("../models/Deals");
/*

 */
var sessionIds = {};

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
		
		
		if (event.message && event.message.text) {
			var textMessage = event.message.text;
			
			sessionIds[sender] = uuid.v1();
			
			// create request
			var apiaiRequest = ApiAiService.textRequest(textMessage, { sessionId : sessionIds[sender] });
			
			apiaiRequest.on("response", function (res) {
				var result = res.result;
				
				if (result) {
					var responseText = result.fulfillment.speech;
					var responseData = result.fulfillment.data;
					var action       = result.action;
					
					if (action) {
						var data = {
							sender_id     : sender,
							response_data : responseData
						};
						
						action = action.split(".");
						
						switch(action[0]) {
							case 'deals' :
								data.title       = result.parameters.title;
								data.description = result.parameters.description;
								data.description = result.resolvedQuery;

								
								Deals[action[1]](data);
								console.log(Deals[action[1]](data));
								break;
							case 'persons':
								Persons[action[1]](data);
								break;
						}
					}
					
					var messageData = {
						recipient : { id : sender },
						message   : null
					};
					
					if (responseData && responseData.facebook) {
						try {
							messageData.message = responseData.facebook;
							
							Facebook.sendMessage(messageData);
						} catch (err) {
							messageData.message = { text : err.message };
							
							Facebook.sendMessage(messageData);
						}
					} else if (responseText) {
						var splittedText = splitResponse(responseText);
						
						async.eachSeries(
							splittedText, function (textPart, callback) {
								messageData.message = { text : textPart };
								
								Facebook.sendMessage(messageData)
									.then(function (res) {
										callback();
									});
							}
						);
					}
				}
				
			});
			
			apiaiRequest.on("error", function (err) {
				console.log(err);
			});
			
			apiaiRequest.end();
		}
	}
	
	function splitResponse(str) {
		if (str.length <= 320)
		{
			return [str];
		}
		
		var result = chunkString(str, 300);
		
		return result;
		
	}
	
	function chunkString(s, len)
	{
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
}
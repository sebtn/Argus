'use strict'

const async = require('async')
const uuid = require('node-uuid')
const request = require('request')

const apiai = require('apiai')
const express = require('express')
const bodyParser = require('body-parser')
const JSONbig = require('json-bigint')

const REST_PORT = (process.env.PORT || 5000)
const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN
const APIAI_LANG = process.env.APIAI_LANG || 'fr'
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN
const FB_APP_SECRET = process.env.FB_APP_SECRET

const apiAiService = apiai(APIAI_ACCESS_TOKEN, {language: APIAI_LANG, requestSource: 'fb'})
const sessionIds = new Map()

/*
 | ------------------------------------------------------------------------------
 |  START APIAi exchange
 | ------------------------------------------------------------------------------
 */
function processEvent (event) {
  var sender = event.sender.id.toString()

  if ((event.message && event.message.text) || (event.postback && event.postback.payload)) {
    var text = event.message ? event.message.text : event.postback.payload
    // Handle a text message from this sender
    if (!sessionIds.has(sender)) {
      sessionIds.set(sender, uuid.v1())
    }
    console.log('Text', text)
    let apiaiRequest = apiAiService.textRequest(text,
      {
        sessionId: sessionIds.get(sender)
      })

    apiaiRequest.on('response', function (response) {
      if (isDefined(response.result)) {
        let responseText = response.result.fulfillment.speech
        let responseData = response.result.fulfillment.data
        let action = response.result.action

        console.log('response from apiAi: ', response)

        if (isDefined(responseData) && isDefined(responseData.facebook)) {
          if (!Array.isArray(responseData.facebook)) {
            try {
              console.log('Response as formatted message')
              sendFBMessage(sender, responseData.facebook)
            } catch (err) {
              sendFBMessage(sender, {text: err.message})
            }
          } else {
            responseData.facebook.forEach((facebookMessage) => {
              try {
                if (facebookMessage.sender_action) {
                  console.log('Response as sender action')
                  sendFBSenderAction(sender, facebookMessage.sender_action)
                } else {
                  console.log('Response as formatted message')
                  sendFBMessage(sender, facebookMessage)
                }
              } catch (err) {
                sendFBMessage(sender, {text: err.message})
              }
            })
          }
        } else if (isDefined(responseText)) {
          console.log('Response as text message')
          // facebook API limit for text length is 320,
          // so we must split message if needed
          var splittedText = splitResponse(responseText)

          async.eachSeries(splittedText, (textPart, callback) => {
            sendFBMessage(sender, {text: textPart}, callback)
          })
        }
      }
    })

    apiaiRequest.on('error', (error) => console.error(error))
    apiaiRequest.end()
  }
}

function splitResponse (str) {
  if (str.length <= 320) {
    return [str]
  }

  return chunkString(str, 300)
}

function chunkString (s, len) {
  var curr = len, prev = 0

  var output = []

  while (s[curr]) {
    if (s[curr++] === ' ') {
      output.push(s.substring(prev, curr))
      prev = curr
      curr += len
    } else {
      var currReverse = curr
      do {
        if ( s.substring (currReverse - 1, currReverse) === ' ') {
          output.push(s.substring(prev, currReverse))
          prev = currReverse
          curr = currReverse + len
          break
        }
        currReverse--
      } while (currReverse > prev)
    }
  }
  output.push(s.substr(prev))
  return output
}

/*
 | ------------------------------------------------------------------------------
 |  START FB Exchange
 | ------------------------------------------------------------------------------
 */
function sendFBMessage (sender, messageData, callback) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending message: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
    if (callback) {
      callback()
    }
  })
// Make the relation with the get user profile method, passing the sender as parameter
  getUserProfile(sender)
}

function sendFBSenderAction (sender, action, callback) {
  setTimeout(() => {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: FB_PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},
        sender_action: action
      }
    }, (error, response, body) => {
      if (error) {
        console.log('Error sending action: ', error)
      } else if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
      if (callback) {
        callback()
      }
    })
  }, 1000)
}

function doSubscribeRequest () {
  request({
    method: 'POST',
    uri: 'https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=' + FB_PAGE_ACCESS_TOKEN
  },
  (error, response, body) => {
    if (error) {
      console.error('Error while subscription: ', error)
    } else {
      console.log('Subscription result: ', response.body)
    }
  })
}

function isDefined (obj) {
  if (typeof obj === 'undefined') {
    return false
  }
  if (!obj) {
    return false
  }

  return obj != null
}

/*
 | ------------------------------------------------------------------------------
 |  Get info form FB API
 | ------------------------------------------------------------------------------
 */

function getUserProfile (idSender) {
  request({
    method: 'GET',
    url: 'https://graph.facebook.com/v2.6/' + idSender,
    qs: {
      fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
      access_token: FB_PAGE_ACCESS_TOKEN
    },
    json: true
  }, function (error, response, body) {
    if (error) {
      console.log(error)
    } else {
      // This response is from other call to the function where the sender
      // is present as aparameter in another function.
      console.log('This is sender info from fb:  ', response.body)
    }
  })
}

/*
 | ------------------------------------------------------------------------------
 |  START APP
 | ------------------------------------------------------------------------------
 */
const app = express()

app.use(bodyParser.text({type: 'application/json'}))

app.get('/webhook/', (req, res) => {
  if (req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge'])

    setTimeout(() => {
      doSubscribeRequest()
    }, 3000)
  } else {
    res.send('Error, wrong validation token')
  }
})

app.post('/webhook/', (req, res) => {
  try {
    var data = JSONbig.parse(req.body)

    if (data.entry) {
      let entries = data.entry
      entries.forEach((entry) => {
        let messaging_events = entry.messaging
        if (messaging_events) {
          messaging_events.forEach((event) => {
            if (event.message && !event.message.is_echo ||
            event.postback && event.postback.payload) {
              processEvent(event)
            }
          })
        }
      })
    }

    return res.status(200).json({
      status: 'ok'
    })
  } catch (err) {
    return res.status(400).json({
      status: 'error',
      error: err
    })
  }
})

app.listen(REST_PORT, () => {
  console.log('Rest service ready on port ' + REST_PORT)
})

doSubscribeRequest()

function verifyRequestSignature (req, res, buf) {
  var signature = req.headers['x-hub-signature']

  if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
    console.error("Couldn't validate the signature.")
  } else {
    var elements = signature.split('=')
    var method = elements[0]
    var signatureHash = elements[1]

    var expectedHash = crypto.createHmac('sha1', Facebook.APP_SECRET)
                                 .update(buf)
                                 .digest('hex')

    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.")
    }
  }
}

/*
 | ------------------------------------------------------------------------------
 |  START SERVER
 | ------------------------------------------------------------------------------
 */
app.get(
    '/', function (req, res) {
      res.send('Pipedrive Bot server up & running')
    }
)

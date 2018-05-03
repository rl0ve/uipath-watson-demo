/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var request = require('request'); // for http request
var basicAuth = require('basic-auth-connect'); // for basic auth
var bodyParser = require('body-parser'); // parser for post requests
var watson = require('watson-developer-cloud'); // watson sdk
var log4js = require('log4js');

log4js.configure('log4js.config.json');

var logger = log4js.getLogger('system');

logger.info('started');

var app = express();

// Basic Auth

app.use(basicAuth(process.env.AUTH_USERNAME, process.env.AUTH_PASSWORD));

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

var assistant = new watson.AssistantV1({
  // If unspecified here, the ASSISTANT_USERNAME and ASSISTANT_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  username: process.env.ASSISTANT_USERNAME || '<username>',
  password: process.env.ASSISTANT_PASSWORD || '<password>',
  version: '2018-02-16'
});

// Endpoint to be call for IBM Watson
app.post('/api/message', function(req, res) {
  logger.info('/api/message is called');

  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the assistant service
  assistant.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(updateMessage(payload, data));
  });
});

// Endpoint to be called for UiPath Orchestrator
app.post('/api/queue', function(req, res){
  logger.info('/api/queue is called');

  var json_body = null;
  var token = null;
  var queueName = req.body.queueName;

  logger.info('queueName: ' + queueName);

  // Authentication
  var headers = {
    'Content-Type': 'application/json'
  }

  var options = {
    url: process.env.UIPATH_AUTH_ENDPOINT,
    method: 'POST',
    headers: headers,
    form: {
      tenancyName: process.env.UIPATH_AUTH_TENANT,
      usernameOrEmailAddress: process.env.UIPATH_AUTH_USERNAME,
      password: process.env.UIPATH_AUTH_PASSWORD
    }
  }

  logger.info('send request for auth');

  request(options, function (error, response, body){
    json_body = JSON.parse(body);
    token = json_body.result;

    if (!error && response.statusCode == 200){

      // Add Queue Item
      var headers = {
        'Authorization': 'Bearer '+ token,
        'Content-Type': 'application/json'
      }
      var options = {
        url: process.env.UIPATH_QUEUE_ENDPOINT,
        method: 'POST',
        headers: headers,
        json: true,
        body: {
          itemData: {
            Name: queueName,
            Priority: process.env.UIPATH_QUEUE_PRIORITY,
            SpecificContent: {
              ParamA: 'dummy',
              ParamB: 'dummy',
              ParamC: 'dummy'
            },
            DeferDate: null,
            DueDate: null,
            Reference: 'demo process'
          }
        }
      }

      logger.info('add queue item');

      request(options, function (error, response, body){
        logger.info('body: '+ JSON.stringify(body));
      });
    }
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {

  logger.info("updateMessage started");

  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    
    logger.info("response.output.text = "+response.output.text);

    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;

  logger.info("responseText = "+responseText);

  return response;
}

module.exports = app;

const https = require('https');
const JsonResponse = require('./response');
const SecretsManager = require('./SecretsManager.js');

var secretName = 'mailerliteSecret';
var region = 'us-east-1';
var apiValue = await SecretsManager.getSecret(secretName, region);

const defaultOptions = {
    host: 'connect.mailerlite.com',
    port: 443,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiValue}`,
    }
}

const post = (path, payload) => new Promise((resolve, reject) => {
    const options = { ...defaultOptions, path, method: 'POST' };
    const req = https.request(options, res => {
        let buffer = "";
        res.on('data', chunk => buffer += chunk)
        res.on('end', () => resolve(JSON.parse(buffer)))
    });
    req.on('error', e => reject(e.message));
    req.write(JSON.stringify(payload));
    req.end();
})

exports.handler = async (event) => {
    const postData = JSON.parse(event.body);
    const response = await post("/api/subscribers", postData);
    let lamdaResponse = new JsonResponse(200, response);
    return lamdaResponse.build();
  };
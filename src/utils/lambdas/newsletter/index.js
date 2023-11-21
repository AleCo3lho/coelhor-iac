const https = require('https');
const JsonResponse = require('./response');
const SecretsManager = require('./secretsManager.js');

const defaultOptions = {
    host: 'connect.mailerlite.com',
    port: 443,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': '',
    }
}

const post = (path, payload) => new Promise(async (resolve, reject) => {
    const secretName = 'mailerliteSecret';
    const region = 'us-east-1';
    const apiValue = await SecretsManager.getSecret(secretName, region);
    console.log(apiValue)
    defaultOptions.headers.Authorization = `Bearer ${apiValue}`
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
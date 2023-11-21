const https = require('https');
const JsonResponse = require('./response');

import {
    SecretsManagerClient,
    GetSecretValueCommand,
  } from "@aws-sdk/client-secrets-manager";

const secret_name = "mailerliteSecret";
const client = new SecretsManagerClient({
    region: "us-east-1",
});

let responseSecret;

try {
    responseSecret = await client.send(
        new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
);
} catch (error) {
    throw error;
}

const token = responseSecret.SecretString;

const defaultOptions = {
    host: 'connect.mailerlite.com',
    port: 443,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
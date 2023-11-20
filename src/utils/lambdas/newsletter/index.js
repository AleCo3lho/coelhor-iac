const https = require("https");
const myDomain = process.env.DOMAIN;
const key = process.env.KEY;
const group = process.env.GROUP;

const defaultOptions = {
  host: "connect.mailerlite.com",
  port: 443,
  headers: {
    "Content-Type": "application/json",
    Authorization: key,
  },
};

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const options = { ...defaultOptions, path, method: "POST" };
    const req = https.request(options, (res) => {
      let buffer = "";
      res.on("data", (chunk) => (buffer += chunk));
      res.on("end", () => resolve(JSON.parse(buffer)));
    });
    req.on("error", (e) => reject(e.message));
    req.write(payload);
    req.end();
  });
}

function generateResponse(code, payload) {
  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Origin": myDomain,
      "Access-Control-Allow-Headers": "x-requested-with",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(payload),
  };
}

function generateError(code, err) {
  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Origin": myDomain,
      "Access-Control-Allow-Headers": "x-requested-with",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(err.message),
  };
}

module.exports.handler = async (event) => {
  try {
    const data = await post("/api/subscribers", event.body);
    return generateResponse(200, data);
  } catch (err) {
    return generateError(500, err);
  }
};

const https = require('https');
const JsonResponse = require('./response');

const defaultOptions = {
    host: 'connect.mailerlite.com',
    port: 443,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiOTM3NDc0NTNkNGNkYjM3MzI2ODY4ZjVmZThlM2RmMGQ1ZWJiODVhYmY2OWNjYjc5NzcxMzJhN2Y0NjgxYzU2NjAyNmE2MjdmOTU5MmMyZjUiLCJpYXQiOjE3MDA1MDM5MTIuNjQ5Mzc5LCJuYmYiOjE3MDA1MDM5MTIuNjQ5MzgyLCJleHAiOjQ4NTYxNzc1MTIuNjMwODQyLCJzdWIiOiI3MTk4MzciLCJzY29wZXMiOltdfQ.onG5hHV7oPgZuCmrAleEQvFP5ONglLBSuAYXCBGKDt0Z0Wwab5-6LsNkC5fKAj3QbsS7kKUVUkM7n6g6FySWWfZv9rr7_gmI27J4v6dDSG0-vLV4lcmJwhoqm311JWjKJhzABLe6Q6zqFBKPy60xxC_f1Qu2WPSvX3AGJ3pMKO0ANHdreEgFEUQFGRLkkgKgnlLgeJMxJlSsMMHXXp850-jUh3OIVUdDig7MHW94bjATl8z4zeeuK1T0EGknptEqte0cKjSxxPReijTCaLsgq_CVbI5MSouWNU7yOSna_GBWIEHE0IWXjnKXzQxTS2PP6-A68SmE1MlXGHii7Sf6NMkwdZmtOuAXt1tsfUcVfTvb4HCCyLgXz_S0VdAhXQo-Nx_CJ5fmNTf94rEw9bGrZ32h2gZ0U5S7UwjS5QU_5WF7NXOLyFvF2QS5ZrvcgUsEcoZKReR-a71Ok8CdbnPzEFF9elS7zq1Y9HhojTJXp1YLisifNPzhZTVJzMokf1DRt-jP8OfNZbwQOcKsmeA-xOUb7f-zc9XehfKOtO9XcFMV1Lfh6a0u9Hc5RG7vJ56A2fVX78Q-Csm40za-SmaVx_VyYmqnU864Dc44DtHrSvb_5FvdgKZcAmQzdzzp_Atj9hR6MvG3wg5N2NxmIOz1uShVV6kHpU1yJK6PHbwsSUc',
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
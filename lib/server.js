/**
 * Main Server File
 * Created On Dec 18 2018
 * By Rapahel Osaze Eyerin
 */

const http = require('http');
const https = require('https');
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const url = require('url');
const path = require('path');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;

// Declare and initialize server
const server = {};

// httpServer
server.httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

server.httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsOptions, (req, res) => {
  unifiedServer(req, res);
});

// This function intercepts both http and https request
function unifiedServer(req, res) {
  // headers from the incoming request
  let headers = req.headers;
  // incoming request method
  let method = req.method.toLowerCase();
  // Parse url
  let parseUrl = url.parse(req.url, true);
  // path request by the visitor
  let path = parseUrl.pathname;
  // Trim the path and remove slashes
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');
  // Get the query string as an object
  let queryStringObject = parseUrl.query;

  // Get incoming data
  const decoder = new StringDecoder('utf-8');
  let buffer = "";

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    console.log('Path', trimmedPath);
    console.log('query', queryStringObject);
    console.log('headers', headers);
    console.log('path', path);
    console.log('Incoming data', buffer);

    let data = {
      headers,
      trimmedPath,
      queryStringObject,
      method,
      path,
      'payload': helpers.parseJsonToObject(buffer)
    };

    const chooseHandler = typeof(server.routes[trimmedPath]) !== 'undefined' ? server.routes[trimmedPath]: handlers.notfound;

    chooseHandler(data, (statusCode, payload) => {
      // Check for status code if not defined return 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // use the payload called back or default to empty
      payload = typeof(payload) === 'object' ? payload : {};
      let payloadString = JSON.stringify(payload);
      
      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });

  });
}

server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[33m%s\x1b[0m', `Server listening of PORT ${config.httpPort}`);
  });

  server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[33m%s\x1b[0m', `Https Server listening of PORT ${config.httpsPort}`);
  });
};

server.routes = {
  'ping': handlers.ping,
  'users': handlers.users,
  'carts': handlers.carts,
  'items': handlers.items,
  'orders': handlers.orders,
  'tokens': handlers.tokens
}

module.exports = server;
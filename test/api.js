const assert = require('assert');
const app = require('../index');
const http = require('http');
const config = require('../lib/config');

let api = {};

let sendRequest = (path, callback) => {
   let options = {
     'protocol': 'http:',
     'host': 'localhost',
     'port': config.httpPort,
     'method' : 'GET',
     'path': path,
     'headers': {
       'Content-Type': 'application/json'
     }
   }

   let req = http.request(options, (res) => {
     callback(res);
   });

   req.on('error', (err) => {

   });

   req.on('close', () => {

   });

   req.end();
}

// The main init() function should be able to run without throwing.
api['app.init should start without throwing'] = (done) => {
  assert.doesNotThrow(() => {
    app.init((err) => {
      done();
    });
  }, TypeError);
};

// Make a request to /ping
api['/ping should respond to GET with 200'] = (done) => {
  sendRequest('/ping', (res) => {
    assert.equal(res.statusCode, 200);
    done();
  });
};

// Make a request to a random path
api['A random path should respond to GET with 404'] = (done) => {
  sendRequest('/this/path/shouldnt/exist', (res) => {
    assert.equal(res.statusCode, 404);
    done();
  });
};

module.exports = api;
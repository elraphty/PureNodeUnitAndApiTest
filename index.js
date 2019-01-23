/**
 * Index file
*/

const server = require('./lib/server');

const app = {};

app.init = (callback) => {
  server.init();
  callback();
}

// Self invoking only if required directly
if(require.main === module) {
  app.init(() => {});
} 

module.exports = app;
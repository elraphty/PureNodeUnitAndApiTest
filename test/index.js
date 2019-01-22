// Set Node environment to testing
process.env.NODE_ENV = 'testing';

const unit = require('./unit');
const api = require('./api');

let app = {};

app.unit = unit;
app.api = api;

const assert = require('assert');
const helpers = require('../lib/helpers');
const data = require('../lib/data');

let unit = {};

unit['handle.addNumber it should return number + 10'] = function(done) {
    let number = 3;
    assert.equal(helpers.Add(number), number + 10);
    done();
}

unit['handle.getNumber it should return a number'] = function(done) {
    assert.equal(typeof(helpers.Add()), 'number');
    done();
}

unit['handle.parseObject it should return an empty object'] = function(done) {
    assert.ok(typeof(helpers.parseJsonToObject()) === 'object')
    done();
}

unit['handle.string it should return a string (its an error)'] = function(done) {
    assert.ok(typeof(helpers.parseJsonToObject()) === 'string')
    done();
}

unit['handle.generateToken it should return a string of length of number'] = function(done) {
    let number = 30;
    assert.equal(helpers.generateToken(30).length, number);
    done();
}

module.exports = unit;
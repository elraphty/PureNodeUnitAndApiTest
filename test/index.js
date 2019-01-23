// Set Node environment to testing
process.env.NODE_ENV = 'testing';

const unit = require('./unit');
const api = require('./api');

let _app = {};

_app.test = {};

_app.test.unit = unit;
_app.test.api = api;

_app.countTest = function() {
  let counter = 0;
  for(let key in _app.test) {
    if(_app.test.hasOwnProperty(key)) {
      let subTest = _app.test[key];
      for(let testName in subTest) {
        if(subTest.hasOwnProperty(testName)) {
          counter++;
        }
      }
    }
  }
  return counter;
}

_app.runTest = function() {
  let successes = 0;
  let errors = [];
  let limit = _app.countTest();
  let counter = 0;

  for(let key in _app.test) {
    if(_app.test.hasOwnProperty(key)) {
      let subTest = _app.test[key];
      for(let test in subTest) {
        if(subTest.hasOwnProperty(test)) {
          // Call the test
          (function(){
            let testName = test;
            let testValue = subTest[testName];
            try {
              testValue(function() {
                // If it calls back without throwing, then it succeeded, so log it in green
                console.log('\x1b[32m%s\x1b[0m', testName);
                successes ++;
                counter ++;
                if(counter === limit) {
                  _app.processTest(limit, successes, errors);
                }
              })
            } catch(e) {
              // push to error array
              errors.push({
                'name': testName,
                'error': e
              });
              console.log('\x1b[31m%s\x1b[0m', testName);
              counter++;
              if(counter === limit) {
                _app.processTest(limit, successes, errors);
              }
            }
          })()
        }
      }
    }
  }
}

_app.processTest = function(limit, successes, errors) {
  console.log('')
  console.log('--- BEGINING OF ERROR REPORT ---');
  console.log('-----------------------------------------------');
  console.log('Errors Tested', limit);
  console.log('Success', successes);
  console.log('Errors', errors.length);

  if(errors.length > 0 ) {
    // ERROR DETAILS
    console.log('****ERROR DETAILS BEGIN****')
    console.log('');
    errors.forEach(function(err) {
      console.log('\x1b[31m%s\x1b[0m', err.name);
      console.log(err.error);
      console.log('');
    });
    console.log('');
    console.log('****ERROR DETAILS END****')
  }

  console.log('');
  console.log('--------END TEST REPORT--------');
}

_app.runTest();
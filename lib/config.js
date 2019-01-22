/**
 * File For All Config
 * reated On Dec 18 2018
 * By Rapahel Osaze Eyerin
 */

const environments = {};

environments.staging = {
  httpPort: 5000,
  httpsPort: 3001,
  secretKey: 'ElraphtySecret',
  stripeKey: 'sk_test_ZFRdBk5ML3RaFDGKb9P92N5C',
  mailgunKey: 'api:key-6392b1150b892cb0d46e99ce06517897'
};

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  secretKey: 'ElraphtySecret'
};

// Determine which environment was passed via command line
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environment above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
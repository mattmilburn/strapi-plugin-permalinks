'use strict';

const beforeUpdateLifecycle = require( '../lifecycles/before-update' );
const transformApiResponseMiddleware = require( '../middlewares/transform-api-response' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  await schemaValidation( params );

  // Middlewares.
  await transformApiResponseMiddleware( params );

  // Lifecycles.
  await beforeUpdateLifecycle( params );
};

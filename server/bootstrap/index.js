'use strict';

const afterUpdateLifecycle = require( '../lifecycles/after-update' );
const transformApiResponseMiddleware = require( '../middlewares/transform-api-response' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  await schemaValidation( params );

  // Middlewares.
  await transformApiResponseMiddleware( params );

  // Lifecycles.
  await afterUpdateLifecycle( params );
};

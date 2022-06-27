'use strict';

const transformApiResponseMiddleware = require( '../middlewares/transform-api-response' );
const lifecycleBeforeUpdate = require( './lifecycle-before-update' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  await transformApiResponseMiddleware( params );
  await schemaValidation( params );
  await lifecycleBeforeUpdate( params );
};

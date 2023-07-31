'use strict';

const afterUpdateLifecycle = require( '../lifecycles/after-update' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  await schemaValidation( params );
  await afterUpdateLifecycle( params );
};

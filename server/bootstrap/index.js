'use strict';

const lifecycleAfterUpdate = require( './lifecycle-after-update' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  await schemaValidation( params );
  await lifecycleAfterUpdate( params );
};

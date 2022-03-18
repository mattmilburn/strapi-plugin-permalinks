'use strict';

const lifecycleBeforeUpdate = require( './lifecycle-before-update' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  await schemaValidation( params );
  await lifecycleBeforeUpdate( params );
};

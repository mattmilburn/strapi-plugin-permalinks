'use strict';

const { afterUpdate, beforeCreateUpdate } = require( '../lifecycles' );
const schemaValidation = require( './schema-validation' );

module.exports = async params => {
  // Startup validation.
  await schemaValidation( params );

  // Lifecycles.
  await beforeCreateUpdate( params );
  await afterUpdate( params );
};

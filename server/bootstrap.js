'use strict';

const { afterUpdate, beforeCreateUpdate } = require( './lifecycles' );
const { getService } = require( './utils' );

module.exports = async params => {
  // Startup validation.
  await getService( 'validation' ).validateSchema( params );

  // Lifecycles.
  await beforeCreateUpdate( params );
  await afterUpdate( params );
};

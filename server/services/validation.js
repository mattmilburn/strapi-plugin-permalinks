'use strict';

const { ValidationError } = require( '@strapi/utils' ).errors;

const { getService } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async validateUIDInput( uid ) {
    const layouts = await getService( 'config' ).layouts();

    // Verify this UID is supported in the plugin config.
    const model = strapi.getModel( uid );

    if ( ! model ) {
      throw new ValidationError( `The model ${uid} was not found.` );
    }

    // Verify this UID is supported in the plugin config.
    const isSupported = layouts.hasOwnProperty( uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }
  },
} );

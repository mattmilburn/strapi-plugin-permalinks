'use strict';

const get = require('lodash/get');

const { getService } = require( '../utils' );
const { ValidationError } = require( '@strapi/utils' ).errors;

module.exports = async ( { strapi } ) => {
  const configService = getService( 'config' );
  const pluginService = getService( 'permalinks' );
  const validationService = getService( 'validation' );
  const layouts = await configService.layouts();
  const uids = await configService.uids();

  // Lifecycle hook to validate permalink values before they are created or updated.
  const beforeCreateUpdate = async ( event ) => {
    const { model, params } = event;
    const { data, where } = params;
    const { uid } = model;
    const id = get( where, 'id', null );
    const attr = layouts[ uid ];
    const value = data[ attr.name ];

    /**
     * @START - Use `getAvailability()` service method instead of code below.
     */

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all( uids.map( uid => {
      const { name } = layouts[ uid ];

      return validationService
        .validateAvailability( uid, name, value, id )
        .then( available => ( {
          uid,
          available,
        } ) );
    } ) );

    const isAvailable = promisedAvailables.every( ( { available } ) => available );

    if ( ! isAvailable ) {
      throw new ValidationError( `Permalink value must be unique.` );
    }

    /**
     * @END
     */
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models: uids,
    beforeCreate: beforeCreateUpdate,
    beforeUpdate: beforeCreateUpdate,
  } );
};

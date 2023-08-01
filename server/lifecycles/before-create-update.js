'use strict';

const { getService } = require( '../utils' );
const { ValidationError } = require( '@strapi/utils' ).errors;

module.exports = async ( { strapi } ) => {
  const configService = getService( 'config' );
  const pluginService = getService( 'permalinks' );
  const layouts = await configService.layouts();
  const uids = await configService.uids();

  // Lifecycle hook to validate permalink values before they are created or updated.
  const beforeCreateUpdate = async ( event ) => {
    const { model, params } = event;
    const { data } = params;
    const { uid } = model;
    const attr = layouts[ uid ];
    const value = data[ attr.name ];

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all( uids.map( uid => {
      const { name } = layouts[ uid ];

      /**
       * @TODO - Must check availability while omitting the current ID (if exists).
       */

      return pluginService
        .checkAvailability( uid, name, value )
        .then( available => ( {
          uid,
          available,
        } ) );
    } ) );

    const isAvailable = promisedAvailables.every( ( { available } ) => available );

    if ( ! isAvailable ) {
      throw new ValidationError( `Permalink value must be unique.` );
    }
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models: uids,
    beforeCreate: beforeCreateUpdate,
    beforeUpdate: beforeCreateUpdate,
  } );
};

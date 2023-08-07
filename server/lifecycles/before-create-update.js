'use strict';

const get = require('lodash/get');

const { getService } = require( '../utils' );
const { ValidationError } = require( '@strapi/utils' ).errors;

module.exports = async ( { strapi } ) => {
  const layouts = await getService( 'config' ).layouts();
  const uids = await getService( 'config' ).uids();

  // Lifecycle hook to validate permalink values before they are created or updated.
  const beforeCreateUpdate = async ( event ) => {
    const { model, params } = event;
    const { data, where } = params;
    const { uid } = model;
    const id = get( where, 'id', null );
    const attr = layouts[ uid ];
    const value = data[ attr.name ];

    await getService( 'validation' ).validateFormat( uid, value );
    await getService( 'validation' ).validateConnection( uid, data, id );

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all( uids.map( uid => {
      const { name } = layouts[ uid ];

      return getService( 'validation' )
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
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models: uids,
    beforeCreate: beforeCreateUpdate,
    beforeUpdate: beforeCreateUpdate,
  } );
};

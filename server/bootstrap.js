'use strict';

const { ValidationError } = require('@strapi/utils').errors;

const { getService } = require( './utils' );

module.exports = async ( { strapi } ) => {
  const { contentTypes } = await getService( 'permalinks' ).getConfig();
  const models = contentTypes.map( type => type.uid );

  contentTypes.forEach( type => {
    const model = strapi.db.metadata.get( type.uid );

    if ( ! model ) {
      throw new ValidationError( `The content type ${type.uid} does not exist.` );
    }

    const { attributes } = model;

    if ( ! attributes[ type.targetField ] ) {
      throw new ValidationError( `The target field ${type.targetField} is not defined for ${type.uid}.` );
    }

    if ( ! attributes[ type.targetRelation ] ) {
      throw new ValidationError( `The target relation ${type.targetRelation} is not defined for ${type.uid}.` );
    }
  } );

  //////////////////////////////////////////////////////////////////////////////

  // Lifecycle hook to sync descendents after a parent relation changes.
  const afterUpdate = event => {
    console.log( 'AFTER UPDATE', event );
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models,
    afterUpdate,
  } );
};

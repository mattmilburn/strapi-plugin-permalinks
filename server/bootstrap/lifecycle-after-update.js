'use strict';

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const { contentTypes } = await getService( 'permalinks' ).getConfig();
  const models = contentTypes.map( type => type.uid );

  /**
   * @TODO - Change to use `beforeUpdate` hook.
   */

  // Lifecycle hook to sync descendants after a parent relation changes.
  const afterUpdate = event => {
    console.log( 'AFTER UPDATE', event );
    const { model, result } = event;
    const field = Object.values( model.attributes ).find( ( { permalink } ) => permalink );

    if ( ! field ) {
      return;
    }

    const targetRelation = field.permalink.targetRelation;

    // @TODO - Update descendants with new slug part.
    // const descendants = await strapi.query( uid ).find( {
    //   where: {
    //     [ targetRelation ]: {
    //       id: result.id,
    //     },
    //   },
    // } );
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models,
    afterUpdate,
  } );
};

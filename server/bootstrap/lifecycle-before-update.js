'use strict';

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const configService = getService( 'config' );
  const pluginService = getService( 'permalinks' );
  const { contentTypes } = await configService.get();
  const layouts = await configService.layouts();
  const models = contentTypes.flat();

  // Lifecycle hook to sync descendants before a parent relation changes.
  const beforeUpdate = async ( event ) => {
    const { model, params } = event;
    const { data, where } = params;
    const { uid } = model;
    const { id } = where;
    const attr = layouts[ uid ];
    const { name } = attr;

    // Do nothing if this data does not contain the `[name]` prop.
    if ( ! data.hasOwnProperty( name ) ) {
      return;
    }

    // Get previous state of entity and compare to next state.
    const entity = await strapi.db.query( uid ).findOne( { where } );
    const previousValue = entity[ name ];
    const nextValue = data[ name ];

    // Do nothing if `[name]` did not change or is not part of this update.
    if ( previousValue === nextValue ) {
      return;
    }

    // Sync children across all related content types.
    const uids = contentTypes.find( _uids => _uids.includes( uid ) );
    const promisedUpdates = uids.map( _uid => {
      return pluginService.syncChildren( _uid, id, nextValue, attr );
    } );

    await Promise.all( promisedUpdates );
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models,
    beforeUpdate,
  } );
};

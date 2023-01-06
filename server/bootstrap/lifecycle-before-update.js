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
    const options = layouts[ model.uid ];
    const { targetField } = options;

    // Get previous state of entity and compare to next state.
    const entity = await strapi.query( model.uid ).findOne( { where } );
    const hasTargetField = data.hasOwnProperty( targetField );
    const previousValue = entity[ targetField ];
    const nextValue = data[ targetField ];

    // Do nothing if `targetField` did not change or is not part of this update.
    if ( ! hasTargetField || previousValue === nextValue ) {
      return;
    }

    // Sync children across all related content types.
    const uids = contentTypes.find( _uids => _uids.includes( model.uid ) );
    const promisedUpdates = uids.map( uid => {
      return pluginService.syncChildren(
        uid,
        where.id,
        nextValue,
        options
      );
    } );

    await Promise.all( promisedUpdates );
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models,
    beforeUpdate,
  } );
};

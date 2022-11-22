'use strict';

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const configService = getService( 'config' );
  const pluginService = getService( 'permalinks' );
  const { contentTypes } = await configService.get();
  const models = contentTypes.map( type => type.uid );

  // Lifecycle hook to sync descendants before a parent relation changes.
  const beforeUpdate = async ( event ) => {
    const { model, params } = event;
    const { data, where } = params;
    const options = contentTypes.find( type => type.uid === model.uid );
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

    // Determine which supported `uids` could be using `model.uid` as a parent.
    const childUIDs = contentTypes
      .filter( type => type.targetUID && type.targetUID === model.uid )
      .map( type => type.uid );

    const promisedUpdates = [ model.uid, ...childUIDs ].map( uid => {
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

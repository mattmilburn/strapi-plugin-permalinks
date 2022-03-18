'use strict';

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const pluginService = getService( 'permalinks' );
  const { contentTypes } = await pluginService.getConfig();
  const models = contentTypes.map( type => type.uid );

  // Lifecycle hook to sync descendants before a parent relation changes.
  const beforeUpdate = async ( event ) => {
    const { model, params } = event;
    const { data, where } = params;
    const options = contentTypes.find( type => type.uid === model.uid );
    const { targetField } = options;

    // Get previous state of entity and compare to next state.
    const entity = await strapi.query( model.uid ).findOne( { where } );
    const previousValue = entity[ targetField ];
    const nextValue = data[ targetField ];

    // Do nothing if `targetField` did not change.
    if ( previousValue === nextValue ) {
      return;
    }

    await pluginService.syncDescendants(
      model.uid,
      where.id,
      previousValue,
      nextValue,
      options
    );
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models,
    beforeUpdate,
  } );
};

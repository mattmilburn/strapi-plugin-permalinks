'use strict';

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const configService = getService( 'config' );
  const pluginService = getService( 'permalinks' );
  const { contentTypes } = await configService.get();
  const layouts = await configService.layouts();
  const models = await configService.uids();

  // Lifecycle hook to set state before updating an entity. This will help know
  // whether or not the value changed in the `afterUpdate` lifecycle.
  const beforeUpdate = async ( event ) => {
    const { model, params } = event;
    const { where } = params;

    const entity = await strapi.db.query( model.uid ).findOne( { where } );

    event.state = entity;
  };

  // Lifecycle hook to sync descendants before a parent relation changes.
  const afterUpdate = async ( event ) => {
    const { model, params, state } = event;
    const { data, where } = params;
    const { uid } = model;
    const { id } = where;
    const attr = layouts[ uid ];
    console.log( 'AFTER UPDATE', uid, attr );
    const { name, targetRelation, targetRelationUID } = attr;

    // Do nothing if this data does not contain the `[name]` prop.
    if ( ! data.hasOwnProperty( name ) ) {
      return;
    }

    // Compare current state to next state.
    const currentValue = state[ name ];
    const nextValue = data[ name ];

    // Do nothing if state did not change or if `[name]` is not part of this update.
    if ( currentValue === nextValue ) {
      return;
    }

    // Sync children across all related content types.
    const uids = await configService.uids( uid );
    const promisedUpdates = uids.map( _uid => {
      // Determine if this `_uid` can be a parent of `uid`.
      const thisAttr = layouts[ _uid ];
      const otherAttr = layouts[ thisAttr.targetRelationUID ];

      if ( otherAttr.targetRelationUID !== uid ) {
        return;
      }

      return pluginService.syncChildren( _uid, id, nextValue, thisAttr.name, thisAttr.targetRelation );
    } );

    await Promise.all( promisedUpdates );
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    models,
    beforeUpdate,
    afterUpdate,
  } );
};

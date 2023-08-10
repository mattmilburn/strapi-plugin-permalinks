'use strict';

const has = require( 'lodash/has' );

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const layouts = await getService( 'config' ).layouts();
  const models = await getService( 'config' ).uids();

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
    const { name } = attr;

    // Do nothing if this data does not contain the `[name]` prop.
    if ( ! has( data, name ) ) {
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
    const uids = await getService( 'config' ).uids( uid );
    const promisedUpdates = uids.map( _uid => {
      // Determine if this `_uid` can be a parent of `uid`.
      const thisAttr = layouts[ _uid ];
      const otherAttr = layouts[ thisAttr.targetRelationUID ];

      if ( otherAttr.targetRelationUID !== uid ) {
        return;
      }

      return getService( 'permalinks' ).syncChildren(
        _uid,
        id,
        nextValue,
        thisAttr.name,
        thisAttr.targetRelation
      );
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

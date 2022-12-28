'use strict';

const get = require( 'lodash/get' );
const uniq = require( 'lodash/uniq' );

const { getService } = require( '../utils' );

module.exports = {
  async config( ctx ) {
    const { contentTypes } = await getService( 'config' ).get();

    const config = {
      contentTypes,
    };

    ctx.send( { config } );
  },

  async ancestorsPath( ctx ) {
    const { uid, id, parentId, parentUID, value } = ctx.request.body;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await configService.get();
    const supportedType = contentTypes.find( type => type.uid === uid );

    if ( ! supportedType ) {
      return ctx.notFound();
    }

    const parentEntity = await strapi.query( parentUID ).findOne( {
      where: { id: parentId },
    } );

    if ( ! parentEntity ) {
      return ctx.notFound();
    }

    const path = get( parentEntity, supportedType.targetField, '' );

    // Check if the entity in question is being assigned as it's own ancestor, but
    // only if `uid` and `parentUID` are the same.
    if ( uid === parentUID ) {
      const hasParentConflict = await pluginService.checkSameParentConflict(
        id,
        uid,
        path,
        value,
        supportedType.targetField
      );

      if ( hasParentConflict ) {
        return ctx.conflict();
      }
    }

    // Return final path.
    ctx.send( { path } );
  },

  async checkAvailability( ctx ) {
    const { uid, parentUID, field, value } = ctx.request.body;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await configService.get();
    const currentUIDs = [ uid, parentUID ];

    // Determine which supported `uids` could present a possible conflict.
    const otherUIDs = contentTypes
      .filter( type => type.targetUID && ! currentUIDs.includes( type.targetUID ) )
      .map( type => type.uid );

    // Combine unique `uids`.
    const uids = uniq( [ ...currentUIDs, ...otherUIDs ] );

    // Validate that the fields are actually a `uid` fields.
    uids.forEach( _uid => pluginService.validateUIDField( _uid, field ) );

    // Determine availability.
    const promisedAvailables = await Promise.all( uids.map( _uid => {
      return pluginService.checkUIDAvailability( _uid, field, value );
    } ) );

    const isAvailable = promisedAvailables.every( available => available );

    // Maybe provide a suggestion.
    const suggestion = ! isAvailable
      ? await pluginService.findUniqueUID( parentUID, field, value )
      : null;

    ctx.body = {
      isAvailable,
      suggestion,
    };
  },

  async checkConnection( ctx ) {
    const { uid, id, targetField } = ctx.request.body;
    const pluginService = getService( 'permalinks' );

    const entity = await strapi.query( uid ).findOne( {
      where: { id },
      populate: [ targetField ],
    } );

    const target = get( entity, targetField );

    ctx.body = {
      [ targetField ]: target ? target : null,
    };
  },
};

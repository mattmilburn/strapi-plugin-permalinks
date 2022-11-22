'use strict';

const { get } = require( 'lodash' );

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
    const { uid, id, parentId, parentUid, value } = ctx.request.body;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await configService.get();
    const supportedType = contentTypes.find( type => type.uid === uid );

    if ( ! supportedType ) {
      return ctx.notFound();
    }

    const parentEntity = await strapi.query( parentUid ).findOne( {
      where: { id: parentId },
    } );

    if ( ! parentEntity ) {
      return ctx.notFound();
    }

    const path = get( parentEntity, supportedType.targetField, '' );

    // Check if the entity in question is being assigned as it's own ancestor, but
    // only if `uid` and `parentUid` are the same.
    if ( uid === parentUid ) {
      const hasParentConflict = await pluginService.checkParentConflicts(
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
    const { uid, parentUid, field, value } = ctx.request.body;
    const targetUid = uid !== parentUid ? parentUid : uid;
    const pluginService = getService( 'permalinks' );

    // Validate that the `targetUid` field is actually a `uid` field.
    await pluginService.validateUIDField( targetUid, field );

    // Determine availability and maybe provide a suggestion.
    const isAvailable = await pluginService.checkUIDAvailability( targetUid, field, value );
    const suggestion = ! isAvailable
      ? await pluginService.findUniqueUID( targetUid, field, value )
      : null;

    ctx.body = {
      isAvailable,
      suggestion,
    };
  },
};

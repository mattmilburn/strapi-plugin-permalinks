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

    // Check if the entity in question is being assigned as it's own ancestor.
    const hasParentConflict = await pluginService.checkParentConflicts(
      id,
      path,
      value,
      supportedType
    );

    if ( hasParentConflict ) {
      return ctx.conflict();
    }

    // Return final path.
    ctx.send( { path } );
  },

  async checkAvailability( ctx ) {
    const { uid, parentUid, field, value } = ctx.request.body;
    const pluginService = getService( 'permalinks' );

    await pluginService.validateUIDField( uid, field );

    const isAvailable = await pluginService.checkUIDAvailability( uid, field, value );

    ctx.body = {
      isAvailable,
      suggestion: ! isAvailable
        ? await pluginService.findUniqueUID( uid, field, value )
        : null,
    };
  },
};

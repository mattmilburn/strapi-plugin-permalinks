'use strict';

const { get } = require( 'lodash' );

const { getService, pluginId } = require( '../utils' );

module.exports = {
  async config( ctx ) {
    const { contentTypes } = await getService( 'permalinks' ).getConfig();

    const config = {
      contentTypes,
    };

    ctx.send( { config } );
  },

  async ancestorsPath( ctx ) {
    const { uid, id, parentId, value } = ctx.request.body;
    const { contentTypes } = await getService( 'permalinks' ).getConfig();
    const supportedType = contentTypes.find( type => type.uid === uid );

    if ( ! supportedType ) {
      return ctx.notFound();
    }

    const { targetField, targetRelation } = supportedType;
    const parentEntity = await strapi.query( uid ).findOne( {
      where: { id: parentId },
    } );

    if ( ! parentEntity ) {
      return ctx.notFound();
    }

    const path = get( parentEntity, targetField, '' );

    ctx.send( { path } );
  },
};

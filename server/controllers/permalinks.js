'use strict';

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
    const { id, field, uid } = ctx.request.params;
    const entity = await strapi.query( uid ).findOne( {
      where: { id },
    } );

    if ( ! entity ) {
      return ctx.notFound();
    }

    ctx.send( { path: entity[ field ] } );
  },
};

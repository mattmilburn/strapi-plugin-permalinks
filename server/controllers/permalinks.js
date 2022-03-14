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
    const { uid, id } = ctx.request.params;
    const pluginService = getService( 'permalinks' );
    const entity = await pluginService.getEntity( uid, id );

    if ( ! entity ) {
      return ctx.notFound();
    }

    // @TODO - Use field name from config.
    ctx.send( { path: entity.slug } );
  },
};

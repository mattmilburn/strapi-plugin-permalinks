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
};

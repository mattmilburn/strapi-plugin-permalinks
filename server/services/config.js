'use strict';

const config = require( '../config' );
const { pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async get() {
    const data = await strapi.config.get( `plugin.${pluginId}`, config.default );

    return data;
  },
} );

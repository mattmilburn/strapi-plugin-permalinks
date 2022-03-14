'use strict';

const qs = require( 'qs' );

const config = require( '../config' );
const { pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async getConfig() {
    const data = await strapi.config.get( `plugin.${pluginId}`, config.default );

    return data;
  },

  async getEntity( uid, id ) {
    const entity = await strapi.query( uid ).findOne( {
      where: { id },
    } );

    return entity;
  },
} );

'use strict';

const get = require( 'lodash/get' );

const { default: defaultConfig } = require( '../config' );
const { getPermalinkAttr, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async get() {
    const config = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );

    return config;
  },

  async layouts( uid = null ) {
    const config = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );
    const { contentTypes } = config;
    const uids = contentTypes.map( item => item.uids ).flat();

    if ( uid ) {
      return getPermalinkAttr( uid );
    }

    // Add `layouts` data to config based on content types with a permalink field configured.
    const layouts = uids.reduce( ( acc, uid ) => ( {
      ...acc,
      [ uid ]: getPermalinkAttr( uid ),
    } ), {} );

    return layouts;
  },

  async uids( uid = null ) {
    const { contentTypes } = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );

    // If a `uid` is provided, return UIDs that are connected together.
    if ( uid ) {
      return contentTypes.find( item => item.uids.includes( uid ) ).uids;
    }

    // Otherwise, return all unique UIDs.
    return contentTypes.map( item => item.uids ).flat();
  },
} );

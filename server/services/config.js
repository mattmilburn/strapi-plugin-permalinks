'use strict';

const get = require( 'lodash/get' );

const { default: defaultConfig } = require( '../config' );
const { pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async get() {
    const config = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );

    return config;
  },

  async layouts() {
    const config = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );
    const { contentTypes } = config;
    const uids = contentTypes.map( item => item.uids ).flat();

    // Add `layouts` data to config based on content types with a permalink field configured.
    const layouts = uids.reduce( ( acc, uid ) => {
      const model = strapi.getModel( uid );

      const permalinkAttr = Object.entries( model.attributes ).find( ( [ _name, attr ] ) => {
        return attr.customField === 'plugin::permalinks.permalink';
      } );

      if ( ! permalinkAttr ) {
        return acc;
      }

      const [ name, attr ] = permalinkAttr;
      const relationUID = get( model, [ 'attributes', attr.targetRelation, 'target' ] );

      return {
        ...acc,
        [ uid ]: {
          name,
          targetField: attr.targetField,
          targetRelation: attr.targetRelation,
          targetRelationUID: relationUID,
        },
      };
    }, {} );

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

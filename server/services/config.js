'use strict';

const get = require( 'lodash/get' );

const { default: defaultConfig } = require( '../config' );
const { getService, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async get() {
    const config = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );

    return config;
  },

  async layouts() {
    const pluginService = getService( 'permalinks' );
    const config = await strapi.config.get( `plugin.${pluginId}`, defaultConfig );
    const { contentTypes } = config;

    // Add `layouts` data to config based on content types with a permalink field configured.
    const layouts = contentTypes.flat().reduce( ( acc, uid ) => {
      const model = pluginService.getModel( uid );

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
} );

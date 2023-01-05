'use strict';

const config = require( '../config' );
const { getService, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async get() {
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await strapi.config.get( `plugin.${pluginId}`, config.default );

    // Add `layouts` data to config based on `contentTypes`.
    const layouts = contentTypes.flat().reduce( ( acc, uid ) => {
      const [ name, attr ] = pluginService.getPermalinkAttr( uid );

      return {
        ...acc,
        [ uid ]: {
          name,
          targetField: attr.targetField,
          targetRelation: attr.targetRelation,
        },
      };
    }, {} );

    return {
      contentTypes,
      layouts,
    };
  },
} );

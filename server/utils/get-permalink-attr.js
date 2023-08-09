'use strict';

const get = require( 'lodash/get' );

const pluginId = require( './plugin-id' );

const getPermalinkAttr = uid => {
  const model = strapi.getModel( uid );

  const permalinkAttr = Object.entries( model.attributes ).find( ( [ _name, attr ] ) => {
    return attr.customField === 'plugin::permalinks.permalink';
  } );

  if ( ! permalinkAttr ) {
    return null;
  }

  const [ name, attr ] = permalinkAttr;
  const { targetField, targetRelation } = get( attr, [ 'pluginOptions', pluginId ] );
  const targetRelationUID = get( model, [ 'attributes', targetRelation, 'target' ] );

  return {
    name,
    targetField,
    targetRelation,
    targetRelationUID,
  };
};

module.exports = getPermalinkAttr;

'use strict';

const get = require( 'lodash/get' );

const getPermalinkAttr = uid => {
  const model = strapi.getModel( uid );

  const permalinkAttr = Object.entries( model.attributes ).find( ( [ _name, attr ] ) => {
    return attr.customField === 'plugin::permalinks.permalink';
  } );

  if ( ! permalinkAttr ) {
    return null;
  }

  const [ name, attr ] = permalinkAttr;
  const relationUID = get( model, [ 'attributes', attr.targetRelation, 'target' ] );

  return {
    name,
    targetField: attr.targetField,
    targetRelation: attr.targetRelation,
    targetRelationUID: relationUID,
  };
};

module.exports = getPermalinkAttr;

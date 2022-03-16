'use strict';

const { ValidationError } = require('@strapi/utils').errors;

module.exports = {
  default: {
    contentTypes: [],
  },
  validator: config => {
    if ( ! config.contentTypes ) {
      return;
    }

    // Ensure `contentTypes` is an array.
    if ( ! Array.isArray( config.contentTypes ) ) {
      throw new ValidationError( `Must define contentTypes as an array.` );
    }

    // Validate each content type.
    config.contentTypes.forEach( type => {
      // Required `uid` prop.
      if ( ! type.uid ) {
        throw new ValidationError( `Missing uid for ${type.uid}.` );
      }

      // Required `targetField` prop.
      if ( ! type.targetField ) {
        throw new ValidationError( `Missing targetField for ${type.uid}.` );
      }

      // Required `targetRelation` prop.
      if ( ! type.targetRelation ) {
        throw new ValidationError( `Missing targetRelation for ${type.uid}.` );
      }
    } );
  },
};

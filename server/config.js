'use strict';

const { ValidationError } = require( '@strapi/utils' ).errors;

module.exports = {
  default: {
    contentTypes: [],
    layouts: [],
  },
  validator: config => {
    if ( ! config.contentTypes ) {
      return;
    }

    // Ensure `contentTypes` is an array.
    if ( ! Array.isArray( config.contentTypes ) ) {
      throw new ValidationError( `Must define contentTypes as an array.` );
    }

    // Ensure UIDs only appear once in the config.
    const uids = config.contentTypes.flat();
    const duplicateUIDs = uids.filter( ( uid, i ) => uids.indexOf( uid ) !== i );
    const uniqueDuplicateUIDs = duplicateUIDs.filter( ( uid, i ) => duplicateUIDs.indexOf( uid ) === i );

    if ( duplicateUIDs.length ) {
      throw new ValidationError( `Must not duplicate UIDs in permalinks config: ${uniqueDuplicateUIDs.join( ', ' )}.` );
    }
  },
};

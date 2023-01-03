'use strict';

const { ValidationError } = require( '@strapi/utils' ).errors;

module.exports = {
  default: {
    contentTypes2: [],
    contentTypes: [],
  },
  validator: config => {
    if ( ! config.contentTypes2 ) {
      return;
    }

    // Ensure `contentTypes` is an array.
    if ( ! Array.isArray( config.contentTypes2 ) ) {
      throw new ValidationError( `Must define contentTypes as an array.` );
    }

    // Ensure UIDs only appear once in the config.
    const uids = config.contentTypes2.flat();
    const duplicateUIDs = uids.filter( ( uid, i ) => uids.indexOf( uid ) !== i );
    const uniqueDuplicateUIDs = duplicateUIDs.filter( ( uid, i ) => duplicateUIDs.indexOf( uid ) === i );

    if ( duplicateUIDs.length ) {
      throw new ValidationError( `Must not duplicate UIDs in permalinks config: ${uniqueDuplicateUIDs.join( ', ' )}.` );
    }
  },
};

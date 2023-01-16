'use strict';

const { ValidationError } = require( '@strapi/utils' ).errors;

module.exports = {
  default: {
    urls: {},
    contentTypes: [],
    lowercase: true,
  },
  validator: config => {
    if ( ! config.contentTypes ) {
      return;
    }

    // Ensure `contentTypes` is an array.
    if ( ! Array.isArray( config.contentTypes ) ) {
      throw new ValidationError( `Must define contentTypes as an array.` );
    }

    const uids = config.contentTypes.flat();

    // Ensure UIDs only appear once in the config.
    const duplicateUIDs = uids.filter( ( uid, i ) => uids.indexOf( uid ) !== i );
    const uniqueDuplicateUIDs = duplicateUIDs.filter( ( uid, i ) => duplicateUIDs.indexOf( uid ) === i );

    if ( duplicateUIDs.length ) {
      throw new ValidationError( `Must not duplicate UIDs in permalinks config: ${uniqueDuplicateUIDs.join( ', ' )}.` );
    }

    // Ensure UIDS from `urls` option also appear in `contentTypes`.
    const conflictUIDsFromUrls = Object.keys( config.urls ).filter( uid => ! uids.includes( uid ) );

    if ( conflictUIDsFromUrls.length ) {
      throw new ValidationError( `Must define UIDs in contentTypes if they are defined in the urls option: ${conflictUIDsFromUrls.join( ', ' )}.` );
    }
  },
};

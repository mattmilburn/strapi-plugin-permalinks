'use strict';

const { ValidationError } = require( '@strapi/utils' ).errors;

const { getService } = require( '../utils' );

module.exports = async ( { strapi } ) => {
  const { contentTypes2 } = await getService( 'config' ).get();
  const uids = contentTypes2.flat();

  uids.forEach( uid => {
    const model = strapi.db.metadata.get( uid );

    if ( ! model ) {
      throw new ValidationError( `The content type ${uid} does not exist.` );
    }

    const { attributes } = model;

    // Ensure that exactly one permalink attribute is defined for this model.
    const permalinkAttrs = Object.entries( attributes ).filter( ( [ _, attr ] ) => {
      return attr.customField === 'plugin::permalinks.permalink';
    } );

    if ( permalinkAttrs.length !== 1 ) {
      throw new ValidationError( `Must have exactly one permalink attribute defined in ${uid}.` );
    }

    // Ensure that permalink attributes have required props defined.
    const [ permalinkName, permalinkAttr ] = permalinkAttrs[ 0 ];

    if ( ! permalinkAttr.targetField ) {
      throw new ValidationError( `Missing ${permalinkName}.targetField in ${uid}.` );
    }

    if ( ! permalinkAttr.targetRelation ) {
      throw new ValidationError( `Missing ${permalinkName}.targetRelation in ${uid}.` );
    }

    // Ensure that permalink attributes target an actual relation field type and the UID exists.
    const targetRelationAttr = attributes[ permalinkAttr.targetRelation ];

    if ( targetRelationAttr.type !== 'relation' ) {
      throw new ValidationError( `Must use a valid relation type for ${permalinkName}.targetRelation in ${uid}.` );
    }

    const targetRelationModel = strapi.db.metadata.get( targetRelationAttr.target );

    if ( ! targetRelationModel ) {
      throw new ValidationError( `The content type ${targetRelationAttr.target} does not exist.` );
    }
  } );
};

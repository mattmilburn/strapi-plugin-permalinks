'use strict';

const { ValidationError } = require( '@strapi/utils' ).errors;

const { getService } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async validateSchema() {
    const configService = getService( 'config' );
    const { contentTypes } = await configService.get();
    const uids = await configService.uids();

    uids.forEach( uid => {
      const model = strapi.db.metadata.get( uid );

      if ( ! model ) {
        throw new ValidationError( `The content type ${uid} does not exist.` );
      }

      const { attributes } = model;

      // Ensure that exactly one permalink attribute is defined for this model.
      const permalinkAttrs = Object.entries( attributes ).filter( ( [ _name, attr ] ) => {
        return attr.customField === 'plugin::permalinks.permalink';
      } );

      if ( permalinkAttrs.length !== 1 ) {
        throw new ValidationError( `Must have exactly one permalink attribute defined in ${uid}.` );
      }

      // Ensure that permalink attributes have required props defined.
      const [ name, attr ] = permalinkAttrs[ 0 ];

      if ( ! attr.targetField ) {
        throw new ValidationError( `Missing ${name}.targetField in ${uid}.` );
      }

      if ( ! attr.targetRelation ) {
        throw new ValidationError( `Missing ${name}.targetRelation in ${uid}.` );
      }

      // Ensure that permalink attributes target an actual string type field.
      const targetFieldAttr = attributes[ attr.targetField ];

      if ( targetFieldAttr.type !== 'string' && targetFieldAttr.type !== 'text' ) {
        throw new ValidationError( `Must use a valid string type for ${name}.targetField in ${uid}. Found ${targetFieldAttr.type}.` );
      }

      // Ensure that permalink attributes target an actual relation field type that uses a oneToOne relation.
      const targetRelationAttr = attributes[ attr.targetRelation ];

      if ( targetRelationAttr.type !== 'relation' ) {
        throw new ValidationError( `Must use a valid relation type for ${name}.targetRelation in ${uid}. Found ${targetRelationAttr.type}.` );
      }

      if ( targetRelationAttr.relation !== 'oneToOne' ) {
        throw new ValidationError( `Must use a oneToOne relation for ${name}.targetRelation in ${uid}.` );
      }
    } );
  },

  async validateUIDInput( uid ) {
    const layouts = await getService( 'config' ).layouts();

    // Verify this UID is supported in the plugin config.
    const model = strapi.getModel( uid );

    if ( ! model ) {
      throw new ValidationError( `The model ${uid} was not found.` );
    }

    // Verify this UID is supported in the plugin config.
    const isSupported = layouts.hasOwnProperty( uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }
  },
} );

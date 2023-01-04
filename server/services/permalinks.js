'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const qs = require( 'qs' );
const { ValidationError } = require('@strapi/utils').errors;

const config = require( '../config' );
const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, getService, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async checkAncestorConflict( id, uid, path, value, targetField ) {
    const parts = path ? path.split( PATH_SEPARATOR ) : [];

    // Check for conflict.
    if ( parts.includes( value ) ) {
      const possibleConflict = parts.slice( 0, parts.indexOf( value ) + 1 ).join( PATH_SEPARATOR );

      const ancestor = await strapi.query( uid ).findOne( {
        where: {
          [ targetField ]: possibleConflict,
        },
      } );

      return ancestor && ancestor.id === parseInt( id );
    }

    return false;
  },

  async checkUIDAvailability( uid, field, value ) {
    const count = await strapi.db.query( uid ).count( {
      where: { [ field ]: value },
    } );

    return count > 0 ? false : true;
  },

  async findUniqueUID( uid, field, value ) {
    const possibleConflicts = await strapi.db.query( uid )
      .findMany( {
        where: { [ field ]: { $contains: value } },
      } )
      .then( results => results.map( result => result[ field ] ) );

    if ( possibleConflicts.length === 0 ) {
      return value;
    }

    let i = 1;
    let tmpUID = `${value}-${i}`;
    while ( possibleConflicts.includes( tmpUID ) ) {
      i++;
      tmpUID = `${value}-${i}`;
    }

    return tmpUID;
  },

  getPermalinkAttr( uid ) {
    const model = strapi.getModel( uid );

    if ( ! model ) {
      return [];
    }

    const permalinkAttr = Object.entries( model.attributes ).find( ( [ _, attr ] ) => {
      return attr.customField === 'plugin::permalinks.permalink';
    } );

    return permalinkAttr ? permalinkAttr : [];
  },

  async syncChildren( uid, id, value, options ) {
    const { targetField, targetRelation } = options;

    const itemsToUpdate = await strapi.query( uid ).findMany( {
      where: {
        [ targetRelation ]: { id },
      },
    } );

    // Do nothing if there are no immediate children to update.
    if ( ! itemsToUpdate.length ) {
      return;
    }

    const promisedUpdates = itemsToUpdate.map( async item => {
      const slug = getPermalinkSlug( item[ targetField ] );
      const updatedValue = `${value}${PATH_SEPARATOR}${slug}`;

      const updatedItem = await strapi.query( uid ).update( {
        where: { id: item.id },
        data: {
          [ targetField ]: updatedValue,
        },
      } );

      return updatedItem;
    } );

    await Promise.all( promisedUpdates );
  },

  async validateUIDConnection( uid ) {
    const { contentTypes2 } = await getService( 'config' ).get();

    return contentTypes2.flat().includes( uid );
  },

  validateUIDField( uid, field ) {
    const model = strapi.getModel( uid );

    if ( ! model ) {
      throw new ValidationError( `ContentType not found: ${uid}` );
    }

    if (
      ! has( model, [ 'attributes', field ] ) ||
      get( model, [ 'attributes', field, 'customField' ] ) !== 'plugin::permalinks.permalink'
    ) {
      throw new ValidationError( `${field} must be a valid permalink custom field attribute` );
    }
  },
} );

'use strict';

const { get, has } = require( 'lodash' );
const qs = require( 'qs' );
const { ValidationError } = require('@strapi/utils').errors;

const config = require( '../config' );
const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async checkParentConflicts( id, path, value, config ) {
    const { uid, targetField } = config;
    const parts = path.split( PATH_SEPARATOR );

    // Check for conflict.
    if ( parts.includes( value ) ) {
      const pathConflict = parts.slice( 0, parts.indexOf( value ) + 1 ).join( PATH_SEPARATOR );
      const ancestor = await strapi.query( uid ).findOne( {
        where: {
          [ targetField ]: pathConflict,
        },
      } );

      return ancestor && ancestor.id === id;
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
    const possibleCollisions = await strapi.db.query( uid )
      .findMany( {
        where: { [ field ]: { $contains: value } },
      } )
      .then( results => results.map( result => result[ field ] ) );

    if ( possibleCollisions.length === 0 ) {
      return value;
    }

    let i = 1;
    let tmpUID = `${value}-${i}`;
    while ( possibleCollisions.includes( tmpUID ) ) {
      i++;
      tmpUID = `${value}-${i}`;
    }

    return tmpUID;
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

  validateUIDField( uid, field ) {
    const model = strapi.contentTypes[ uid ];

    if ( ! model ) {
      throw new ValidationError( `ContentType not found: ${uid}` );
    }

    if (
      ! has( model, [ 'attributes', field ] ) ||
      get( model, [ 'attributes', field, 'type' ] ) !== 'uid'
    ) {
      throw new ValidationError( `${field} must be a valid \`uid\` attribute` );
    }
  }
} );

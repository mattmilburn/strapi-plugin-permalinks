'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const qs = require( 'qs' );
const { ValidationError } = require('@strapi/utils').errors;

const config = require( '../config' );
const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, getService, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async checkAncestorConflict( id, uid, path, value ) {
    const [ name ] = getService( 'permalinks' ).getPermalinkAttr( uid );
    const parts = path ? path.split( PATH_SEPARATOR ) : [];

    // Check for conflict.
    if ( parts.includes( value ) ) {
      const possibleConflict = parts.slice( 0, parts.indexOf( value ) + 1 ).join( PATH_SEPARATOR );

      const entity = await strapi.query( uid ).findOne( {
        where: {
          [ name ]: possibleConflict,
        },
      } );

      return entity && entity.id === parseInt( id );
    }

    return false;
  },

  async checkAvailability( uid, value ) {
    const [ name ] = getService( 'permalinks' ).getPermalinkAttr( uid );

    if ( ! name ) {
      return false;
    }

    const count = await strapi.db.query( uid ).count( {
      where: { [ name ]: value },
    } );

    return count > 0 ? false : true;
  },

  async findUniqueUID( uid, value ) {
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

  getModel( uid ) {
    const model = strapi.getModel( uid );

    if ( ! model ) {
      throw new ValidationError( `The model ${uid} was not found.` );
    }

    return model;
  },

  getPermalinkAttr( uid ) {
    const model = strapi.getModel( uid );

    if ( ! model ) {
      throw new ValidationError( `The model ${uid} was not found.` );
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

  async validateSupport( uid ) {
    const { contentTypes } = await getService( 'config' ).get();

    return contentTypes.flat().includes( uid );
  },
} );

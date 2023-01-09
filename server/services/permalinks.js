'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const qs = require( 'qs' );
const { ValidationError } = require('@strapi/utils').errors;

const config = require( '../config' );
const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, getService, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async checkAncestorConflict( id, uid, path, field, value ) {
    const parts = path ? path.split( PATH_SEPARATOR ) : [];

    // Check for conflict.
    if ( parts.includes( value ) ) {
      const possibleConflict = parts.slice( 0, parts.indexOf( value ) + 1 ).join( PATH_SEPARATOR );

      const entity = await strapi.db.query( uid ).findOne( {
        where: {
          [ field ]: possibleConflict,
        },
      } );

      return entity && entity.id === parseInt( id );
    }

    return false;
  },

  async checkAvailability( uid, field, value ) {
    const count = await strapi.db.query( uid ).count( {
      where: { [ field ]: value },
    } );

    return count > 0 ? false : true;
  },

  async findUniquePermalink( uid, field, value ) {
    const possibleConflicts = await strapi.entityService
      .findMany( uid, {
        where: {
          [ field ]: {
            $contains: value,
          },
        },
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

  async syncChildren( uid, id, value, attr ) {
    const { targetField, targetRelation } = attr;

    const itemsToUpdate = await strapi.entityService.findMany( uid, {
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

      const updatedItem = await strapi.entityService.update( uid, item.id, {
        data: {
          [ targetField ]: updatedValue,
        },
      } );

      return updatedItem;
    } );

    await Promise.all( promisedUpdates );
  },
} );

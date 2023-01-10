'use strict';

const get = require( 'lodash/get' );
const { ValidationError } = require('@strapi/utils').errors;

const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug } = require( '../utils' );

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
    const { name, targetRelation } = attr;

    const itemsToUpdate = await strapi.entityService.findMany( uid, {
      where: {
        [ targetRelation ]: { id },
      },
    } );

    // Do nothing if there are no immediate children to update.
    if ( ! itemsToUpdate.length ) {
      return;
    }

    const promisedUpdates = itemsToUpdate.map( item => {
      const slug = getPermalinkSlug( item[ name ] );
      const updatedValue = `${value}${PATH_SEPARATOR}${slug}`;

      return strapi.entityService.update( uid, item.id, {
        data: {
          [ name ]: updatedValue,
        },
      } );
    } );

    await Promise.all( promisedUpdates );
  },
} );
